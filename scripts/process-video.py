"""Prepare a HeyGen download for the site, in one command.

  python scripts/process-video.py 1.1

Takes public/avatar/<id>.mp4 as downloaded from HeyGen (large, 1080p), keeps the
original in private/videos/<id>-hd.mp4, and writes:
  public/avatar/<id>.mp4   540px H.264 (Safari / fallback)
  public/avatar/<id>.webm  540px VP9 with transparent background (Chrome/Edge/Firefox)
"""

import pathlib
import shutil
import subprocess
import sys

import imageio_ffmpeg

ROOT = pathlib.Path(__file__).resolve().parent.parent


def main() -> None:
    sid = sys.argv[1]
    src = ROOT / "public" / "avatar" / f"{sid}.mp4"
    hd = ROOT / "private" / "videos" / f"{sid}-hd.mp4"
    hd.parent.mkdir(parents=True, exist_ok=True)
    if src.exists() and src.stat().st_size > 5_000_000:
        shutil.move(str(src), str(hd))
    if not hd.exists():
        sys.exit(f"missing {src} (download it from HeyGen first)")
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run(
        [ff, "-v", "error", "-y", "-i", str(hd), "-vf", "scale=540:-2", "-c:v", "libx264", "-crf", "28",
         "-preset", "slow", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "80k", "-movflags", "+faststart", str(src)],
        check=True,
    )
    subprocess.run([sys.executable, str(ROOT / "scripts" / "cutout-video.py"), str(hd), str(ROOT / "public" / "avatar" / f"{sid}.webm")], check=True)
    for f in (src, src.with_suffix(".webm")):
        print(f"{f.name}: {f.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
