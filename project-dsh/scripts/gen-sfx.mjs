#!/usr/bin/env node
/**
 * gen-sfx.mjs
 * ---------------------------------------------------------------------------
 * Deterministic synthesis of the ORIGINAL sound-design palette for the
 * documentary short "看不见的代价".
 *
 * Nothing is downloaded, sampled, recorded or borrowed: every waveform is
 * computed here from noise generators and analytic oscillators, driven only
 * by a seeded mulberry32 PRNG (no Math.random, no Date.now).
 *
 * Signal chain per sound:
 *   synth at 96 kHz  ->  DC removal  ->  raised-cosine edge fades
 *   ->  peak/RMS targeting  ->  decimate by 2 (Blackman windowed-sinc LP)
 *   ->  16-bit PCM mono WAV at 48 kHz
 *
 * Run:  node scripts/gen-sfx.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT_DIR = path.join(ROOT, 'public', 'sfx');

const OUT_SR = 48000;
const OVERSAMPLE = 2;
const SR = OUT_SR * OVERSAMPLE; // 96000 synthesis rate
const TWO_PI = Math.PI * 2;

/* ------------------------------------------------------------------ *
 * 0. utilities
 * ------------------------------------------------------------------ */

/** mulberry32 — small, fast, fully deterministic PRNG. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const R = (rng, a, b) => a + (b - a) * rng();
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

const n96 = (sec) => Math.round(sec * SR);
const n48 = (sec) => Math.round(sec * OUT_SR);
const zero = (n) => new Float64Array(n);

function noiseArr(rng, n) {
  const a = new Float64Array(n);
  for (let i = 0; i < n; i++) a[i] = rng() * 2 - 1;
  return a;
}

/** Paul Kellet pink-noise filter (~ -3 dB/oct, 1/f). */
function pinkArr(rng, n) {
  const out = new Float64Array(n);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < n; i++) {
    const w = rng() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return out;
}

function onePoleLP(x, fc, sr = SR) {
  const a = Math.exp((-TWO_PI * fc) / sr);
  const out = new Float64Array(x.length);
  let y = 0;
  for (let i = 0; i < x.length; i++) {
    y = (1 - a) * x[i] + a * y;
    out[i] = y;
  }
  return out;
}

function onePoleHP(x, fc, sr = SR) {
  const lp = onePoleLP(x, fc, sr);
  const out = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = x[i] - lp[i];
  return out;
}

/**
 * Topology-preserving state-variable filter (Zavalishin).
 * fc may be a function of the sample index -> stable under modulation.
 * mode: 'bp' (peak gain ~ Q) | 'lp' | 'hp'
 */
function svfArr(x, fc, q = 1.0, mode = 'bp', sr = SR) {
  const out = new Float64Array(x.length);
  const k = 1 / Math.max(0.0001, q);
  const fcFn = typeof fc === 'function' ? fc : () => fc;
  const maxF = sr * 0.45;
  let ic1 = 0, ic2 = 0;
  for (let i = 0; i < x.length; i++) {
    const f = clamp(fcFn(i), 8, maxF);
    const g = Math.tan((Math.PI * f) / sr);
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = x[i] - ic2;
    const v1 = a1 * ic1 + a2 * v3;
    const v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1;
    ic2 = 2 * v2 - ic2;
    out[i] = mode === 'lp' ? v2 : mode === 'hp' ? x[i] - k * v1 - v2 : v1;
  }
  return out;
}

/** Normalise an array in place to |max| == 1, returns the old max. */
function normMax(a) {
  let m = 0;
  for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i]));
  if (m > 1e-12) for (let i = 0; i < a.length; i++) a[i] /= m;
  return m;
}

/** Piecewise-linear breakpoints [[t, value], ...] -> value(t). */
function ramp(t, pts) {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t0, v0] = pts[i - 1];
      const [t1, v1] = pts[i];
      const u = (t - t0) / Math.max(1e-9, t1 - t0);
      return v0 + (v1 - v0) * (u * u * (3 - 2 * u)); // smoothstep between points
    }
  }
  return pts[pts.length - 1][1];
}

const smoothstep = (a, b, x) => {
  const u = clamp((x - a) / Math.max(1e-9, b - a), 0, 1);
  return u * u * (3 - 2 * u);
};

/** Gaussian swell centred at c with width w. */
const bell = (t, c, w) => Math.exp(-((t - c) / w) * ((t - c) / w));

/* ---------------------------- grains / partials --------------------------- */

/**
 * Short filtered-noise grain ("tinkle", "scratch", "click body").
 */
function addGrain(out, rng, t0, dur, opt) {
  const {
    mode = 'bp',
    fc = 3000,
    q = 1.2,
    amp = 0.3,
    tau = null,
    attack = 0.0008,
  } = opt;
  const n = Math.max(4, Math.round(dur * SR));
  const start = Math.round(t0 * SR);
  if (start >= out.length) return;
  const src = noiseArr(rng, n);
  const f = svfArr(src, typeof fc === 'function' ? fc : () => fc, q, mode);
  const tauS = tau == null ? dur * 0.45 : tau;
  const atk = Math.max(1, Math.round(attack * SR));
  for (let i = 0; i < n; i++) {
    const idx = start + i;
    if (idx >= out.length) break;
    let e = Math.exp(-i / SR / tauS);
    if (i < atk) e *= 0.5 - 0.5 * Math.cos((Math.PI * i) / atk);
    out[idx] += amp * e * f[i];
  }
}

/**
 * Sinusoidal partial with attack + exponential decay and optional glide.
 */
function addPartial(out, t0, dur, freq, amp, opt) {
  const {
    attack = 0.002,
    decayTau = null,
    phase = 0,
    glideTo = null,
    glideTime = null,
    hold = false,
  } = opt || {};
  const n = Math.max(4, Math.round(dur * SR));
  const start = Math.round(t0 * SR);
  if (start >= out.length) return;
  const tau = decayTau == null ? dur * 0.5 : decayTau;
  const atk = Math.max(1, Math.round(attack * SR));
  const gt = glideTime == null ? dur : glideTime;
  let ph = phase;
  for (let i = 0; i < n; i++) {
    const idx = start + i;
    if (idx >= out.length) break;
    const t = i / SR;
    const fr =
      glideTo == null
        ? freq
        : freq + (glideTo - freq) * smoothstep(0, gt, t);
    ph += (TWO_PI * fr) / SR;
    let e = hold ? 1 : Math.exp(-t / tau);
    if (i < atk) e *= 0.5 - 0.5 * Math.cos((Math.PI * i) / atk);
    out[idx] += amp * e * Math.sin(ph);
  }
}

/* ------------------------------------------------------- decimation / output */

