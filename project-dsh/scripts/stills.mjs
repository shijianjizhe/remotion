// 批量渲染片段静帧: node scripts/stills.mjs <compId> <outDir> <frame,frame,...>
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const compId = process.argv[2] ?? "StyleProof";
const outDir = process.argv[3] ?? ".analysis/stills";
const frames = (process.argv[4] ?? "0").split(",").map((s) => Number(s.trim()));
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: compId });
for (const frame of frames) {
  const output = path.join(outDir, `${compId}-${String(frame).padStart(4, "0")}.png`);
  await renderStill({ composition, serveUrl, output, frame, imageFormat: "png" });
  console.log("wrote", output);
}
