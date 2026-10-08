"""Build the presenter stills (public/avatar/fig-0…4.webp) from one full-body image on black.

  python scripts/make-avatar-stills.py <image> --mouth X,Y,W

fig-0 is the image as is (mouth closed); fig-1…4 open the mouth step by step by lowering the jaw
around X,Y (the line between the lips, in source pixels; W = mouth width). The site swaps them by voice level (lip movement).
The black background connected to the frame edges becomes transparent; the figure is placed in a
540×960 frame, head at the top, like the previous stills.
Requires: pip install pillow opencv-python-headless numpy
"""

import argparse
import pathlib

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_W, OUT_H = 540, 960


def alpha_mask(rgb: np.ndarray, threshold: int = 28) -> np.ndarray:
    dark = (rgb.max(axis=2) < threshold).astype(np.uint8)
    _, labels = cv2.connectedComponents(dark, connectivity=4)
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    bg = np.isin(labels, border[border != 0]) & (dark == 1)
    # enclosed near-black gaps (e.g. between arm and body) are background too
    n, lab, stats, _ = cv2.connectedComponentsWithStats(dark, connectivity=4)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] > 400:
            bg |= lab == i
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    alpha = cv2.erode(alpha, np.ones((3, 3), np.uint8), iterations=1)  # drop the dark fringe
    return cv2.GaussianBlur(alpha, (3, 3), 0)  # soften the cut edge


def open_mouth(img: Image.Image, x: int, y: int, w: int, drop: float) -> Image.Image:
    """Open the mouth by lowering the jaw `drop` pixels: the lower lip, chin and beard are warped
    down smoothly (no pasted shape), and the gap between the lips shows the mouth's dark inside."""
    if drop <= 0:
        return img
    src = np.array(img.convert("RGB")).astype(np.float32)
    H, W = src.shape[:2]
    jaw_w, jaw_h = 1.35 * w, 1.15 * w  # area of the face that moves with the jaw
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    t = (yy - y) / jaw_h
    # near the lips only the mouth's width moves (corners stay put); lower down the whole jaw moves
    hw = 0.44 * w + (jaw_w - 0.44 * w) * np.clip(t / 0.45, 0, 1)
    fx = np.clip(1 - ((xx - x) / hw) ** 2, 0, 1) ** 1.5
    fy = np.where(t < 0, 0, np.where(t < 0.7, 1.0, np.clip(1 - (t - 0.7) / 0.3, 0, 1)))
    shift = drop * fx * fy
    map_y = (yy - shift).astype(np.float32)
    out = cv2.remap(src, xx, map_y, interpolation=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)

    # Mouth cavity between the upper lip (fixed) and the lowered lower lip. Its top follows the
    # smile line (corners slightly higher), it narrows to points at the mouth corners, and its
    # edges are feathered so it blends into the lips instead of looking cut.
    half = 0.44 * w
    u = np.clip((xx - x) / half, -1, 1)
    inside_x = np.abs(xx - x) < half
    lip_line = y - 3.5 * u**2  # smile: corners a little higher than the centre
    gap = drop * np.clip(1 - u**2, 0, 1) ** 1.2 * inside_x
    t = (yy - lip_line) / np.maximum(gap, 1e-3)
    inside = (t >= 0) & (t <= 1) & (gap > 0.6)
    depth = np.clip(t, 0, 1)[..., None]
    top = np.array([62, 26, 30], np.float32)  # inner lip edge
    deep = np.array([34, 12, 16], np.float32)  # throat
    cavity = top * (1 - depth) * 0.35 + deep * (0.65 + 0.35 * depth)
    mask = cv2.GaussianBlur(inside.astype(np.float32), (0, 0), 1.4)[..., None]
    out = out * (1 - mask) + cavity * mask
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def frame(img: Image.Image, alpha: np.ndarray) -> Image.Image:
    rgba = img.convert("RGBA")
    rgba.putalpha(Image.fromarray(alpha))
    x0, y0, x1, y1 = rgba.getbbox()  # the figure only
    fig = rgba.crop((x0, y0, x1, y1))
    scale = min((OUT_H * 0.97) / fig.height, (OUT_W * 0.98) / fig.width)
    fig = fig.resize((round(fig.width * scale), round(fig.height * scale)), Image.LANCZOS)
    out = Image.new("RGBA", (OUT_W, OUT_H), (0, 0, 0, 0))
    out.paste(fig, ((OUT_W - fig.width) // 2, OUT_H - fig.height), fig)  # feet on the bottom edge
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("--mouth", required=True, help="X,Y,W of the mouth in the source image")
    a = ap.parse_args()
    x, y, w = (int(v) for v in a.mouth.split(","))
    src = Image.open(a.image).convert("RGB")
    alpha = alpha_mask(np.array(src))
    # 5 mouth positions, from closed to wide open (jaw drop in source pixels, relative to mouth width)
    for i, drop in enumerate((0, 0.045, 0.09, 0.135, 0.18)):
        out = frame(open_mouth(src, x, y, w, drop * w), alpha)
        path = ROOT / "public" / "avatar" / f"fig-{i}.webp"
        out.save(path, "WEBP", quality=90)
        print(path.name, out.size)


if __name__ == "__main__":
    main()
