#!/usr/bin/env python3
"""Instagram / YouTube Shorts kapağı (1080x1920): satır satır siyah kutularda başlık,
kırmızı hapta alt başlık, sağ altta filigran.

  python3 kapak.py klipler/v9_ref/final_gemi.png -o yayin/kapak.png
"""
import argparse
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1080, 1920
INTER = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
INTER_SB = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
EMOJI = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
RED = (224, 58, 46)


def cover(img):
    s = max(W / img.width, H / img.height)
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    x, y = (img.width - W) // 2, (img.height - H) // 2
    return img.crop((x, y, x + W, y + H))


def emoji_img(ch, size):
    f = ImageFont.truetype(EMOJI, 109)
    im = Image.new("RGBA", (136, 128), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((0, 0), ch, font=f, embedded_color=True)
    im = im.crop(im.getbbox())
    return im.resize((round(im.width * size / im.height), size), Image.LANCZOS)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("bg")
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--satir", nargs="+", default=["Denize çukur kazıp", "gemi park ettiler"])
    ap.add_argument("--hap", default="Adı: kuru havuz")
    ap.add_argument("--emoji", default="⚓")
    ap.add_argument("--hap2", default="· 70 sn")
    ap.add_argument("--filigran", default="speechgenai.com")
    a = ap.parse_args()

    base = cover(Image.open(a.bg).convert("RGB")).convert("RGBA")
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    # başlık: her satır kendi kutusunda, son satırın sonunda kırmızı nokta
    ft = ImageFont.truetype(INTER, 100)
    y = 300
    for i, line in enumerate(a.satir):
        last = i == len(a.satir) - 1
        tw = d.textlength(line + ("." if last else ""), font=ft)
        asc, desc = ft.getmetrics()
        bw, bh = tw + 64, asc + desc + 26
        x0 = (W - bw) / 2
        d.rounded_rectangle([x0, y, x0 + bw, y + bh], radius=18, fill=(22, 22, 22, 238))
        d.text((x0 + 32, y + 10), line, font=ft, fill="white")
        if last:
            d.text((x0 + 32 + d.textlength(line, font=ft), y + 10), ".", font=ft, fill=RED)
        y += bh - 4

    # kırmızı hap
    fp = ImageFont.truetype(INTER, 58)
    em = emoji_img(a.emoji, 54) if a.emoji else None
    t1, t2 = a.hap + " ", " " + a.hap2 if a.hap2 else ""
    w1, w2 = d.textlength(t1, font=fp), d.textlength(t2, font=fp)
    ew = em.width if em else 0
    pw, ph = w1 + ew + w2 + 64, 86
    px, py = (W - pw) / 2, y + 70
    d.rounded_rectangle([px, py, px + pw, py + ph], radius=16, fill=RED + (245,))
    d.text((px + 32, py + 10), t1, font=fp, fill="white")
    if em:
        layer.alpha_composite(em, (round(px + 32 + w1), round(py + (ph - em.height) / 2)))
    d.text((px + 32 + w1 + ew, py + 10), t2, font=fp, fill="white")

    # filigran (gölgeli)
    fw = ImageFont.truetype(INTER_SB, 40)
    tw = d.textlength(a.filigran, font=fw)
    wx, wy = W - 60 - tw, 1580
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((wx + 2, wy + 3), a.filigran, font=fw, fill=(0, 0, 0, 170))
    sh = sh.filter(ImageFilter.GaussianBlur(3))
    base.alpha_composite(sh)
    d.text((wx, wy), a.filigran, font=fw, fill="white")

    base.alpha_composite(layer)
    base.convert("RGB").save(a.out, quality=95)
    print("tamam:", a.out)


if __name__ == "__main__":
    main()
