// 程序化“眼睛”：把渲染结果转成可判读的统计与亮度图。
// 用法: node scripts/inspect.mjs <png> [gridW] [gridH]
import sharp from "sharp";
import path from "node:path";

const file = process.argv[2];
const GW = Number(process.argv[3] ?? 64);
const GH = Number(process.argv[4] ?? 24);
if (!file) {
  console.error("usage: node scripts/inspect.mjs <png> [gw] [gh]");
  process.exit(1);
}

const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const lum = new Float32Array(W * H);
let sum = 0, dark = 0, bright = 0, hot = 0;
let br = 0, bg = 0, bb = 0;
for (let i = 0, o = 0; i < W * H; i++, o += 3) {
  const l = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
  lum[i] = l;
  sum += l;
  if (l < 18) dark++;
  if (l > 90) { bright++; br += data[o]; bg += data[o + 1]; bb += data[o + 2]; }
  if (l > 200) hot++;
}

const ramp = " .:-=+*#%@";
const sh = (l) => ramp[Math.min(9, Math.max(0, Math.round(Math.pow(l / 255, 0.62) * 9)))];
const lines = [];
for (let j = 0; j < GH; j++) {
  let line = "";
  for (let i = 0; i < GW; i++) {
    let s = 0, n = 0;
    const x0 = Math.floor((i * W) / GW), x1 = Math.floor(((i + 1) * W) / GW);
    const y0 = Math.floor((j * H) / GH), y1 = Math.floor(((j + 1) * H) / GH);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { s += lum[y * W + x]; n++; }
    line += sh(s / n);
  }
  lines.push(line);
}

// 区域墨量（存在内容 = 有高于阈值的像素）
const region = (x0, y0, x1, y1, th = 70) => {
  let c = 0, n = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { n++; if (lum[y * W + x] > th) c++; }
  return +((c / n) * 100).toFixed(2);
};

const hex = (r, g, b) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
console.log("file      ", path.basename(file), W + "x" + H);
console.log("meanLum   ", (sum / (W * H)).toFixed(2), "| dark(<18)%", ((dark / (W * H)) * 100).toFixed(1),
  "| bright(>90)%", ((bright / (W * H)) * 100).toFixed(2), "| hot(>200)px", hot);
console.log("brightCol ", bright ? hex(br / Math.max(1, bright), bg / Math.max(1, bright), bb / Math.max(1, bright)) : "-");
console.log("ink%  TL  ", region(0, 0, Math.round(W * 0.32), Math.round(H * 0.2)),
  "| TR", region(Math.round(W * 0.68), 0, W, Math.round(H * 0.2)),
  "| center", region(Math.round(W * 0.2), Math.round(H * 0.2), Math.round(W * 0.8), Math.round(H * 0.78)),
  "| sub-band", region(110, 860, W - 110, 980),
  "| bottom-left", region(0, Math.round(H * 0.82), Math.round(W * 0.3), H));
console.log("map (x=" + GW + ", y=" + GH + "):");
for (const l of lines) console.log("  |" + l + "|");
