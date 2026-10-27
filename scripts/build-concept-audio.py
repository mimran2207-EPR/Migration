"""Generate the Hebrew narration of every concept in the learning path.

Usage:  python scripts/build-concept-audio.py [--voice he-IL-AvriNeural] [--rate +0%] [--only 12,13] [--force]
Reads the scripts from src/content/deep (via `npx tsx`) and writes public/narration/concepts/<n>.mp3.
A concept is regenerated only when its script changed (hashes in public/narration/concepts/index.json),
so run it again after editing any narration.
Requires: pip install --upgrade edge-tts   (old versions get HTTP 403 from the service)
"""

import argparse
import asyncio
import hashlib
import json
import pathlib
import subprocess
import sys

import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "narration" / "concepts"


def load() -> list[dict]:
    code = "import { deep } from './src/content/deep'; console.log(JSON.stringify(deep.map(d => ({ n: d.n, text: d.narration }))));"
    out = subprocess.run(["npx", "tsx", "-e", code], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", shell=True, check=True)
    return json.loads(out.stdout.strip().splitlines()[-1])


async def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="he-IL-AvriNeural")
    ap.add_argument("--rate", default="+0%")
    ap.add_argument("--only", default="")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    only = {int(s) for s in args.only.split(",") if s}
    OUT.mkdir(parents=True, exist_ok=True)
    index_file = OUT / "index.json"
    index = json.loads(index_file.read_text(encoding="utf-8")) if index_file.exists() else {}
    made = 0
    for item in load():
        n = item["n"]
        if only and n not in only:
            continue
        digest = hashlib.sha1(f"{args.voice}|{args.rate}|{item['text']}".encode("utf-8")).hexdigest()[:12]
        target = OUT / f"{n}.mp3"
        if not args.force and index.get(str(n)) == digest and target.exists() and target.stat().st_size > 0:
            continue
        for attempt in range(3):
            try:
                await edge_tts.Communicate(item["text"], args.voice, rate=args.rate).save(str(target))
                break
            except Exception as err:  # the service drops connections now and then
                if attempt == 2:
                    raise
                print(f"{n}: retry ({err})")
                await asyncio.sleep(3)
        if target.stat().st_size == 0:
            target.unlink()
            raise SystemExit(f"{n}: empty audio — update edge-tts (pip install --upgrade edge-tts)")
        index[str(n)] = digest
        index_file.write_text(json.dumps(index, indent=1), encoding="utf-8")
        made += 1
        print(f"{n}: {target.stat().st_size // 1024} KB")
    print(f"done, {made} generated")


if __name__ == "__main__":
    asyncio.run(main())
