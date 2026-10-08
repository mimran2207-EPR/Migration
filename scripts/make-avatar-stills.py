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


def lip_seam(rgb: np.ndarray, x: int, y: int, w: int) -> np.poly1d:
    """The dark line between the lips, as y = f(x), fitted to the darkest row of each column near
    (x, y). Following the real seam (the face is slightly tilted) keeps the opening on the lips."""
    lum = rgb.astype(np.float32).mean(axis=2)
    lum = cv2.GaussianBlur(lum, (0, 0), 1.2)
    xs, ys = [], []
    for cx in range(int(x - 0.42 * w), int(x + 0.42 * w) + 1, 2):
        lo, hi = int(y - 0.05 * w), int(y + 0.17 * w)
        ys.append(lo + int(lum[lo:hi, cx].argmin()))
        xs.append(cx)
    xs, ys = np.array(xs, float), np.array(ys, float)
    keep = np.ones(len(xs), bool)
    for deg in (1, 1, 2):  # robust fit: drop moustache/beard hairs picked up as "darkest"
        fit = np.poly1d(np.polyfit(xs[keep], ys[keep], deg))
        keep = np.abs(ys - fit(xs)) < 2.5
    return fit


def open_mouth(img: Image.Image, x: int, y: int, w: int, drop: float) -> Image.Image:
    """Open the mouth by lowering the jaw `drop` pixels below the lip seam: the lower lip, chin and
    beard are warped down smoothly, the upper lip stays, and the gap shows the mouth's inside."""
    if drop <= 0:
        return img
    rgb = np.array(img.convert("RGB"))
    seam = lip_seam(rgb, x, y, w)
    src = rgb.astype(np.float32)
    H, W = src.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    half = 0.46 * w  # half the mouth width: corners stay put
    sy = seam(np.clip(xx, x - half, x + half)).astype(np.float32)
    jaw_w, jaw_h = 1.35 * w, 1.15 * w
    t = (yy - sy) / jaw_h
    hw = half + (jaw_w - half) * np.clip(t / 0.45, 0, 1)
    fx = np.clip(1 - ((xx - x) / hw) ** 2, 0, 1) ** 1.5
    fy = np.where(t < 0, 0, np.where(t < 0.7, 1.0, np.clip(1 - (t - 0.7) / 0.3, 0, 1)))
    shift = drop * fx * fy
    out = cv2.remap(src, xx, (yy - shift).astype(np.float32), interpolation=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)

    # The opening: from the seam down to the lowered lower lip, rounded (elliptic) and tapering to
    # the corners, with soft edges. Dark red inside, a faint hint of upper teeth when wide open.
    u = np.clip((xx - x) / half, -1.2, 1.2)
    gap = drop * np.clip(1 - u**2, 0, 1) ** 0.75
    v = (yy - sy + 0.6) / np.maximum(gap, 1e-3)  # 0 at the seam, 1 at the lower lip
    edge = np.minimum(v, 1 - v) * np.maximum(gap, 1e-3)  # distance to the nearest lip, px
    alpha = np.clip(edge / 1.3 + 0.5, 0, 1) * (gap > 0.8)
    alpha *= np.clip((1 - np.abs(u)) / 0.18, 0, 1)  # fade into the corners
    vv = np.clip(v, 0, 1)
    inner = np.array([96, 46, 48], np.float32)  # lip-coloured inner edge
    deep = np.array([38, 14, 18], np.float32)
    teeth = np.array([214, 205, 196], np.float32)
    col = deep[None, None] + (inner - deep)[None, None] * (np.abs(vv - 0.5) * 1.1)[..., None]
    t_amt = np.clip((drop - 6) / 6, 0, 0.55) * np.clip(1 - vv / 0.32, 0, 1) * np.clip(1 - np.abs(u) / 0.55, 0, 1)
    col = col * (1 - t_amt[..., None]) + teeth * t_amt[..., None]
    a3 = cv2.GaussianBlur(alpha.astype(np.float32), (0, 0), 0.7)[..., None]
    out = out * (1 - a3) + col * a3
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
    for i, drop in enumerate((0, 0.04, 0.08, 0.12, 0.16)):
        out = frame(open_mouth(src, x, y, w, drop * w), alpha)
        path = ROOT / "public" / "avatar" / f"fig-{i}.webp"
        out.save(path, "WEBP", quality=90)
        print(path.name, out.size)


if __name__ == "__main__":
    main()