function designLowpass(taps, fcNorm) {
  const h = new Float64Array(taps);
  const mid = (taps - 1) / 2;
  let sum = 0;
  for (let i = 0; i < taps; i++) {
    const m = i - mid;
    const sinc =
      m === 0 ? 2 * fcNorm : Math.sin(2 * Math.PI * fcNorm * m) / (Math.PI * m);
    const w =
      0.42 -
      0.5 * Math.cos((TWO_PI * i) / (taps - 1)) +
      0.08 * Math.cos((4 * Math.PI * i) / (taps - 1));
    h[i] = sinc * w;
    sum += h[i];
  }
  for (let i = 0; i < taps; i++) h[i] /= sum;
  return h;
}

const DEC_TAPS = 129;
const DEC_HP = designLowpass(DEC_TAPS, 0.2083); // ~20 kHz at 96 kHz

/** Decimate by 2, polyphase: output sample k <- input around 2k. */
function decimate2(x) {
  const outLen = Math.floor(x.length / 2);
  const out = new Float64Array(outLen);
  const half = (DEC_TAPS - 1) >> 1;
  const n = x.length;
  for (let k = 0; k < outLen; k++) {
    const center = 2 * k;
    let acc = 0;
    for (let t = 0; t < DEC_TAPS; t++) {
      const idx = center + t - half;
      if (idx >= 0 && idx < n) acc += DEC_HP[t] * x[idx];
    }
    out[k] = acc;
  }
  return out;
}

function removeDC(a) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i];
  const m = s / a.length;
  for (let i = 0; i < a.length; i++) a[i] -= m;
  return a;
}

function applyFades(a, fadeInSec, fadeOutSec) {
  const n = a.length;
  const fin = Math.min(n >> 1, Math.max(2, Math.round(fadeInSec * SR)));
  const fout = Math.min(n >> 1, Math.max(2, Math.round(fadeOutSec * SR)));
  for (let i = 0; i < fin; i++) a[i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / fin);
  for (let i = 0; i < fout; i++) {
    const j = n - 1 - i;
    a[j] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / fout);
  }
  a[0] = 0;
  a[n - 1] = 0;
  return a;
}

const peakOf = (a) => {
  let p = 0;
  for (let i = 0; i < a.length; i++) p = Math.max(p, Math.abs(a[i]));
  return p;
};
const rmsOf = (a) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * a[i];
  return Math.sqrt(s / a.length);
};

/**
 * Gated (active-region) RMS, measured on 10 ms blocks with a -30 dB relative
 * gate. Whole-file RMS is meaningless for a short impact with a long decay
 * tail, so this is what the per-category loudness targets act on: it makes a
 * 0.4 s tick and a 2.6 s coin ring sit at a comparable loudness.
 */
function gatedRms(a, sr = SR, blockSec = 0.01, gateDb = -30) {
  const blk = Math.max(16, Math.round(blockSec * sr));
  const nb = Math.floor(a.length / blk);
  if (nb < 1) return rmsOf(a);
  const e = new Float64Array(nb);
  let maxE = 0;
  for (let b = 0; b < nb; b++) {
    let s = 0;
    for (let i = 0; i < blk; i++) {
      const v = a[b * blk + i];
      s += v * v;
    }
    e[b] = s / blk;
    if (e[b] > maxE) maxE = e[b];
  }
  const thr = maxE * Math.pow(10, gateDb / 10);
  let acc = 0, cnt = 0;
  for (let b = 0; b < nb; b++) {
    if (e[b] >= thr) { acc += e[b]; cnt++; }
  }
  if (cnt === 0) return rmsOf(a);
  return Math.sqrt(acc / cnt);
}
const db = (x) => 20 * Math.log10(Math.max(1e-12, x));

/**
 * Final per-sound conditioning:
 *   DC removal -> edge fades -> hit target RMS but never exceed peakCeil.
 */
function finalize(x96, durSec, opt) {
  const { rmsDb = -24, peakCeil = 0.88, fadeIn = 0.003, fadeOut = null } = opt;
  removeDC(x96);
  const fOut = fadeOut == null ? Math.min(0.05, durSec * 0.06) : fadeOut;
  applyFades(x96, fadeIn, fOut);

  // band-limit to 48 kHz first (decimate by 2), then measure and normalise
  // on exactly the signal that ends up in the file.
  const x = decimate2(x96);
  removeDC(x);

  const p = peakOf(x);
  const rg = gatedRms(x, OUT_SR);
  if (p < 1e-9 || rg < 1e-9) throw new Error('degenerate (silent) synthesis');

  // aim the loud (active) region at the category target, never past the ceiling
  let g = Math.pow(10, rmsDb / 20) / rg;
  if (p * g > peakCeil) g = peakCeil / p;
  for (let i = 0; i < x.length; i++) x[i] *= g;

  // re-seal both edges so the file starts and ends on an exact zero crossing
  applyFades(x, Math.max(fadeIn, 0.0015), Math.max(fOut * 0.9, 0.004));
  const pk = peakOf(x);
  if (pk > 0.94) {
    const k = 0.94 / pk;
    for (let i = 0; i < x.length; i++) x[i] *= k;
  }
  return x;
}

/* --------------------------------------------------------------- WAV writer */

function writeWavMono16(file, samples, sr) {
  const n = samples.length;
  const dataBytes = n * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8, 'ascii');
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 1 * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.round(clamp(samples[i], -1, 1) * 32767);
    buf.writeInt16LE(v, 44 + i * 2);
  }
  fs.writeFileSync(file, buf);
  return buf.length;
}

/* ==========================================================================
 * SOUND DESIGN — 26 originals
 * ========================================================================== */

/* 1. air-room — 6.0 s : almost subliminal room air ------------------------ */
function airRoom(rng) {
  const n = n96(6.0);
  const w = noiseArr(rng, n);
  // "heavily low-passed": four cascaded one-poles at ~400 Hz = 24 dB/oct
  const lp = onePoleLP(onePoleLP(onePoleLP(onePoleLP(w, 400), 400), 400), 400);
  const p = onePoleLP(onePoleLP(pinkArr(rng, n), 160), 160);
  const out = zero(n);
  const a1 = rng() * TWO_PI, a2 = rng() * TWO_PI, a3 = rng() * TWO_PI;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const drift =
      0.62 +
      0.20 * Math.sin(TWO_PI * 0.067 * t + a1) +
      0.14 * Math.sin(TWO_PI * 0.043 * t + a2);
    const flutter = 1 + 0.055 * Math.sin(TWO_PI * 0.5 * t + a3);
    out[i] = (lp[i] * 1.0 + p[i] * 0.9) * drift * flutter;
  }
  return finalize(out, 6.0, { rmsDb: -40, peakCeil: 0.8, fadeIn: 0.12, fadeOut: 0.15 });
}

