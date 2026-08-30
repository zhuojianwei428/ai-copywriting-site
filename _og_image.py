#!/usr/bin/env python3
# 生成社交分享图 og.png (1200x630)
# 依赖 Pillow：python -m pip install --target <pkgs> Pillow
# 无 Pillow 时脚本会安全退出，不影响其他构建步骤。
import os
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "og.png")

W, H = 1200, 630
BG = (11, 14, 20)
FG = (232, 237, 245)
DIM = (154, 167, 189)
ACC = (109, 139, 255)
ACC2 = (176, 109, 255)

TITLE_1 = "AI writing tools that"
TITLE_2 = "don't sound like AI"
SUB = "11 tools, real-tested. Graded on one thing:"
SUB2 = "does the output sound human?"
BRAND = "CopyTools"

FONTS = os.path.join(os.environ.get("SystemRoot", r"C:\Windows"), "Fonts")


def load(name, size):
    p = os.path.join(FONTS, name)
    if not os.path.exists(p):
        return None
    from PIL import ImageFont
    return ImageFont.truetype(p, size)


def pick(candidates, size):
    for n in candidates:
        f = load(n, size)
        if f:
            return f
    return None


def main():
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("skip og.png: Pillow 未安装（不影响 SEO 构建）")
        return 0

    f_title = pick(["segoeuib.ttf", "arialbd.ttf", "DejaVuSans-Bold.ttf"], 58)
    f_sub = pick(["segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"], 30)
    f_brand = pick(["segoeuib.ttf", "arialbd.ttf", "DejaVuSans-Bold.ttf"], 26)
    if not (f_title and f_sub and f_brand):
        print("skip og.png: 找不到可用字体")
        return 0

    img = Image.new("RGBA", (W, H), BG + (255,))

    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-140, -180, 440, 400], fill=ACC + (55,))
    gd.ellipse([880, 400, 1440, 960], fill=ACC2 + (55,))
    img = Image.alpha_composite(img, glow)

    d = ImageDraw.Draw(img)
    d.text((80, 186), TITLE_1, font=f_title, fill=FG)
    d.text((80, 258), TITLE_2, font=f_title, fill=ACC)

    d.rectangle([80, 358, 300, 363], fill=ACC)
    d.text((80, 392), SUB, font=f_sub, fill=DIM)
    d.text((80, 436), SUB2, font=f_sub, fill=DIM)

    d.ellipse([80, 546, 100, 566], fill=ACC)
    d.text((112, 544), BRAND, font=f_brand, fill=DIM)

    img.convert("RGB").save(OUT, "PNG", optimize=True)
    print("og.png ->", OUT, os.path.getsize(OUT), "bytes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
