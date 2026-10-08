"""Cut one long HeyGen "batch" video into one video per step, then process each for the site.

  python scripts/split-batch.py 1            # reads private/videos/batch-1.mp4

How the cut points are found: each step's expected start is estimated from its share of the
batch's words; the cut is then snapped to the longest silence near that estimate (the blank
line between steps makes HeyGen pause there). Steps go to private/videos/<id>-hd.mp4 and are
processed by process-video.py into public/avatar/<id>.mp4 + .webm.
Requires: pip install imageio-ffmpeg opencv-python-headless
"""

import json
import pathlib
import re
import subprocess
import sys

import imageio_ffmpeg

ROOT = pathlib.Path(__file__).resolve().parent.parent
FF = imageio_ffmpeg.get_ffmpeg_exe()


def silences(video: pathlib.Path) -> tuple[float, list[tuple[float, float]]]:
    out = subprocess.run(
        [FF, "-hide_banner", "-i", str(video), "-af", "silencedetect=noise=-38dB:d=0.25", "-f", "null", "-"],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    ).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", out).groups()
    duration = int(h) * 3600 + int(m) * 60 + float(s)
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    return duration, list(zip(starts, ends))


def main() -> None:
    n = int(sys.argv[1])
    batch = next(b for b in json.loads((ROOT / "docs" / "heygen-batches.json").read_text(encoding="utf-8")) if b["n"] == n)
    video = ROOT / "private" / "videos" / f"batch-{n}.mp4"
    if not video.exists():
        sys.exit(f"missing {video}")
    duration, gaps = silences(video)
    # speech spans from the first to the last sound
    t0 = gaps[0][1] if gaps and gaps[0][0] < 0.05 else 0.0
    t1 = gaps[-1][0] if gaps and gaps[-1][1] > duration - 0.3 else duration
    words = [len(s["script"].split()) for s in batch["steps"]]
    total = sum(words)

    cuts = [0.0]
    acc = 0
    for i, w in enumerate(words[:-1]):
        acc += w
        expected = t0 + (t1 - t0) * acc / total
        window = max(3.0, 0.25 * (t1 - t0) * w / total)
        near = [g for g in gaps if abs((g[0] + g[1]) / 2 - expected) <= window and g[0] > cuts[-1] + 1]
        best = max(near, key=lambda g: g[1] - g[0]) if near else None
        cut = (best[0] + best[1]) / 2 if best else expected
        print(f"  {batch['steps'][i]['id']} → {batch['steps'][i + 1]['id']}: expected {expected:6.1f}s, cut {cut:6.1f}s"
              + ("" if best else "  (no pause found — estimated)"))
        cuts.append(cut)
    cuts.append(duration)

    for i, step in enumerate(batch["steps"]):
        sid = step["id"]
        hd = ROOT / "private" / "videos" / f"{sid}-hd.mp4"
        start, end = cuts[i], cuts[i + 1]
        subprocess.run(
            [FF, "-v", "error", "-y", "-i", str(video), "-ss", f"{start:.3f}", "-to", f"{end:.3f}",
             "-c:v", "libx264", "-crf", "18", "-preset", "fast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", str(hd)],
            check=True,
        )
        print(f"{sid}: {end - start:5.1f}s")
        subprocess.run([sys.executable, str(ROOT / "scripts" / "process-video.py"), sid], check=False)


if __name__ == "__main__":
    main()
