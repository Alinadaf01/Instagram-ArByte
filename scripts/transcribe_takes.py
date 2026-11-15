"""Transcribe a long take recording region by region (resumable).

Splits the 16 kHz mono WAV at silences (-38 dB, 0.6 s), transcribes each
region with faster-whisper large-v3 (word timestamps, Persian) and appends
to the JSON output after every region, so it can be re-run until done.
Usage: python3 scripts/transcribe_takes.py <in.wav> <out.json>
"""
import json
import os
import re
import subprocess
import sys

import soundfile as sf
from faster_whisper import WhisperModel


def regions(src, sr, n):
    log = subprocess.run(["ffmpeg", "-i", src, "-af", "silencedetect=n=-38dB:d=0.6", "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]
    en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", log)]
    out, p = [], 0.0
    for a, b in zip(st, en):
        if a - p > 0.3:
            out.append([max(0, p - 0.25), a + 0.25])
        p = b
    if n / sr - p > 0.3:
        out.append([p - 0.25, n / sr])
    split = []
    for a, b in out:
        while b - a > 28:
            split.append([a, a + 28])
            a += 28
        split.append([a, b])
    return split


def main():
    src, dst = sys.argv[1], sys.argv[2]
    audio, sr = sf.read(src, dtype="float32")
    res = json.load(open(dst)) if os.path.exists(dst) else []
    done = {r["start"] for r in res}
    model = WhisperModel("large-v3", device="cpu", compute_type="int8", cpu_threads=4)
    for a, b in regions(src, sr, len(audio)):
        if round(a, 2) in done:
            continue
        segs, _ = model.transcribe(audio[int(a * sr):int(b * sr)], language="fa", word_timestamps=True, vad_filter=False, beam_size=5, condition_on_previous_text=False)
        words, text = [], ""
        for s in segs:
            text += s.text
            words += [{"word": w.word.strip(), "start": round(a + w.start, 3), "end": round(a + w.end, 3)} for w in s.words]
        res.append({"start": round(a, 2), "end": round(b, 2), "text": text.strip(), "words": words})
        json.dump(res, open(dst, "w"), ensure_ascii=False, indent=1)
        print(f"{a:7.2f}-{b:7.2f} {text.strip()}", flush=True)


if __name__ == "__main__":
    main()
