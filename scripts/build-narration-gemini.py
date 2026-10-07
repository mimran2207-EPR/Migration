"""Generate narration with a Google Gemini voice (default "Kore") for every step and
every module intro.

Outputs:
  public/narration/<step-id>.mp3   - played by the site for each step
  private/heygen-audio/m<id>.wav   - module intro audio to upload in HeyGen ("Audio" tab),
                                     so the intro videos speak with the same voice
Usage:
  set GEMINI_API_KEY in your environment (never commit it), then:
  python scripts/build-narration-gemini.py [--voice Kore] [--only 1.1,m1] [--model gemini-2.5-flash-preview-tts]
Requires: pip install google-genai lameenc
"""

import argparse
import json
import os
import pathlib
import subprocess
import sys
import time
import wave

import lameenc
from google import genai
from google.genai import types

ROOT = pathlib.Path(__file__).resolve().parent.parent
STEP_OUT = ROOT / "public" / "narration"
INTRO_OUT = ROOT / "private" / "heygen-audio"
RATE = 24000  # Gemini TTS returns 16-bit mono PCM at 24 kHz


def load_items() -> list[dict]:
    code = (
        "import { modules } from './src/content/lessons';"
        "const out = [];"
        "for (const m of modules) {"
        "  if (m.intro) out.push({ id: 'm' + m.id, text: m.intro });"
        "  for (const s of m.steps) out.push({ id: s.id, text: s.script });"
        "}"
        "console.log(JSON.stringify(out));"
    )
    res = subprocess.run(["npx", "tsx", "-e", code], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", shell=True, check=True)
    return json.loads(res.stdout.strip().splitlines()[-1])


def synthesize(client: genai.Client, model: str, voice: str, text: str) -> bytes:
    for attempt in range(4):
        try:
            resp = client.models.generate_content(
                model=model,
                contents=text,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice))
                    ),
                ),
            )
            return resp.candidates[0].content.parts[0].inline_data.data
        except Exception as err:  # rate limits on the free tier: back off and retry
            if attempt == 3:
                raise
            wait = 20 * (attempt + 1)
            print(f"  retry in {wait}s ({err.__class__.__name__})", file=sys.stderr)
            time.sleep(wait)
    raise RuntimeError("unreachable")


def to_mp3(pcm: bytes) -> bytes:
    enc = lameenc.Encoder()
    enc.set_bit_rate(64)
    enc.set_in_sample_rate(RATE)
    enc.set_channels(1)
    enc.set_quality(2)
    return enc.encode(pcm) + enc.flush()


def to_wav(pcm: bytes, path: pathlib.Path) -> None:
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(pcm)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="Kore")
    ap.add_argument("--model", default="gemini-2.5-flash-preview-tts")
    ap.add_argument("--only", default="")
    args = ap.parse_args()
    if not os.environ.get("GEMINI_API_KEY"):
        sys.exit("GEMINI_API_KEY is not set")
    only = {s for s in args.only.split(",") if s}
    client = genai.Client()
    STEP_OUT.mkdir(parents=True, exist_ok=True)
    INTRO_OUT.mkdir(parents=True, exist_ok=True)
    for item in load_items():
        if only and item["id"] not in only:
            continue
        pcm = synthesize(client, args.model, args.voice, item["text"])
        if item["id"].startswith("m"):
            target = INTRO_OUT / f"{item['id']}.wav"
            to_wav(pcm, target)
        else:
            target = STEP_OUT / f"{item['id']}.mp3"
            target.write_bytes(to_mp3(pcm))
        print(f"{item['id']}: {target.stat().st_size // 1024} KB, {len(pcm) / 2 / RATE:.1f}s")


if __name__ == "__main__":
    main()
