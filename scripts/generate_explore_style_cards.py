from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "apps" / "visitor-web" / "public" / "assets" / "explore"
SIZE = (1672, 941)
SEAL = (1408, 736, 74)


SPECS = {
    "architecture": {
        "bg_top": (13, 72, 74),
        "bg_bottom": (7, 48, 52),
        "panel": (8, 65, 68),
        "gold": (218, 166, 91),
        "ink": (232, 189, 111),
        "mode": "blueprint",
    },
    "figure": {
        "bg_top": (229, 213, 193),
        "bg_bottom": (184, 165, 155),
        "panel": (75, 62, 78),
        "gold": (196, 158, 100),
        "ink": (73, 62, 65),
        "mode": "portrait",
    },
    "family": {
        "bg_top": (246, 234, 206),
        "bg_bottom": (218, 220, 195),
        "panel": (23, 105, 99),
        "gold": (199, 151, 78),
        "ink": (73, 96, 88),
        "mode": "playful",
    },
    "mystery": {
        "bg_top": (55, 32, 30),
        "bg_bottom": (24, 22, 24),
        "panel": (91, 31, 25),
        "gold": (188, 132, 75),
        "ink": (205, 186, 157),
        "mode": "dossier",
    },
    "craft": {
        "bg_top": (25, 28, 28),
        "bg_bottom": (9, 14, 15),
        "panel": (7, 79, 76),
        "gold": (204, 153, 78),
        "ink": (191, 149, 92),
        "mode": "material",
    },
}


def rgba(rgb: tuple[int, int, int], alpha: int) -> tuple[int, int, int, int]:
    return (*rgb, alpha)


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def layer() -> Image.Image:
    return Image.new("RGBA", SIZE, (0, 0, 0, 0))


