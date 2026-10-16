"""Hand corrections for Whisper's Persian mistakes in public/timestamps.json.

Each fix matches a run of consecutive words (by text) and replaces it with a
single word that keeps the run's start/end time. Re-run after transcribe.py.
"""
import json
from pathlib import Path

PUBLIC = Path(__file__).resolve().parent.parent / "public"

FIXES = {
    "intro": [
        (["محلوب"], "محبوب"),
        (["i7", "-1165G7،"], "i7-1165G7،"),
    ],
    "voiceover": [
        (["جادوی"], "جادویی"),
        (["لبتای"], "لپ‌تاپ"),
        (["۱۲۳"], "۱۲.۳"),
        (["۵۰"], "۵۱۲"),
        (["که", "هم", "عرضه"], None),  # handled below: ۵۱۲ «گیگ» هم عرضه
        (["کارشناسایی"], "کارشناسای"),
        (["آرواید"], "آربایت"),
        (["راه", "نماییتون"], "راهنمایی‌تون"),
        (["می", "کنند"], "می‌کنن"),
        (["دقیقا"], "دقیقاً"),
        (["طور"], "ترب"),
        (["با", "این", "مالز"], "ایمالز"),
        (["الیکترونیکی"], "الکترونیکی"),
        (["محلت"], "مهلت"),
        (["آربایت", "داتایار"], "arbyte.ir"),
    ],
}


def apply(words, pattern, repl):
    out, i, n = [], 0, len(pattern)
    while i < len(words):
        if [w["word"] for w in words[i : i + n]] == pattern:
            out.append({"word": repl, "start": words[i]["start"], "end": words[i + n - 1]["end"]})
            i += n
        else:
            out.append(words[i])
            i += 1
    return out


def main():
    path = PUBLIC / "timestamps.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    for part, fixes in FIXES.items():
        words = data[part]["words"]
        for pattern, repl in fixes:
            if repl is None:
                # "۵۱۲ که هم عرضه" → "۵۱۲ گیگ هم عرضه"
                for j in range(len(words) - 2):
                    if [w["word"] for w in words[j : j + 3]] == pattern and words[j - 1]["word"] == "۵۱۲":
                        words[j]["word"] = "گیگ"
                continue
            words = apply(words, pattern, repl)
        # Whisper stretches a word over a following pause — clamp to 0.9s
        for w in words:
            if w["end"] - w["start"] > 0.9:
                w["start"] = round(w["end"] - 0.6, 3)
        data[part]["words"] = words
        data[part]["text"] = " ".join(w["word"] for w in words)
        print(f"── {part} ──\n{data[part]['text']}\n")
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
