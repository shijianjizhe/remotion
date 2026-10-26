import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const REF_FRAMES = "E:\\remotion\\project-dsh\\.analysis\\ref";
const RAW = "E:\\remotion\\project-dsh\\.analysis\\ref\\seq320x180.raw";

// ---------- 1. composition maps from 480x270 stills ----------
const grid = (buf, w, h, gx, gy) => {
  const out = [];
  for (let j = 0; j < gy; j++) {
    const row = [];
    for (let i = 0; i < gx; i++) {
      let r = 0, g = 0, b = 0, n = 0;
      const x0 = Math.floor((i * w) / gx), x1 = Math.floor(((i + 1) * w) / gx);
      const y0 = Math.floor((j * h) / gy), y1 = Math.floor(((j + 1) * h) / gy);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const o = (y * w + x) * 3;
          r += buf[o]; g += buf[o + 1]; b += buf[o + 2]; n++;
        }
      }
      row.push({ r: r / n, g: g / n, b: b / n });
    }
    out.push(row);
  }
  return out;
};

const shade = (l) => {
  const ramp = " .:-=+*#%@";
  return ramp[Math.min(9, Math.max(0, Math.round((l / 255) * 9 * 1.6)))];
};

const files = fs.readdirSync(REF_FRAMES).filter((f) => /^f\d+\.png$/.test(f)).sort();
const report = [];
for (const f of files) {
  const p = path.join(REF_FRAMES, f);
  const { data, info } = await sharp(p).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const g = grid(data, info.width, info.height, 40, 15);
  const lines = g.map((row) => row.map((c) => shade(0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b)).join(""));
  // dominant bright color
  let br = 0, bg = 0, bb = 0, bn = 0, dark = 0, total = 0;
  for (let o = 0; o < data.length; o += 3) {
    const l = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
    total++;
    if (l < 18) dark++;
    if (l > 90) { br += data[o]; bg += data[o + 1]; bb += data[o + 2]; bn++; }
  }
  const bright = bn ? [Math.round(br / bn), Math.round(bg / bn), Math.round(bb / bn)] : null;
  const hex = bright ? "#" + bright.map((v) => v.toString(16).padStart(2, "0")).join("") : "n/a";
  report.push({ file: f, darkPct: +((dark / total) * 100).toFixed(1), brightPct: +((bn / total) * 100).toFixed(1), brightColor: hex, map: lines });
}

// ---------- 2. temporal stats from 1fps raw sequence ----------
let temporal = null;
if (fs.existsSync(RAW)) {
  const W = 320, H = 180, CH = 3, FS = W * H * CH;
  const buf = fs.readFileSync(RAW);
  const n = Math.floor(buf.length / FS);
  const lum = [], diffs = [];
  let prev = null;
  for (let k = 0; k < n; k++) {
    const off = k * FS;
    let sum = 0;
    for (let i = 0; i < FS; i += 3) sum += 0.2126 * buf[off + i] + 0.7152 * buf[off + i + 1] + 0.0722 * buf[off + i + 2];
    lum.push(+(sum / (W * H)).toFixed(2));
    if (prev) {
      let d = 0;
      for (let i = 0; i < FS; i += 3) d += Math.abs(buf[off + i + 1] - prev[i + 1]);
      diffs.push(+(d / (W * H)).toFixed(2));
    }
    prev = buf.subarray(off, off + FS);
  }
  const cuts = [];
  for (let i = 0; i < diffs.length; i++) if (diffs[i] > 12) cuts.push(i + 1);
  temporal = { frames: n, lumMin: Math.min(...lum), lumMax: Math.max(...lum), lumMean: +(lum.reduce((a, b) => a + b, 0) / lum.length).toFixed(2), lum, diffs, cuts };
}

const out = { composition: report, temporal };
fs.writeFileSync("E:\\remotion\\project-dsh\\.analysis\\ref-stats.json", JSON.stringify(out, null, 1));

// console summary
console.log("=== composition (darkPct / brightPct / brightColor) ===");
for (const r of report) console.log(r.file, r.darkPct, r.brightPct, r.brightColor);
if (temporal) {
  console.log("=== temporal ===");
  console.log("frames", temporal.frames, "lumMin", temporal.lumMin, "lumMax", temporal.lumMax, "lumMean", temporal.lumMean);
  console.log("cuts(>12):", temporal.cuts.join(","));
  console.log("lum series:", temporal.lum.join(","));
  console.log("diff series:", temporal.diffs.join(","));
}