def draw_gradient(draw: ImageDraw.ImageDraw, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> None:
    for y in range(SIZE[1]):
        t = y / (SIZE[1] - 1)
        color = tuple(lerp(top[i], bottom[i], t) for i in range(3))
        draw.line((0, y, SIZE[0], y), fill=color)


def add_texture(draw: ImageDraw.ImageDraw, rng: random.Random, dark: bool) -> None:
    width, height = SIZE
    for _ in range(26000):
        x = rng.randrange(width)
        y = rng.randrange(height)
        if dark:
            color = rng.choice([(0, 0, 0), (223, 171, 91), (88, 63, 38), (22, 26, 26)])
            alpha = rng.randrange(8, 32)
        else:
            color = rng.choice([(91, 73, 48), (252, 239, 207), (164, 135, 88), (118, 107, 88)])
            alpha = rng.randrange(7, 28)
        draw.point((x, y), fill=rgba(color, alpha))

    for _ in range(360):
        x = rng.randrange(width)
        y = rng.randrange(height)
        length = rng.randrange(26, 160)
        angle = rng.random() * math.tau
        x2 = x + math.cos(angle) * length
        y2 = y + math.sin(angle) * length
        color = (231, 176, 91) if dark else (72, 58, 42)
        draw.line((x, y, x2, y2), fill=rgba(color, rng.randrange(8, 28)), width=1)


def draw_border(draw: ImageDraw.ImageDraw, gold: tuple[int, int, int], dark: bool) -> None:
    x0, y0, x1, y1 = 52, 40, 1620, 900
    shadow = layer()
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((x0 + 12, y0 + 14, x1 + 12, y1 + 14), radius=44, fill=(0, 0, 0, 78))
    shadow = shadow.filter(ImageFilter.GaussianBlur(13))
    draw.bitmap((0, 0), shadow, fill=None)

    base = (31, 26, 23) if dark else (87, 66, 39)
    draw.rounded_rectangle((x0, y0, x1, y1), radius=44, outline=rgba(base, 232), width=9)
    draw.rounded_rectangle((x0 + 10, y0 + 10, x1 - 10, y1 - 10), radius=34, outline=rgba(gold, 230), width=4)
    draw.rounded_rectangle((x0 + 22, y0 + 22, x1 - 22, y1 - 22), radius=25, outline=rgba(gold, 120), width=2)

    for cx, cy, sx, sy in [
        (x0 + 38, y0 + 38, 1, 1),
        (x1 - 38, y0 + 38, -1, 1),
        (x0 + 38, y1 - 38, 1, -1),
        (x1 - 38, y1 - 38, -1, -1),
    ]:
        draw.rounded_rectangle((cx - 42, cy - 15, cx + 42, cy + 15), radius=12, outline=rgba(gold, 170), width=3)
        draw.ellipse((cx - 8, cy - 8, cx + 8, cy + 8), fill=rgba(gold, 155))
        draw.arc((cx - 50 * sx, cy - 48 * sy, cx + 50 * sx, cy + 48 * sy), 0, 90, fill=rgba(gold, 115), width=2)


def draw_left_tab(draw: ImageDraw.ImageDraw, panel: tuple[int, int, int], gold: tuple[int, int, int]) -> None:
    x0, y0, x1, y1 = 152, 104, 308, 826
    draw.rounded_rectangle((x0 - 14, y0 - 14, x1 + 14, y1 + 14), radius=26, fill=rgba((38, 30, 25), 218))
    draw.rounded_rectangle((x0 - 7, y0 - 7, x1 + 7, y1 + 7), radius=21, outline=rgba(gold, 232), width=4)
    draw.rounded_rectangle((x0, y0, x1, y1), radius=17, fill=rgba(panel, 244))
    draw.rounded_rectangle((x0 + 13, y0 + 13, x1 - 13, y1 - 13), radius=13, outline=rgba(gold, 188), width=3)
    draw.rounded_rectangle((x0 + 26, y0 + 26, x1 - 26, y1 - 26), radius=8, outline=rgba((18, 13, 10), 96), width=2)


def draw_text_reserved_area(draw: ImageDraw.ImageDraw, spec: dict) -> None:
    mode = spec["mode"]
    gold = spec["gold"]
    if mode in {"blueprint", "mystery", "material", "dossier"}:
        fill = rgba((32, 42, 42) if mode == "blueprint" else (38, 35, 32), 95)
        draw.rectangle((324, 58, 875, 884), fill=fill)
        draw.rectangle((324, 58, 875, 884), outline=rgba(gold, 58), width=1)
    else:
        fill = rgba((247, 235, 210), 178)
        draw.rounded_rectangle((318, 78, 935, 858), radius=18, fill=fill)
    for x, alpha in [(395, 62), (858, 32)]:
        draw.line((x, 92, x, 846), fill=rgba(gold, alpha), width=1)


def draw_seal_reserve(draw: ImageDraw.ImageDraw, spec: dict) -> None:
    cx, cy, r = SEAL
    gold = spec["gold"]
    mode = spec["mode"]
    if mode in {"blueprint", "dossier", "material"}:
        fill = rgba((224, 205, 166), 62)
    else:
        fill = rgba((246, 232, 202), 120)
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=fill, outline=rgba(gold, 210), width=4)
    draw.ellipse((cx - r + 10, cy - r + 10, cx + r - 10, cy + r - 10), outline=rgba(gold, 115), width=2)
    for a in range(0, 360, 90):
        x = cx + math.cos(math.radians(a)) * (r + 3)
        y = cy + math.sin(math.radians(a)) * (r + 3)
        draw.regular_polygon((x, y, 7), 4, rotation=45, outline=rgba(gold, 170))
    for i in range(3):
        draw.arc((cx - 32 - i * 9, cy + 2 - i * 6, cx + 32 + i * 9, cy + 44 + i * 6), 205, 335, fill=rgba(gold, 45), width=2)


def fade_left(image: Image.Image, start: int = 680, end: int = 1020) -> Image.Image:
    alpha = Image.new("L", SIZE, 255)
    apx = alpha.load()
    for y in range(SIZE[1]):
        for x in range(start, end):
            apx[x, y] = int(255 * ((x - start) / (end - start)) ** 0.85)
        for x in range(0, start):
            apx[x, y] = 0
    out = image.copy()
    out.putalpha(alpha)
    return out