/* 2. low-hum — 4.0 s : distant mechanical resonance ------------------------ */
function lowHum(rng) {
  const n = n96(4.0);
  const out = zero(n);
  const voices = [
    [42.0, 42.31, 0.55],
    [63.0, 62.72, 0.36],
    [105.0, 105.42, 0.17],
    [21.0, 21.0, 0.30],
    [126.0, 126.5, 0.07],
  ];
  for (const [f1, f2, a] of voices) {
    addPartial(out, 0, 4.0, f1, a, { attack: 0.7, decayTau: 1.35 });
    addPartial(out, 0, 4.0, f2, a * 0.9, {
      attack: 0.75,
      decayTau: 1.4,
      phase: rng() * TWO_PI,
    });
  }
  const nz = onePoleLP(noiseArr(rng, n), 240);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const trem = 1 - 0.34 * (0.5 - 0.5 * Math.cos(TWO_PI * 0.3 * t));
    out[i] = out[i] * 0.62 * trem + nz[i] * 0.05;
  }
  const y = onePoleLP(out, 320);
  return finalize(y, 4.0, { rmsDb: -29, peakCeil: 0.78, fadeIn: 0.25, fadeOut: 0.3 });
}

/* 3. glass-break — 1.6 s : one clean pane shatter ------------------------- */
function glassBreak(rng) {
  const n = n96(1.6);
  const out = zero(n);

  // very short sharp transient, ~3 ms attack
  addGrain(out, rng, 0, 0.16, { mode: 'hp', fc: 1900, q: 0.9, amp: 0.95, tau: 0.022, attack: 0.003 });
  addGrain(out, rng, 0, 0.10, { mode: 'bp', fc: 4300, q: 1.0, amp: 0.55, tau: 0.015, attack: 0.0015 });
  addGrain(out, rng, 0.004, 0.06, { mode: 'bp', fc: 7200, q: 1.6, amp: 0.30, tau: 0.010, attack: 0.001 });

  // 40 tinkle grains over ~0.9 s, thinning out
  const GRAINS = 40;
  const weights = [];
  for (let k = 0; k < GRAINS; k++) {
    weights.push(0.02 + Math.pow(k / (GRAINS - 1), 1.8) + rng() * 0.02);
  }
  const wsum = weights.reduce((a, b) => a + b, 0);
  let tt = 0.015;
  for (let k = 0; k < GRAINS; k++) {
    const taper = 0.36 * Math.pow(1 - k / (GRAINS - 1), 0.7) + 0.02;
    const dur = R(rng, 0.03, 0.12);
    const fc = R(rng, 3000, 8000);
    addGrain(out, rng, tt, dur * 2.2, {
      mode: 'bp',
      fc,
      q: R(rng, 2.0, 3.4),
      amp: taper * 0.9,
      tau: dur * 0.55,
      attack: 0.0006,
    });
    addPartial(out, tt, dur * 2.0, fc * R(rng, 1.0, 1.06), taper * 0.30, {
      attack: 0.0006,
      decayTau: dur * 0.42,
      phase: rng() * TWO_PI,
    });
    tt += (weights[k] / wsum) * 0.86;
  }

  // soft low "air thump" — short, not a rumble
  addPartial(out, 0.004, 0.4, 90, 0.30, { attack: 0.004, decayTau: 0.105 });
  addPartial(out, 0.004, 0.4, 61, 0.17, { attack: 0.006, decayTau: 0.12, phase: 1.1 });

  return finalize(out, 1.6, { rmsDb: -17, peakCeil: 0.90, fadeIn: 0.0008, fadeOut: 0.08 });
}

/* 4. glass-tinkle — 2.2 s : residual shards + glass dust ------------------- */
function glassTinkle(rng) {
  const n = n96(2.2);
  const out = zero(n);
  const N = 46;
  for (let k = 0; k < N; k++) {
    const u = k / (N - 1);
    const t = 0.02 + 2.0 * Math.pow(u, 1.45) + R(rng, -0.02, 0.03);
    if (t < 0.01 || t > 2.10) continue;
    const amp = (0.16 * Math.pow(1 - u, 1.2) + 0.015) * R(rng, 0.6, 1.4);
    const dur = R(rng, 0.02, 0.08);
    addGrain(out, rng, t, dur * 2.4, {
      mode: 'bp',
      fc: R(rng, 2000, 6000),
      q: R(rng, 2.0, 4.0),
      amp,
      tau: dur * 0.6,
      attack: 0.0006,
    });
  }
  // fine dust shimmer bed
  const dust = svfArr(noiseArr(rng, n), 4200, 2.2, 'bp');
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] += dust[i] * 0.010 * Math.exp(-t / 1.1) * (0.5 + 0.5 * Math.sin(TWO_PI * 0.7 * t));
  }
  return finalize(out, 2.2, { rmsDb: -26, peakCeil: 0.82, fadeIn: 0.001, fadeOut: 0.06 });
}

/* 5. coin-tick — 0.5 s : small gold coin tapped on wood -------------------- */
function coinTick(rng) {
  const n = n96(0.5);
  const out = zero(n);
  addGrain(out, rng, 0, 0.02, { mode: 'hp', fc: 2400, q: 0.8, amp: 0.22, tau: 0.0022, attack: 0.0005 });

  const parts = [
    [2100, 0.38, 0.115],
    [3700, 0.30, 0.085],
    [5200, 0.21, 0.055],
    [7100, 0.13, 0.038],
  ];
  for (const [f, a, tau] of parts) {
    const det = 1 + R(rng, -0.004, 0.004);
    addPartial(out, 0, 0.34, f * det, a, { attack: 0.0009, decayTau: tau });
    addPartial(out, 0, 0.34, f * det * 1.0031, a * 0.55, {
      attack: 0.0011,
      decayTau: tau * 0.85,
      phase: rng() * TWO_PI,
    });
  }
  // tiny wooden body thump at 180 Hz (~30 ms)
  addPartial(out, 0, 0.09, 180, 0.34, { attack: 0.0015, decayTau: 0.013 });
  addPartial(out, 0, 0.09, 268, 0.13, { attack: 0.0018, decayTau: 0.009, phase: 0.7 });

  return finalize(out, 0.5, { rmsDb: -17, peakCeil: 0.85, fadeIn: 0.0005, fadeOut: 0.03 });
}

