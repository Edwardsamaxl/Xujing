from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "apps" / "visitor-web" / "public" / "assets" / "yanxi"
OUT_DIR = ROOT / "apps" / "visitor-web" / "public" / "assets" / "explore"
SIZE = (1672, 941)


CARD_SPECS = {
    "architecture": {
        "source": "architecture.png",
        "accent": (12, 74, 75),
        "panel": (8, 64, 68),
        "gold": (215, 165, 92),
        "crop": (230, 120, 940, 1210),
        "visual_box": (825, 84, 1628, 892),
        "wash": (8, 58, 60, 212),
        "mode": "blueprint",
    },
    "figure": {
        "source": "people.png",
        "accent": (76, 61, 76),
        "panel": (60, 48, 64),
        "gold": (202, 166, 105),
        "crop": (318, 300, 940, 1538),
        "visual_box": (840, 40, 1634, 922),
        "wash": (227, 209, 188, 188),
        "mode": "portrait",
    },
    "family": {
        "source": "kids.png",
        "accent": (31, 102, 98),
        "panel": (22, 92, 88),
        "gold": (199, 151, 78),
        "crop": (295, 215, 914, 1334),
        "visual_box": (888, 92, 1618, 892),
        "wash": (246, 232, 201, 190),
        "mode": "playful",
    },
    "mystery": {
        "source": "suspense.png",
        "accent": (75, 29, 25),
        "panel": (91, 31, 25),
        "gold": (185, 133, 76),
        "crop": (288, 190, 944, 1344),
        "visual_box": (790, 58, 1638, 910),
        "wash": (47, 31, 28, 218),
        "mode": "dossier",
    },
    "craft": {
        "source": "technique.png",
        "accent": (9, 84, 79),
        "panel": (6, 76, 74),
        "gold": (204, 153, 78),
        "crop": (248, 160, 930, 1298),
        "visual_box": (792, 36, 1636, 916),
        "wash": (23, 24, 22, 222),
        "mode": "material",
    },
}


def rgba(rgb: tuple[int, int, int], alpha: int) -> tuple[int, int, int, int]:
    return (*rgb, alpha)


