"""Reel #2 («i5 یا i7؟») — cut the five takes into one edit.

* Trims each take to its speech and shortens pauses longer than ~0.35s
  (ranges chosen from silencedetect at -36 dB).
* public/video2/edit.mp4   – 1080×1920 H.264 30fps picture of the whole edit
* public/video2/voice.wav  – the matching voice track: high-pass, denoise,
                             de-ess, compression, -16 LUFS
* public/video2/edit.json  – segment boundaries + corrected subtitle words,
                             all re-timed to the edit
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
V2 = ROOT / "public" / "video2"
RAW = V2 / "raw"

# take → kept source ranges (seconds)
EDL = [
    ("0350", "hook", [(0.74, 6.62)]),  # speech starts at 0.80 → first frame already talking
    ("0351", "intro", [(0.84, 3.94), (4.33, 7.55)]),
    ("0352", "i5", [(0.0, 5.06), (5.39, 7.92), (8.37, 9.66)]),
    ("0353", "i7", [(0.0, 2.59), (2.74, 10.40)]),
    ("0354", "cta", [(0.60, 7.32)]),
]

# Subtitle text per take: corrected Whisper words (same count/timing as the
# large-v3 pass in raw_words2.json, except 0354 which uses raw_words.json).
FIXES = {
    "0350": {"بخریم": "بخری", "نمی‌آت.": "نمیاد!"},
    "0351": {"منطقه": "منتها"},
    "0352": {"دانشجوی،": "دانشجویی؟", "می‌دی،": "می‌دی؟", "بهتریه": "بهتریه"},
    "0353": {"ویدیوی": "ویدیو", "خوب": "خب"},
    "0354": {"بیاییم": "بیا", "نیاد": "میاد", "کانفیک": "کانفیگ", "کنی.": "کنیم!"},
}
MERGE = {  # consecutive tokens shown as one subtitle word
    "0351": [(["Surface", "Pro", "7", "Plus"], "Surface Pro 7+")],
    "0352": [(["برنامه", "نویسی"], "برنامه‌نویسی")],
    "0354": [(["برای", "تو"], "برات")],
}

# per-location colour correction, applied before scaling
GRADE = {
    # grey wall (same room as reel #1): only tame the hot highlights and give a
    # touch of matte so it matches the first reel's look
    "grey": "curves=all='0/0.03 0.25/0.24 0.5/0.48 0.85/0.74 1/0.9',eq=saturation=1.04",
    # beige wall: was too bright and yellow → bring exposure down to the grey
    # takes and neutralise the cast while keeping skin warm
    "beige": "curves=r='0/0.02 0.3/0.25 0.6/0.52 0.76/0.69 1/0.9':g='0/0.02 0.3/0.25 0.6/0.51 0.75/0.68 1/0.9':"
    "b='0/0.02 0.3/0.255 0.58/0.51 0.68/0.645 1/0.88',eq=saturation=1.02",
}
LOCATION = {"0350": "grey", "0351": "grey", "0352": "beige", "0353": "beige", "0354": "beige"}

# The room is quiet (noise floor ≈ -75 dB), so no denoiser: the earlier
# afftdn/de-esser made the voice sound processed. Clean EQ + gentle comp.
VOICE = (
    "highpass=f=75,"
    "equalizer=f=220:t=q:w=1.2:g=-2.5,"     # less boxiness
    "equalizer=f=3200:t=q:w=1.4:g=2.5,"     # presence / clarity
    "equalizer=f=9000:t=h:w=0.7:g=1.5,"     # air
    "acompressor=threshold=-20dB:ratio=2.5:attack=12:release=180:makeup=3,"
    "loudnorm=I=-16:TP=-1.5:LRA=7"
)


def run(cmd):
    subprocess.run(cmd, check=True)


def words_for(take):
    src = "raw_words.json" if take == "0354" else "raw_words2.json"
    ws = json.loads((V2 / src).read_text(encoding="utf-8"))[take]["words"]
    ws = [{"word": FIXES.get(take, {}).get(w["word"], w["word"]), "start": w["start"], "end": w["end"]} for w in ws]
    for pattern, repl in MERGE.get(take, []):
        out, i = [], 0
        while i < len(ws):
            if [w["word"] for w in ws[i : i + len(pattern)]] == pattern:
                out.append({"word": repl, "start": ws[i]["start"], "end": ws[i + len(pattern) - 1]["end"]})
                i += len(pattern)
            else:
                out.append(ws[i])
                i += 1
        ws = out
    return ws


def main():
    inputs, vparts, aparts, labels = [], [], [], []
    segments, words = [], []
    t = 0.0
    k = 0
    for idx, (take, name, ranges) in enumerate(EDL):
        inputs += ["-i", str(RAW / f"IMG_{take}.MOV")]
        seg_start = t
        mapped = []
        for a, b in ranges:
            vparts.append(
                f"[{idx}:v]trim={a}:{b},setpts=PTS-STARTPTS,"
                f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,{GRADE[LOCATION[take]]},format=yuv420p[v{k}]"
            )
            aparts.append(f"[{idx}:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.015,afade=t=out:st={b - a - 0.015}:d=0.015[a{k}]")
            labels.append(f"[v{k}][a{k}]")
            mapped.append((a, b, t))
            t += b - a
            k += 1
        for w in words_for(take):
            s = w["start"]
            for a, b, off in mapped:
                if s < a:  # starts inside a removed pause → snap to next kept range
                    s = a
                if a <= s <= b:
                    e = min(w["end"], b)
                    words.append({"word": w["word"], "start": round(off + s - a, 3), "end": round(off + e - a, 3), "seg": name})
                    break
        segments.append({"name": name, "take": take, "start": round(seg_start, 3), "end": round(t, 3)})

    graph = ";".join(vparts + aparts) + f";{''.join(labels)}concat=n={k}:v=1:a=1[v][a];[a]{VOICE}[voice]"
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", graph,
         "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-threads", "2", "-crf", "16", "-movflags", "+faststart", "-an", str(V2 / "edit.mp4"),
         "-map", "[voice]", "-ar", "48000", "-ac", "1", str(V2 / "voice.wav")])
    (V2 / "edit.json").write_text(json.dumps({"duration": round(t, 3), "segments": segments, "words": words}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"edit: {t:.2f}s")
    for s in segments:
        print(s)
    print(" ".join(w["word"] for w in words))


if __name__ == "__main__":
    main()