/* 6. coin-ring — 2.6 s : one larger coin's low shimmer -------------------- */
function coinRing(rng) {
  const n = n96(2.6);
  const out = zero(n);
  // soft attack, no click: a 8 ms raised-cosine bore
  const partials = [
    [620, 0.42, 2.05],
    [940, 0.30, 1.55],
    [1380, 0.20, 0.85],
    [2100, 0.11, 0.40],
    [2960, 0.05, 0.22],
  ];
  for (const [f, a, tau] of partials) {
    addPartial(out, 0, 2.5, f, a, { attack: 0.008, decayTau: tau });
    addPartial(out, 0, 2.5, f - 1.5, a * 0.75, { attack: 0.008, decayTau: tau, phase: rng() * TWO_PI });
    addPartial(out, 0, 2.5, f + 1.5, a * 0.7, { attack: 0.008, decayTau: tau * 0.95, phase: rng() * TWO_PI });
  }
  // faint noise "grip"
  addGrain(out, rng, 0, 0.05, { mode: 'bp', fc: 2600, q: 1.4, amp: 0.045, tau: 0.014, attack: 0.004 });
  return finalize(out, 2.6, { rmsDb: -20, peakCeil: 0.85, fadeIn: 0.004, fadeOut: 0.12 });
}

/* 7. coin-land — 0.7 s : dropped and settling ----------------------------- */
function coinLand(rng) {
  const n = n96(0.7);
  const out = zero(n);

  const tap = (t0, base, amp, tau) => {
    addGrain(out, rng, t0, 0.014, { mode: 'hp', fc: 1900, q: 0.9, amp: amp * 0.4, tau: 0.0016, attack: 0.0006 });
    const ps = [
      [1320, 0.5, 0.062],
      [2440, 0.34, 0.044],
      [3870, 0.18, 0.026],
    ];
    for (const [f, a, tt] of ps) {
      const fr = f * base;
      addPartial(out, t0, tau, fr, a * amp, { attack: 0.0018, decayTau: tt });
      addPartial(out, t0, tau, fr * 1.004, a * amp * 0.5, { attack: 0.0022, decayTau: tt * 0.8, phase: rng() * TWO_PI });
    }
    addPartial(out, t0, 0.08, 210, amp * 0.22, { attack: 0.002, decayTau: 0.016 });
  };

  tap(0.0, 0.94, 0.85, 0.24);
  tap(0.09, 0.88, 0.55, 0.20);

  // tiny off-centre wobble
  const wob = zero(n);
  addPartial(wob, 0.17, 0.48, 782, 0.09, { attack: 0.012, decayTau: 0.20 });
  addPartial(wob, 0.17, 0.48, 1120, 0.06, { attack: 0.014, decayTau: 0.16, phase: 1.3 });
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    wob[i] *= 1 + 0.55 * Math.sin(TWO_PI * 9.0 * t);
    out[i] += wob[i];
  }

  return finalize(out, 0.7, { rmsDb: -18, peakCeil: 0.85, fadeIn: 0.0006, fadeOut: 0.04 });
}

/* 8. low-boom — 2.0 s : soft sub accent (deliberately lower than glass) --- */
function lowBoom(rng) {
  const n = n96(2.0);
  const out = zero(n);
  addPartial(out, 0, 1.95, 55, 0.85, { attack: 0.012, decayTau: 0.40, glideTo: 38, glideTime: 1.6 });
  addPartial(out, 0, 1.95, 27.5, 0.30, { attack: 0.02, decayTau: 0.5, glideTo: 19, glideTime: 1.6, phase: 0.4 });
  addGrain(out, rng, 0, 0.9, { mode: 'lp', fc: 200, q: 0.7, amp: 0.16, tau: 0.22, attack: 0.01 });
  const y = onePoleLP(out, 700);
  return finalize(y, 2.0, { rmsDb: -19, peakCeil: 0.60, fadeIn: 0.004, fadeOut: 0.2 });
}

/* 9. paper-turn — 1.2 s : one page being turned --------------------------- */
function paperTurn(rng) {
  const n = n96(1.2);
  const src = onePoleHP(onePoleLP(onePoleLP(noiseArr(rng, n), 5500), 5500), 260);
  const fcFn = (i) => {
    const t = i / SR;
    return ramp(t, [
      [0.0, 900],
      [0.22, 2100],
      [0.42, 4600],
      [0.62, 1800],
      [0.85, 3200],
      [1.05, 1200],
    ]);
  };
  const bp = svfArr(src, fcFn, 1.5, 'bp');
  const flutter = onePoleLP(noiseArr(rng, n), 210);
  normMax(flutter);
  const out = zero(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = 0.85 * bell(t, 0.30, 0.15) + 0.62 * bell(t, 0.76, 0.19);
    out[i] = bp[i] * env * (0.72 + 0.5 * flutter[i]);
  }
  // grain bursts riding on the page
  for (let k = 0; k < 12; k++) {
    const t = R(rng, 0.1, 1.0);
    const amp = 0.10 * R(rng, 0.4, 1.0) * bell(t, 0.35, 0.4);
    addGrain(out, rng, t, 0.02, { mode: 'bp', fc: R(rng, 2500, 5500), q: 2.2, amp, tau: 0.004, attack: 0.0004 });
  }
  // small settle tap
  addGrain(out, rng, 1.045, 0.03, { mode: 'bp', fc: 1800, q: 2.0, amp: 0.14, tau: 0.006, attack: 0.0006 });
  addPartial(out, 1.045, 0.07, 520, 0.05, { attack: 0.001, decayTau: 0.02 });

  return finalize(out, 1.2, { rmsDb: -26, peakCeil: 0.82, fadeIn: 0.004, fadeOut: 0.04 });
}

/* 10. paper-open — 1.6 s : larger sheet unfolding ------------------------- */
function paperOpen(rng) {
  const n = n96(1.6);
  const src = pinkArr(rng, n);
  const fcFn = (i) => {
    const t = i / SR;
    return ramp(t, [
      [0.0, 500],
      [0.35, 1000],
      [0.72, 3400],
      [1.15, 1500],
      [1.6, 800],
    ]);
  };
  const bp = svfArr(src, fcFn, 0.85, 'bp');
  const breeze = onePoleLP(noiseArr(rng, n), 260);
  const out = zero(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = smoothstep(0.02, 0.55, t) * (1 - smoothstep(0.85, 1.55, t));
    out[i] = bp[i] * env * 1.6 + breeze[i] * env * 0.55;
  }
  // tiny creases
  const creaseTimes = [0.18, 0.47, 0.79, 1.06];
  for (const t of creaseTimes) {
    addGrain(out, rng, t, R(rng, 0.002, 0.004) * 4, {
      mode: 'bp',
      fc: R(rng, 2600, 6000),
      q: 2.6,
      amp: R(rng, 0.05, 0.11),
      tau: 0.0012,
      attack: 0.0004,
    });
  }
  // gentle tail
  addGrain(out, rng, 1.34, 0.16, { mode: 'bp', fc: 1300, q: 1.0, amp: 0.10, tau: 0.05, attack: 0.01 });

  return finalize(out, 1.6, { rmsDb: -27, peakCeil: 0.82, fadeIn: 0.01, fadeOut: 0.06 });
}

