// 从成片中抽取帧，与原始渲染 PNG 比对 (PSNR / 平均绝对误差)，用于评估压缩损伤。
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const ROOT = path.resolve(import.meta.dirname, "..");
const FFM = path.join(ROOT, "node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe");
const MP4 = path.join(ROOT, "output/看不见的代价.mp4");
const frames = process.argv.slice(2).map(Number);
const dir = path.join(ROOT, ".analysis/psnr");
fs.mkdirSync(dir, { recursive: true });

const raw = async (f) => (await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true }));

for (const f of frames) {
  const src = path.join(ROOT, ".analysis/det", `f${f}-a.png`);
  const dec = path.join(dir, `d${f}.png`);
  execFileSync(FFM, ["-y", "-hide_banner", "-v", "error", "-ss", (f / 30).toFixed(6), "-i", MP4, "-frames:v", "1", dec]);
  const a = await raw(src);
  const b = await raw(dec);
  let mse = 0, mae = 0, n = 0;
  for (let i = 0; i < a.data.length; i++) {
    const d = a.data[i] - b.data[i];
    mse += d * d;
    mae += Math.abs(d);
    n++;
  }
  mse /= n;
  const psnr = mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse);
  console.log(`frame ${f}: PSNR ${psnr.toFixed(2)} dB, MAE ${(mae / n).toFixed(3)}/255, size ${a.info.width}x${a.info.height}`);
}
