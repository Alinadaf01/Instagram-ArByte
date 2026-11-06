"""Reel #3 («بودجه‌ت رو بگو») — cut one long take + a separate voice track.

Inputs (public/video3/raw, not in git):
* IMG_0402.MOV  – iPhone 4K HLG, the whole session (picture)
* voice.ogg     – the phone-in-pocket voice recording (sound)
* graded.mp4    – IMG_0402 scaled to 1080×1920 + GRADE (made once, below)

The voice track runs SYNC seconds ahead of the camera clock (found by
cross-correlating the camera audio with voice.ogg; no drift over 200s).

Outputs:
* public/video3/edit.mp4  – picture of the edit (1080×1920, 30fps)
* public/video3/voice.wav – matching voice, EQ + gentle comp, -16 LUFS; silent
                            under the «showcase» gaps (music carries them)
* public/video3/edit.json – segments + subtitle words re-timed to the edit
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
V3 = ROOT / "public" / "video3"
RAW = V3 / "raw"
SYNC = 1.158  # voice time = camera time + SYNC

# HLG treated as Rec.709 (iPhone HLG is backward compatible) then: highlight
# roll-off for the bright wall, a little warmth in the mids, more saturation
GRADE = (
    "curves=all='0/0 0.25/0.21 0.5/0.46 0.8/0.74 1/0.92',"
    "colorbalance=rm=0.035:gm=0:bm=-0.025:rs=-0.01:bs=0.015,eq=saturation=1.18:contrast=1.05"
)

VOICE = (
    "highpass=f=80,"
    "equalizer=f=220:t=q:w=1.2:g=-2.5,"
    "equalizer=f=3200:t=q:w=1.4:g=2.5,"
    "equalizer=f=9000:t=h:w=0.7:g=1.5,"
    "acompressor=threshold=-20dB:ratio=2.5:attack=12:release=180:makeup=3,"
    "loudnorm=I=-16:TP=-1.5:LRA=7"
)

# (name, voice-clock range, speaks?) — showcase gaps reuse silent footage
EDL = [
    ("hook", (110.00, 112.45), True),
    ("m1", (114.95, 118.40), True),
    ("p1", (118.40, 120.95), False),
    ("m2", (92.90, 95.95), True),
    ("p2", (96.00, 98.45), False),
    ("m3", (98.30, 101.75), True),
    ("p3", (112.45, 114.90), False),
    ("cta", (192.05, 196.90), True),
]

# corrected subtitle words, voice-clock times (large-v3 word stamps, onsets
# checked against the waveform)
WORDS = {
    "hook": [("بودجه‌ت", 110.10, 110.48), ("رو", 110.48, 110.64), ("بگو", 110.64, 110.84), ("تا", 110.84, 111.00), ("بهت", 111.00, 111.18),
             ("بگم", 111.18, 111.36), ("کدوم", 111.36, 111.60), ("مدل", 111.60, 111.82), ("رو", 111.82, 111.94), ("بخری", 111.94, 112.30)],
    "m1": [("بودجه‌ی", 115.00, 115.46), ("کم،", 115.46, 115.82), ("برای", 115.82, 116.04), ("دانشگاه", 116.04, 116.50), ("و", 116.50, 116.58),
           ("کار", 116.58, 116.72), ("روزمره؟", 116.72, 117.28), ("این", 117.28, 117.80), ("مدل", 117.80, 118.20)],
    "m2": [("طراحی", 93.00, 93.47), ("و", 93.47, 93.56), ("برنامه‌نویسی", 93.56, 94.22), ("جدی‌تر؟", 94.22, 94.95), ("این", 94.95, 95.30), ("مدل", 95.30, 95.72)],
    "m3": [("گیم،", 98.46, 99.10), ("رندر", 99.10, 99.58), ("یا", 99.58, 99.74), ("تدوین", 99.74, 100.10), ("سنگین‌تر؟", 100.10, 100.88),
           ("این", 100.88, 101.26), ("مدل", 101.26, 101.56)],
    "cta": [("بودجه‌ت", 192.10, 192.51), ("و", 192.51, 192.57), ("کارت", 192.57, 192.87), ("رو", 192.87, 192.97), ("برامون", 192.97, 193.20),
            ("کامنت", 193.20, 193.51), ("کن؛", 193.51, 193.91), ("دقیق‌ترین", 193.91, 194.63), ("گزینه‌ای", 194.63, 194.97), ("که", 194.97, 195.19),
            ("مناسب‌تره", 195.19, 195.75), ("برات", 195.75, 195.95), ("دایرکت", 195.95, 196.31), ("می‌کنیم", 196.31, 196.71)],
}


def run(cmd):
    subprocess.run(cmd, check=True)


def ensure_graded():
    out = RAW / "graded.mp4"
    if out.exists():
        return out
    run(["ffmpeg", "-v", "error", "-y", "-i", str(RAW / "IMG_0402.MOV"), "-an",
         "-vf", f"scale=1080:1920:flags=lanczos,{GRADE},format=yuv420p",
         "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
         "-c:v", "libx264", "-preset", "fast", "-crf", "14", "-threads", "3", str(out)])
    return out


def main():
    graded = ensure_graded()
    vparts, aparts, labels = [], [], []
    segments, words = [], []
    t = 0.0
    for k, (name, (a, b), speaks) in enumerate(EDL):
        d = b - a
        va = a - SYNC
        vparts.append(f"[0:v]trim={va:.3f}:{va + d:.3f},setpts=PTS-STARTPTS,fps=30[v{k}]")
        if speaks:
            aparts.append(f"[1:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={d - 0.03:.3f}:d=0.03[a{k}]")
        else:
            aparts.append(f"anullsrc=r=48000:cl=mono,atrim=0:{d:.3f}[a{k}]")
        labels.append(f"[v{k}][a{k}]")
        for w, s, e in WORDS.get(name, []):
            words.append({"word": w, "start": round(t + s - a, 3), "end": round(t + min(e, b) - a, 3), "seg": name})
        segments.append({"name": name, "start": round(t, 3), "end": round(t + d, 3)})
        t += d
    n = len(EDL)
    graph = ";".join(vparts + aparts) + f";{''.join(labels)}concat=n={n}:v=1:a=1[v][a];[a]aformat=channel_layouts=mono,{VOICE}[voice]"
    run(["ffmpeg", "-v", "error", "-y", "-i", str(graded), "-i", str(RAW / "voice.ogg"), "-filter_complex", graph,
         "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-threads", "3", "-crf", "15", "-movflags", "+faststart", "-an", str(V3 / "edit.mp4"),
         "-map", "[voice]", "-ar", "48000", "-ac", "1", str(V3 / "voice.wav")])
    (V3 / "edit.json").write_text(json.dumps({"duration": round(t, 3), "segments": segments, "words": words}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"edit: {t:.2f}s")
    for s in segments:
        print(s)


if __name__ == "__main__":
    main()
