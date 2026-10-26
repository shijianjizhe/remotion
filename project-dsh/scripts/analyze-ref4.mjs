import fs from "node:fs";
import sharp from "sharp";
import path from "node:path";
const j = JSON.parse(fs.readFileSync("E:\\remotion\\project-dsh\\.analysis\\ref-timeline.json", "utf8"));
const d = j.diffs;
const idx = d.map((v, i) => [i, v]).sort((a, b) => b[1] - a[1]).slice(0, 18).sort((a, b) => a[0] - b[0]);
console.log("top motion spikes (sec:energy):", idx.map(([i, v]) => (i / 2).toFixed(1) + ":" + v).join("  "));
const over = d.filter((v) => v > 6).length;
console.log("frames with diff>6:", over, "of", d.length, "=> approx shots:", over);
const sorted = [...d].sort((a, b) => a - b);
const med = sorted[Math.floor(sorted.length / 2)];
console.log("median diff:", med, "mean diff:", (d.reduce((a, b) => a + b, 0) / d.length).toFixed(2), "p90:", sorted[Math.floor(sorted.length * 0.9)]);

// accent colour: brightest 0.5% pixels over a sample of frames
const DIR = "E:\\remotion\\project-dsh\\.analysis\\seq";
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".png")).sort();
const px = [];
for (let k = 0; k < files.length; k += 6) {
  const { data, info } = await sharp(path.join(DIR, files[k])).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const arr = [];
  for (let o = 0; o < data.length; o += 3) {
    const l = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
    if (l > 120) arr.push([l, data[o], data[o + 1], data[o + 2]]);
  }
  arr.sort((a, b) => b[0] - a[0]);
  for (const p of arr.slice(0, 30)) px.push(p);
}
let r = 0, g = 0, b = 0;
for (const p of px) { r += p[1]; g += p[2]; b += p[3]; }
const mean = [r / px.length, g / px.length, b / px.length].map((v) => Math.round(v));
const hex = "#" + mean.map((v) => v.toString(16).padStart(2, "0")).join("");
const mx = Math.max(...mean), mn = Math.min(...mean);
console.log("accent mean of top highlights:", hex, mean, "sat%:", Math.round(((mx - mn) / mx) * 100), "n=", px.length);
// hue-ish description
console.log("R-G diff:", mean[0] - mean[1], "G-B diff:", mean[1] - mean[2]);
