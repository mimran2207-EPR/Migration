"""Remove the black background of a HeyGen avatar video -> transparent WebM (VP9 alpha).

Only near-black pixels CONNECTED TO THE FRAME BORDER are made transparent, so dark
areas inside the figure (trousers, mouth, glasses) stay opaque.

Usage: python scripts/cutout-video.py <input.mp4> <output.webm> [--width 540]
Requires: pip install opencv-python-headless imageio-ffmpeg
"""

import argparse
import pathlib
import subprocess
import tempfile

import cv2
import imageio_ffmpeg
import numpy as np


def alpha_mask(frame: np.ndarray, threshold: int = 22) -> np.ndarray:
    dark = (frame.max(axis=2) < threshold).astype(np.uint8)
    n, labels = cv2.connectedComponents(dark, connectivity=4)
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    bg = np.isin(labels, border[border != 0]) & (dark == 1)
    # enclosed gaps (e.g. between arm and body) are pure black too: drop large near-black islands
    black = (frame.max(axis=2) < 10).astype(np.uint8)
    n2, lab2, stats, _ = cv2.connectedComponentsWithStats(black, connectivity=4)
    for k in range(1, n2):
        if stats[k, cv2.CC_STAT_AREA] > 250:
            bg |= lab2 == k
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    # soften the edge by one pixel so the figure doesn't look cut with scissors
    alpha = cv2.erode(alpha, np.ones((2, 2), np.uint8))
    return cv2.GaussianBlur(alpha, (3, 3), 0)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--width", type=int, default=540)
    args = ap.parse_args()
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    cap = cv2.VideoCapture(args.src)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    with tempfile.TemporaryDirectory() as tmp:
        i = 0
        while True:
            ok, f = cap.read()
            if not ok:
                break
            h = int(f.shape[0] * args.width / f.shape[1]) // 2 * 2
            f = cv2.resize(f, (args.width, h), interpolation=cv2.INTER_AREA)
            rgba = cv2.cvtColor(f, cv2.COLOR_BGR2BGRA)
            rgba[:, :, 3] = alpha_mask(f)
            cv2.imwrite(str(pathlib.Path(tmp) / f"f{i:05d}.png"), rgba)
            i += 1
        subprocess.run(
            [ff, "-v", "error", "-y", "-framerate", str(fps), "-i", str(pathlib.Path(tmp) / "f%05d.png"),
             "-i", args.src, "-map", "0:v", "-map", "1:a?", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
             "-b:v", "0", "-crf", "36", "-deadline", "good", "-row-mt", "1", "-c:a", "libopus", "-b:a", "64k",
             "-auto-alt-ref", "0", args.dst],
            check=True,
        )
    print(f"{i} frames -> {args.dst}")


if __name__ == "__main__":
    main()
