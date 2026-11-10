"""Presenter matte for the whole of public/video5/edit.mp4 (streamed).

Writes public/video5/cutout.webm (VP9 + alpha, BT.709 tagged, 1080×1920,
30fps) so titles can sit behind the presenter's head. Frames are streamed
from ffmpeg (a 45 s edit does not fit in memory as one array).
Masks: rembg u2net_human_seg at 720×1280, 3-frame temporal smoothing, slight
choke + feather. Resumable: masks are cached in public/video5/masks/.
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

V5 = Path(__file__).resolve().parent.parent / "public" / "video5"
W, H, FPS = 1080, 1920, 30
FRAME = W * H * 3


def stream():
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(V5 / "edit.mp4"), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    while True:
        buf = p.stdout.read(FRAME)
        if len(buf) < FRAME:
            break
        yield np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    p.wait()


def main():
    mdir = V5 / "masks"
    mdir.mkdir(exist_ok=True)
    session = None
    n = 0
    for i, f in enumerate(stream()):
        n = i + 1
        p = mdir / f"{i:04d}.png"
        if p.exists():
            continue
        session = session or new_session("u2net_human_seg")
        small = Image.fromarray(f).resize((720, 1280), Image.BILINEAR)
        remove(small, session=session, only_mask=True, post_process_mask=True).save(p)
        if i % 100 == 0:
            print("mask", i, flush=True)
    enc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-framerate", str(FPS), "-i", "-",
         "-vf", "scale=out_color_matrix=bt709:out_range=tv", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
         "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
         "-b:v", "0", "-crf", "22", "-row-mt", "1", "-deadline", "good", "-cpu-used", "5", "-threads", "4", str(V5 / "cutout.webm")],
        stdin=subprocess.PIPE,
    )
    load = lambda i: np.asarray(Image.open(mdir / f"{min(max(i, 0), n - 1):04d}.png"), np.float32)
    for i, f in enumerate(stream()):
        m = (load(i - 1) + load(i) + load(i + 1)) / 3
        mi = Image.fromarray(m.clip(0, 255).astype(np.uint8)).resize((W, H), Image.BILINEAR)
        mi = mi.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
        enc.stdin.write(np.dstack([f, np.asarray(mi)]).tobytes())
    enc.stdin.close()
    enc.wait()
    print("cutout.webm", n, "frames")
    return 0


if __name__ == "__main__":
    sys.exit(main())
