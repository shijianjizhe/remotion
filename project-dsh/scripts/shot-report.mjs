// 逐镜头中帧抽样 + 量化体检表（作为 docs/QA.md 的数据来源）
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, ".analysis/shot-stills");
fs.mkdirSync(DIR, { recursive: true });
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "src/config/shots.json"), "utf8"));

const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "public") });
const composition = await selectComposition({ serveUrl, id: "InvisibleCost" });

const stats = async (file) => {
  const { data: px, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  let sum = 0, dark = 0, bright = 0, hot = 0;
  const lum = new Float32Array(W * H);
  for (let i = 0, o = 0; i < W * H; i++, o += 3) {
    const l = 0.2126 * px[o] + 0.7152 * px[o + 1] + 0.0722 * px[o + 2];
    lum[i] = l; sum += l;
    if (l < 18) dark++;
    if (l > 90) bright++;
    if (l > 200) hot++;
  }
  const ink = (x0, y0, x1, y1, th = 90) => {
    let c = 0, n = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { n++; if (lum[y * W + x] > th) c++; }
    return (c / n) * 100;
  };
  return {
    mean: sum / (W * H),
    dark: (dark / (W * H)) * 100,
    bright: (bright / (W * H)) * 100,
    hot,
    center: ink(384, 216, 1536, 842),
    sub: ink(110, 860, 1810, 980),
    tl: ink(0, 60, 620, 200),
    tr: ink(1300, 60, 1920, 260),
  };
};

const rows = [];
for (const s of data.shots) {
  const frame = Math.floor(s.start + (s.end - s.start) * 0.62);
  const file = path.join(DIR, `${s.id}-${frame}.png`);
  await renderStill({ composition, serveUrl, output: file, frame, imageFormat: "png" });
  const st = await stats(file);
  rows.push({ shot: s.id, frame, ...st, caption: s.caption });
  console.log(
    `${s.id} f${String(frame).padStart(4)} mean ${st.mean.toFixed(1).padStart(5)} dark% ${st.dark.toFixed(0).padStart(3)} bright% ${st.bright.toFixed(2).padStart(5)} hot ${String(st.hot).padStart(6)} | center ${st.center.toFixed(1).padStart(5)} sub ${st.sub.toFixed(2).padStart(5)} TL ${st.tl.toFixed(2).padStart(5)} TR ${st.tr.toFixed(2).padStart(5)} | ${s.caption ?? "（无）"}`,
  );
}
fs.writeFileSync(path.join(ROOT, ".analysis/shot-report.json"), JSON.stringify(rows, null, 1));
