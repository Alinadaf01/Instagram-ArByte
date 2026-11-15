"""Synthesise the UI sound effects used by every reel (public/video2/sfx).

whoosh, impact, pop, click, ding, error — short, clean, 48 kHz mono WAVs
made from noise/sines so they can always be rebuilt (public/ media is not
in git). Run once after a fresh checkout: python3 scripts/make_sfx.py
"""
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000
OUT = Path(__file__).resolve().parent.parent / "public" / "video2" / "sfx"
rng = np.random.default_rng(7)


def env(n, attack, decay_pow=2.0):
    t = np.linspace(0, 1, n)
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * (1 - t) ** decay_pow


def norm(x, peak=0.9):
    return (x / (np.max(np.abs(x)) + 1e-9) * peak).astype(np.float32)


def bandpass_sweep(noise, f0, f1):
    # crude sweep: filter overlapping chunks with a moving centre frequency
    out = np.zeros_like(noise)
    n = len(noise)
    step = n // 24
    for i in range(24):
        fc = f0 * (f1 / f0) ** (i / 23)
        sos = butter(2, [max(40, fc * 0.6), min(SR / 2 - 100, fc * 1.6)], btype="band", fs=SR, output="sos")
        seg = slice(i * step, min(n, (i + 2) * step))
        w = np.hanning(seg.stop - seg.start)
        out[seg] += sosfilt(sos, noise[seg]) * w
    return out


def whoosh(d=0.55):
    n = int(SR * d)
    x = bandpass_sweep(rng.standard_normal(n), 300, 4000)
    t = np.linspace(0, 1, n)
    return norm(x * np.sin(np.pi * t) ** 1.5, 0.7)


def impact(d=0.9):
    n = int(SR * d)
    t = np.arange(n) / SR
    f = 55 * np.exp(-t * 3) + 38
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5)
    crack = sosfilt(butter(2, 1800, btype="high", fs=SR, output="sos"), rng.standard_normal(n)) * np.exp(-t * 40)
    return norm(body + 0.35 * crack, 0.95)


def pop(d=0.18):
    n = int(SR * d)
    t = np.arange(n) / SR
    f = 900 * np.exp(-t * 18) + 380
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.02, 3), 0.8)


def click(d=0.05):
    n = int(SR * d)
    t = np.arange(n) / SR
    x = sosfilt(butter(2, [2000, 7000], btype="band", fs=SR, output="sos"), rng.standard_normal(n)) * np.exp(-t * 160)
    return norm(x + 0.4 * np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 200), 0.7)


def ding(d=0.8):
    n = int(SR * d)
    t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * t) for f, a in ((1318.5, 1.0), (2637, 0.35), (1975.5, 0.25)))
    return norm(x * np.exp(-t * 5) * np.clip(t / 0.004, 0, 1), 0.6)


def error(d=0.35):
    n = int(SR * d)
    t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * 180 * t)) * 0.5 + np.sin(2 * np.pi * 185 * t)
    x = sosfilt(butter(2, 2500, btype="low", fs=SR, output="sos"), x)
    gate = (np.sin(2 * np.pi * 9 * t) > -0.2).astype(float)
    return norm(x * gate * env(n, 0.01, 1.2), 0.55)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in (("whoosh", whoosh), ("impact", impact), ("pop", pop), ("click", click), ("ding", ding), ("error", error)):
        sf.write(OUT / f"{name}.wav", fn(), SR)
        print("wrote", OUT / f"{name}.wav")


if __name__ == "__main__":
    main()
