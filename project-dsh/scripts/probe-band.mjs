// 单次区域墨量探针: node scripts/probe-band.mjs <png> <x0> <y0> <x1> <y1> [th]
import sharp from "sharp";
const [file, x0s, y0s, x1s, y1s, ths] = process.argv.slice(2);
const x0 = +x0s, y0 = +y0s, x1 = +x1s, y1 = +y1s, th = +(ths ?? 120);
const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
let ink = 0, n = 0, minX = W, maxX = 0, minY = 1e9, maxY = 0;
for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
  const o = (y * W + x) * 3;
  const l = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
  n++;
  if (l > th) { ink++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
}
console.log(
  `rect(${x0},${y0})-(${x1},${y1}) th>${th}: ink ${ink} px = ${((ink / n) * 100).toFixed(2)}%` +
    (ink ? ` bbox x[${minX},${maxX}] y[${minY},${maxY}] centerX ${((minX + maxX) / 2).toFixed(0)}` : " (EMPTY)"),
);
