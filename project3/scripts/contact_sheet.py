"""Tile a list of images into a labelled contact sheet. usage: contact_sheet.py out.jpg cols thumbW img1 img2 ..."""
import sys
from PIL import Image, ImageDraw
out, cols, tw = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
files = sys.argv[4:]
ims = [Image.open(f).convert("RGB") for f in files]
th = int(tw * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw, rows * (th + 18)), (30, 30, 30))
d = ImageDraw.Draw(sheet)
for i, (im, f) in enumerate(zip(ims, files)):
    x, y = (i % cols) * tw, (i // cols) * (th + 18)
    sheet.paste(im.resize((tw, th)), (x, y + 18))
    d.text((x + 4, y + 3), f.replace("\\", "/").split("/")[-1], fill=(255, 220, 120))
sheet.save(out, quality=88)
print(out, sheet.size)
