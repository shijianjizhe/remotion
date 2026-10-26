// 全片渲染 → 合流音效 → clean 版 → 封面 → 抽帧接触表
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "output");
const TMP = path.join(ROOT, ".analysis/render");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const FFMPEG = path.join(ROOT, "node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe");
const FFPROBE = path.join(ROOT, "node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe");
const SILENT = path.join(TMP, "invisible-cost-video-only.mp4");
const WITH_SFX = path.join(OUT, "看不见的代价.mp4");
const CLEAN = path.join(OUT, "看不见的代价_clean.mp4");
const SFX = path.join(OUT, "看不见的代价_sfx.wav");

const probe = (f) =>
  execFileSync(
    FFPROBE,
    ["-hide_banner", "-v", "error", "-show_format", "-show_streams", "-of", "json", f],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );

const step = process.argv[2] ?? "all";
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "public") });
const composition = await selectComposition({ serveUrl, id: "InvisibleCost" });
console.log("composition:", composition.width + "x" + composition.height, composition.fps + "fps", composition.durationInFrames, "frames");

if (step === "all" || step === "render") {
  const t0 = Date.now();
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: SILENT,
    imageFormat: "png",
    crf: 20,
    x264Preset: "medium",
    pixelFormat: "yuv420p",
    concurrency: 12,
    onProgress: ({ renderedFrames, encodedFrames }) => {
      if (renderedFrames % 120 === 0) {
        const el = (Date.now() - t0) / 1000;
        process.stdout.write(`\r  ${renderedFrames}/${composition.durationInFrames} frames, ${el.toFixed(0)}s elapsed`);
      }
    },
  });
  process.stdout.write(`\n  render done in ${((Date.now() - t0) / 1000).toFixed(0)}s → ${(fs.statSync(SILENT).size / 1e6).toFixed(1)} MB\n`);
}

if (step === "all" || step === "mux") {
  if (!fs.existsSync(SFX)) throw new Error("missing " + SFX);
  execFileSync(FFMPEG, [
    "-y", "-hide_banner", "-v", "error",
    "-i", SILENT, "-i", SFX,
    "-map", "0:v:0", "-map", "1:a:0",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
    "-movflags", "+faststart", "-shortest",
    WITH_SFX,
  ], { stdio: "inherit" });
  execFileSync(FFMPEG, [
    "-y", "-hide_banner", "-v", "error",
    "-i", SILENT, "-map", "0:v:0", "-c", "copy", "-an",
    "-movflags", "+faststart", CLEAN,
  ], { stdio: "inherit" });
  console.log("  muxed:", (fs.statSync(WITH_SFX).size / 1e6).toFixed(1), "MB", "| clean:", (fs.statSync(CLEAN).size / 1e6).toFixed(1), "MB");
}

if (step === "all" || step === "poster") {
  const posterFrame = Number(process.env.POSTER_FRAME ?? 432);
  await renderStill({ composition, serveUrl, output: path.join(OUT, "poster.png"), frame: posterFrame, imageFormat: "png" });
  const st = await sharp(path.join(OUT, "poster.png")).metadata();
  console.log("  poster:", posterFrame, st.width + "x" + st.height, (fs.statSync(path.join(OUT, "poster.png")).size / 1e6).toFixed(2), "MB");
}

if (step === "all" || step === "qa") {
  const QA = path.join(ROOT, ".analysis/qa-frames");
  fs.mkdirSync(QA, { recursive: true });
  const every10 = [];
  for (let s = 0; s < 140; s += 10) every10.push(Math.min(4199, Math.round(s * 30)));
  const files = [];
  for (const f of every10) {
    const p = path.join(QA, `t${String(f).padStart(4, "0")}.png`);
    await renderStill({ composition, serveUrl, output: p, frame: f, imageFormat: "png" });
    files.push(p);
  }
  const TW = 480, TH = 270;
  const cols = 5;
  const grid = await Promise.all(files.map(async (p) => ({ input: await sharp(p).resize(TW, TH).toBuffer() })));
  const rows = Math.ceil(grid.length / cols);
  await sharp({ create: { width: TW * cols, height: TH * rows, channels: 3, background: "#000000" } })
    .composite(grid.map((g, i) => ({ ...g, left: (i % cols) * TW, top: Math.floor(i / cols) * TH })))
    .png()
    .toFile(path.join(ROOT, ".analysis/qa-contact-10s.png"));
  console.log("  qa frames:", files.length, "contact sheet: .analysis/qa-contact-10s.png");
}

// 最终探测
if (fs.existsSync(WITH_SFX)) {
  const info = JSON.parse(probe(WITH_SFX));
  const v = info.streams.find((s) => s.codec_type === "video");
  const a = info.streams.find((s) => s.codec_type === "audio");
  console.log("\nFINAL", path.basename(WITH_SFX));
  console.log("  ", v.codec_name, v.profile, v.width + "x" + v.height, v.pix_fmt, v.r_frame_rate, "frames", v.nb_frames, "dur", Number(info.format.duration).toFixed(3) + "s");
  console.log("  ", a ? `audio ${a.codec_name} ${a.sample_rate}Hz ${a.channels}ch ${Math.round(a.bit_rate / 1000)}kbps` : "NO AUDIO (unexpected)");
  console.log("  ", "size", (Number(info.format.size) / 1e6).toFixed(2), "MB", "bitrate", (Number(info.format.bit_rate) / 1e6).toFixed(2), "Mbps");
}
