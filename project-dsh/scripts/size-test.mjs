import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const ROOT = path.resolve(import.meta.dirname, "..");
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "public") });
const composition = await selectComposition({ serveUrl, id: "StyleProof" });
const out = path.join(ROOT, ".analysis/size-test.mp4");
await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out, imageFormat: "png", crf: 20, pixelFormat: "yuv420p", concurrency: 12, frameRange: [0, 89] });
const st = fs.statSync(out);
console.log("90 frames size:", st.size, "bytes =>", ((st.size * 8) / 3 / 1e6).toFixed(2), "Mbps");
