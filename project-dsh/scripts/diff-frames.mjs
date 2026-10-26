// 比较两张 PNG 的差异像素（定位不确定性的来源）
import sharp from "sharp";
const [a, b] = process.argv.slice(2);
const A = await sharp(a).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const B = await sharp(b).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = A.info.width;
let n = 0, maxD = 0, minX = 1e9, maxX = -1, minY = 1e9, maxY = -1, sum = 0;
for (let i = 0; i < A.data.length; i += 3) {
  const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
  if (d > 0) {
    n++; sum += d;
    const px = (i / 3) % W, py = Math.floor(i / 3 / W);
    if (px < minX) minX = px; if (px > maxX) maxX = px;
    if (py < minY) minY = py; if (py > maxY) maxY = py;
    if (d > maxD) maxD = d;
  }
}
console.log(n === 0 ? "IDENTICAL" : `diff px ${n}, maxDelta ${maxD}, meanDelta ${(sum / n).toFixed(2)}, bbox x[${minX},${maxX}] y[${minY},${maxY}]`);
