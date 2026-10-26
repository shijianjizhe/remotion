import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const DIR = "E:\\remotion\\project-dsh\\.analysis\\seq";
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".png")).sort();
const W = 320, H = 180;
const ramp = " .:-=+*#%@";
const sh = (l) => ramp[Math.min(9, Math.max(0, Math.round(Math.pow(l / 255, 0.7) * 9)))];

let prev = null;
const rows = [];
const diffs = [];
for (let k = 0; k < files.length; k++) {
  const { data } = await sharp(path.join(DIR, files[k])).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const lum = new Float32Array(W * H);
  let sum = 0, dark = 0, bright = 0, br = 0, bg = 0, bb = 0;
  for (let i = 0, o = 0; i < W * H; i++, o += 3) {
    const l = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
    lum[i] = l; sum += l;
    if (l < 18) dark++;
    if (l > 100) { bright++; br += data[o]; bg += data[o + 1]; bb += data[o + 2]; }
  }
  // bright centroid + bbox
  let cx = 0, cy = 0, n = 0, x0 = W, x1 = 0, y0 = H, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (lum[y * W + x] > 70) { cx += x; cy += y; n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  // row profile in 18 bands
  const bands = [];
  for (let b = 0; b < 18; b++) {
    let s = 0, c = 0;
    for (let y = Math.floor((b * H) / 18); y < Math.floor(((b + 1) * H) / 18); y++) for (let x = 0; x < W; x++) { s += lum[y * W + x]; c++; }
    bands.push(+(s / c).toFixed(1));
  }
  let d = 0;
  if (prev) for (let i = 0; i < W * H; i++) d += Math.abs(lum[i] - prev[i]);
  diffs.push(+(d / (W * H)).toFixed(2));
  prev = lum;
  rows.push({
    t: +(k / 2).toFixed(1),
    meanLum: +(sum / (W * H)).toFixed(1),
    darkPct: +((dark / (W * H)) * 100).toFixed(0),
    brightPct: +((bright / (W * H)) * 100).toFixed(1),
    brightHex: n ? "#" + [br, bg, bb].map((v) => Math.round(v / n).toString(16).padStart(2, "0")).join("") : "-",
    centroid: n ? [Math.round((cx / n / W) * 100), Math.round((cy / n / H) * 100), Math.round((n / (W * H)) * 1000)] : null,
    bbox: n ? [Math.round((x0 / W) * 100), Math.round((y0 / H) * 100), Math.round((x1 / W) * 100), Math.round((y1 / H) * 100)] : null,
    bands,
  });
}
fs.writeFileSync("E:\\remotion\\project-dsh\\.analysis\\ref-timeline.json", JSON.stringify({ rows, diffs }, null, 1));

// compact table every 2 s
console.log("t | meanLum dark% bright% col | centroid(x,y,area‰) | rowBands(top..bottom)");
for (const r of rows) {
  if (r.t % 4 !== 0) continue;
  console.log(`${String(r.t).padStart(5)} | ${String(r.meanLum).padStart(5)} ${String(r.darkPct).padStart(3)} ${String(r.brightPct).padStart(4)} ${r.brightHex} | ${(r.centroid || []).join(",")} | ${r.bands.map((b) => sh(b * 3)).join("")}`);
}
console.log("=== diffs (motion energy, 0.5s steps) ===");
console.log(diffs.map((d, i) => (i % 4 === 0 ? `${(i / 2).toFixed(0)}s:${d}` : "")).filter(Boolean).join("  "));
