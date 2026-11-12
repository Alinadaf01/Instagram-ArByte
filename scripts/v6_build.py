"""Reel #6 («چک‌لیست گیمینگ») — cut the desk take + separate voice.

Inputs (public/video6/raw, not in git):
* IMG_0403.MOV – iPhone 4K HLG, already colour-graded by the presenter
* voice.m4a    – separate voice recording (phone in pocket)

The presenter's grade is kept: only the technical HLG/BT.2020 → SDR/BT.709
conversion is applied. Each line is the best take (chosen by hand from the
large-v3 transcript, onsets checked on the waveform); pauses longer than
GAP_MAX inside a line are shortened to GAP_KEEP, picture and sound together.

Outputs: public/video6/edit.mp4, voice.wav, edit.json (segments + words).
"""
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import fftconvolve

ROOT = Path(__file__).resolve().parent.parent
V6 = ROOT / "public" / "video6"
RAW = V6 / "raw"
CONVERT = "colorspace=iall=bt2020:itrc=bt709:all=bt709:format=yuv420p"
SYNC = -0.400  # voice clock = camera clock + SYNC (refined per line below)
GAP_MAX, GAP_KEEP = 0.34, 0.16
FREEZE_AT = 158.95  # voice clock: the last frame with the eyes on the lens

VOICE = (
    "highpass=f=80,"
    "equalizer=f=220:t=q:w=1.2:g=-2.5,"
    "equalizer=f=3200:t=q:w=1.4:g=2.5,"
    "equalizer=f=9000:t=h:w=0.7:g=1.5,"
    "acompressor=threshold=-20dB:ratio=2.5:attack=12:release=180:makeup=3,"
    "loudnorm=I=-16:TP=-1.5:LRA=7"
)

# (name, voice-clock range of the chosen take) — onsets from the waveform
EDL = [
    ("hook", (47.95, 50.95)),     # complete sentence, eyes on the lens to the end
    ("n1", (124.05, 130.35)),
    ("n2", (130.88, 135.22)),
    ("n3", (137.25, 141.05)),
    ("cta", (152.72, 159.30)),    # one clean take; picture held from FREEZE_AT (eyes drop at 159.0)
]

# corrected subtitle words (voice clock; starts from a per-window large-v3 pass)
WORDS = {
    "hook": [("دو", 48.00), ("تا", 48.12), ("لپ‌تاپ", 48.20), ("با", 48.52), ("یه", 48.60), ("کارت‌گرافیک", 48.68), ("می‌تونن", 49.16),
             ("کلی", 49.48), ("با", 49.78), ("هم", 49.94), ("فرق", 49.98), ("داشته", 50.28), ("باشن!", 50.52, 50.90)],
    "n1": [("یک:", 124.10), ("فقط", 124.41), ("RTX‌ش", 124.75), ("رو", 125.10), ("نبین؛", 125.33), ("ببین", 125.61), ("TGP‌ش", 125.99), ("چند", 126.47),
           ("واته.", 126.77), ("تعیین", 127.03), ("می‌کنه", 127.81), ("چقدر", 128.13), ("از", 128.53), ("قدرت", 128.67), ("گرافیک", 128.93),
           ("واقعاً", 129.33), ("بهت", 129.63), ("می‌رسه.", 129.85, 130.30)],
    "n2": [("دو:", 130.95), ("رمش", 131.26), ("دوکاناله", 131.80), ("باشه،", 132.34), ("اسلات", 132.68), ("خالی", 133.38), ("برای", 133.78),
           ("ارتقا", 134.02), ("داشته", 134.46), ("باشه.", 134.80, 135.15)],
    "n3": [("سه:", 137.30), ("صفحه‌ی", 137.88), ("۱۴۴", 138.28), ("هرتز؛", 138.62), ("تفاوتشو", 139.32), ("با", 140.04), ("چشم", 140.24),
           ("می‌بینی.", 140.52, 141.00)],
    "cta": [("این", 152.80), ("ویدیو", 152.90), ("رو", 153.12), ("برای", 153.30), ("رفیقت", 153.50), ("که", 153.84), ("می‌خواد", 154.04),
            ("لپ‌تاپ", 154.26), ("گیمینگ", 154.55), ("بخره", 154.86), ("بفرست.", 155.16), ("کلمه‌ی", 155.40), ("«گیمینگ»", 156.10), ("رو", 156.64),
            ("کامنت", 156.78), ("کن", 157.10), ("تا", 157.26), ("لیست", 157.42), ("موجودی", 157.64), ("رو", 158.08), ("برات", 158.22),
            ("ارسال", 158.46), ("کنیم.", 158.90, 159.25)],
}


def run(cmd):
    subprocess.run(cmd, check=True)


