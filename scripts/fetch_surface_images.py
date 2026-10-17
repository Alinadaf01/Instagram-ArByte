"""Download official Surface Pro 7+ product imagery from Microsoft's CDN and
prepare it for the edit.

* public/surface/spin/NN.png – the 36-frame 360° turntable from the Surface
  Pro 7+ product page (1920×720 per frame, white background removed, all
  frames cropped to one shared box so the device never jitters)
* public/surface/tablet.png  – tablet-mode front shot (already transparent)

Source page: https://www.microsoft.com/en-us/d/surface-pro-7/92WRLRCVZ4PR/DMK2
"""
import io
import time
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_fill_holes
from rembg import new_session, remove

OUT = Path(__file__).resolve().parent.parent / "public" / "surface"
CDN = "https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/"
SPRITE = "a236b20e-Panel09_HotspotSprite360_Device"
FRAMES, FW, FH = 36, 1920, 720
TARGET_W = 1400  # stored width per frame (plenty for a 1080-wide reel)


def get(url: str, tries: int = 5) -> Image.Image:
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return Image.open(io.BytesIO(r.read()))
        except OSError:
            if attempt == tries - 1:
                raise
            time.sleep(2 ** attempt)


def main():
    (OUT / "spin").mkdir(parents=True, exist_ok=True)
    session = new_session("isnet-general-use")

    cut = []
    for i in range(FRAMES):
        raw = get(f"{CDN}{SPRITE}?crop=0,{i * FH},{FW},{FH}&wid={FW}&fmt=png").convert("RGB")
        rgba = remove(raw, session=session, post_process_mask=True)
        # keep the original pixels (rembg zeroes colour where it cuts) and
        # only take the alpha from the matte
        a = np.dstack([np.array(raw), np.array(rgba)[..., 3]])
        # drop the faint floor shadow / white fringe the matte keeps
        alpha = a[..., 3].astype(np.float32)
        white = a[..., :3].min(axis=2) > 235
        alpha[white & (alpha < 200)] = 0
        # the matte sometimes eats the bright screen (frontal frames) — the
        # device has no real holes, so fill everything enclosed by its outline
        solid = binary_fill_holes(alpha > 128)
        alpha[solid] = 255
        a[..., 3] = alpha.astype(np.uint8)
        cut.append(Image.fromarray(a, "RGBA"))
        print(f"frame {i:02d}")

    # one shared crop box → stable turntable
    box = None
    for im in cut:
        b = Image.fromarray(((np.array(im)[..., 3] > 20) * 255).astype(np.uint8)).getbbox()
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    pad = 12
    box = (max(0, box[0] - pad), max(0, box[1] - pad), min(FW, box[2] + pad), min(FH, box[3] + pad))
    for i, im in enumerate(cut):
        im = im.crop(box)
        scale = min(1.0, TARGET_W / im.width)
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        im.save(OUT / "spin" / f"{i:02d}.png", optimize=True)
    print("spin box", box, "→", im.size)

    tablet = get(f"{CDN}FullBleedHero-Surface-Pro-7-Plus-Tablet?fmt=png-alpha&wid=2000").convert("RGBA")
    solid = Image.fromarray(((np.array(tablet)[..., 3] > 20) * 255).astype(np.uint8))
    tablet.crop(solid.getbbox()).save(OUT / "tablet.png", optimize=True)
    print("tablet", tablet.size)


if __name__ == "__main__":
    main()
