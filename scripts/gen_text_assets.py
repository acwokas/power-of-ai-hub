from PIL import Image, ImageDraw, ImageFont
import os

NAVY = (20, 38, 76)
CREAM = (244, 236, 216)
OUT = "/tmp/poah-fresh/public"

def font(size):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf",
        "/System/Library/Fonts/Georgia.ttf",
        "/Library/Fonts/Georgia.ttf",
    ]
    for c in candidates:
        if os.path.exists(c):
            return ImageFont.truetype(c, size)
    return ImageFont.load_default()

def make_dai(size, path):
    img = Image.new("RGBA", (size, size), CREAM)
    d = ImageDraw.Draw(img)
    text = "d.ai"
    fs = int(size * 0.55)
    f = font(fs)
    bbox = d.textbbox((0, 0), text, font=f)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (size - w) // 2 - bbox[0]
    y = (size - h) // 2 - bbox[1]
    d.text((x, y), text, fill=NAVY, font=f)
    img.save(path)

for sz in [16, 32, 192, 512]:
    make_dai(sz, f"{OUT}/favicon-{sz}x{sz}.png")

make_dai(180, f"{OUT}/apple-touch-icon.png")

ico_imgs = []
for sz in [16, 32, 48]:
    tmp = Image.new("RGBA", (sz, sz), CREAM)
    dd = ImageDraw.Draw(tmp)
    fs = int(sz * 0.55)
    f = font(fs)
    bbox = dd.textbbox((0,0), "d.ai", font=f)
    w = bbox[2]-bbox[0]; h = bbox[3]-bbox[1]
    x = (sz - w)//2 - bbox[0]; y = (sz - h)//2 - bbox[1]
    dd.text((x,y), "d.ai", fill=NAVY, font=f)
    ico_imgs.append(tmp)
ico_imgs[0].save(f"{OUT}/favicon.ico", format="ICO", sizes=[(16,16),(32,32),(48,48)])

og = Image.new("RGB", (1200, 630), NAVY)
od = ImageDraw.Draw(og)
text = "democratising.ai"
fs = 110
f = font(fs)
bbox = od.textbbox((0,0), text, font=f)
w = bbox[2]-bbox[0]; h = bbox[3]-bbox[1]
x = (1200 - w)//2 - bbox[0]; y = (630 - h)//2 - bbox[1]
od.text((x,y), text, fill=CREAM, font=f)
og.save(f"{OUT}/og-image.png")

print("OK")
