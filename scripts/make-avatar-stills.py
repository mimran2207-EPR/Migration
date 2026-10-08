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
    fx = np.clip(1 - ((xx - x) / jaw_w) ** 2, 0, 1) ** 1.5
    t = (yy - y) / jaw_h
    fy = np.where(t < 0, 0, np.where(t < 0.7, 1.0, np.clip(1 - (t - 0.7) / 0.3, 0, 1)))
    shift = drop * fx * fy
    map_y = (yy - shift).astype(np.float32)
    out = cv2.remap(src, xx, map_y, interpolation=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)

    # mouth cavity between the upper lip (fixed) and the lowered lower lip
    gap = drop * np.clip(1 - ((xx - x) / (w / 2)) ** 2, 0, 1) ** 0.8
    inside = (yy >= y - 1) & (yy < y - 1 + gap)
    depth = np.clip((yy - y + 1) / np.maximum(gap, 1), 0, 1)
    dark = np.stack([40 + 30 * depth, 16 + 10 * depth, 18 + 10 * depth], axis=-1)  # dark red throat
    mask = cv2.GaussianBlur(inside.astype(np.float32), (0, 0), 0.9)[..., None]
    out = out * (1 - mask) + dark * mask
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
    for i, drop in enumerate((0, 0.05, 0.1, 0.15, 0.21)):
        out = frame(open_mouth(src, x, y, w, drop * w), alpha)
        path = ROOT / "public" / "avatar" / f"fig-{i}.webp"
        out.save(path, "WEBP", quality=90)
        print(path.name, out.size)


if __name__ == "__main__":
    main()
