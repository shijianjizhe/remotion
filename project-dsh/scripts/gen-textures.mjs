#!/usr/bin/env node
/**
 * gen-textures.mjs
 * -----------------------------------------------------------------------------
 * Deterministic procedural texture / sprite generator for the short film
 * "看不见的代价" (The Invisible Cost) - 1850s shop, black/gold palette.
 *
 * Everything is generated from code with a fixed seed (mulberry32).
 * No network access, no Math.random(), no Date.now() in any pixel decision.
 * Every octave / random draw comes from a seeded stream, so two runs of this
 * script produce byte-identical PNGs.
 *
 * Output: public/tex/*.png   (plus a font copy into public/fonts/)
 *
 * Usage:  node scripts/gen-textures.mjs
 */

import sharp from "sharp";
import { mkdir, copyFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const TEX_DIR = path.join(PROJECT_ROOT, "public", "tex");
const FONT_DIR = path.join(PROJECT_ROOT, "public", "fonts");
const FONT_SRC = "C:" + path.sep + "Windows" + path.sep + "Fonts" + path.sep + "NotoSerifSC-VF.ttf";
const FONT_DST = path.join(FONT_DIR, "NotoSerifSC-VF.ttf");

const MASTER_SEED = 0x1850a97e; // "1850" + a little noise

/* ==========================================================================
 * 1. Seeded PRNG (mulberry32)
 * ========================================================================== */
function mulberry32(a) {
  let t = a >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/* ==========================================================================
 * 2. Deterministic hash + value noise + fBm
 * ========================================================================== */
function hash2i(ix, iy, seed) {
  let h =
    Math.imul(ix | 0, 0x27d4eb2d) ^
    Math.imul(iy | 0, 0x165667b1) ^
    Math.imul(seed | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

/** Smooth (quintic-free, smoothstep) bilinear value noise in [0,1). */
function valueNoise(x, y, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2i(xi, yi, seed);
  const b = hash2i(xi + 1, yi, seed);
  const c = hash2i(xi, yi + 1, seed);
  const d = hash2i(xi + 1, yi + 1, seed);
  const top = a + (b - a) * ux;
  const bot = c + (d - c) * ux;
  return top + (bot - top) * uy;
}

/** Fractal brownian motion: returns roughly [0,1], mean ~0.5. */
function fbm(x, y, seed, octaves, scale) {
  let amp = 1;
  let sum = 0;
  let norm = 0;
  let s = scale;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(x / s, y / s, seed + o * 1013);
    norm += amp;
    amp *= 0.5;
    s *= 0.5;
  }
  return sum / norm;
}

/** Signed fBm in [-1,1]. */
function fbmS(x, y, seed, octaves, scale) {
  return fbm(x, y, seed, octaves, scale) * 2 - 1;
}

/* ==========================================================================
 * 3. Ordered (Bayer 8x8) dither - kills banding AND keeps PNGs small
 *    (random dither destroys PNG compressibility; ordered dither does not).
 * ========================================================================== */
const BAYER8 = [
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
];
const BAYER8N = new Float64Array(64);
for (let i = 0; i < 64; i++) BAYER8N[i] = (BAYER8[i] + 0.5) / 64 - 0.5;

/** Ordered dither in [-0.5, 0.5). */
function dither(x, y) {
  return BAYER8N[((y & 7) << 3) | (x & 7)];
}

/* ==========================================================================
 * 4. Small helpers
 * ========================================================================== */
function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

/** Smooth asymptotic cap: stays strictly below "cap", no flat clipping. */
function softCap(v, knee, cap) {
  if (v <= knee) return v;
  return knee + (cap - knee) * Math.tanh((v - knee) / (cap - knee));
}

function smoothstep(e0, e1, v) {
  const t = clamp((v - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

const PNG_OPTS = { compressionLevel: 9, adaptiveFiltering: true, palette: false, force: true };

async function writePng(buf, width, height, channels, name) {
  const file = path.join(TEX_DIR, name);
  const t0 = performance.now();
  await sharp(buf, { raw: { width, height, channels } })
    .png(PNG_OPTS)
    .toFile(file);
  const st = await stat(file);
  const ms = Math.round(performance.now() - t0);
  console.log(
    "  ok  " + name.padEnd(16) +
    String(width).padStart(5) + "x" + String(height).padEnd(5) +
    " ch=" + channels +
    "  " + (st.size / 1024).toFixed(1).padStart(8) + " KiB  " + ms + " ms"
  );
  return { name, bytes: st.size, width, height, channels };
}

/* ==========================================================================
 * 5. parchment.png - 1400x1900 opaque aged hand-made paper
 * ========================================================================== */
async function genParchment() {
  const W = 1400;
  const H = 1900;
  const N = W * H;
  const rand = mulberry32(MASTER_SEED ^ 0x1111);

  const fibre = new Float32Array(N);
  const stain = new Float32Array(N);

  /* ---- 60..90 faint irregular fibre streaks (mostly vertical, slight lean) ---- */
  const fibreCount = 62 + Math.floor(rand() * 29);
  for (let f = 0; f < fibreCount; f++) {
    const light = rand() < 0.34;
    const x0 = rand() * W;
    const y0 = -80 + rand() * (H + 160);
    const len = 80 + rand() * 440;
    const lean = (rand() - 0.5) * 0.36;          // radians, ~ +-10 deg
    const curl = (rand() - 0.5) * 0.012;         // curvature
    const mag = 0.3 + rand() * 0.7;
    const strength = (light ? 1 : -1) * mag;
    const wob = 0.5 + rand() * 1.8;
    let ang = Math.PI * 0.5 + lean;
    let px = x0;
    let py = y0;
    const steps = Math.max(2, Math.floor(len));
    for (let s = 0; s < steps; s++) {
      ang += curl * Math.sin(s * 0.05 * wob);
      px += Math.cos(ang);
      py += Math.sin(ang);
      const ix = Math.round(px);
      const iy = Math.round(py);
      if (ix < 1 || iy < 1 || ix >= W - 1 || iy >= H - 1) continue;
      const t = s / steps;
      const env = Math.pow(Math.sin(Math.PI * t), 0.65); // tapered ends
      const w = env * strength * 1.6;
      const b = iy * W + ix;
      fibre[b - 1] += w * 0.30;
      fibre[b] += w;
      fibre[b + 1] += w * 0.30;
      fibre[b - W] += w * 0.22;
      fibre[b + W] += w * 0.22;
    }
  }

  /* ---- 8..14 very soft irregular brownish stains ---- */
  const stainCount = 9 + Math.floor(rand() * 6); // 9..14
  for (let s = 0; s < stainCount; s++) {
    const cx = rand() * W;
    const cy = rand() * H;
    const big = rand();
    const rx = 80 + big * big * 300;              // mostly small, a few large
    const ry = rx * (0.55 + rand() * 0.85);
    const peak = 0.045 + rand() * 0.05;           // 0.045 .. 0.095
    const k1 = 2 + rand() * 2.4;
    const k2 = 2 + rand() * 2.4;
    const p1 = rand() * Math.PI * 2;
    const p2 = rand() * Math.PI * 2;
    const x0 = Math.max(0, Math.floor(cx - rx * 1.5));
    const x1 = Math.min(W - 1, Math.ceil(cx + rx * 1.5));
    const y0 = Math.max(0, Math.floor(cy - ry * 1.5));
    const y1 = Math.min(H - 1, Math.ceil(cy + ry * 1.5));
    for (let y = y0; y <= y1; y++) {
      const dy = (y - cy) / ry;
      for (let x = x0; x <= x1; x++) {
        const dx = (x - cx) / rx;
        const th = Math.atan2(dy, dx);
        const mod = 1 + 0.17 * Math.sin(k1 * th + p1) + 0.11 * Math.sin(k2 * th + p2);
        const r = Math.sqrt(dx * dx + dy * dy) / mod;
        if (r >= 1) continue;
        const t = 1 - r;
        const w = peak * (t * t * (3 - 2 * t));
        const idx = y * W + x;
        if (w > stain[idx]) stain[idx] = w; // max-composite: blots stay distinct
      }
    }
  }

  /* ---- compose ---- */
  const SEED_A = 0x201; // large warm/cool mottling
  const SEED_B = 0x202; // very large cool patches
  const SEED_C = 0x203; // medium mottle
  const SEED_D = 0x204; // fine paper grain (value noise)
  const SEED_E = 0x205; // fine paper grain (hash)

  const data = Buffer.allocUnsafe(N * 3);
  const BURNR = 198, BURNG = 174, BURNB = 131; // #C6AE83 edge burn target
  const STAINR = 176, STAING = 138, STAINB = 85; // #B08A55

  for (let y = 0; y < H; y++) {
    const vt = y / (H - 1);
    const vScale = 1.004 - 0.012 * vt;      // very subtle overall vertical gradient
    const dyEdge = Math.min(y, H - 1 - y);
    const edgeY = dyEdge < 140 ? 1 - dyEdge / 140 : 0;
    let p = y * W * 3;
    for (let x = 0; x < W; x++) {
      const i = y * W + x;

      // multi-octave mottling (5 + 3 + 3 octaves -> fBm)
      const big = fbmS(x, y, SEED_A, 5, 420);
      const cool = fbmS(x, y, SEED_B, 3, 980);
      const mid = fbmS(x, y, SEED_C, 3, 96);
      let d = big * 0.70 + cool * 0.34 + mid * 0.42;
      d = clamp(d * 1.45, -1, 1); // expand: fBm rarely reaches +-1 on its own

      // fine paper grain (smooth value noise + block hash), low amplitude
      const fine =
        (valueNoise(x / 3.4, y / 3.4, SEED_D) - 0.5) * 1.5 +
        (hash2i(x >> 1, y >> 1, SEED_E) - 0.5) * 1.0;

      // Warm (d>0) / cool (d<0) shift around base #E8D6B1, hue stays warm.
      // The light (+R) side is deliberately smaller than the dark side: 232+12
      // would break the hard "peak brightness < 240" rule, and aged paper has
      // far more dark mottling than bright bloom anyway.
      let r = 232 + (d > 0 ? d * 6 : d * 12);
      let g = 214 + (d > 0 ? d * 7 : d * 12);
      let b = 177 - d * 12;
      r += fine * 1.25;
      g += fine * 1.5;
      b += fine * 1.2;

      // fibres: dark ones subtract, light ones add only a little
      let fw = fibre[i];
      if (fw > 0) fw *= 0.5;
      fw = clamp(fw, -2.2, 2.2) * 4.4;
      r += fw;
      g += fw * 0.9;
      b += fw * 0.7;

      // stains (brown, very low alpha)
      const sv = stain[i];
      if (sv > 0.0005) {
        const sa = sv > 0.1 ? 0.1 : sv;
        r += (STAINR - r) * sa;
        g += (STAING - g) * sa;
        b += (STAINB - b) * sa;
      }

      // soft edge burn (radius ~140px, toward #C6AE83)
      let edge = edgeY;
      const dxE = x < W - 1 - x ? x : W - 1 - x;
      const edgeX = dxE < 140 ? 1 - dxE / 140 : 0;
      if (edgeX > edge) edge = edgeX;
      if (edge > 0) {
        const f = edge * edge * (3 - 2 * edge) * 0.82;
        r += (BURNR - r) * f;
        g += (BURNG - g) * f;
        b += (BURNB - b) * f;
      }

      // very subtle vertical gradient (+ a barely-there warm drift downward)
      r = r * vScale * (1 + 0.004 * vt);
      g = g * vScale;
      b = b * vScale * (1 - 0.012 * vt);

      // +-2 LSB dither, then a soft asymptotic cap so peak brightness < 240
      const dt = dither(x, y);
      r = softCap(r + dt * 2.6, 236, 239);
      g = softCap(g + dt * 2.4, 236, 239);
      b = softCap(b + dt * 2.2, 236, 239);

      data[p++] = clamp(Math.round(r), 0, 239);
      data[p++] = clamp(Math.round(g), 0, 239);
      data[p++] = clamp(Math.round(b), 0, 239);
    }
  }

  return writePng(data, W, H, 3, "parchment.png");
}

/* ==========================================================================
 * 6. grain.png - 512x512 RGBA fine film grain
 * ========================================================================== */
async function genGrain() {
  const W = 512;
  const H = 512;
  const N = W * H;
  const rand = mulberry32(MASTER_SEED ^ 0x2222);
  const data = Buffer.allocUnsafe(N * 4);

  const MEAN = 0.10;
  const SD = 0.048;

  let p = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // Box-Muller from two seeded uniforms -> gaussian-ish
      let u1 = rand();
      const u2 = rand();
      if (u1 < 1e-9) u1 = 1e-9;
      const gauss = Math.sqrt(-2 * Math.log(u1)) * Math.cos(6.283185307179586 * u2);
      let a = MEAN + gauss * SD;
      a = clamp(a, 0, 0.28);
      data[p++] = 255;
      data[p++] = 255;
      data[p++] = 255;
      data[p++] = clamp(Math.round(a * 255), 0, 71);
    }
  }

  return writePng(data, W, H, 4, "grain.png");
}

/* ==========================================================================
 * 7. glow-gold.png - 512x512 RGBA soft radial glow (#E8CA88, sigma ~90px)
 * ========================================================================== */
async function genGlowGold() {
  const W = 512;
  const H = 512;
  const cx = (W - 1) / 2;
  const cy = (H - 1) / 2;
  const sigma = 90;
  const s2 = 2 * sigma * sigma;
  const R = 232, G = 202, B = 136; // #E8CA88

  const gAt = (r) => Math.exp(-(r * r) / s2);
  const gEdge = gAt(cx); // ~0.0176 at the rim -> renormalised away
  const data = Buffer.allocUnsafe(W * H * 4);

  let p = 0;
  for (let y = 0; y < H; y++) {
    const dy = y - cy;
    for (let x = 0; x < W; x++) {
      const dx = x - cx;
      const r = Math.sqrt(dx * dx + dy * dy);
      let a = (gAt(r) - gEdge) / (1 - gEdge);
      a = clamp(a, 0, 1);
      a = clamp(Math.round(a * 255) + dither(x, y) * 1.2, 0, 255);
      data[p++] = R;
      data[p++] = G;
      data[p++] = B;
      data[p++] = clamp(Math.round(a), 0, 255);
    }
  }

  return writePng(data, W, H, 4, "glow-gold.png");
}

/* ==========================================================================
 * 8. glow-ember.png - 512x512 RGBA tight bright core + faint halo (#FFF0D0)
 * ========================================================================== */
async function genGlowEmber() {
  const W = 512;
  const H = 512;
  const cx = (W - 1) / 2;
  const cy = (H - 1) / 2;
  const R = 255, G = 240, B = 208; // #FFF0D0
  const sCore2 = 2 * 30 * 30;
  const sHalo2 = 2 * 115 * 115;

  const raw = (r) => Math.exp(-(r * r) / sCore2) + 0.14 * Math.exp(-(r * r) / sHalo2);
  const rawEdge = raw(cx);
  const rawMax = raw(0);

  const data = Buffer.allocUnsafe(W * H * 4);
  let p = 0;
  for (let y = 0; y < H; y++) {
    const dy = y - cy;
    for (let x = 0; x < W; x++) {
      const dx = x - cx;
      const r = Math.sqrt(dx * dx + dy * dy);
      let a = (raw(r) - rawEdge) / (rawMax - rawEdge);
      a = clamp(a, 0, 1);
      a = clamp(Math.round(a * 255) + dither(x, y) * 1.2, 0, 255);
      data[p++] = R;
      data[p++] = G;
      data[p++] = B;
      data[p++] = clamp(Math.round(a), 0, 255);
    }
  }

  return writePng(data, W, H, 4, "glow-ember.png");
}

/* ==========================================================================
 * 9. wall.png - 1600x1000 opaque dark warm plaster/stone (max channel < 46)
 * ========================================================================== */
async function genWall() {
  const W = 1600;
  const H = 1000;
  const N = W * H;
  const rand = mulberry32(MASTER_SEED ^ 0x3333);

  /* ---- a few fine hairline cracks ---- */
  const crack = new Float32Array(N);
  const crackCount = 6;
  for (let c = 0; c < crackCount; c++) {
    let px = rand() * W;
    let py = rand() * H;
    let ang = rand() * Math.PI * 2;
    const len = 260 + rand() * 700;
    const drift = (rand() - 0.5) * 0.02;
    const wob = 0.6 + rand() * 1.6;
    const width = 0.45 + rand() * 0.35; // sub-pixel -> 1..2px hairline
    const steps = Math.floor(len);
    for (let s = 0; s < steps; s++) {
      ang += drift + Math.sin(s * 0.035 * wob) * 0.012;
      px += Math.cos(ang) * 0.9;
      py += Math.sin(ang) * 0.9;
      const ix = Math.round(px);
      const iy = Math.round(py);
      if (ix < 2 || iy < 2 || ix >= W - 2 || iy >= H - 2) continue;
      const fade = Math.pow(Math.sin(Math.PI * (s / steps)), 0.5);
      const amp = 0.98 * fade;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const w = amp * Math.exp(-(ox * ox + oy * oy) / (2 * width * width));
          const idx = (iy + oy) * W + (ix + ox);
          if (w > crack[idx]) crack[idx] = w;
        }
      }
    }
  }

  const SEED_S = 0x301; // trowel swirls (low frequency)
  const SEED_T = 0x302; // medium trowel
  const SEED_F = 0x303; // fine grain

  const data = Buffer.allocUnsafe(N * 3);
  const CR = 10, CG = 9, CB = 8; // #0A0908
  const cx = W * 0.5;
  const cy = H * 0.28;

  let p = 0;
  for (let y = 0; y < H; y++) {
    const wy = (y - cy) / (H * 0.80);
    for (let x = 0; x < W; x++) {
      const i = y * W + x;

      const sw1 = fbmS(x, y, SEED_S, 4, 360);   // trowel swirls
      const sw2 = fbmS(x, y, SEED_T, 3, 84);    // medium plaster
      const gn = (hash2i(x >> 1, y >> 1, SEED_F) - 0.5) * 2; // fine grain

      // gentle warm falloff: brighter toward centre-top (#1A1512)
      const wx = (x - cx) / (W * 0.62);
      const rr = Math.sqrt(wx * wx + wy * wy);
      const fall = 1 - smoothstep(0.0, 1.15, rr);

      let r = 19 + sw1 * 5.2 + sw2 * 2.4 + gn * 1.5 + fall * 7.0;
      let g = 17 + sw1 * 4.6 + sw2 * 2.1 + gn * 1.3 + fall * 4.4;
      let b = 15 + sw1 * 3.9 + sw2 * 1.8 + gn * 1.2 + fall * 3.2;

      const ck = crack[i];
      if (ck > 0.002) {
        const k = ck * 0.94;
        r += (CR - r) * k;
        g += (CG - g) * k;
        b += (CB - b) * k;
      }

      const dt = dither(x, y) * 2.0;
      r += dt;
      g += dt * 0.95;
      b += dt * 0.9;

      data[p++] = clamp(Math.round(r), 0, 45);
      data[p++] = clamp(Math.round(g), 0, 45);
      data[p++] = clamp(Math.round(b), 0, 45);
    }
  }

  return writePng(data, W, H, 3, "wall.png");
}

/* ==========================================================================
 * 10. vignette.png - 1920x1080 RGBA elliptical vignette, max alpha 0.55 at corners
 * ========================================================================== */
async function genVignette() {
  const W = 1920;
  const H = 1080;
  const N = W * H;
  const cx = (W - 1) / 2;
  const cy = (H - 1) / 2;
  const ax = cx;
  const ay = cy;
  const SQ2 = Math.SQRT2;
  const MAXA = 0.55;

  const data = Buffer.allocUnsafe(N * 4);
  let p = 0;
  for (let y = 0; y < H; y++) {
    const ny = (y - cy) / ay;
    for (let x = 0; x < W; x++) {
      const nx = (x - cx) / ax;
      const e = Math.sqrt(nx * nx + ny * ny) / SQ2; // 0 centre .. 1 corners
      let s = smoothstep(0.24, 1.0, e);
      s = Math.pow(s, 1.25);
      let a = MAXA * 255 * s;
      a += dither(x, y) * 1.15;
      data[p++] = 0;
      data[p++] = 0;
      data[p++] = 0;
      data[p++] = clamp(Math.round(a), 0, 140);
    }
  }

  return writePng(data, W, H, 4, "vignette.png");
}

/* ==========================================================================
 * 11. venue-haze.png - 1600x900 RGBA warm volumetric haze (gold, alpha <= 0.13)
 * ========================================================================== */
async function genHaze() {
  const W = 1600;
  const H = 900;
  const N = W * H;
  const rand = mulberry32(MASTER_SEED ^ 0x4444);
  const field = new Float32Array(N);

  const blobCount = 9;
  const blobs = [];
  for (let i = 0; i < blobCount; i++) {
    const sx = 170 + rand() * 300;
    blobs.push({
      cx: (0.12 + rand() * 0.76) * W,
      cy: (0.10 + rand() * 0.66) * H,
      sx,
      sy: sx * (0.55 + rand() * 0.75),
      peak: 0.032 + rand() * 0.050,
    });
  }
  for (const bl of blobs) {
    const x0 = Math.max(0, Math.floor(bl.cx - bl.sx * 3));
    const x1 = Math.min(W - 1, Math.ceil(bl.cx + bl.sx * 3));
    const y0 = Math.max(0, Math.floor(bl.cy - bl.sy * 3));
    const y1 = Math.min(H - 1, Math.ceil(bl.cy + bl.sy * 3));
    const s2x = 2 * bl.sx * bl.sx;
    const s2y = 2 * bl.sy * bl.sy;
    for (let y = y0; y <= y1; y++) {
      const dy = (y - bl.cy) / bl.sy;
      const ey = Math.exp(-(dy * dy) / 2);
      const row = y * W;
      for (let x = x0; x <= x1; x++) {
        const dx = (x - bl.cx) / bl.sx;
        const a = bl.peak * Math.exp(-(dx * dx) / 2) * ey; // gaussian, separable
        if (a < 1e-5) continue;
        const i = row + x;
        field[i] = 1 - (1 - field[i]) * (1 - a); // screen compositing
      }
    }
    void s2x;
    void s2y;
  }

  // normalise so the hottest point is exactly 0.125 (< 0.13) -> no clipping
  let maxv = 0;
  for (let i = 0; i < N; i++) if (field[i] > maxv) maxv = field[i];
  const k = maxv > 0 ? 0.125 / maxv : 1;

  const R = 196, G = 154, B = 87; // #C49A57
  const data = Buffer.allocUnsafe(N * 4);
  let p = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const a = field[y * W + x] * k;
      let v = a * 255 + dither(x, y) * 1.1;
      if (a < 1e-4) v = 0; // keep empty air perfectly transparent & compressible
      data[p++] = R;
      data[p++] = G;
      data[p++] = B;
      data[p++] = clamp(Math.round(v), 0, 33);
    }
  }

  return writePng(data, W, H, 4, "venue-haze.png");
}

