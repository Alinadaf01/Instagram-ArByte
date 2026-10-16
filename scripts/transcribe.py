"""Persian word-level transcription → public/timestamps.json

Transcribes
  * voiceover.m4a                      (times in seconds of the file)
  * intro.mp4 between 1.2s and 12.4s   (times re-based to the trimmed intro)
with faster-whisper (large-v3, word_timestamps=True).

Usage:  python scripts/transcribe.py [--model large-v3] [--device cpu]

After it runs, open public/timestamps.json and fix any misspelt words by hand —
only the "word" text matters for subtitles, the timings stay as they are.
"""
import argparse
import json
import subprocess
import tempfile
from pathlib import Path

from faster_whisper import WhisperModel

PUBLIC = Path(__file__).resolve().parent.parent / "public"
INTRO_START, INTRO_END = 1.2, 12.4

PROMPT = (
    "سلام، امروز می‌خوایم سرفیس پرو ۷ پلاس مایکروسافت رو با هم بررسی کنیم. "
    "پردازنده Core i7-1165G7 و Core i5-1135G7، گرافیک Iris Xe، رم 16GB و 8GB، "
    "حافظه SSD، صفحه‌نمایش تاچ 2K، کیبورد جداشونده، وزن ۷۷۰ گرم. "
    "مشاوره رایگان با کارشناسان آربایت. سابقه در ترب و ایمالز و اینماد. سایت arbyte.ir"
)


def to_wav(src: Path, start: float | None = None, end: float | None = None) -> Path:
    out = Path(tempfile.mkstemp(suffix=".wav")[1])
    cmd = ["ffmpeg", "-v", "error", "-y"]
    if start is not None:
        cmd += ["-ss", str(start)]
    if end is not None:
        cmd += ["-to", str(end)] if start is None else ["-t", str(end - start)]
    cmd += ["-i", str(src), "-vn", "-ac", "1", "-ar", "16000", str(out)]
    subprocess.run(cmd, check=True)
    return out


def transcribe(model: WhisperModel, wav: Path):
    segments, info = model.transcribe(
        str(wav),
        language="fa",
        word_timestamps=True,
        vad_filter=True,
        beam_size=5,
        initial_prompt=PROMPT,
        condition_on_previous_text=False,
    )
    words, text = [], []
    for seg in segments:
        text.append(seg.text.strip())
        for w in seg.words or []:
            words.append({"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)})
    return words, " ".join(text), info.duration


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="large-v3")
    ap.add_argument("--device", default="cpu")
    ap.add_argument("--compute", default="int8")
    args = ap.parse_args()

    model = WhisperModel(args.model, device=args.device, compute_type=args.compute)
    result = {}

    vo = PUBLIC / "voiceover.m4a"
    if vo.exists():
        words, text, dur = transcribe(model, to_wav(vo))
        result["voiceover"] = {"duration": round(dur, 3), "text": text, "words": words}
        print("── voiceover ──\n" + text)

    intro = PUBLIC / "intro.mp4"
    if intro.exists():
        words, text, _ = transcribe(model, to_wav(intro, INTRO_START, INTRO_END))
        result["intro"] = {"text": text, "words": words}
        print("── intro ──\n" + text)

    out = PUBLIC / "timestamps.json"
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nwrote {out}")


if __name__ == "__main__":
    main()
