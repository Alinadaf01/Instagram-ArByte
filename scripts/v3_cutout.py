"""Presenter matte for the whole of public/video3/edit.mp4.

Writes public/video3/cutout.webm (VP9 + alpha, 1080×1920, 30fps), the
presenter only, so titles and products can sit *behind* his head on the wall.
Masks: rembg u2net_human_seg at 720×1280, 3-frame temporal smoothing, slight
choke + feather. Resumable: masks are cached in public/video3/masks/.
"""
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

V3 = Path(__file__).resolve().parent.parent / "public" / "video3"
W, H, FPS = 1080, 1920, 30


def frames():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(V3 / "edit.mp4"), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)


def main():
    fr = frames()
    mdir = V3 / "masks"
    mdir.mkdir(exist_ok=True)
    session = None
    for i, f in enumerate(fr):
        p = mdir / f"{i:04d}.png"
        if p.exists():
            continue
        session = session or new_session("u2net_human_seg")
        small = Image.fromarray(f).resize((720, 1280), Image.BILINEAR)
        remove(small, session=session, only_mask=True, post_process_mask=True).save(p)
        if i % 50 == 0:
            print("mask", i, "/", len(fr), flush=True)
    if len(list(mdir.glob("*.png"))) < len(fr):
        return 1
    tmp = V3 / "cutout_frames"
    shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir()
    masks = [np.asarray(Image.open(mdir / f"{i:04d}.png"), np.float32) for i in range(len(fr))]
    for i, f in enumerate(fr):
        m = np.mean(masks[max(0, i - 1) : i + 2], axis=0)
        mi = Image.fromarray(m.clip(0, 255).astype(np.uint8)).resize((W, H), Image.BILINEAR)
        mi = mi.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
        Image.fromarray(np.dstack([f, np.asarray(mi)]), "RGBA").save(tmp / f"{i:04d}.png", compress_level=1)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", str(tmp / "%04d.png"), "-vf", "scale=out_color_matrix=bt709:out_range=tv",
         "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
         "-b:v", "0", "-crf", "22", "-row-mt", "1", "-deadline", "good", "-cpu-used", "4", "-threads", "4", str(V3 / "cutout.webm")],
        check=True,
    )
    shutil.rmtree(tmp)
    print("cutout.webm", len(fr), "frames")
    return 0


if __name__ == "__main__":
    sys.exit(main())
