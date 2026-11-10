"""Reel #5 («i5 نسل ۱۱ در برابر i7 نسل ۱۰») — cut four takes, camera sound.

Inputs (public/video5/raw, not in git): IMG_0332/0333/0335/0337 — iPhone HLG,
graded by the presenter, sound from the camera mic (no separate voice).
Only the technical HLG/BT.2020 → SDR/BT.709 conversion is applied.

* best take per line (from the large-v3 transcript, onsets checked on the
  waveform), pauses > GAP_MAX inside a line shortened to GAP_KEEP
* the whole edit runs SPEED× faster (atempo keeps the pitch) to keep it short
* camera voice: high-pass, EQ, gentle compression, -16 LUFS

Outputs: public/video5/edit.mp4, voice.wav, edit.json (segments + words,
timed to the sped-up edit).
"""
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
V5 = ROOT / "public" / "video5"
RAW = V5 / "raw"
CONVERT = "colorspace=iall=bt2020:itrc=bt709:all=bt709:format=yuv420p"
SPEED = 1.06
GAP_MAX, GAP_KEEP = 0.24, 0.10

VOICE = (
    "highpass=f=85,"
    "equalizer=f=200:t=q:w=1.2:g=-3,"
    "equalizer=f=3000:t=q:w=1.4:g=3,"
    "equalizer=f=8500:t=h:w=0.7:g=2,"
    "acompressor=threshold=-22dB:ratio=3:attack=10:release=160:makeup=4,"
    "loudnorm=I=-16:TP=-1.5:LRA=6"
)

EDL = [
    ("hook", "IMG_0332.MOV", (46.05, 50.20)),
    ("example", "IMG_0333.MOV", (28.10, 34.30)),
    ("why", "IMG_0335.mov", (1.92, 10.65)),
    ("end", "IMG_0337.mov", (0.55, 9.98)),
]

WORDS = {
    "hook": [("اگه", 46.05), ("بهت", 46.14), ("بگم", 46.32), ("بعضی", 46.54), ("از", 46.88), ("پردازنده‌های", 47.02), ("i5", 47.66),
             ("از", 48.12), ("i7", 48.34), ("قوی‌ترن،", 48.78), ("باور", 49.28), ("می‌کنی؟", 49.54, 50.10)],
    "example": [("مثلاً", 28.10), ("ممکنه", 28.43), ("یه", 28.89), ("پردازنده‌ی", 29.09), ("i5", 29.69), ("نسل", 30.25), ("۱۱", 30.49),
                ("از", 30.87), ("i7", 31.45), ("نسل", 31.91), ("۱۰", 32.37), ("عملکرد", 32.63), ("بهتری", 33.33), ("داشته", 33.67),
                ("باشه.", 33.91, 34.20)],
    "why": [("چرا؟", 1.95), ("چون", 2.23), ("قدرت", 2.53), ("پردازنده", 2.93), ("فقط", 3.57), ("به", 3.81), ("i5", 3.95), ("و", 4.29),
            ("i7", 4.47), ("بودنش", 4.75), ("بستگی", 5.15), ("نداره؛", 5.57), ("به", 5.95), ("نسل،", 6.35), ("تعداد", 6.91), ("هسته،", 7.39),
            ("معماری", 7.79), ("یا", 8.61), ("سری", 8.77), ("پردازنده", 9.05), ("هم", 9.73), ("بستگی", 9.91), ("داره.", 10.39, 10.60)],
    "end": [("پس", 0.55), ("موقع", 0.81), ("خرید", 1.05), ("لپ‌تاپ", 1.33), ("به", 1.81), ("برچسب", 1.99), ("i5", 2.39), ("یا", 2.79),
            ("i7", 3.11), ("بودنش", 3.39), ("توجه", 3.87), ("نکن؛", 4.17), ("مدل", 4.95), ("دقیق", 5.15), ("پردازنده‌ت", 5.45), ("رو", 6.09),
            ("بررسی", 6.27), ("کن،", 6.63), ("چون", 6.91), ("همیشه", 7.35), ("i7", 7.73), ("بودن", 8.05), ("به", 8.43), ("معنی", 8.55),
            ("انتخاب", 8.73), ("بهتر", 9.01), ("نیست.", 9.47, 9.90)],
}


def run(cmd):
    subprocess.run(cmd, check=True)


def keep_ranges(wav, a, b, sr=16000):
    x, _ = sf.read(wav)
    hop = int(0.01 * sr)
    x = x[int(a * sr):int(b * sr)]
    n = len(x) // hop
    db = 20 * np.log10(np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)
    quiet = db < -48
    out, s, i = [], 0.0, 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            g0, g1 = i * 0.01, j * 0.01
            if g1 - g0 > GAP_MAX and g0 > 0.05 and j < n:
                out.append((a + s, a + g0 + GAP_KEEP / 2))
                s = g1 - GAP_KEEP / 2
            i = j
        else:
            i += 1
    out.append((a + s, b))
    return [(round(p, 3), round(q, 3)) for p, q in out if q - p > 0.05]


def clip_for(name, src, a, b):
    out = RAW / f"clip_{name}.mp4"
    start = max(0.0, a - 0.5)
    if not out.exists():
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{start:.3f}", "-i", str(RAW / src), "-t", f"{b - a + 1:.3f}",
             "-vf", f"{CONVERT},scale=1080:1920:flags=lanczos,format=yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
             "-c:v", "libx264", "-preset", "fast", "-crf", "14", "-threads", "3", "-c:a", "pcm_s16le", str(out)])
    return out, start


def main():
    inputs, vparts, aparts, labels, segments, words = [], [], [], [], [], []
    t, k = 0.0, 0
    for idx, (name, src, (a, b)) in enumerate(EDL):
        clip, cs = clip_for(name, src, a, b)
        inputs += ["-i", str(clip)]
        seg_start, mapped = t, []
        for p, q in keep_ranges(RAW / f"{Path(src).stem}.16k.wav", a, b):
            d = (q - p) / SPEED
            vparts.append(f"[{idx}:v]trim={p - cs:.3f}:{q - cs:.3f},setpts=(PTS-STARTPTS)/{SPEED},fps=30[v{k}]")
            aparts.append(f"[{idx}:a]atrim={p - cs:.3f}:{q - cs:.3f},asetpts=PTS-STARTPTS,atempo={SPEED},aformat=channel_layouts=mono,"
                          f"afade=t=in:d=0.01,afade=t=out:st={max(0, d - 0.015):.3f}:d=0.015[a{k}]")
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
                    words.append({"word": w[0], "start": round(o + (s - p) / SPEED, 3), "end": round(o + (min(e, q) - p) / SPEED, 3), "seg": name})
                    break
        segments.append({"name": name, "start": round(seg_start, 3), "end": round(t, 3), "cuts": [round(o, 3) for _, _, o in mapped[1:]]})
    graph = ";".join(vparts + aparts) + f";{''.join(labels)}concat=n={k}:v=1:a=1[v][a];[a]{VOICE}[voice]"
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", graph,
         "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-threads", "3", "-crf", "15",
         "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-movflags", "+faststart", "-an", str(V5 / "edit.mp4"),
         "-map", "[voice]", "-ar", "48000", "-ac", "1", str(V5 / "voice.wav")])
    (V5 / "edit.json").write_text(json.dumps({"duration": round(t, 3), "segments": segments, "words": words}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"edit: {t:.2f}s")
    for s in segments:
        print(s)


if __name__ == "__main__":
    main()
