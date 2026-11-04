"""Cut the presenter out of the i5/i7 chapters of public/video2/edit.mp4.

Writes public/video2/cutout.webm (VP9 with alpha, 1080×1920, 30fps) covering
[START, END] seconds of the edit, so the composition can dissolve the beige
wall into the motion-graphics world and slide the presenter aside.
Masks: rembg u2net_human_seg at 720×1280, smoothed over 3 frames, feathered.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

V2 = Path(__file__).resolve().parent.parent / "public" / "video2"
W, H, FPS = 1080, 1920, 30


def main():
    edit = json.loads((V2 / "edit.json").read_text(encoding="utf-8"))
    seg = {s["name"]: s for s in edit["segments"]}
    start = seg["i5"]["start"] - 0.5
    end = seg["cta"]["start"] + 0.5
    tmp = V2 / "cutout_frames"
    shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir()
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-ss", f"{start}", "-to", f"{end}", "-i", str(V2 / "edit.mp4"), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        capture_output=True, check=True,
    ).stdout
    frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
    print(f"{len(frames)} frames from {start:.2f}s to {end:.2f}s")
    session = new_session("u2net_human_seg")
    masks = []
    for i, fr in enumerate(frames):
        small = Image.fromarray(fr).resize((720, 1280), Image.BILINEAR)
        m = remove(small, session=session, only_mask=True, post_process_mask=True)
        masks.append(np.asarray(m, np.float32))
        if i % 50 == 0:
            print("mask", i, flush=True)
    for i, fr in enumerate(frames):
        # temporal smoothing kills edge flicker
        m = np.mean([masks[j] for j in range(max(0, i - 1), min(len(masks), i + 2))], axis=0)
        mi = Image.fromarray(m.clip(0, 255).astype(np.uint8)).resize((W, H), Image.BILINEAR)
        mi = mi.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.5))
        a = np.asarray(mi, np.float32) / 255
        # bake the neon rim light into the file (a CSS drop-shadow on a
        # full-frame video is too slow for the renderer)
        glow = np.asarray(mi.filter(ImageFilter.GaussianBlur(14)), np.float32) / 255
        rim = np.clip(glow * 1.6 - a * 0.9, 0, 1) * 0.9
        col = np.array([199, 125, 255], np.float32)
        out_a = np.clip(a + rim * (1 - a), 0, 1)
        rgb = (fr.astype(np.float32) * a[..., None] + col * (rim * (1 - a))[..., None]) / np.maximum(out_a[..., None], 1e-4)
        rgba = np.dstack([rgb.clip(0, 255).astype(np.uint8), (out_a * 255).astype(np.uint8)])
        Image.fromarray(rgba, "RGBA").save(tmp / f"{i:04d}.png", compress_level=1)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", str(tmp / "%04d.png"), "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
         "-b:v", "0", "-crf", "24", "-row-mt", "1", "-deadline", "good", "-cpu-used", "4", str(V2 / "cutout.webm")],
        check=True,
    )
    shutil.rmtree(tmp)
    (V2 / "cutout.json").write_text(json.dumps({"start": round(start, 3), "end": round(end, 3)}))
    print("cutout.webm", start, end)


if __name__ == "__main__":
    sys.exit(main())
