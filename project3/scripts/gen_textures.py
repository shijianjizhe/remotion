"""Procedurally generates the original textures used in the film (deterministic seeds).
Outputs: public/textures/parchment_wide.png, parchment_page.png, grain_0..3.png"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import zoom, gaussian_filter, distance_transform_edt

OUT = "public/textures/"

def fbm(h, w, rng, octaves=5, base=4):
    acc = np.zeros((h, w)); amp = 1.0; tot = 0
    for o in range(octaves):
        n = base * 2 ** o
        g = rng.random((n + 2, int(n * w / h) + 2))
        z = zoom(g, (h / n, w / (n * w / h)), order=3)[:h, :w]
        acc += amp * z; tot += amp; amp *= 0.5
    acc /= tot
    return (acc - acc.min()) / (acc.max() - acc.min())

def parchment(w, h, seed, name):
    rng = np.random.default_rng(seed)
    base = np.array([232, 214, 177], float) / 255
    mott = fbm(h, w, rng, 6, 6)
    mid = fbm(h, w, rng, 4, 24)
    fine = gaussian_filter(rng.random((h, w)), 0.8)
    img = np.ones((h, w, 3)) * base
    img *= (0.90 + 0.14 * mott)[..., None]
    img *= (0.96 + 0.07 * mid)[..., None]
    img *= (0.975 + 0.05 * (fine - 0.5) * 2)[..., None]
    st = fbm(h, w, rng, 5, 5)
    stain = np.clip((st - 0.66) * 5, 0, 1)
    img *= (1 - 0.13 * stain)[..., None] * (np.array([1, 0.97, 0.9])[None, None, :] ** stain[..., None])
    # stain rings
    ring = np.abs(st - 0.66) < 0.0025
    img[ring] *= 0.975
    fib = Image.new("L", (w, h), 0); d = ImageDraw.Draw(fib)
    for _ in range(int(w * h / 500)):
        x, y = rng.random() * w, rng.random() * h
        a = rng.normal(0.1, 0.6); L = rng.uniform(6, 34)
        pts = [(x, y)]
        for k in range(4):
            a += rng.normal(0, 0.25); x += np.cos(a) * L / 4; y += np.sin(a) * L / 4; pts.append((x, y))
        d.line(pts, fill=int(rng.uniform(50, 150)), width=1)
    fib = np.asarray(fib.filter(ImageFilter.GaussianBlur(0.5)), float) / 255
    img *= (1 - 0.13 * fib)[..., None]
    spk = gaussian_filter((rng.random((h, w)) > 0.99985).astype(float), 1.0)
    img *= (1 - 0.6 * np.clip(spk * 4, 0, 1))[..., None]
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    nx = (fbm(h, w, rng, 5, 10) - 0.5) * 26
    ny = (fbm(h, w, rng, 5, 10) - 0.5) * 26
    X, Y = xx + nx, yy + ny
    hw, hh, rad = w / 2 - 22, h / 2 - 22, 14
    qx = np.abs(X - w / 2) - (hw - rad); qy = np.abs(Y - h / 2) - (hh - rad)
    sdf = np.sqrt(np.maximum(qx, 0) ** 2 + np.maximum(qy, 0) ** 2) + np.minimum(np.maximum(qx, qy), 0) - rad
    inside = -sdf
    alpha = np.clip(inside / 1.6, 0, 1)
    bn = fbm(h, w, rng, 4, 12)
    burn = np.clip(1 - inside / (18 + 40 * bn), 0, 1) ** 2.2
    img *= (1 - 0.6 * burn)[..., None] * (np.array([1, 0.9, 0.75])[None, None, :] ** burn[..., None])
    cx, cy = w / 2, h / 2
    r = np.sqrt(((xx - cx) / cx) ** 2 + ((yy - cy) / cy) ** 2)
    img *= (1 - 0.14 * np.clip(r - 0.55, 0, 1))[..., None]
    out = np.dstack([np.clip(img, 0, 1) * 255, alpha * 255]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(OUT + name, optimize=True)
    print(name, w, h)

parchment(1600, 1000, 11, "parchment_wide.png")
parchment(760, 980, 23, "parchment_page.png")
parchment(1000, 420, 37, "parchment_ticket.png")
for i in range(4):
    rng = np.random.default_rng(100 + i)
    g = gaussian_filter(rng.normal(0, 1, (1080, 1920)), 0.6)
    g = np.clip(128 + g / g.std() * 38, 0, 255).astype(np.uint8)
    Image.fromarray(g, "L").save(OUT + f"grain_{i}.png")
print("grain ok")
