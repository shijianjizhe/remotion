#!/usr/bin/env node
/**
 * verify-textures.mjs
 * Programmatic verification of every generated texture in public/tex/.
 * Checks: existence, exact dimensions, channel count, colour space, byte size,
 * and full per-channel statistics (mean / min / max / stdev) via sharp.
 *
 * Usage:  node scripts/verify-textures.mjs
 */

import sharp from "sharp";
import { stat, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const TEX_DIR = path.join(PROJECT_ROOT, "public", "tex");

const MAX_BYTES = 3 * 1024 * 1024;

const EXPECTED = [
  { name: "parchment.png", width: 1400, height: 1900, hasAlpha: false, note: "aged hand-made paper, opaque" },
  { name: "grain.png", width: 512, height: 512, hasAlpha: true, note: "fine film grain" },
  { name: "glow-gold.png", width: 512, height: 512, hasAlpha: true, note: "soft gold glow sprite" },
  { name: "glow-ember.png", width: 512, height: 512, hasAlpha: true, note: "tight ember glow sprite" },
  { name: "wall.png", width: 1600, height: 1000, hasAlpha: false, note: "dark plaster wall, opaque" },
  { name: "vignette.png", width: 1920, height: 1080, hasAlpha: true, note: "elliptical vignette" },
  { name: "venue-haze.png", width: 1600, height: 900, hasAlpha: true, note: "warm volumetric haze" },
];

const LABELS = ["R", "G", "B", "A"];

function f(n) {
  return Number(n).toFixed(2).padStart(7);
}

async function checkOne(exp) {
  const file = path.join(TEX_DIR, exp.name);
  const problems = [];
  try {
    await access(file);
  } catch {
    return { name: exp.name, ok: false, problems: ["MISSING FILE: " + file] };
  }
  const st = await stat(file);
  const meta = await sharp(file).metadata();
  const stats = await sharp(file).stats();

  if (meta.width !== exp.width || meta.height !== exp.height) {
    problems.push("DIMENSION MISMATCH: got " + meta.width + "x" + meta.height + ", expected " + exp.width + "x" + exp.height);
  }
  if (meta.format !== "png") problems.push("FORMAT is " + meta.format + ", expected png");
  const expectCh = exp.hasAlpha ? 4 : 3;
  if (meta.channels !== expectCh) problems.push("CHANNELS got " + meta.channels + ", expected " + expectCh);
  if (meta.hasAlpha !== exp.hasAlpha) problems.push("hasAlpha got " + meta.hasAlpha + ", expected " + exp.hasAlpha);
  if (!meta.space || String(meta.space).toLowerCase() !== "srgb") {
    problems.push("COLOUR SPACE got " + meta.space + ", expected srgb");
  }
  if (st.size > MAX_BYTES) problems.push("TOO BIG: " + (st.size / 1048576).toFixed(2) + " MiB > 3 MiB");

  const chans = stats.channels.map((c, i) => ({
    label: LABELS[i] || "ch" + i,
    min: c.min,
    max: c.max,
    mean: c.mean,
    stdev: c.stdev,
  }));

  return {
    name: exp.name,
    ok: problems.length === 0,
    problems,
    bytes: st.size,
    width: meta.width,
    height: meta.height,
    channels: meta.channels,
    hasAlpha: meta.hasAlpha,
    space: meta.space,
    depth: meta.depth,
    chans,
    entropy: stats.entropy,
    note: exp.note,
  };
}

const results = [];
for (const exp of EXPECTED) results.push(await checkOne(exp));

console.log("");
console.log("=".repeat(96));
console.log("TEXTURE VERIFICATION REPORT   " + TEX_DIR);
console.log("=".repeat(96));
console.log(
  "file".padEnd(17) + "dims".padEnd(12) + "ch".padStart(3) + "  hasAlpha  space  bytes          size"
);
console.log("-".repeat(96));
for (const r of results) {
  if (r.problems.includes && r.problems.length && r.bytes === undefined) {
    console.log(r.name.padEnd(17) + "*** " + r.problems.join("; "));
    continue;
  }
  console.log(
    r.name.padEnd(17) +
    (r.width + "x" + r.height).padEnd(12) +
    String(r.channels).padStart(3) + "  " +
    String(r.hasAlpha).padEnd(9) +
    String(r.space).padEnd(6) + " " +
    String(r.bytes).padStart(9) + "   " +
    (r.bytes / 1024).toFixed(1).padStart(8) + " KiB"
  );
}

console.log("");
console.log("PER-CHANNEL STATISTICS (0-255)");
console.log("-".repeat(96));
console.log("file".padEnd(17) + "chan      min      max     mean    stdev");
for (const r of results) {
  if (!r.chans) continue;
  for (const c of r.chans) {
    console.log(
      r.name.padEnd(17) + c.label.padEnd(5) + f(c.min) + f(c.max) + f(c.mean) + f(c.stdev)
    );
  }
}

console.log("");
console.log("ALPHA SUMMARY (RGBA files)");
console.log("-".repeat(96));
for (const r of results) {
  if (!r.chans || !r.hasAlpha) continue;
  const a = r.chans[3];
  console.log(
    r.name.padEnd(17) +
    "meanAlpha=" + a.mean.toFixed(3) +
    " (" + (a.mean / 255).toFixed(4) + " as 0..1)" +
    "  minA=" + a.min + "  maxA=" + a.max +
    " (" + (a.max / 255).toFixed(4) + " as 0..1)"
  );
}


/* --- structural check: is there large-scale variation, or is it a flat colour? --- */
async function coarseStats(file, hasAlpha) {
  const meta = await sharp(file).metadata();
  const w = Math.max(8, Math.round(meta.width / 16));
  const h = Math.max(8, Math.round(meta.height / 16));
  let pipe = sharp(file);
  if (hasAlpha) {
    pipe = pipe.extractChannel(3);
  } else {
    pipe = pipe.removeAlpha().greyscale();
  }
  const buf = await pipe.resize({ width: w, height: h, kernel: "linear" }).raw().toBuffer();
  let min = 255, max = 0, sum = 0, sum2 = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = buf[i];
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
    sum2 += v * v;
  }
  const n = buf.length;
  const mean = sum / n;
  const sd = Math.sqrt(Math.max(0, sum2 / n - mean * mean));

  // full-resolution distinct-level count (in the measured plane)
  let full;
  if (hasAlpha) full = await sharp(file).extractChannel(3).raw().toBuffer();
  else full = await sharp(file).removeAlpha().greyscale().raw().toBuffer();
  const seen = new Uint8Array(256);
  for (let i = 0; i < full.length; i++) seen[full[i]] = 1;
  let uniq = 0;
  for (let i = 0; i < 256; i++) uniq += seen[i];

  return { min, max, sd, uniq, plane: hasAlpha ? "alpha" : "luma" };
}

