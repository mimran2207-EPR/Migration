"""Build the presenter stills (public/avatar/fig-0/1/2.webp) from one full-body image on black.

  python scripts/make-avatar-stills.py <image> --mouth X,Y,W

fig-0 is the image as is (mouth closed); fig-1 / fig-2 paint a half-open / open mouth centred at
X,Y (pixels in the source image) with width W. The site swaps them by voice level (lip movement).
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


def open_mouth(img: Image.Image, x: int, y: int, w: int, opening: float) -> Image.Image:
    """Paint a dark mouth opening (height = opening × width) with a soft edge over the lips."""
    if opening <= 0:
        return img
    h = max(2, int(w * opening))
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse([x - w // 2, y - h // 2, x + w // 2, y + h // 2], fill=(58, 22, 24, 255))
    # a hint of upper teeth on the wider opening
    if opening > 0.12:
        d.rectangle([x - w // 4, y - h // 2 + 1, x + w // 4, y - h // 2 + max(2, h // 4)], fill=(232, 226, 220, 255))
        d.ellipse([x - w // 2, y - h // 2, x + w // 2, y + h // 2], outline=(58, 22, 24, 255), width=2)
    layer = layer.filter(ImageFilter.GaussianBlur(1.2))
    return Image.alpha_composite(img.convert("RGBA"), layer)


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
    for i, opening in enumerate((0.0, 0.1, 0.22)):
        out = frame(open_mouth(src, x, y, w, opening), alpha)
        path = ROOT / "public" / "avatar" / f"fig-{i}.webp"
        out.save(path, "WEBP", quality=90)
        print(path.name, out.size)


if __name__ == "__main__":
    main()