/* ==========================================================================
 * 12. fonts
 * ========================================================================== */
async function installFont() {
  await mkdir(FONT_DIR, { recursive: true });
  await copyFile(FONT_SRC, FONT_DST);
  const st = await stat(FONT_DST);
  const src = await stat(FONT_SRC);
  console.log(
    "  ok  NotoSerifSC-VF.ttf  " + (st.size / 1024).toFixed(1) + " KiB" +
    (st.size === src.size ? "  (size matches source)" : "  WARNING size mismatch")
  );
  return { name: "public/fonts/NotoSerifSC-VF.ttf", bytes: st.size };
}

/* ==========================================================================
 * main
 * ========================================================================== */
async function main() {
  const t0 = performance.now();
  await mkdir(TEX_DIR, { recursive: true });
  console.log("gen-textures: writing to " + TEX_DIR);
  const results = [];
  results.push(await genParchment());
  results.push(await genGrain());
  results.push(await genGlowGold());
  results.push(await genGlowEmber());
  results.push(await genWall());
  results.push(await genVignette());
  results.push(await genHaze());
  const font = await installFont();

  console.log("");
  console.log("done in " + ((performance.now() - t0) / 1000).toFixed(1) + " s");
  let total = 0;
  for (const r of results) total += r.bytes;
  console.log("total texture bytes: " + total + " (" + (total / 1048576).toFixed(2) + " MiB)");
  for (const r of results) {
    if (r.bytes > 3 * 1024 * 1024) {
      console.log("WARNING: " + r.name + " exceeds 3 MB");
    }
  }
  void font;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
