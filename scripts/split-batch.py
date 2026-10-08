"""Cut one long HeyGen "batch" video into one video per step, then process each for the site.

  python scripts/split-batch.py 1            # reads private/videos/batch-1.mp4
  python scripts/split-batch.py 1 --dry      # only show the cut points

How the cut points are found: all silences in the video are candidates; a dynamic program picks
one cut per step boundary so that every segment's length best matches the step's expected length
(its MP3 narration, scaled to the batch), preferring longer pauses (the blank line between steps). Steps go to private/videos/<id>-hd.mp4 and are
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


def narration_seconds(sid: str) -> float | None:
    mp3 = ROOT / "public" / "narration" / f"{sid}.mp3"
    if not mp3.exists():
        return None
    out = subprocess.run([FF, "-hide_banner", "-i", str(mp3)], capture_output=True, text=True, errors="replace").stderr
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", out)
    return int(m[1]) * 3600 + int(m[2]) * 60 + float(m[3]) if m else None


def best_cuts(gaps: list[tuple[float, float]], t0: float, t1: float, pred: list[float]) -> list[float]:
    """Choose len(pred)-1 cut points among the silences (dynamic programming): each segment's
    length should match its predicted length, and longer silences are preferred as cuts."""
    cands = [((a + b) / 2, b - a) for a, b in gaps if t0 < (a + b) / 2 < t1]
    n, m = len(pred), len(cands)
    if m < n - 1:
        sys.exit(f"only {m} pauses found for {n} steps — check the video")
    longest = max(length for _, length in cands)

    def cost(seg: float, p: float) -> float:
        return ((seg - p) / p) ** 2

    INF = float("inf")
    # dp[k][j]: best cost with cut k (0-based) at candidate j
    dp = [[INF] * m for _ in range(n - 1)]
    back = [[-1] * m for _ in range(n - 1)]
    for j, (t, length) in enumerate(cands):
        dp[0][j] = cost(t - t0, pred[0]) - 0.3 * length / longest
    for k in range(1, n - 1):
        for j in range(k, m):
            t, length = cands[j]
            for i in range(k - 1, j):
                if dp[k - 1][i] == INF:
                    continue
                c = dp[k - 1][i] + cost(t - cands[i][0], pred[k]) - 0.3 * length / longest
                if c < dp[k][j]:
                    dp[k][j], back[k][j] = c, i
    last = min(range(m), key=lambda j: dp[n - 2][j] + cost(t1 - cands[j][0], pred[n - 1]) if dp[n - 2][j] < INF else INF)
    picks = [last]
    for k in range(n - 2, 0, -1):
        picks.append(back[k][picks[-1]])
    return [cands[j][0] for j in reversed(picks)]


def check_audio(video: pathlib.Path, batch: dict, cuts: list[float], n: int) -> None:
    """--check: an MP3 with every transition (2.5 s before the cut, a beep, 3 s after) so a person
    can confirm each cut falls between two steps, plus the expected words around each beep."""
    import shutil
    import tempfile

    tmp = pathlib.Path(tempfile.mkdtemp())
    run = lambda *a: subprocess.run([FF, "-v", "error", "-y", *a], check=True)
    run("-f", "lavfi", "-i", "sine=frequency=880:duration=0.25", "-ar", "44100", "-ac", "1", str(tmp / "beep.wav"))
    run("-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "1.6", str(tmp / "gap.wav"))
    parts = []
    for i, c in enumerate(cuts):
        run("-ss", str(max(0, c - 2.5)), "-to", str(c), "-i", str(video), "-vn", "-ar", "44100", "-ac", "1", str(tmp / f"a{i}.wav"))
        run("-ss", str(c), "-to", str(c + 3), "-i", str(video), "-vn", "-ar", "44100", "-ac", "1", str(tmp / f"z{i}.wav"))
        parts += [f"file 'a{i}.wav'", "file 'beep.wav'", f"file 'z{i}.wav'", "file 'gap.wav'"]
        prev, nxt = batch["steps"][i], batch["steps"][i + 1]
        print(f"{i + 1:2}. end {prev['id']}: …{' '.join(prev['script'].split()[-4:])}  ║  start {nxt['id']}: {' '.join(nxt['script'].split()[:5])}…")
    (tmp / "list.txt").write_text("\n".join(parts))
    out = ROOT / "private" / "videos" / f"check-batch-{n}.mp3"
    run("-f", "concat", "-safe", "0", "-i", str(tmp / "list.txt"), "-c:a", "libmp3lame", "-b:a", "96k", str(out))
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"check audio: {out}")


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    n = int(sys.argv[1])
    batch = next(b for b in json.loads((ROOT / "docs" / "heygen-batches.json").read_text(encoding="utf-8")) if b["n"] == n)
    video = ROOT / "private" / "videos" / f"batch-{n}.mp4"
    if not video.exists():
        sys.exit(f"missing {video}")
    duration, gaps = silences(video)
    # speech spans from the first to the last sound
    t0 = gaps[0][1] if gaps and gaps[0][0] < 0.05 else 0.0
    t1 = gaps[-1][0] if gaps and gaps[-1][1] > duration - 0.3 else duration
    # Expected length of each step: its MP3 narration length (same text, similar pace),
    # falling back to word count; scaled so the steps fill the batch's speech span.
    weights = [narration_seconds(s["id"]) or len(s["script"].split()) / 2.5 for s in batch["steps"]]
    scale = (t1 - t0) / sum(weights)
    pred = [w * scale for w in weights]
    cuts = [0.0] + best_cuts(gaps, t0, t1, pred) + [duration]
    if "--dry" in sys.argv or "--check" in sys.argv:
        for i, step in enumerate(batch["steps"]):
            print(f"{step['id']}: {cuts[i]:6.1f} → {cuts[i + 1]:6.1f}  ({cuts[i + 1] - cuts[i]:4.1f}s)")
        if "--check" in sys.argv:
            check_audio(video, batch, cuts[1:-1], n)
        return

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
