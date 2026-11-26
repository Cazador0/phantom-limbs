#!/usr/bin/env python3
"""Generate EXIF-stripped member portrait and band group derivatives from master photos."""

import argparse
from pathlib import Path
import sys
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
IMG_OUT = ROOT / "assets/img"
MEMBERS_OUT = IMG_OUT / "members"

# (source_filename, slug, centering_xy) — display order per specs/001 & 002
PORTRAITS = [
    ("Tiffany-Baucum-personal-3.jpeg", "tiffany-baucum-1", (0.50, 0.12)),
    ("Tiffany-Baucum-personal-1.png", "tiffany-baucum-2", (0.50, 0.12)),
    ("Tiffany-Baucum-personal-2.png", "tiffany-baucum-3", (0.50, 0.20)),
    ("Joren-Cain-personal-1.jpeg", "joren-cain-1", (0.50, 0.08)),
    ("Joren-Cain-personal-2.jpeg", "joren-cain-2", (0.50, 0.15)),
    ("Danny-Enriquez-personal-1.jpeg", "danny-enriquez-1", (0.50, 0.10)),
    ("Danny-Enriquez-personal-2.jpeg", "danny-enriquez-2", (0.50, 0.12)),
    ("Robert-Tracy-personal-1.jpeg", "robert-tracy-1", (0.50, 0.12)),
    ("Robert-Tracy-personal-2.JPG", "robert-tracy-2", (0.50, 0.06)),
    ("Kei-Tabuchi-personal-2.jpeg", "kei-tabuchi-1", (0.50, 0.10)),
    ("Kei-Tabuchi-personal-1.jpeg", "kei-tabuchi-2", (0.50, 0.12)),
]

GROUP_PHOTO = ("band-photo.png", "band-photo", (1534, 1025), (960, 642))


def load_clean_rgb(path: Path, min_w: int, min_h: int) -> Image.Image:
    if not path.is_file():
        sys.exit(f"Missing source image: {path}")
    with Image.open(path) as raw:
        transposed = ImageOps.exif_transpose(raw)
        w, h = transposed.size
        if w < min_w or h < min_h:
            sys.exit(f"{path.name} is {w}x{h}; minimum required is {min_w}x{min_h}")
        # Fresh RGB copy strips camera EXIF/GPS metadata while preserving rendered pixels.
        clean = Image.new("RGB", (w, h))
        clean.paste(transposed.convert("RGB"))
        return clean


def build(src_dir: Path) -> None:
    MEMBERS_OUT.mkdir(parents=True, exist_ok=True)

    for fname, slug, centering in PORTRAITS:
        src = load_clean_rgb(src_dir / fname, 880, 1100)
        hi = ImageOps.fit(src, (880, 1100), method=Image.Resampling.LANCZOS, centering=centering)
        lo = hi.resize((400, 500), resample=Image.Resampling.LANCZOS)

        hi.save(MEMBERS_OUT / f"{slug}-880.jpg", format="JPEG", quality=85, optimize=True, progressive=True)
        hi.save(MEMBERS_OUT / f"{slug}-880.webp", format="WEBP", quality=82, method=6)
        lo.save(MEMBERS_OUT / f"{slug}-400.webp", format="WEBP", quality=82, method=6)
        print(f"Built {slug}-{{400.webp,880.webp,880.jpg}} from {fname}")

    g_fname, g_slug, hi_size, lo_size = GROUP_PHOTO
    g_src = load_clean_rgb(src_dir / g_fname, hi_size[0], hi_size[1])
    g_hi = ImageOps.fit(g_src, hi_size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    g_lo = g_hi.resize(lo_size, resample=Image.Resampling.LANCZOS)

    g_hi.save(IMG_OUT / f"{g_slug}-{hi_size[0]}.jpg", format="JPEG", quality=86, optimize=True, progressive=True)
    g_hi.save(IMG_OUT / f"{g_slug}-{hi_size[0]}.webp", format="WEBP", quality=82, method=6)
    g_lo.save(IMG_OUT / f"{g_slug}-{lo_size[0]}.jpg", format="JPEG", quality=85, optimize=True, progressive=True)
    g_lo.save(IMG_OUT / f"{g_slug}-{lo_size[0]}.webp", format="WEBP", quality=82, method=6)
    print(f"Built {g_slug}-{{{lo_size[0]},{hi_size[0]}}}.{{webp,jpg}} from {g_fname}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--src", required=True, type=Path, help="Directory containing renamed Drive master photos")
    args = parser.parse_args()
    build(args.src.expanduser().resolve())


if __name__ == "__main__":
    main()
