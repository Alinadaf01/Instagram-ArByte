"""Reel #7 («تست قبل از ارسال») — cut the desk take + separate voice.

Inputs (public/video7/raw, not in git):
* IMG_0406.MOV – iPhone 4K HLG, already colour-graded by the presenter
* voice.m4a    – separate voice recording (phone in pocket)

The presenter's grade is kept: only the technical HLG/BT.2020 → SDR/BT.709
conversion is applied. Each line is the best take (chosen by hand from the
large-v3 transcript, onsets checked on the waveform); pauses longer than
GAP_MAX inside a line are shortened to GAP_KEEP, picture and sound together.

Outputs: public/video7/edit.mp4, voice.wav, edit.json (segments + words).
"""
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import fftconvolve

ROOT = Path(__file__).resolve().parent.parent
V7 = ROOT / "public" / "video7"
RAW = V7 / "raw"
CONVERT = "colorspace=iall=bt2020:itrc=bt709:all=bt709:format=yuv420p"
SYNC = -0.2245  # voice clock = camera clock + SYNC (refined per line below)
GAP_MAX, GAP_KEEP = 0.34, 0.16
FREEZE_AT = None  # no hold needed: the last take ends on the lens

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
    ("hook", (3.15, 6.50)),
    ("serial", (15.50, 18.85)),
    ("screen", (22.40, 27.25)),
    ("battery", (49.85, 54.50)),
    ("ports", (56.15, 59.00)),
    ("warranty", (162.85, 166.58)),
    ("cta", (167.02, 170.65)),     # same continuous take as «warranty», eyes on the lens
]

# corrected subtitle words (voice clock; per-window large-v3 pass + waveform)
WORDS = {
    "hook": [("این", 3.25), ("دستگاه", 3.54), ("فردا", 3.98), ("می‌ره", 4.34), ("رشت؛", 4.54), ("ببین", 4.90), ("قبلش", 5.14), ("باهاش", 5.50),
             ("چیکار", 5.72), ("می‌کنیم.", 6.02, 6.42)],
    "serial": [("اول،", 15.55), ("سریالِ", 15.88), ("روی", 16.30), ("بدنه", 16.46), ("رو", 16.82), ("با", 17.00), ("سریالِ", 17.08), ("توی", 17.40),
               ("ویندوز", 17.56), ("تطبیق", 17.92), ("می‌دیم.", 18.36, 18.75)],
    "screen": [("بعد", 22.45), ("صفحه:", 22.62), ("پیکسل", 23.85), ("به", 24.30), ("پیکسل؛", 24.38), ("تاچ", 25.00), ("و", 25.54), ("گوشه", 25.70),
               ("به", 26.40), ("گوشه‌ش", 26.56), ("رو.", 26.92, 27.15)],
    "battery": [("سلامت", 49.85), ("باتری", 50.22), ("رو", 50.66), ("هم", 50.82), ("با", 50.98), ("گزارش", 51.14), ("توی", 51.46), ("ویندوز", 51.66),
                ("چک", 52.12), ("می‌کنیم", 52.38), ("و", 52.90), ("درصدش", 53.18), ("رو", 53.74), ("بهتون", 53.86), ("می‌گیم.", 54.10, 54.45)],
    "ports": [("شارژ", 56.25), ("و", 56.80), ("پورت‌ها", 56.84), ("هم", 57.28), ("که", 57.44), ("یک‌به‌یک", 57.76), ("تست", 58.36), ("می‌شن.", 58.64, 58.95)],
    "warranty": [("بعدش", 162.88), ("با", 163.06), ("برگه‌ی", 163.22), ("گارانتیش", 163.46), ("که", 164.04), ("همراهش", 164.22), ("مهلت", 164.50),
                 ("تست", 164.84), ("هم", 165.18), ("هست،", 165.40), ("می‌ره", 165.64), ("برای", 166.00), ("ارسال.", 166.22, 166.55)],
    "cta": [("اگه", 167.08), ("می‌خوای", 167.48), ("مطمئن", 167.74), ("خرید", 168.04), ("کنی،", 168.32), ("کلمه‌ی", 168.62), ("«مشاوره»", 169.20),
            ("رو", 169.60), ("کامنت", 169.82), ("کن.", 170.36, 170.60)],
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
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{start:.3f}", "-i", str(RAW / "IMG_0406.MOV"), "-t", f"{cb - ca + 2:.3f}", "-an",
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
            if FREEZE_AT and name == "cta" and q > FREEZE_AT > p:
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
    lift = f",volume=enable='between(t,{lw['start'] - 0.02:.3f},{t:.3f})':volume=1.0"
    graph = ";".join(vparts + aparts) + f";{''.join(labels)}concat=n={k}:v=1:a=1[v][a];[a]aformat=channel_layouts=mono,{VOICE}{lift}[voice]"
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-i", str(RAW / "voice.m4a"), "-filter_complex", graph,
         "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-threads", "3", "-crf", "15",
         "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-movflags", "+faststart", "-an", str(V7 / "edit.mp4"),
         "-map", "[voice]", "-ar", "48000", "-ac", "1", str(V7 / "voice.wav")])
    (V7 / "edit.json").write_text(json.dumps({"duration": round(t, 3), "segments": segments, "words": words}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"edit: {t:.2f}s")
    for s in segments:
        print(s)


if __name__ == "__main__":
    main()
