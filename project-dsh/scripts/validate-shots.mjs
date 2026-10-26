// 校验分镜表与音效表：无重叠、无空隙、首帧 0、末帧 4200、字幕窗口有效、音效事件合法。
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "src/config/shots.json"), "utf8"));
const { shots, chapters } = data;
const errors = [];
const warn = [];

if (shots.length !== 28) errors.push(`expect 28 shots, found ${shots.length}`);
let prevEnd = 0;
for (const s of shots) {
  if (s.start !== prevEnd) errors.push(`${s.id}: expected start ${prevEnd}, got ${s.start} (gap/overlap)`);
  if (s.end <= s.start) errors.push(`${s.id}: empty range`);
  prevEnd = s.end;
  const len = s.end - s.start;
  if (s.caption) {
    if (s.capIn === null || s.capOut === null) errors.push(`${s.id}: caption without capIn/capOut`);
    else {
      if (s.capIn < 0 || s.capOut > len) errors.push(`${s.id}: caption window ${s.capIn}..${s.capOut} outside length ${len}`);
      if (s.capOut - s.capIn < 60) warn.push(`${s.id}: caption visible only ${s.capOut - s.capIn} frames`);
      const chars = [...s.caption].length;
      if (chars > 20) warn.push(`${s.id}: caption ${chars} chars > 20`);
      for (const h of s.hi) if (!s.caption.includes(h)) errors.push(`${s.id}: highlight "${h}" not in caption`);
    }
  } else if (s.capIn !== null) errors.push(`${s.id}: capIn without caption`);
}
if (shots[0].start !== 0) errors.push("first shot must start at 0");
if (prevEnd !== 4200) errors.push(`last shot ends at ${prevEnd}, expected 4200`);

let chapEnd = null;
for (const c of chapters) {
  if (c.end <= c.start) errors.push(`chapter ${c.id}: empty`);
  if (c.end > 4200) errors.push(`chapter ${c.id}: beyond timeline`);
  if (chapEnd !== null && c.start !== chapEnd) errors.push(`chapter ${c.id}: not contiguous (prev end ${chapEnd}, start ${c.start})`);
  chapEnd = c.end;
}

const sfx = JSON.parse(fs.readFileSync(path.join(ROOT, "src/config/sfx.json"), "utf8"));
if (sfx.totalFrames !== 4200) errors.push(`sfx totalFrames ${sfx.totalFrames} != 4200`);
for (const e of sfx.events) {
  if (e.startFrame < 0 || e.startFrame + e.durationFrames > sfx.totalFrames) errors.push(`sfx ${e.id} outside timeline`);
  if (e.volume <= 0 || e.volume > 1) errors.push(`sfx ${e.id}: bad volume`);
  if (!fs.existsSync(path.join(ROOT, "public/sfx", e.file))) errors.push(`sfx ${e.id}: missing public/sfx/${e.file}`);
}

console.log(`shots ${shots.length} | chapters ${chapters.length} | sfx events ${sfx.events.length} | total ${prevEnd} frames (${(prevEnd / 30).toFixed(2)}s)`);
for (const s of shots) console.log(`  ${s.id} ${String(s.start).padStart(4)}-${String(s.end).padStart(4)} ${s.scene.padEnd(15)} ${s.caption ?? "（无）"}`);
if (warn.length) { console.log("WARNINGS:"); warn.forEach((w) => console.log("  ! " + w)); }
if (errors.length) { console.error("ERRORS:"); errors.forEach((e) => console.error("  x " + e)); process.exit(1); }
console.log("OK — 分镜表与音效表合法");