def local_sync(cam, vo, a, b, sr=16000):
    """camera offset for the voice range [a, b] (± 60 ms around SYNC)"""
    va = vo[int(a * sr):int(b * sr)]
    ca = a - SYNC
    pad = int(0.06 * sr)
    ref = cam[int(ca * sr) - pad:int(ca * sr) + len(va) + pad]
    c = fftconvolve(ref, va[::-1], mode="valid")
    return SYNC - (np.argmax(c) - pad) / sr


def keep_ranges(vo, a, b, sr=16000):
    """split [a, b] at pauses longer than GAP_MAX (frame RMS < -38 dBFS)"""
    hop = int(0.01 * sr)
    x = vo[int(a * sr):int(b * sr)]
    n = len(x) // hop
    db = 20 * np.log10(np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)
    quiet = db < -38
    out, s, i = [], 0.0, 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            g0, g1 = i * 0.01, j * 0.01
            if g1 - g0 > GAP_MAX and g0 > 0.05 and j < n:
                half = GAP_KEEP / 2
                out.append((a + s, a + g0 + half))
                s = g1 - half
            i = j
        else:
            i += 1
    out.append((a + s, b))
    return [(round(p, 3), round(q, 3)) for p, q in out if q - p > 0.05]


def clip_for(name, ca, cb):
    """converted 1080×1920 clip of camera range [ca-1, cb+1] (only what we use)"""
    out = RAW / f"clip_{name}.mp4"
    start = max(0.0, ca - 1.0)
    if not out.exists():
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{start:.3f}", "-i", str(RAW / "IMG_0403.MOV"), "-t", f"{cb - ca + 2:.3f}", "-an",
             "-vf", f"{CONVERT},scale=1080:1920:flags=lanczos,format=yuv420p",
             "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
             "-c:v", "libx264", "-preset", "fast", "-crf", "14", "-threads", "3", str(out)])
    return out, start


def main():
    cam, _ = sf.read(RAW / "cam16k.wav")
    vo, _ = sf.read(RAW / "vo16k.wav")
    vparts, aparts, labels, segments, words = [], [], [], [], []
    t, k = 0.0, 0
    inputs = []
    for idx, (name, (a, b)) in enumerate(EDL):
        off = local_sync(cam, vo, a, b)
        clip, cstart = clip_for(name, a - off, b - off)
        inputs += ["-i", str(clip)]
        seg_start = t
        mapped = []
        for p, q in keep_ranges(vo, a, b):
            d = q - p
            if name == "cta" and q > FREEZE_AT > p:
                hold = q - FREEZE_AT
                vparts.append(f"[{idx}:v]trim={p - off - cstart:.3f}:{FREEZE_AT - off - cstart:.3f},setpts=PTS-STARTPTS,fps=30,tpad=stop_mode=clone:stop_duration={hold:.3f}[v{k}]")
            else:
                vparts.append(f"[{idx}:v]trim={p - off - cstart:.3f}:{q - off - cstart:.3f},setpts=PTS-STARTPTS,fps=30[v{k}]")
            aparts.append(f"[{len(EDL)}:a]atrim={p:.3f}:{q:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={d - 0.015:.3f}:d=0.015[a{k}]")
            labels.append(f"[v{k}][a{k}]")
            mapped.append((p, q, t))
            t += d
            k += 1
        for i, w in enumerate(WORDS[name]):
            s = w[1]
            e = w[2] if len(w) > 2 else WORDS[name][i + 1][1]
            for p, q, o in mapped:
                if s < p:
                    s = p
                if p <= s <= q:
                    words.append({"word": w[0], "start": round(o + s - p, 3), "end": round(o + min(e, q) - p, 3), "seg": name})
                    break
        segments.append({"name": name, "start": round(seg_start, 3), "end": round(t, 3), "sync": round(float(off), 4), "cuts": [round(o, 3) for _, _, o in mapped[1:]]})
    # «کنیم» trails off quietly: lift the last word a little so the music never covers it
    lw = words[-1]
    lift = f",volume=enable='between(t,{lw['start'] - 0.02:.3f},{t:.3f})':volume=2.1"
    graph = ";".join(vparts + aparts) + f";{''.join(labels)}concat=n={k}:v=1:a=1[v][a];[a]aformat=channel_layouts=mono,{VOICE}{lift}[voice]"
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-i", str(RAW / "voice.m4a"), "-filter_complex", graph,
         "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-threads", "3", "-crf", "15",
         "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-movflags", "+faststart", "-an", str(V6 / "edit.mp4"),
         "-map", "[voice]", "-ar", "48000", "-ac", "1", str(V6 / "voice.wav")])
    (V6 / "edit.json").write_text(json.dumps({"duration": round(t, 3), "segments": segments, "words": words}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"edit: {t:.2f}s")
    for s in segments:
        print(s)


if __name__ == "__main__":
    main()
