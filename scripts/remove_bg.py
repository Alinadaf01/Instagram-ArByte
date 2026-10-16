"""Remove the white background from the Surface product shots.

Writes <name>-clean.png next to each source in public/. Uses rembg
(isnet-general-use) and then cleans the alpha edge so the device floats
naturally over the dark purple UI.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

PUBLIC = Path(__file__).resolve().parent.parent / "public"
FILES = ["surface-front.png", "surface-side.png", "surface-back.png"]


def main() -> None:
    session = new_session("isnet-general-use")
    for name in FILES:
        src = PUBLIC / name
        if not src.exists():
            print(f"skip {name} (missing)")
            continue
        img = Image.open(src).convert("RGBA")
        if np.array(img)[..., 3].min() < 10:
            # Already a cut-out (transparent PNG) — rembg would eat the
            # bright sky on the screen, so just trim and keep it.
            solid = Image.fromarray(((np.array(img)[..., 3] > 8) * 255).astype(np.uint8))
            cut = img.crop(solid.getbbox())
            out = PUBLIC / name.replace(".png", "-clean.png")
            cut.save(out, optimize=True)
            print(f"{name} already transparent -> {out.name} {cut.size}")
            continue
        cut = remove(img, session=session, post_process_mask=True)
        a = np.array(cut)
        alpha = a[..., 3].astype(np.float32)
        # Knock out residual near-white halo pixels along the edge
        rgb = a[..., :3].astype(np.float32)
        whiteness = rgb.min(axis=2)
        halo = (whiteness > 238) & (alpha < 250)
        alpha[halo] = 0
        mask = Image.fromarray(alpha.astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
        cut.putalpha(mask)
        bbox = cut.getbbox()
        if bbox:
            cut = cut.crop(bbox)
        out = PUBLIC / name.replace(".png", "-clean.png")
        cut.save(out, optimize=True)
        print(f"{name} -> {out.name} {cut.size}")


if __name__ == "__main__":
    sys.exit(main())