def cover_resize(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    sw, sh = img.size
    tw, th = size
    scale = max(tw / sw, th / sh)
    resized = img.resize((math.ceil(sw * scale), math.ceil(sh * scale)), Image.Resampling.LANCZOS)
    x = (resized.width - tw) // 2
    y = (resized.height - th) // 2
    return resized.crop((x, y, x + tw, y + th))


def fit_resize(img: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    bw = box[2] - box[0]
    bh = box[3] - box[1]
    sw, sh = img.size
    scale = min(bw / sw, bh / sh)
    return img.resize((math.ceil(sw * scale), math.ceil(sh * scale)), Image.Resampling.LANCZOS)


def add_texture(draw: ImageDraw.ImageDraw, rng: random.Random, light: bool) -> None:
    width, height = SIZE
    for _ in range(17000):
        x = rng.randrange(width)
        y = rng.randrange(height)
        if light:
            color = rng.choice([(92, 75, 48), (250, 238, 205), (151, 124, 76)])
            alpha = rng.randrange(8, 26)
        else:
            color = rng.choice([(12, 13, 13), (185, 137, 72), (89, 61, 38)])
            alpha = rng.randrange(8, 30)
        draw.point((x, y), fill=rgba(color, alpha))

    for _ in range(220):
        x = rng.randrange(width)
        y = rng.randrange(height)
        length = rng.randrange(26, 150)
        angle = rng.random() * math.tau
        x2 = x + math.cos(angle) * length
        y2 = y + math.sin(angle) * length
        color = (67, 51, 35) if light else (230, 176, 96)
        draw.line((x, y, x2, y2), fill=rgba(color, rng.randrange(10, 34)), width=1)


def draw_border(draw: ImageDraw.ImageDraw, gold: tuple[int, int, int], dark: bool) -> None:
    x0, y0, x1, y1 = 50, 38, 1622, 902
    shadow = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((x0 + 12, y0 + 14, x1 + 12, y1 + 14), radius=42, fill=(0, 0, 0, 78))
    shadow = shadow.filter(ImageFilter.GaussianBlur(13))
    draw.bitmap((0, 0), shadow, fill=None)

    base = (38, 30, 25) if dark else (82, 61, 36)
    draw.rounded_rectangle((x0, y0, x1, y1), radius=44, outline=rgba(base, 230), width=9)
    draw.rounded_rectangle((x0 + 10, y0 + 10, x1 - 10, y1 - 10), radius=34, outline=rgba(gold, 230), width=4)
    draw.rounded_rectangle((x0 + 22, y0 + 22, x1 - 22, y1 - 22), radius=25, outline=rgba(gold, 128), width=2)

    for cx, cy in [(x0 + 40, y0 + 40), (x1 - 40, y0 + 40), (x0 + 40, y1 - 40), (x1 - 40, y1 - 40)]:
        draw.rounded_rectangle((cx - 44, cy - 16, cx + 44, cy + 16), radius=12, outline=rgba(gold, 175), width=3)
        draw.ellipse((cx - 8, cy - 8, cx + 8, cy + 8), fill=rgba(gold, 165))


def draw_panel(draw: ImageDraw.ImageDraw, panel: tuple[int, int, int], gold: tuple[int, int, int]) -> None:
    x0, y0, x1, y1 = 152, 104, 308, 826
    draw.rounded_rectangle((x0 - 14, y0 - 14, x1 + 14, y1 + 14), radius=25, fill=rgba((38, 30, 25), 220))
    draw.rounded_rectangle((x0 - 6, y0 - 6, x1 + 6, y1 + 6), radius=20, outline=rgba(gold, 235), width=4)
    draw.rounded_rectangle((x0, y0, x1, y1), radius=16, fill=rgba(panel, 242))
    draw.rounded_rectangle((x0 + 13, y0 + 13, x1 - 13, y1 - 13), radius=12, outline=rgba(gold, 185), width=3)
    draw.rounded_rectangle((x0 + 26, y0 + 26, x1 - 26, y1 - 26), radius=8, outline=rgba((20, 14, 10), 95), width=2)


def paste_faded(base: Image.Image, visual: Image.Image, box: tuple[int, int, int, int], opacity: int = 235) -> None:
    visual = fit_resize(visual, box).convert("RGBA")
    layer = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    x = box[0] + ((box[2] - box[0]) - visual.width) // 2
    y = box[1] + ((box[3] - box[1]) - visual.height) // 2
    alpha = Image.new("L", visual.size, opacity)
    fade_w = max(1, visual.width // 4)
    apx = alpha.load()
    for yy in range(visual.height):
        for xx in range(fade_w):
            apx[xx, yy] = int(apx[xx, yy] * (xx / fade_w) ** 0.7)
    visual.putalpha(alpha)
    layer.alpha_composite(visual, (x, y))
    base.alpha_composite(layer)


def draw_readability_wash(draw: ImageDraw.ImageDraw, spec: dict) -> None:
    mode = spec["mode"]
    if mode in {"blueprint", "dossier", "material"}:
        draw.rectangle((312, 44, 900, 898), fill=rgba(spec["wash"][:3], 80))
        draw.rectangle((325, 56, 858, 884), outline=rgba(spec["gold"], 52), width=1)
    else:
        draw.rounded_rectangle((316, 76, 940, 858), radius=18, fill=rgba(spec["wash"][:3], 120))

    for x, alpha in [(318, 80), (395, 58), (860, 28)]:
        draw.line((x, 86, x, 852), fill=rgba(spec["gold"], alpha), width=1)


def draw_style_marks(draw: ImageDraw.ImageDraw, spec: dict, rng: random.Random) -> None:
    gold = spec["gold"]
    accent = spec["accent"]
    mode = spec["mode"]

    if mode == "blueprint":
        for x in range(380, 1560, 82):
            draw.line((x, 76, x, 864), fill=rgba(gold, 30), width=1)
        for y in range(120, 840, 72):
            draw.line((350, y, 1585, y), fill=rgba(gold, 28), width=1)
        draw.line((1030, 716, 1514, 716), fill=rgba(gold, 115), width=2)
        for i in range(6):
            x = 1090 + i * 72
            draw.line((x, 704, x, 728), fill=rgba(gold, 145), width=2)
    elif mode == "portrait":
        for i in range(5):
            x = 1040 + i * 90
            draw.rounded_rectangle((x, 118, x + 34, 774), radius=18, fill=rgba((34, 29, 27), 35))
        draw.line((930, 96, 1510, 830), fill=rgba((245, 226, 190), 42), width=48)
        draw.line((998, 96, 1578, 830), fill=rgba((38, 32, 30), 35), width=28)
    elif mode == "playful":
        for cx, cy, r in [(1130, 184, 44), (1436, 196, 60), (1212, 724, 38), (1500, 716, 48)]:
            draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=rgba(accent, 42), outline=rgba(gold, 105), width=3)
        draw.rounded_rectangle((1135, 508, 1395, 598), radius=18, outline=rgba(gold, 96), width=3)
    elif mode == "dossier":
        for i in range(3):
            x = 882 + i * 34
            draw.line((x, 82, x - 74, 864), fill=rgba((133, 34, 25), 90), width=5)
        draw.rounded_rectangle((1010, 720, 1492, 820), radius=8, outline=rgba((142, 35, 26), 98), width=8)
        for _ in range(18):
            x = rng.randrange(710, 1580)
            y = rng.randrange(84, 862)
            draw.line((x, y, x + rng.randrange(-100, 100), y + rng.randrange(-50, 50)), fill=rgba((255, 242, 214), 24), width=1)
    elif mode == "material":
        for cx, cy, r in [(982, 682, 180), (1230, 268, 104), (1480, 620, 78)]:
            draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=rgba(gold, 78), width=5)
        for i in range(9):
            draw.line((828 + i * 74, 826, 1060 + i * 72, 410), fill=rgba(gold, 34), width=2)


def make_card(slug: str, spec: dict) -> None:
    rng = random.Random(f"explore-{slug}")
    src = Image.open(SOURCE_DIR / spec["source"]).convert("RGB")

    bg = cover_resize(src, SIZE).convert("RGBA").filter(ImageFilter.GaussianBlur(24))
    tint = Image.new("RGBA", SIZE, rgba(spec["wash"][:3], spec["wash"][3]))
    card = Image.alpha_composite(bg, tint)

    draw = ImageDraw.Draw(card, "RGBA")
    add_texture(draw, rng, spec["mode"] in {"portrait", "playful"})
    draw_readability_wash(draw, spec)

    visual = src.crop(spec["crop"])
    if spec["mode"] in {"blueprint", "dossier"}:
        visual = visual.filter(ImageFilter.UnsharpMask(radius=1.2, percent=120, threshold=3))
    paste_faded(card, visual, spec["visual_box"], 224)

    draw = ImageDraw.Draw(card, "RGBA")
    draw_style_marks(draw, spec, rng)
    draw_panel(draw, spec["panel"], spec["gold"])
    draw_border(draw, spec["gold"], spec["mode"] in {"blueprint", "dossier", "material"})

    vignette = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    vd = ImageDraw.Draw(vignette, "RGBA")
    vd.rectangle((0, 0, 80, SIZE[1]), fill=(0, 0, 0, 30))
    vd.rectangle((1530, 0, SIZE[0], SIZE[1]), fill=(0, 0, 0, 36))
    vignette = vignette.filter(ImageFilter.GaussianBlur(30))
    card = Image.alpha_composite(card, vignette)

    out = OUT_DIR / slug
    out.mkdir(parents=True, exist_ok=True)
    card.convert("RGB").save(out / f"{slug}-card.png", quality=96)


def main() -> None:
    for slug, spec in CARD_SPECS.items():
        make_card(slug, spec)


if __name__ == "__main__":
    main()
