"""Generate one MP3 narration per lesson step with a neural Hebrew voice.

Usage:  python scripts/build-narration.py [--voice he-IL-AvriNeural] [--only 1.1,1.2]
Reads the scripts from src/content/lessons.ts (via `npx tsx`) and writes public/narration/<id>.mp3.
Requires: pip install edge-tts
"""

import argparse
import asyncio
import json
import pathlib
import subprocess

import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "narration"


def load_steps() -> list[dict]:
    code = "import { allSteps } from './src/content/lessons'; console.log(JSON.stringify(allSteps.map(s => ({ id: s.id, script: s.script }))));"
    out = subprocess.run(["npx", "tsx", "-e", code], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", shell=True, check=True)
    return json.loads(out.stdout.strip().splitlines()[-1])


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="he-IL-AvriNeural")
    ap.add_argument("--rate", default="+0%")
    ap.add_argument("--only", default="")
    args = ap.parse_args()
    only = {s for s in args.only.split(",") if s}
    OUT.mkdir(parents=True, exist_ok=True)
    for step in load_steps():
        if only and step["id"] not in only:
            continue
        target = OUT / f"{step['id']}.mp3"
        await edge_tts.Communicate(step["script"], args.voice, rate=args.rate).save(str(target))
        print(f"{step['id']}: {target.stat().st_size // 1024} KB")


if __name__ == "__main__":
    asyncio.run(main())
