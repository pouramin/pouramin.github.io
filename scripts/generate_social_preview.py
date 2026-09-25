#!/usr/bin/env python3
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
OUT = Path("assets/social-preview.png")
OUT.parent.mkdir(parents=True, exist_ok=True)

bg = (247, 247, 244)
ink = (20, 22, 25)
muted = (100, 106, 116)
accent = (91, 76, 240)
green = (35, 165, 115)
line = (220, 221, 219)

img = Image.new("RGB", (W, H), bg)
draw = ImageDraw.Draw(img)

def font(size, bold=False):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()

# Frame
draw.rounded_rectangle((48, 48, W-48, H-48), radius=34, fill=(252,252,250), outline=line, width=2)

# AP mark
draw.rounded_rectangle((88, 88, 184, 184), radius=24, fill=accent)
draw.text((111, 112), "AP", font=font(35, True), fill="white")

draw.text((214, 92), "Amin Pour", font=font(34, True), fill=ink)
draw.text((214, 139), "pouramin.dev", font=font(22), fill=muted)

# Status pill
draw.rounded_rectangle((88, 225, 330, 271), radius=23, fill=(235,247,241))
draw.ellipse((108, 241, 120, 253), fill=green)
draw.text((137, 235), "BUILDING IN PUBLIC", font=font(15, True), fill=(45,90,70))

# Main statement
draw.text((88, 315), "Practical AI +", font=font(63, True), fill=ink)
draw.text((88, 389), "developer tools.", font=font(63, True), fill=accent)

# Footer labels
labels = ["Open source", "Local-first", "AI tooling", "TunnelLab"]
x = 88
for label in labels:
    bbox = draw.textbbox((0,0), label, font=font(18, True))
    width = bbox[2]-bbox[0] + 38
    draw.rounded_rectangle((x, 505, x+width, 549), radius=22, fill=(243,243,240), outline=line)
    draw.text((x+19, 515), label, font=font(18, True), fill=muted)
    x += width + 12

img.save(OUT, "PNG", optimize=True)
print(f"Wrote {OUT}")