def draw_palace_line(draw: ImageDraw.ImageDraw, x: int, y: int, s: float, color, alpha: int) -> None:
    pts = [
        (x - 230 * s, y + 68 * s),
        (x - 112 * s, y + 5 * s),
        (x + 35 * s, y - 18 * s),
        (x + 184 * s, y + 6 * s),
        (x + 270 * s, y + 55 * s),
    ]
    draw.line(pts, fill=rgba(color, alpha), width=max(2, int(4 * s)), joint="curve")
    draw.line((x - 205 * s, y + 86 * s, x + 245 * s, y + 72 * s), fill=rgba(color, alpha), width=max(2, int(4 * s)))
    for i in range(25):
        t = i / 24
        sx = lerp(int(x - 182 * s), int(x + 215 * s), t)
        draw.line((sx, y + 24 * s, sx + 9 * s, y + 78 * s), fill=rgba(color, max(0, alpha - 42)), width=1)
    for i in range(9):
        bx = x - 150 * s + i * 48 * s
        draw.rectangle((bx, y + 90 * s, bx + 18 * s, y + 250 * s), outline=rgba(color, max(0, alpha - 26)), width=max(1, int(2 * s)))
    draw.line((x - 220 * s, y + 252 * s, x + 245 * s, y + 235 * s), fill=rgba(color, alpha - 20), width=max(2, int(3 * s)))


def draw_architecture(draw: ImageDraw.ImageDraw, spec: dict) -> None:
    gold, ink = spec["gold"], spec["ink"]
    for x in range(350, 1590, 82):
        draw.line((x, 78, x, 862), fill=rgba(gold, 38), width=1)
    for y in range(112, 852, 72):
        draw.line((340, y, 1580, y), fill=rgba(gold, 34), width=1)
    draw_palace_line(draw, 1260, 230, 0.82, ink, 170)
    draw_palace_line(draw, 1188, 516, 0.68, ink, 118)
    draw.line((974, 726, 1492, 726), fill=rgba(gold, 130), width=2)
    for i, label_x in enumerate(range(1030, 1420, 70)):
        draw.line((label_x, 710, label_x, 740), fill=rgba(gold, 160), width=2)
    for i, y in enumerate([238, 300, 365, 428, 490]):
        draw.line((1330, y, 1548, y), fill=rgba(gold, 100), width=1)
        draw.circle((1330, y), 3, fill=rgba(gold, 130))
    draw.arc((1018, 646, 1186, 814), 0, 360, fill=rgba(ink, 135), width=4)
    for a in range(0, 360, 30):
        cx, cy, r = 1102, 730, 80
        draw.line((cx, cy, cx + math.cos(math.radians(a)) * r, cy + math.sin(math.radians(a)) * r), fill=rgba(ink, 90), width=2)


