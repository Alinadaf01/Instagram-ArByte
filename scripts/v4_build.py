"""Reel #4 («سرفیس ۷ پلاسه یا ۵؟») — cut the desk take + separate voice.

Inputs (public/video4/raw, not in git):
* IMG_0407.MOV – iPhone 4K HLG, already colour-graded by the presenter
* voice.m4a    – separate voice recording (phone in pocket)
* music.mp3    – «Come Back» (Mehdi Fard), instrumental

The presenter's grade is kept: only the technical HLG/BT.2020 → SDR/BT.709
conversion is applied. Each line is the best take (chosen by hand from the
large-v3 transcript, onsets checked on the waveform); pauses longer than
GAP_MAX inside a line are shortened to GAP_KEEP, picture and sound together.

Outputs: public/video4/edit.mp4, voice.wav, edit.json (segments + words).
"""
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import fftconvolve

ROOT = Path(__file__).resolve().parent.parent
V4 = ROOT / "public" / "video4"
RAW = V4 / "raw"
CONVERT = "colorspace=iall=bt2020:itrc=bt709:all=bt709:format=yuv420p"
SYNC = -0.414  # voice clock = camera clock + SYNC (refined per line below)
GAP_MAX, GAP_KEEP = 0.28, 0.14

VOICE = (
    "highpass=f=80,"
    "equalizer=f=220:t=q:w=1.2:g=-2.5,"
    "equalizer=f=3200:t=q:w=1.4:g=2.5,"
    "equalizer=f=9000:t=h:w=0.7:g=1.5,"
    "acompressor=threshold=-20dB:ratio=2.5:attack=12:release=180:makeup=3,"
    "loudnorm=I=-16:TP=-1.5:LRA=7"
)

# (name, voice-clock range of the chosen take)
EDL = [
    ("hook", (71.10, 77.00)),
    ("ports", (78.90, 87.85)),
    ("model", (361.50, 372.80)),
    ("ssd", (386.25, 391.98)),
    ("info", (408.05, 414.80)),
    ("cta", (419.00, 425.45)),
]

# corrected subtitle words (voice clock)
WORDS = {
    "hook": [("این", 71.20), ("سرفیس", 71.33), ("پرو", 71.75), ("۷", 71.95), ("پلاسه", 72.13), ("یا", 72.65), ("شاید", 72.97), ("هم", 73.19),
             ("پرو", 73.31), ("۵؟", 73.49), ("از", 73.71), ("بیرون", 74.49), ("عین", 74.89), ("همن،", 75.07), ("ولی", 75.29), ("چهار", 75.69),
             ("سال", 75.93), ("با", 76.15), ("هم", 76.29), ("فاصله", 76.35), ("دارن!", 76.65, 76.95)],
    "ports": [("اول،", 79.00), ("بغلش", 79.65), ("رو", 80.21), ("نگاه", 80.37), ("کن.", 80.59), ("اگه", 81.20), ("پورت", 81.51), ("تایپ‌سی", 81.77),
              ("داره", 82.41), ("یعنی", 82.63), ("پرو", 82.87), ("۷", 83.01), ("یا", 83.37), ("پرو", 83.49), ("۷", 83.63), ("پلاسه؛", 83.95),
              ("پرو", 84.29), ("۶", 84.93), ("و", 85.23), ("پرو", 85.33), ("۵", 85.63), ("به", 86.01), ("جاش", 86.29), ("مینی", 86.53),
              ("دیسپلی‌پورت", 86.77), ("دارن.", 87.45, 87.75)],
    "model": [("دوم،", 361.60), ("پایه", 361.87), ("رو", 362.33), ("باز", 362.51), ("کن.", 362.67), ("زیر", 362.93), ("پایه", 363.43),
              ("مدل‌نامبر", 363.75), ("رو", 364.37), ("نوشته:", 364.49), ("1960", 364.89), ("و", 365.57), ("1961", 366.01), ("پرو", 366.29),
              ("۷", 366.87), ("پلاسه،", 367.13), ("1866", 367.73), ("پرو", 368.81), ("۷ـه", 369.33), ("و", 369.79), ("1796", 369.99),
              ("پرو", 370.99), ("۵", 371.63), ("یا", 371.89), ("پرو", 372.07), ("۶ـه.", 372.25, 372.70)],
    "ssd": [("سوم،", 386.35), ("فقط", 386.86), ("پرو", 387.46), ("۷", 387.64), ("پلاسه", 387.84), ("که", 388.28), ("زیرش", 388.42),
            ("دریچه", 388.64), ("برای", 389.16), ("ارتقای", 389.48), ("SSD", 389.90), ("داره", 390.40), ("و", 390.60), ("SSDـش", 390.74),
            ("قابل", 391.16), ("تعویضه.", 391.42, 391.90)],
    "info": [("و", 408.10), ("آخر،", 408.36), ("توی", 408.80), ("ویندوز", 409.36), ("msinfo32", 409.88), ("رو", 410.76), ("بزن؛", 411.00),
             ("مدل", 411.22), ("دقیق", 411.94), ("و", 412.34), ("نسل", 412.46), ("پردازنده", 412.76), ("رو", 413.48), ("می‌تونی", 413.62),
             ("بررسی", 414.02), ("کنی.", 414.36, 414.75)],
    "cta": [("اگه", 419.10), ("سرفیس", 420.00), ("نیاز", 420.42), ("داری،", 420.72), ("کلمه‌ی", 420.98), ("«سرفیس»", 421.38), ("رو", 421.82),
            ("برامون", 421.96), ("کامنت", 422.16), ("کن", 422.50), ("تا", 422.68), ("چک‌لیست", 422.82), ("کامل", 423.28), ("خرید", 423.80),
            ("رو", 424.14), ("برات", 424.24), ("ارسال", 424.50), ("کنیم.", 425.00, 425.35)],
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
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{start:.3f}", "-i", str(RAW / "IMG_0407.MOV"), "-t", f"{cb - ca + 2:.3f}", "-an",
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
    graph = ";".join(vparts + aparts) + f";{''.join(labels)}concat=n={k}:v=1:a=1[v][a];[a]aformat=channel_layouts=mono,{VOICE}[voice]"
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-i", str(RAW / "voice.m4a"), "-filter_complex", graph,
         "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-threads", "3", "-crf", "15",
         "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-movflags", "+faststart", "-an", str(V4 / "edit.mp4"),
         "-map", "[voice]", "-ar", "48000", "-ac", "1", str(V4 / "voice.wav")])
    (V4 / "edit.json").write_text(json.dumps({"duration": round(t, 3), "segments": segments, "words": words}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"edit: {t:.2f}s")
    for s in segments:
        print(s)


if __name__ == "__main__":
    main()
