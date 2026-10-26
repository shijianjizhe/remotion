// 12 秒美术样片（成片第 4.0 秒起，重新计时）+ 关键帧 + 接触表
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "preview");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(ROOT, ".analysis/proof-stills"), { recursive: true });

const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "public") });
const composition = await selectComposition({ serveUrl, id: "StyleProof" });
console.log("proof frames:", composition.durationInFrames, composition.width + "x" + composition.height, composition.fps + "fps");

await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  outputLocation: path.join(OUT, "style-proof.mp4"),
  imageFormat: "png",
  crf: 20,
  pixelFormat: "yuv420p",
  concurrency: 12,
  onProgress: ({ renderedFrames }) => {
    if (renderedFrames % 30 === 0) process.stdout.write(`\r  rendered ${renderedFrames}/${composition.durationInFrames}`);
  },
});
process.stdout.write("\n");

// 关键帧
const keyFrames = [6, 22, 40, 120, 190, 250, 300, 336, 352];
const thumbs = [];
for (const frame of keyFrames) {
  const p = path.join(ROOT, ".analysis/proof-stills", `k${String(frame).padStart(3, "0")}.png`);
  await renderStill({ composition, serveUrl, output: p, frame, imageFormat: "png" });
  thumbs.push(p);
}

// 接触表 3x3
const TW = 640;
const TH = 360;
const composites = await Promise.all(
  thumbs.map(async (p) => ({ input: await sharp(p).resize(TW, TH).toBuffer() })),
);
await sharp({ create: { width: TW * 3, height: TH * 3, channels: 3, background: "#000000" } })
  .composite(composites.map((c, i) => ({ ...c, left: (i % 3) * TW, top: Math.floor(i / 3) * TH })))
  .png()
  .toFile(path.join(OUT, "contact-sheet.png"));

console.log("wrote", path.join(OUT, "style-proof.mp4"), fs.statSync(path.join(OUT, "style-proof.mp4")).size, "bytes");
console.log("wrote", path.join(OUT, "contact-sheet.png"));
