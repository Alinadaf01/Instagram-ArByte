"""Audio mix prep + voiceover edit.

* Voice tracks (voiceover.m4a and the intro's camera audio) are recorded very
  quietly (≈ -30 LUFS) while music.mp3 is mastered hot (≈ -5.6 LUFS), so the
  music buried the voice. Here every source is cleaned and normalised:
    voice → high-pass, gentle compression, -16 LUFS
    music → -16 LUFS (the edit then sits it ~16 dB under speech)
* The voiceover is edited: lead-in silence trimmed and the ArByte-history
  sentence («ما توی آربایت با چهار سال سابقه … موجود کردیم») cut out, both
  inside natural pauses.

Writes public/media/{voiceover.wav,intro-voice.wav,music.mp3} and
public/edit.json (word timestamps re-timed to the edited voiceover).
"""
import json
import re
import subprocess
from pathlib import Path

PUBLIC = Path(__file__).resolve().parent.parent / "public"
MEDIA = PUBLIC / "media"

INTRO_END = 12.4
# (start, end) in voiceover.m4a seconds to remove — both edges sit in silence
VO_CUTS = [(31.9, 41.15)]

VOICE_CHAIN = (
    "highpass=f=80,lowpass=f=14000,"
    "acompressor=threshold=-24dB:ratio=3:attack=8:release=120:makeup=4,"
    "loudnorm=I=-16:TP=-1.5:LRA=7"
)


def run(cmd):
    subprocess.run(cmd, check=True)


def ffprobe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout
    return float(out.strip())


def keep_ranges(lead: float, dur: float):
    ranges, cur = [], lead
    for a, b in VO_CUTS:
        ranges.append((cur, a))
        cur = b
    ranges.append((cur, dur))
    return ranges


def remap(t: float, ranges, snap: str | None = None):
    """Original VO time → edited time. Inside a cut → None, or snapped to the
    next kept range when snap="next" (Whisper often starts a word early, in
    the silence before it)."""
    acc = 0.0
    for a, b in ranges:
        if a <= t <= b:
            return round(acc + (t - a), 3)
        if snap == "next" and t < a:
            return round(acc, 3)
        acc += b - a
    return None


def build_voiceover(lead: float):
    src = PUBLIC / "voiceover.m4a"
    dur = ffprobe_duration(src)
    ranges = keep_ranges(lead, dur)
    parts, labels = [], []
    for i, (a, b) in enumerate(ranges):
        parts.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={b - a - 0.02}:d=0.02[p{i}]")
        labels.append(f"[p{i}]")
    graph = ";".join(parts) + f";{''.join(labels)}concat=n={len(labels)}:v=0:a=1,{VOICE_CHAIN}[out]"
    out = MEDIA / "voiceover.wav"
    run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-filter_complex", graph, "-map", "[out]", "-ar", "48000", "-ac", "1", str(out)])
    return ranges, ffprobe_duration(out)


def main():
    MEDIA.mkdir(exist_ok=True)
    analysis = json.loads((PUBLIC / "audio-analysis.json").read_text())
    lead = analysis.get("voLeadIn", 0.0)

    ranges, vo_dur = build_voiceover(lead)

    run(["ffmpeg", "-v", "error", "-y", "-t", str(INTRO_END + 0.6), "-i", str(PUBLIC / "intro.mp4"), "-map", "0:a:0",
         "-af", VOICE_CHAIN, "-ar", "48000", "-ac", "1", str(MEDIA / "intro-voice.wav")])

    run(["ffmpeg", "-v", "error", "-y", "-i", str(PUBLIC / "music.mp3"), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
         "-ar", "48000", "-b:a", "320k", str(MEDIA / "music.mp3")])

    ts = json.loads((PUBLIC / "timestamps.json").read_text(encoding="utf-8"))
    words = []
    for w in ts["voiceover"]["words"]:
        s, e = remap(w["start"], ranges, snap="next"), remap(w["end"], ranges)
        if s is None or e is None:
            continue
        words.append({"word": w["word"], "start": s, "end": e})
    pauses = []
    for a, b in analysis.get("voPauses", []):
        s, e = remap(a, ranges), remap(b, ranges)
        if s is not None and e is not None and e > s:
            pauses.append([s, e])
    edit = {
        "intro": {"words": ts["intro"]["words"]},
        "voiceover": {"duration": round(vo_dur, 3), "words": words, "pauses": pauses},
    }
    (PUBLIC / "edit.json").write_text(json.dumps(edit, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"voiceover: {vo_dur:.2f}s, {len(words)} words")
    print(" ".join(w["word"] for w in words))
    for f in ["voiceover.wav", "intro-voice.wav", "music.mp3"]:
        log = subprocess.run(["ffmpeg", "-v", "info", "-i", str(MEDIA / f), "-af", "ebur128", "-f", "null", "-"],
                             capture_output=True, text=True).stderr
        m = re.findall(r"I:\s+(-?[\d.]+) LUFS", log)
        print(f"{f}: {m[-1] if m else '?'} LUFS")


if __name__ == "__main__":
    main()