console.log("");
console.log("STRUCTURE CHECK (16x box-downsampled plane: proves large-scale variation, not a flat fill)");
console.log("-".repeat(96));
console.log("file".padEnd(17) + "plane".padEnd(7) + "coarseMin  coarseMax  coarseStdev  distinctLevels(fullres)");
for (const r of results) {
  if (!r.chans) continue;
  const c = await coarseStats(path.join(TEX_DIR, r.name), r.hasAlpha);
  console.log(
    r.name.padEnd(17) + c.plane.padEnd(7) +
    String(c.min).padStart(9) + String(c.max).padStart(11) +
    c.sd.toFixed(2).padStart(13) + String(c.uniq).padStart(20)
  );
}

console.log("");
console.log("TOTAL: " + results.reduce((s, r) => s + (r.bytes || 0), 0) + " bytes across " + results.length + " files");

const failed = results.filter((r) => !r.ok);
console.log("");
if (failed.length === 0) {
  console.log("RESULT: ALL " + results.length + " TEXTURES OK (dimensions, channels, alpha, srgb, size)");
} else {
  console.log("RESULT: " + failed.length + " PROBLEM(S)");
  for (const r of failed) {
    for (const p of r.problems) console.log("  - " + r.name + ": " + p);
  }
  process.exitCode = 1;
}

/* --- font copy --- */
try {
  const fs2 = await stat(path.join(PROJECT_ROOT, "public", "fonts", "NotoSerifSC-VF.ttf"));
  const src = await stat("C:" + path.sep + "Windows" + path.sep + "Fonts" + path.sep + "NotoSerifSC-VF.ttf");
  const same = fs2.size === src.size;
  console.log("FONT: public/fonts/NotoSerifSC-VF.ttf  " + fs2.size + " bytes  source=" + src.size + " bytes  " + (same ? "IDENTICAL SIZE" : "MISMATCH"));
  if (!same) process.exitCode = 1;
} catch (e) {
  console.log("FONT: MISSING -- " + e.message);
  process.exitCode = 1;
}