def draw_figure(draw: ImageDraw.ImageDraw, spec: dict) -> None:
    ink, gold = spec["ink"], spec["gold"]
    for i in range(7):
        x = 1040 + i * 76
        draw.rounded_rectangle((x, 92, x + 18, 816), radius=9, fill=rgba((45, 39, 40), 42))
    for i in range(4):
        y = 170 + i * 150
        draw.line((995, y, 1542, y + 40), fill=rgba((45, 39, 40), 34), width=12)
    draw.line((965, 102, 1502, 806), fill=rgba((247, 231, 197), 45), width=34)
    cx, cy = 1248, 578
    draw.ellipse((cx - 72, cy - 358, cx + 72, cy - 210), fill=rgba((42, 35, 34), 180))
    draw.polygon(
        [(cx - 58, cy - 225), (cx - 270, cy + 248), (cx + 258, cy + 264), (cx + 65, cy - 220)],
        fill=rgba((85, 72, 92), 172),
    )
    draw.arc((cx - 212, cy - 98, cx + 202, cy + 300), 202, 338, fill=rgba(gold, 74), width=3)
    for i in range(12):
        ax = cx - 96 + (i % 6) * 38
        ay = cy - 266 + (i // 6) * 44
        draw.ellipse((ax - 9, ay - 9, ax + 9, ay + 9), outline=rgba(gold, 120), width=2)
    draw.line((cx + 8, cy - 250, cx + 8, cy - 120), fill=rgba(gold, 130), width=2)
    draw.line((cx + 8, cy - 120, cx + 24, cy - 62), fill=rgba(gold, 100), width=2)
    for i in range(26):
        x = cx - 225 + i * 18
        draw.arc((x, cy - 18, x + 90, cy + 130), 230, 318, fill=rgba(gold, 30), width=1)
    draw.arc((952, 132, 1562, 886), 250, 325, fill=rgba(gold, 55), width=3)


def draw_family(draw: ImageDraw.ImageDraw, spec: dict) -> None:
    ink, gold = spec["ink"], spec["gold"]
    draw_palace_line(draw, 1230, 492, 0.58, (75, 99, 92), 98)
    draw.ellipse((962, 500, 1260, 798), outline=rgba(gold, 210), width=9)
    draw.ellipse((982, 520, 1240, 778), fill=rgba((235, 226, 207), 95), outline=rgba(gold, 100), width=2)
    cx, cy = 1112, 650
    for a in range(0, 360, 30):
        x = cx + math.cos(math.radians(a)) * 70
        y = cy + math.sin(math.radians(a)) * 70
        draw.ellipse((x - 19, y - 12, x + 19, y + 12), fill=rgba((190, 177, 151), 88), outline=rgba(ink, 82), width=2)
    draw.ellipse((cx - 28, cy - 28, cx + 28, cy + 28), fill=rgba((230, 206, 154), 110), outline=rgba(gold, 105), width=2)
    stickers = [
        ((1320, 250), "roof"),
        ((1452, 586), "dragon"),
        ((1132, 250), "flower"),
        ((1210, 790), "fish"),
        ((1506, 226), "leaf"),
    ]
    for (x, y), kind in stickers:
        draw.ellipse((x - 10, y - 10, x + 10, y + 10), fill=rgba((248, 232, 190), 185), outline=rgba(gold, 150), width=2)
        if kind == "roof":
            draw.line((x - 72, y + 20, x, y - 42, x + 94, y + 10), fill=rgba((157, 78, 50), 150), width=8, joint="curve")
            draw.line((x - 48, y + 32, x + 74, y + 25), fill=rgba((54, 111, 106), 150), width=7)
        elif kind == "dragon":
            draw.arc((x - 92, y - 90, x + 76, y + 96), 280, 95, fill=rgba((171, 92, 50), 155), width=10)
            draw.arc((x - 54, y - 42, x + 112, y + 116), 130, 310, fill=rgba((205, 142, 71), 135), width=6)
        elif kind == "flower":
            for a in range(0, 360, 60):
                px = x + math.cos(math.radians(a)) * 34
                py = y + math.sin(math.radians(a)) * 22
                draw.ellipse((px - 24, py - 14, px + 24, py + 14), fill=rgba((55, 127, 120), 130), outline=rgba(gold, 130), width=2)
        elif kind == "fish":
            draw.ellipse((x - 62, y - 30, x + 40, y + 30), fill=rgba((196, 107, 55), 120), outline=rgba(gold, 130), width=2)
            draw.polygon([(x + 38, y), (x + 88, y - 32), (x + 88, y + 32)], fill=rgba((220, 148, 76), 120), outline=rgba(gold, 120))
        else:
            draw.ellipse((x - 58, y - 72, x + 18, y + 52), fill=rgba((67, 132, 121), 115), outline=rgba(gold, 130), width=3)
            draw.ellipse((x + 8, y - 36, x + 64, y + 42), fill=rgba((67, 132, 121), 110), outline=rgba(gold, 120), width=3)
    points = [(1132, 250), (1320, 250), (1506, 226), (1452, 586), (1210, 790)]
    for a, b in zip(points, points[1:]):
        draw.line((*a, *b), fill=rgba(gold, 66), width=3)


def draw_mystery(draw: ImageDraw.ImageDraw, spec: dict, rng: random.Random) -> None:
    ink, gold = spec["ink"], spec["gold"]
    for i in range(3):
        x = 118 + i * 28
        draw.line((x, 82, x - 80, 860), fill=rgba((130, 35, 27), 150), width=7)
    for i, box in enumerate([(930, 118, 1510, 420), (865, 300, 1472, 740), (1005, 530, 1550, 858)]):
        fill = (184, 160, 123) if i != 1 else (211, 200, 178)
        draw.rounded_rectangle(box, radius=10, fill=rgba(fill, 118), outline=rgba(ink, 115), width=2)
    draw_palace_line(draw, 1225, 472, 0.62, (42, 41, 38), 155)
    draw.line((1000, 745, 1320, 745), fill=rgba((42, 41, 38), 110), width=2)
    draw.rounded_rectangle((1012, 718, 1486, 810), radius=8, outline=rgba((142, 35, 26), 110), width=7)
    draw.ellipse((1428, 170, 1542, 284), outline=rgba((82, 70, 54), 92), width=3)
    for _ in range(28):
        x = rng.randrange(890, 1560)
        y = rng.randrange(120, 835)
        draw.line((x, y, x + rng.randrange(-90, 90), y + rng.randrange(-46, 46)), fill=rgba((255, 244, 215), 28), width=1)
    draw.line((888, 80, 820, 860), fill=rgba((160, 57, 44), 135), width=5)
    draw.line((925, 80, 852, 860), fill=rgba((160, 57, 44), 105), width=4)


def draw_craft(draw: ImageDraw.ImageDraw, spec: dict) -> None:
    ink, gold = spec["ink"], spec["gold"]
    draw.rectangle((968, 82, 1510, 342), fill=rgba((29, 117, 111), 138), outline=rgba(gold, 120), width=3)
    for _ in range(80):
        x1 = random.randrange(980, 1500)
        y1 = random.randrange(90, 334)
        draw.line((x1, y1, x1 + random.randrange(-80, 80), y1 + random.randrange(-45, 45)), fill=rgba((235, 190, 113), 42), width=1)
    draw.pieslice((760, 370, 1140, 750), 200, 520, fill=rgba((69, 56, 42), 155), outline=rgba(gold, 132), width=5)
    cx, cy, r = 950, 560, 172
    for a in range(0, 360, 18):
        x = cx + math.cos(math.radians(a)) * r
        y = cy + math.sin(math.radians(a)) * r
        draw.line((cx, cy, x, y), fill=rgba(gold, 96), width=3)
    draw.ellipse((cx - 52, cy - 52, cx + 52, cy + 52), fill=rgba((40, 34, 29), 190), outline=rgba(gold, 150), width=4)
    for y in range(410, 790, 44):
        draw.arc((1110, y - 60, 1580, y + 80), 188, 344, fill=rgba((91, 53, 34), 118), width=6)
        draw.arc((1130, y - 45, 1560, y + 60), 190, 340, fill=rgba(gold, 42), width=2)
    draw.rectangle((1068, 676, 1518, 858), fill=rgba((109, 80, 50), 128), outline=rgba(gold, 135), width=4)
    for x in range(1100, 1500, 86):
        draw.ellipse((x - 22, 720, x + 22, 764), fill=rgba((26, 107, 102), 120), outline=rgba(gold, 120), width=3)
    for cx2, cy2, rr in [(1198, 246, 78), (1392, 640, 62), (1070, 760, 120)]:
        draw.ellipse((cx2 - rr, cy2 - rr, cx2 + rr, cy2 + rr), outline=rgba(gold, 48), width=3)


def make_card(slug: str, spec: dict) -> None:
    rng = random.Random(f"xujing-explore-{slug}")
    card = layer()
    draw = ImageDraw.Draw(card, "RGBA")
    draw_gradient(draw, spec["bg_top"], spec["bg_bottom"])
    add_texture(draw, rng, spec["mode"] in {"blueprint", "dossier", "material"})
    draw_text_reserved_area(draw, spec)

    art = layer()
    ad = ImageDraw.Draw(art, "RGBA")
    if spec["mode"] == "blueprint":
        draw_architecture(ad, spec)
    elif spec["mode"] == "portrait":
        draw_figure(ad, spec)
    elif spec["mode"] == "playful":
        draw_family(ad, spec)
    elif spec["mode"] == "dossier":
        draw_mystery(ad, spec, rng)
    elif spec["mode"] == "material":
        draw_craft(ad, spec)
    card = Image.alpha_composite(card, fade_left(art))

    draw = ImageDraw.Draw(card, "RGBA")
    draw_left_tab(draw, spec["panel"], spec["gold"])
    draw_seal_reserve(draw, spec)
    draw_border(draw, spec["gold"], spec["mode"] in {"blueprint", "dossier", "material"})

    vignette = layer()
    vd = ImageDraw.Draw(vignette, "RGBA")
    vd.rectangle((0, 0, 88, SIZE[1]), fill=(0, 0, 0, 32))
    vd.rectangle((1518, 0, SIZE[0], SIZE[1]), fill=(0, 0, 0, 38))
    vd.rectangle((0, 0, SIZE[0], 64), fill=(0, 0, 0, 16))
    vd.rectangle((0, 876, SIZE[0], SIZE[1]), fill=(0, 0, 0, 20))
    card = Image.alpha_composite(card, vignette.filter(ImageFilter.GaussianBlur(26)))

    out = OUT_DIR / slug
    out.mkdir(parents=True, exist_ok=True)
    card.convert("RGB").save(out / f"{slug}-card.png", quality=96)


def main() -> None:
    random.seed(7)
    for slug, spec in SPECS.items():
        make_card(slug, spec)


if __name__ == "__main__":
    main()
