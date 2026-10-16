"""Audio analysis used to sync the edit (no ML needed).

Writes public/audio-analysis.json with:
  voLeadIn   – seconds of silence at the start of voiceover.m4a (trimmed off)
  voPauses   – [start, end] pauses in the voiceover (seconds in the file)
  musicDrop  – seconds in music.mp3 where the biggest energy jump (the drop) is
  musicDrop2 – the next big drop after that
"""
import json
import re
import subprocess
from pathlib import Path

import numpy as np

PUBLIC = Path(__file__).resolve().parent.parent / "public"
SR = 22050


def decode(path: Path) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def vo_pauses(path: Path):
    out = subprocess.run(
        ["ffmpeg", "-i", str(path), "-af", "silencedetect=noise=-38dB:d=0.3", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    return [[round(s, 3), round(e, 3)] for s, e in zip(starts, ends)]


def music_drop(path: Path, search_from=4.0, search_to=60.0) -> float:
    x = decode(path)
    # low-pass-ish energy: bass carries the drop
    hop = SR // 50  # 20ms
    n = len(x) // hop
    frames = x[: n * hop].reshape(n, hop)
    spec = np.abs(np.fft.rfft(frames * np.hanning(hop), axis=1))
    freqs = np.fft.rfftfreq(hop, 1 / SR)
    bass = spec[:, (freqs > 30) & (freqs < 160)].sum(axis=1)
    full = np.sqrt((frames ** 2).mean(axis=1))
    e = bass / (bass.max() + 1e-9) + full / (full.max() + 1e-9)
    win = 50  # 1s windows
    best_t, best = search_from, -1.0
    for i in range(int(search_from * 50), min(n - win, int(search_to * 50))):
        before = e[i - win : i].mean()
        after = e[i : i + win].mean()
        score = after - before
        if score > best:
            best, best_t = score, i / 50
    # snap to the strongest onset within ±150ms
    i0 = int(best_t * 50)
    seg = np.diff(e[max(0, i0 - 8) : i0 + 8])
    if len(seg):
        best_t = (max(0, i0 - 8) + int(np.argmax(seg)) + 1) / 50
    return round(best_t, 3)


def main():
    res = {}
    vo = PUBLIC / "voiceover.m4a"
    if vo.exists():
        pauses = vo_pauses(vo)
        res["voPauses"] = pauses
        lead = pauses[0][1] if pauses and pauses[0][0] < 0.05 else 0.0
        res["voLeadIn"] = round(max(0.0, lead - 0.3), 3)  # keep a breath before speech
    music = PUBLIC / "music.mp3"
    if music.exists():
        res["musicDrop"] = music_drop(music)
        # second drop (used as an accent for the website reveal)
        res["musicDrop2"] = music_drop(music, res["musicDrop"] + 20, res["musicDrop"] + 70)
    (PUBLIC / "audio-analysis.json").write_text(json.dumps(res, indent=2))
    print(json.dumps(res, indent=2))


if __name__ == "__main__":
    main()
