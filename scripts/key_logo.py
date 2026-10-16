"""Key the near-black background out of logo.png → public/logo-clean.png"""
from pathlib import Path

import numpy as np
from PIL import Image

PUBLIC = Path(__file__).resolve().parent.parent / "public"

im = np.array(Image.open(PUBLIC / "logo.png").convert("RGB")).astype(np.float32) / 255
a = np.clip((im.max(axis=2) - 0.06) / 0.35, 0, 1)
rgb = np.clip(im / np.maximum(a[..., None], 1e-3), 0, 1)
img = Image.fromarray((np.dstack([rgb, a]) * 255).astype(np.uint8), "RGBA")
img = img.crop(Image.fromarray(((a > 0.05) * 255).astype(np.uint8)).getbbox())
img.save(PUBLIC / "logo-clean.png")
print("logo-clean.png", img.size)
