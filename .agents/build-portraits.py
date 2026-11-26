#!/usr/bin/env python3
"""Generate EXIF-stripped member portrait and gallery derivatives from master photos."""

import argparse
from pathlib import Path
import sys
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
MEMBERS_OUT = ROOT / "assets/img/members"
GALLERY_OUT = ROOT / "assets/img/gallery"

# (source_filename, slug, centering_xy) — display order per specs/001-member-profiles/spec.md
PORTRAITS = [
    ("Tiffany-Baucum-personal-3.jpeg", "tiffany-baucum-1", (0.50, 0.12)),
    ("Tiffany-Baucum-personal-1.png", "tiffany-baucum-2", (0.50, 0.12)),
    ("Tiffany-Baucum-personal-2.png", "tiffany-baucum-3", (0.50, 0.20)),
    ("Joren-Cain-personal-1.jpeg", "joren-cain-1", (0.50, 0.08)),
    ("Joren-Cain-personal-2.jpeg", "joren-cain-2", (0.50, 0.15)),
    ("Danny-Enriquez-personal-1.jpeg", "danny-enriquez-1", (0.50, 0.10)),
    ("Danny-Enriquez-personal-2.jpeg", "danny-enriquez-2", (0.50, 0.12)),
    ("Robert-Tracy-personal-1.jpeg", "robert-tracy-1", (0.50, 0.12)),
    ("Kei-Tabuchi-personal-2.jpeg", "kei-tabuchi-1", (0.50, 0.10)),
    ("Kei-Tabuchi-personal-1.jpeg", "kei-tabuchi-2", (0.50, 0.12)),
]

GALLERY_GROUP = ("band-photo-1.png", "band-mural-pose", (1318, 879), (800, 534))


def load_clean_rgb(path: Path, min_w: int, min_h: int) -> Image.Image:
    if not path.is_file():
        sys.exit(f"Missing source image: {path}")
    with Image.open(path) as raw:
        transposed = ImageOps.exif_transpose(raw)
        w, h = transposed.size
        if w < min_w or h < min_h:
            sys.exit(f"{path.name} is {w}x{h}; minimum required is {min_w}x{min_h}")
        # Fresh RGB copy strips camera EXIF/GPS metadata while preserving ICC-rendered pixels.
        clean = Image.new("RGB", (w, h))
        clean.paste(transposed.convert("RGB"))
        return clean


def build(src_dir: Path) -> None:
    MEMBERS_OUT.mkdir(parents=True, exist_ok=True)
    GALLERY_OUT.mkdir(parents=True, exist_ok=True)

    for fname, slug, centering in PORTRAITS:
        src = load_clean_rgb(src_dir / fname, 880, 1100)
        hi = ImageOps.fit(src, (880, 1100), method=Image.Resampling.LANCZOS, centering=centering)
        lo = hi.resize((400, 500), resample=Image.Resampling.LANCZOS)

        hi.save(MEMBERS_OUT / f"{slug}-880.jpg", format="JPEG", quality=85, optimize=True, progressive=True)
        hi.save(MEMBERS_OUT / f"{slug}-880.webp", format="WEBP", quality=82, method=6)
        lo.save(MEMBERS_OUT / f"{slug}-400.webp", format="WEBP", quality=82, method=6)
        print(f"Built {slug}-{{400.webp,880.webp,880.jpg}} from {fname}")

    g_fname, g_slug, full_size, thumb_size = GALLERY_GROUP
    g_src = load_clean_rgb(src_dir / g_fname, full_size[0], full_size[1])
    g_full = ImageOps.fit(g_src, full_size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    g_thumb = g_full.resize(thumb_size, resample=Image.Resampling.LANCZOS)

    g_full.save(
        GALLERY_OUT / f"{g_slug}-{full_size[0]}.jpg",
        format="JPEG",
        quality=86,
        optimize=True,
        progressive=True,
    )
    g_thumb.save(GALLERY_OUT / f"{g_slug}-{thumb_size[0]}.webp", format="WEBP", quality=82, method=6)
    print(f"Built {g_slug}-{full_size[0]}.jpg and {g_slug}-{thumb_size[0]}.webp from {g_fname}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--src", required=True, type=Path, help="Directory containing renamed Drive master photos")
    args = parser.parse_args()
    build(args.src.expanduser().resolve())


if __name__ == "__main__":
    main()
