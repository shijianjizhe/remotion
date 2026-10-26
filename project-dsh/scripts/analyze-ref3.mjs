import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
const DIR = "E:\\remotion\\project-dsh\\.analysis\\seq";
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".png")).sort();
const W = 320, H = 180;
const rowInk = new Float64Array(H);
const colInk = new Float64Array(W);
let frames = 0;
for (let k = 0; k < files.length; k += 2) {
  const { data } = await sharp(path.join(DIR, files[k])).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 3;
    const l = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
    if (l > 55) { rowInk[y] += 1; colInk[x] += 1; }
  }
  frames++;
}
const norm = (a) => Array.from(a).map((v) => v / frames);
const r = norm(rowInk), c = norm(colInk);
const ramp = " .:-=+*#%@";
const bar = (v, max) => ramp[Math.min(9, Math.round((v / max) * 9))];
const rmax = Math.max(...r), cmax = Math.max(...c);
console.log("ROW ink profile (0=top,180=bottom), sampled every 4 rows:");
for (let y = 0; y < H; y += 4) console.log(String(y).padStart(3), bar(r[y], rmax), (Math.round(r[y] * 10) / 10).toString());
console.log("COL ink profile (0=left,320=right), every 8 cols:");
let s = "";
for (let x = 0; x < W; x += 8) s += bar(c[x], cmax);
console.log(s);
const top = r.map((v, i) => [i, v]).sort((a, b) => b[1] - a[1]).slice(0, 12);
console.log("top ink rows:", top.map(([i, v]) => i + ":" + v.toFixed(1)).join(" "));