/* 11. metal-etch — 1.2 s : engraver's stylus on a plate ------------------- */
function metalEtch(rng) {
  const n = n96(1.2);
  const tone = zero(n);
  const cluster = [
    [3800, 0.20],
    [4150, 0.16],
    [4620, 0.13],
    [5080, 0.10],
    [6250, 0.05],
  ];
  for (const [f, a] of cluster) {
    addPartial(tone, 0, 1.15, f, a, { attack: 0.02, decayTau: 5.0, phase: rng() * TWO_PI });
    addPartial(tone, 0, 1.15, f * 1.0027, a * 0.6, { attack: 0.02, decayTau: 4.0, phase: rng() * TWO_PI });
  }
  // very fast amplitude grain
  const g = onePoleLP(onePoleLP(noiseArr(rng, n), 700), 700);
  normMax(g);
  const out = zero(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = smoothstep(0, 0.06, t) * (1 - smoothstep(1.0, 1.18, t));
    const grain = 0.30 + 0.70 * Math.abs(g[i]);
    out[i] = tone[i] * grain * env * 1.15;
  }
  // scratch ticks
  for (let k = 0; k < 14; k++) {
    const t = R(rng, 0.02, 1.1);
    addGrain(out, rng, t, 0.006, {
      mode: 'bp',
      fc: R(rng, 4800, 8200),
      q: 2.6,
      amp: R(rng, 0.03, 0.10),
      tau: 0.0012,
      attack: 0.0003,
    });
  }
  // 60 Hz body (the plate on the bench)
  addPartial(out, 0, 1.18, 60, 0.035, { attack: 0.06, decayTau: 3.0, hold: true });
  addPartial(out, 0, 1.18, 120, 0.014, { attack: 0.06, decayTau: 3.0, hold: true, phase: 0.9 });

  return finalize(out, 1.2, { rmsDb: -27, peakCeil: 0.76, fadeIn: 0.012, fadeOut: 0.05 });
}

/* 12. ash-whoosh — 2.0 s : fine dust dispersing --------------------------- */
function ashWhoosh(rng) {
  const n = n96(2.0);
  const src = pinkArr(rng, n);
  const fcFn = (i) => {
    const t = i / SR;
    return ramp(t, [
      [0.0, 300],
      [0.55, 3000],
      [2.0, 500],
    ]);
  };
  const bp = svfArr(src, fcFn, 1.5, 'bp');
  const gran = onePoleLP(noiseArr(rng, n), 90);
  normMax(gran);
  const out = zero(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = smoothstep(0.0, 0.42, t) * (1 - smoothstep(0.55, 1.95, t));
    const density = 0.25 + 0.75 * clamp(0.5 + 0.5 * gran[i] * (2.2 - t * 1.4), 0, 1);
    out[i] = bp[i] * env * (0.35 + 0.65 * density) * 1.7;
  }
  for (let k = 0; k < 26; k++) {
    const t = R(rng, 0.15, 1.9);
    addGrain(out, rng, t, 0.03, {
      mode: 'bp',
      fc: R(rng, 1800, 5200),
      q: 2.4,
      amp: R(rng, 0.01, 0.05) * (1 - t / 2.4),
      tau: 0.006,
      attack: 0.0006,
    });
  }
  return finalize(out, 2.0, { rmsDb: -26, peakCeil: 0.82, fadeIn: 0.02, fadeOut: 0.12 });
}

/* 13. ink-tap — 0.4 s : pen nib touching paper ---------------------------- */
function inkTap(rng) {
  const n = n96(0.4);
  const out = zero(n);
  addGrain(out, rng, 0, 0.01, { mode: 'hp', fc: 2600, q: 0.8, amp: 0.6, tau: 0.0011, attack: 0.0003 });
  addPartial(out, 0, 0.05, 6500, 0.10, { attack: 0.0004, decayTau: 0.005 });
  addGrain(out, rng, 0, 0.14, { mode: 'bp', fc: 1500, q: 3.0, amp: 0.20, tau: 0.028, attack: 0.0006 });
  addPartial(out, 0, 0.12, 430, 0.05, { attack: 0.0008, decayTau: 0.03 });
  return finalize(out, 0.4, { rmsDb: -24, peakCeil: 0.82, fadeIn: 0.0004, fadeOut: 0.02 });
}

/* 14. line-flow — 1.4 s : a thin line of light extending ------------------ */
function lineFlow(rng) {
  const n = n96(1.4);
  const src = noiseArr(rng, n);
  const fcFn = (i) => {
    const t = i / SR;
    return 1000 + 3000 * smoothstep(0.12, 1.28, t);
  };
  const bp = svfArr(src, fcFn, 6.2, 'bp');
  const out = zero(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = smoothstep(0.0, 0.30, t) * (1 - smoothstep(0.95, 1.38, t));
    out[i] = bp[i] * env * 0.55;
  }
  // soft guide tone, a fourth up (300 -> 400 Hz), ~ -30 dB
  addPartial(out, 0, 1.36, 300, 0.032, { attack: 0.16, decayTau: 9, glideTo: 400, glideTime: 1.15, hold: true });
  addPartial(out, 0, 1.36, 600, 0.008, { attack: 0.2, decayTau: 9, glideTo: 800, glideTime: 1.15, hold: true, phase: 0.6 });
  return finalize(out, 1.4, { rmsDb: -28, peakCeil: 0.8, fadeIn: 0.05, fadeOut: 0.09 });
}

/* 15. gear-whirr — 1.4 s : fine clockwork, brightness rising -------------- */
function gearWhirr(rng) {
  const n = n96(1.4);
  const imp = zero(n);
  const RATE = 14;
  const period = 1 / RATE;
  let k = 0;
  for (let t = 0.01; t < 1.34; t += period, k++) {
    const u = k / ((1.34 - 0.01) / period);
    const fc = 1200 + 3400 * u;
    addGrain(imp, rng, t, 0.012, {
      mode: 'bp',
      fc,
      q: 1.9,
      amp: 0.30 * (0.55 + 0.45 * u) * R(rng, 0.8, 1.15),
      tau: 0.0035,
      attack: 0.0004,
    });
  }
  const ring = svfArr(onePoleLP(onePoleLP(imp, 6500), 6500), 1650, 5.5, 'bp');
  const out = zero(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = smoothstep(0.0, 0.10, t) * (1 - smoothstep(1.16, 1.38, t));
    out[i] = (imp[i] * 0.55 + ring[i] * 0.45) * env;
  }
  return finalize(out, 1.4, { rmsDb: -25, peakCeil: 0.8, fadeIn: 0.004, fadeOut: 0.06 });
}

