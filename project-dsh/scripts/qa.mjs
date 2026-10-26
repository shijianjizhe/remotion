// 技术验收：容器/流/时长/音轨/静音版/帧确定性/接触表
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "output");
const FFPROBE = path.join(ROOT, "node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe");
const probe = (f) =>
  JSON.parse(
    execFileSync(FFPROBE, ["-hide_banner", "-v", "error", "-show_format", "-show_streams", "-of", "json", f], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    }),
  );
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");

const rows = [];
const add = (k, v) => { rows.push([k, v]); console.log(String(k).padEnd(26), v); };

console.log("=== 交付文件 ===");
for (const name of ["看不见的代价.mp4", "看不见的代价_clean.mp4", "看不见的代价_sfx.wav", "poster.png"]) {
  const f = path.join(OUT, name);
  if (!fs.existsSync(f)) { console.log("MISSING", name); process.exitCode = 1; continue; }
  add(name, (fs.statSync(f).size / 1e6).toFixed(2) + " MB  sha256:" + sha(f).slice(0, 16));
}

console.log("\n=== 主成片流信息 ===");
const main = probe(path.join(OUT, "看不见的代价.mp4"));
const v = main.streams.find((s) => s.codec_type === "video");
const a = main.streams.find((s) => s.codec_type === "audio");
add("video", `${v.codec_name} ${v.profile} ${v.width}x${v.height} ${v.pix_fmt} ${v.r_frame_rate} ${v.nb_frames} frames`);
add("video duration", Number(v.duration).toFixed(3) + " s");
add("format duration", Number(main.format.duration).toFixed(3) + " s");
add("bitrate", (Number(main.format.bit_rate) / 1e6).toFixed(2) + " Mbps");
add("audio", a ? `${a.codec_name} ${a.sample_rate} Hz ${a.channels} ch ${Math.round(a.bit_rate / 1000)} kbps ${Number(a.duration).toFixed(3)} s` : "NONE");

console.log("\n=== clean 版 ===");
const clean = probe(path.join(OUT, "看不见的代价_clean.mp4"));
const cv = clean.streams.find((s) => s.codec_type === "video");
const ca = clean.streams.find((s) => s.codec_type === "audio");
add("clean video", `${cv.width}x${cv.height} ${cv.pix_fmt} ${cv.nb_frames} frames ${Number(clean.format.duration).toFixed(3)}s`);
add("clean audio streams", ca ? "PRESENT (BAD)" : "none (OK)");

console.log("\n=== SFX WAV ===");
const wavPath = path.join(OUT, "看不见的代价_sfx.wav");
const wb = fs.readFileSync(wavPath);
const hdr = {
  riff: wb.toString("ascii", 0, 4),
  riffSize: wb.readUInt32LE(4),
  wave: wb.toString("ascii", 8, 12),
  fmt: wb.toString("ascii", 12, 16),
  audioFormat: wb.readUInt16LE(20),
  channels: wb.readUInt16LE(22),
  sampleRate: wb.readUInt32LE(24),
  bitsPerSample: wb.readUInt16LE(34),
  dataBytes: wb.readUInt32LE(40),
};
const dur = hdr.dataBytes / (hdr.sampleRate * hdr.channels * (hdr.bitsPerSample / 8));
add("wav", `${hdr.riff}/${hdr.wave} fmt=${hdr.audioFormat} ${hdr.channels}ch ${hdr.sampleRate}Hz ${hdr.bitsPerSample}bit`);
add("wav duration", dur.toFixed(6) + " s");
add("wav data bytes", hdr.dataBytes);
// 峰值 / RMS
let peak = 0, acc = 0, n = 0;
for (let i = 44; i + 1 < wb.length; i += 2) {
  const s = wb.readInt16LE(i) / 32768;
  if (Math.abs(s) > peak) peak = Math.abs(s);
  acc += s * s; n++;
}
add("wav peak", (20 * Math.log10(peak)).toFixed(2) + " dBFS");
add("wav rms", (20 * Math.log10(Math.sqrt(acc / n))).toFixed(2) + " dBFS");

console.log("\n=== 渲染确定性（同帧两次独立渲染） ===");
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "public") });
const composition = await selectComposition({ serveUrl, id: "InvisibleCost" });
const det = [];
for (const frame of [137, 1543, 2210, 3390, 4180]) {
  const p1 = path.join(ROOT, ".analysis/det", `f${frame}-a.png`);
  const p2 = path.join(ROOT, ".analysis/det", `f${frame}-b.png`);
  fs.mkdirSync(path.dirname(p1), { recursive: true });
  await renderStill({ composition, serveUrl, output: p1, frame, imageFormat: "png" });
  await renderStill({ composition, serveUrl, output: p2, frame, imageFormat: "png" });
  const same = sha(p1) === sha(p2);
  let maxD = 0, diffPx = 0;
  if (!same) {
    const A = await sharp(p1).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const B = await sharp(p2).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < A.data.length; i += 3) {
      const d = Math.max(
        Math.abs(A.data[i] - B.data[i]),
        Math.abs(A.data[i + 1] - B.data[i + 1]),
        Math.abs(A.data[i + 2] - B.data[i + 2]),
      );
      if (d > 0) { diffPx++; if (d > maxD) maxD = d; }
    }
  }
  const totalPx = 1920 * 1080;
  const pass = same || (maxD <= 2 && diffPx / totalPx < 0.001);
  det.push({ frame, same, maxD, diffPx });
  add(
    `frame ${frame}`,
    same
      ? "identical sha256 " + sha(p1).slice(0, 16)
      : `maxDelta ${maxD}/255 on ${diffPx} px (${((diffPx / totalPx) * 100).toFixed(4)}%) -> ${pass ? "within text-raster tolerance" : "BAD"}`,
  );
  if (!pass) process.exitCode = 1;
}

console.log("\n=== 逐镜头接触表 ===");
const stillDir = path.join(ROOT, ".analysis/shot-stills");
const files = fs.readdirSync(stillDir).filter((f) => f.endsWith(".png")).sort((x, y) => Number(x.slice(1, 3)) - Number(y.slice(1, 3)));
const TW = 400, TH = 225, cols = 6;
const grid = await Promise.all(files.map(async (f) => ({ input: await sharp(path.join(stillDir, f)).resize(TW, TH).toBuffer() })));
await sharp({ create: { width: TW * cols, height: TH * Math.ceil(grid.length / cols), channels: 3, background: "#000000" } })
  .composite(grid.map((g, i) => ({ ...g, left: (i % cols) * TW, top: Math.floor(i / cols) * TH })))
  .png()
  .toFile(path.join(ROOT, ".analysis/qa-contact-shots.png"));
add("shot contact sheet", `.analysis/qa-contact-shots.png (${files.length} stills)`);

fs.writeFileSync(path.join(ROOT, ".analysis/qa-report.json"), JSON.stringify({ rows, det }, null, 1));
console.log("\nwritten .analysis/qa-report.json");
