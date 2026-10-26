// 同帧多次渲染的确定性测试（含逐像素差异）
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const frame = Number(process.argv[2] ?? 3390);
const times = Number(process.argv[3] ?? 4);
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "public") });
const composition = await selectComposition({ serveUrl, id: "InvisibleCost" });
const dir = path.join(ROOT, ".analysis/det2");
fs.mkdirSync(dir, { recursive: true });
const outs = [];
for (let i = 0; i < times; i++) {
  const p = path.join(dir, `f${frame}-${i}.png`);
  await renderStill({ composition, serveUrl, output: p, frame, imageFormat: "png", concurrency: i % 2 === 0 ? 1 : null });
  outs.push(p);
}
const hash = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex").slice(0, 16);
console.log(outs.map((p, i) => `#${i} ${hash(p)}`).join("\n"));
const raw = async (p) => (await sharp(p).removeAlpha().raw().toBuffer({ resolveWithObject: true })).data;
const base = await raw(outs[0]);
for (let i = 1; i < outs.length; i++) {
  const b = await raw(outs[i]);
  let n = 0, maxD = 0;
  for (let k = 0; k < base.length; k++) {
    const d = Math.abs(base[k] - b[k]);
    if (d > 0) { n++; if (d > maxD) maxD = d; }
  }
  console.log(`#0 vs #${i}: diff bytes ${n}, maxDelta ${maxD}`);
}