/* 16. clock-tick — 0.4 s : single dry mechanical tick --------------------- */
function clockTick(rng) {
  const n = n96(0.4);
  const out = zero(n);
  addGrain(out, rng, 0, 0.008, { mode: 'hp', fc: 3000, q: 0.8, amp: 0.55, tau: 0.0009, attack: 0.0002 });
  addPartial(out, 0, 0.12, 900, 0.34, { attack: 0.0006, decayTau: 0.018 });
  addPartial(out, 0, 0.12, 1450, 0.16, { attack: 0.0008, decayTau: 0.012, phase: 0.8 });
  addPartial(out, 0, 0.14, 2320, 0.07, { attack: 0.001, decayTau: 0.008, phase: 1.9 });
  addPartial(out, 0, 0.16, 150, 0.26, { attack: 0.0015, decayTau: 0.026 });
  return finalize(out, 0.4, { rmsDb: -17, peakCeil: 0.85, fadeIn: 0.0002, fadeOut: 0.02 });
}

/* 17. sand-flow — 3.2 s : grains pouring and settling --------------------- */
function sandFlow(rng) {
  const n = n96(3.2);
  const out = zero(n);
  let t = 0.0;
  let guard = 0;
  while (t < 3.15 && guard++ < 20000) {
    const rate = 40 + 900 * bell(t, 1.05, 0.85) * (t > 2.35 ? 0.35 : 1);
    const dt = -Math.log(Math.max(1e-9, rng())) / rate;
    t += dt;
    if (t >= 3.15) break;
    const fadeIn = smoothstep(0.0, 0.25, t);
    const settle = t > 2.35 ? Math.exp(-(t - 2.35) / 0.45) : 1;
    const amp = R(rng, 0.02, 0.10) * fadeIn * settle;
    const dur = R(rng, 0.002, 0.008);
    addGrain(out, rng, t, dur * 4, {
      mode: 'bp',
      fc: R(rng, 1800, 5000),
      q: 1.6,
      amp,
      tau: dur * 0.8,
      attack: 0.0002,
    });
  }
  const hp = onePoleHP(out, 260);
  // soft pour bed
  const bed = onePoleLP(noiseArr(rng, n), 900);
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    const env = smoothstep(0.0, 0.5, tt) * (1 - smoothstep(1.6, 3.15, tt));
    hp[i] += bed[i] * env * 0.05;
  }
  return finalize(hp, 3.2, { rmsDb: -23, peakCeil: 0.85, fadeIn: 0.02, fadeOut: 0.15 });
}

/* 18. chain-creak — 1.6 s : brass balance chain under tension ------------- */
function chainCreak(rng) {
  const n = n96(1.6);
  const exc = zero(n);
  // irregular stick-slip impulse train
  let t = 0.06;
  while (t < 1.5) {
    const idx = Math.round(t * SR);
    const amp = R(rng, 0.5, 1.3) * (rng() < 0.12 ? 0.25 : 1);
    if (idx < n) exc[idx] += amp;
    t += R(rng, 0.017, 0.032);
  }
  const fcFn = (i) =>
    ramp(i / SR, [
      [0.05, 210],
      [0.75, 480],
      [1.5, 300],
    ]);
  const res = svfArr(exc, fcFn, 17, 'bp');
  const out = zero(n);
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    const env = smoothstep(0.03, 0.35, tt) * (1 - smoothstep(1.15, 1.55, tt));
    out[i] = res[i] * env * 0.55;
  }
  // 4 small metallic clinks
  for (let k = 0; k < 4; k++) {
    const t0 = R(rng, 0.1, 1.35);
    for (const [f, a, tau] of [
      [2180, 0.024, 0.022],
      [3180, 0.017, 0.015],
      [4380, 0.009, 0.009],
    ]) {
      addPartial(out, t0, 0.08, f * R(rng, 0.99, 1.01), a, { attack: 0.0008, decayTau: tau, phase: rng() * TWO_PI });
    }
    addGrain(out, rng, t0, 0.01, { mode: 'hp', fc: 2800, q: 1.0, amp: 0.03, tau: 0.0015, attack: 0.0003 });
  }
  return finalize(out, 1.6, { rmsDb: -24, peakCeil: 0.85, fadeIn: 0.01, fadeOut: 0.08 });
}

/* 19. balance-settle — 1.4 s : precision balance finding equilibrium ------ */
function balanceSettle(rng) {
  const n = n96(1.4);
  const out = zero(n);
  const hit = (t0, amp) => {
    addGrain(out, rng, t0, 0.012, { mode: 'hp', fc: 2200, q: 1.0, amp: amp * 0.35, tau: 0.0016, attack: 0.0006 });
    for (const [f, a, tau] of [
      [1120, 0.34, 0.20],
      [1870, 0.20, 0.115],
      [2950, 0.11, 0.055],
      [4160, 0.05, 0.028],
    ]) {
      const fr = f * R(rng, 0.997, 1.003);
      addPartial(out, t0, 0.6, fr, a * amp, { attack: 0.0025, decayTau: tau });
      addPartial(out, t0, 0.6, fr * 1.0035, a * amp * 0.5, { attack: 0.003, decayTau: tau * 0.85, phase: rng() * TWO_PI });
    }
  };
  hit(0.0, 0.9);
  hit(0.45, 0.45);
  return finalize(out, 1.4, { rmsDb: -22, peakCeil: 0.85, fadeIn: 0.0015, fadeOut: 0.12 });
}

/* 20. low-breath — 1.8 s : abstract low swell (no voice) ------------------ */
function lowBreath(rng) {
  const n = n96(1.8);
  const tone = zero(n);
  addPartial(tone, 0, 1.78, 70, 0.6, { attack: 0.02, decayTau: 9, hold: true });
  addPartial(tone, 0, 1.78, 105, 0.14, { attack: 0.02, decayTau: 9, hold: true, phase: 1.2 });
  addPartial(tone, 0, 1.78, 35, 0.30, { attack: 0.02, decayTau: 9, hold: true, phase: 0.4 });
  const air = onePoleLP(onePoleLP(onePoleLP(noiseArr(rng, n), 550), 550), 550);
  const out = zero(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = smoothstep(0.02, 0.85, t) * (1 - smoothstep(0.85, 1.72, t));
    const e2 = 0.5 - 0.5 * Math.cos(TWO_PI * Math.min(1, t / 1.74));
    out[i] = (tone[i] * env + air[i] * 2.6 * e2) * 0.9;
  }
  return finalize(out, 1.8, { rmsDb: -29, peakCeil: 0.76, fadeIn: 0.05, fadeOut: 0.08 });
}

