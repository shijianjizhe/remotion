// 一键渲染：node scripts/render-all.mjs [proof|full|poster|all]
// 流程：生成 SFX 事件 → 校验 → 离线混音（WAV）→ Remotion 渲染无声画面 → ffmpeg 封装 AAC 音轨
import {execFileSync} from "node:child_process";
import fs from "node:fs";

const PY = process.env.PYTHON || "python";
const mode = process.argv[2] || "all";
const run = (cmd, args) => {
  console.log(`\n$ ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, {stdio: "inherit", shell: process.platform === "win32"});
};
const q = (s) => (process.platform === "win32" ? `"${s}"` : s);
const npx = (args) => run("npx", args);
const remotion = (args) => npx(["remotion", ...args]);
const VIDEO_FLAGS = ["--codec=h264", "--crf=16", "--pixel-format=yuv420p", "--color-space=bt709", "--x264-preset=slow", "--concurrency=14", "--muted"];

fs.mkdirSync("output", {recursive: true});
fs.mkdirSync("preview", {recursive: true});

run("node", ["scripts/make_sfx_events.mjs"]);
run("node", ["--experimental-strip-types", "--no-warnings", "scripts/validate-shots.mjs"]);

const mux = (video, wav, out) =>
  remotion(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", q(video), "-i", q(wav), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-movflags", "+faststart", q(out)]);

if (mode === "proof" || mode === "all") {
  run(PY, ["scripts/mix_sfx.py", "preview/style-proof_sfx.wav", "120", "360"]);
  remotion(["render", "StyleProof", "preview/style-proof_clean.mp4", ...VIDEO_FLAGS]);
  mux("preview/style-proof_clean.mp4", "preview/style-proof_sfx.wav", "preview/style-proof.mp4");
}
if (mode === "full" || mode === "all") {
  run(PY, ["scripts/mix_sfx.py", q("output/看不见的代价_sfx.wav")]);
  remotion(["render", "InvisibleCost", q("output/看不见的代价_clean.mp4"), ...VIDEO_FLAGS]);
  mux("output/看不见的代价_clean.mp4", "output/看不见的代价_sfx.wav", "output/看不见的代价.mp4");
}
if (mode === "poster" || mode === "all") {
  remotion(["still", "Poster", "output/poster.png", "--image-format=png"]);
}
console.log("\nDone.");