/* 21. time-wheel — 1.4 s : ratcheting date dial --------------------------- */
function timeWheel(rng) {
  const n = n96(1.4);
  const out = zero(n);
  const CLICKS = 10;
  let t = 0.03;
  let gap = 0.052;
  for (let k = 0; k < CLICKS; k++) {
    const u = k / (CLICKS - 1);
    const amp = (1 - 0.45 * u) * R(rng, 0.85, 1.05);
    addGrain(out, rng, t, 0.007, { mode: 'hp', fc: 4200, q: 0.9, amp: 0.45 * amp, tau: 0.0012, attack: 0.0002 });
    for (const [f, a, tau] of [
      [2200, 0.20, 0.020],
      [3400, 0.13, 0.013],
      [5480, 0.06, 0.008],
    ]) {
      addPartial(out, t, 0.10, f * R(rng, 0.995, 1.005), a * amp, { attack: 0.0006, decayTau: tau, phase: rng() * TWO_PI });
    }
    addPartial(out, t, 0.08, 340, 0.10 * amp, { attack: 0.001, decayTau: 0.012 });
    t += gap;
    gap *= 1.135;
  }
  // soft detent at the end
  const td = Math.min(1.26, t + 0.02);
  addGrain(out, rng, td, 0.02, { mode: 'bp', fc: 1500, q: 2.0, amp: 0.22, tau: 0.005, attack: 0.0008 });
  addPartial(out, td, 0.14, 780, 0.16, { attack: 0.002, decayTau: 0.035 });
  addPartial(out, td, 0.14, 1180, 0.08, { attack: 0.0025, decayTau: 0.022 });

  return finalize(out, 1.4, { rmsDb: -18, peakCeil: 0.85, fadeIn: 0.0008, fadeOut: 0.09 });
}

/* 22. ticket-tear — 0.6 s : card stock torn / perforated ------------------ */
function ticketTear(rng) {
  const n = n96(0.6);
  const src = noiseArr(rng, n);
  const hp = onePoleHP(src, 900);
  const rough = onePoleLP(noiseArr(rng, n), 420);
  normMax(rough);
  const out = zero(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = smoothstep(0.0, 0.012, t) * Math.exp(-t / 0.17);
    const grain = 0.35 + 0.85 * Math.abs(rough[i]);
    out[i] = hp[i] * env * grain * 1.1;
  }
  for (let k = 0; k < 16; k++) {
    const t = R(rng, 0.01, 0.34);
    addGrain(out, rng, t, 0.006, {
      mode: 'bp',
      fc: R(rng, 2500, 7000),
      q: 2.2,
      amp: R(rng, 0.03, 0.10) * Math.exp(-t / 0.2),
      tau: 0.0011,
      attack: 0.0002,
    });
  }
  return finalize(out, 0.6, { rmsDb: -20, peakCeil: 0.85, fadeIn: 0.0006, fadeOut: 0.06 });
}

/* 23. theatre-creak — 1.8 s : heavy old hinge ----------------------------- */
function theatreCreak(rng) {
  const n = n96(1.8);
  const exc = zero(n);
  let t = 0.05;
  while (t < 1.68) {
    const idx = Math.round(t * SR);
    const amp = R(rng, 0.55, 1.25) * (rng() < 0.09 ? 0.2 : 1);
    if (idx < n) exc[idx] += amp;
    t += R(rng, 0.020, 0.038);
  }
  const fcFn = (i) =>
    ramp(i / SR, [
      [0.05, 120],
      [0.9, 240],
      [1.55, 300],
      [1.8, 210],
    ]);
  const res = svfArr(exc, fcFn, 24, 'bp');
  const air = onePoleLP(onePoleLP(onePoleLP(noiseArr(rng, n), 340), 340), 340);
  const out = zero(n);
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    const env = smoothstep(0.04, 0.55, tt) * (1 - smoothstep(1.25, 1.75, tt));
    out[i] = res[i] * env * 0.75 + air[i] * env * 2.2;
  }
  // faint low body
  addPartial(out, 0, 1.7, 96, 0.03, { attack: 0.3, decayTau: 4.0, hold: true });
  return finalize(out, 1.8, { rmsDb: -25, peakCeil: 0.85, fadeIn: 0.02, fadeOut: 0.12 });
}

/* 24. crowd-murmur — 3.4 s : abstract non-verbal audience presence -------- */
function crowdMurmur(rng) {
  const n = n96(3.4);
  const src = noiseArr(rng, n);

  // three low-Q bands only: no formants, no intelligible "vowels"
  const b1 = svfArr(src, 420, 0.85, 'bp');
  const b2 = svfArr(noiseArr(rng, n), 900, 0.75, 'bp');
  const b3 = svfArr(noiseArr(rng, n), 1550, 0.7, 'bp');
  const b4 = svfArr(noiseArr(rng, n), 260, 1.1, 'bp');

  // many slow random envelopes (the "voices" presence, never a voice)
  const envs = [];
  for (let v = 0; v < 16; v++) {
    const rate = R(rng, 0.6, 3.2);
    const e = new Float64Array(n);
    let y = 0;
    const a = Math.exp((-TWO_PI * rate) / SR);
    for (let i = 0; i < n; i++) {
      y = (1 - a) * (rng() * 2 - 1) + a * y;
      e[i] = y;
    }
    normMax(e);
    envs.push(e);
  }
  const mix = zero(n);
  for (const e of envs) for (let i = 0; i < n; i++) mix[i] += e[i] * 0.0625;

  const out = zero(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = smoothstep(0.0, 0.7, t) * (1 - smoothstep(2.4, 3.35, t));
    const mod1 = 0.35 + 0.65 * clamp(0.5 + 0.5 * mix[i], 0, 1);
    const mod2 = 0.4 + 0.6 * clamp(0.5 - 0.5 * mix[i], 0, 1);
    out[i] =
      (b1[i] * 1.0 * mod1 +
        b2[i] * 0.55 * mod2 +
        b3[i] * 0.22 * (0.5 + 0.5 * mod1) +
        b4[i] * 0.7 * mod2) *
      env;
  }
  // heavy smear: cascade of two low-passes + gentle high-pass to keep it dark
  const sm = onePoleLP(onePoleLP(out, 1400), 1000);
  const y = onePoleHP(sm, 140);
  return finalize(y, 3.4, { rmsDb: -35, peakCeil: 0.72, fadeIn: 0.3, fadeOut: 0.35 });
}

/* 25. seal-stamp — 0.9 s : wax seal pressed onto paper ------------------- */
function sealStamp(rng) {
  const n = n96(0.9);
  const out = zero(n);
  addPartial(out, 0, 0.18, 90, 0.55, { attack: 0.003, decayTau: 0.038 });
  addPartial(out, 0, 0.18, 142, 0.18, { attack: 0.004, decayTau: 0.03, phase: 0.7 });
  addGrain(out, rng, 0, 0.02, { mode: 'hp', fc: 1400, q: 0.8, amp: 0.16, tau: 0.0022, attack: 0.0006 });
  // squishy filtered noise, gently sweeping down
  const fcFn = (i) => ramp(i / SR, [
    [0.0, 820],
    [0.16, 420],
    [0.42, 240],
  ]);
  addGrain(out, rng, 0.004, 0.42, { mode: 'bp', fc: fcFn, q: 1.3, amp: 0.62, tau: 0.085, attack: 0.004 });
  addGrain(out, rng, 0.01, 0.30, { mode: 'bp', fc: 620, q: 1.1, amp: 0.26, tau: 0.06, attack: 0.006 });
  addGrain(out, rng, 0.01, 0.22, { mode: 'lp', fc: 380, q: 0.8, amp: 0.10, tau: 0.05, attack: 0.006 });
  // small paper settle
  addGrain(out, rng, 0.30, 0.05, { mode: 'bp', fc: 2100, q: 2.2, amp: 0.10, tau: 0.008, attack: 0.0008 });
  addGrain(out, rng, 0.44, 0.05, { mode: 'bp', fc: 1600, q: 2.4, amp: 0.035, tau: 0.006, attack: 0.0008 });

  return finalize(out, 0.9, { rmsDb: -17, peakCeil: 0.88, fadeIn: 0.0006, fadeOut: 0.06 });
}

/* 26. lock-drop — 1.0 s : brass lock dropping home ----------------------- */
function lockDrop(rng) {
  const n = n96(1.0);
  const out = zero(n);
  const clank = (t0, amp, scale) => {
    addGrain(out, rng, t0, 0.012, { mode: 'hp', fc: 2600, q: 0.9, amp: amp * 0.55, tau: 0.0018, attack: 0.0009 });
    for (const [f, a, tau] of [
      [480, 0.46, 0.34],
      [790, 0.38, 0.25],
      [1310, 0.29, 0.19],
      [2170, 0.19, 0.12],
      [3410, 0.11, 0.07],
      [4930, 0.05, 0.04],
    ]) {
      const fr = f * scale * R(rng, 0.995, 1.005);
      addPartial(out, t0, 0.9, fr, a * amp, { attack: 0.0022, decayTau: tau });
      addPartial(out, t0, 0.9, fr * 1.004, a * amp * 0.45, { attack: 0.0028, decayTau: tau * 0.8, phase: rng() * TWO_PI });
    }
    addPartial(out, t0, 0.2, 110, amp * 0.30, { attack: 0.003, decayTau: 0.055 });
    addPartial(out, t0, 0.2, 168, amp * 0.15, { attack: 0.004, decayTau: 0.04, phase: 1.4 });
  };
  clank(0.0, 1.0, 1.0);
  clank(0.235, 0.30, 1.06);
  clank(0.395, 0.14, 1.11);
  return finalize(out, 1.0, { rmsDb: -15, peakCeil: 0.90, fadeIn: 0.0006, fadeOut: 0.08 });
}

/* =========================== sound table ================================= */

const SOUNDS = [
  ['air-room.wav', 6.0, airRoom],
  ['low-hum.wav', 4.0, lowHum],
  ['glass-break.wav', 1.6, glassBreak],
  ['glass-tinkle.wav', 2.2, glassTinkle],
  ['coin-tick.wav', 0.5, coinTick],
  ['coin-ring.wav', 2.6, coinRing],
  ['coin-land.wav', 0.7, coinLand],
  ['low-boom.wav', 2.0, lowBoom],
  ['paper-turn.wav', 1.2, paperTurn],
  ['paper-open.wav', 1.6, paperOpen],
  ['metal-etch.wav', 1.2, metalEtch],
  ['ash-whoosh.wav', 2.0, ashWhoosh],
  ['ink-tap.wav', 0.4, inkTap],
  ['line-flow.wav', 1.4, lineFlow],
  ['gear-whirr.wav', 1.4, gearWhirr],
  ['clock-tick.wav', 0.4, clockTick],
  ['sand-flow.wav', 3.2, sandFlow],
  ['chain-creak.wav', 1.6, chainCreak],
  ['balance-settle.wav', 1.4, balanceSettle],
  ['low-breath.wav', 1.8, lowBreath],
  ['time-wheel.wav', 1.4, timeWheel],
  ['ticket-tear.wav', 0.6, ticketTear],
  ['theatre-creak.wav', 1.8, theatreCreak],
  ['crowd-murmur.wav', 3.4, crowdMurmur],
  ['seal-stamp.wav', 0.9, sealStamp],
  ['lock-drop.wav', 1.0, lockDrop],
];

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('gen-sfx: synthesising ' + SOUNDS.length + ' mono WAVs -> ' + OUT_DIR);
  console.log('         synthesis rate ' + SR + ' Hz -> decimate x2 -> ' + OUT_SR + ' Hz, 16-bit PCM\n');

  const rows = [];
  let idx = 0;
  for (const [name, durSec, fn] of SOUNDS) {
    const rng = mulberry32(0x5f3a91 + idx * 7919);
    const expected = n48(durSec);
    let x = fn(rng);
    if (x.length !== expected) {
      const fix = new Float64Array(expected);
      fix.set(x.subarray(0, Math.min(expected, x.length)));
      x = fix;
    }
    // final hard guarantee: absolute silence at both edges
    x[0] = 0;
    x[x.length - 1] = 0;
    const bytes = writeWavMono16(path.join(OUT_DIR, name), x, OUT_SR);
    const pk = peakOf(x);
    const rm = db(rmsOf(x));
    const gr = db(gatedRms(x, OUT_SR));
    rows.push({ name, dur: durSec, samples: x.length, peak: pk, rmsDb: rm, gatedDb: gr, bytes });
    console.log(
      name.padEnd(20) +
        ' ' + durSec.toFixed(2) + ' s' +
        '  samples ' + String(x.length).padStart(7) +
        '  peak ' + pk.toFixed(3) +
        '  rms ' + rm.toFixed(1) +
        '  gated ' + gr.toFixed(1) + ' dBFS'
    );
    idx++;
  }

  const total = rows.reduce((a, r) => a + r.dur, 0);
  console.log('\n' + SOUNDS.length + ' files, ' + total.toFixed(2) + ' s of material total');
  console.log('max peak across library: ' + Math.max(...rows.map((r) => r.peak)).toFixed(3) + ' (must be <= 0.95)');
  const quiet = rows.filter((r) => r.rmsDb > -55).length;
  console.log('files above the -55 dBFS silence floor: ' + quiet + '/' + rows.length);
}

main();
