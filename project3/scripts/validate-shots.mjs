// 校验：镜头无重叠/无空隙、首帧 0、末帧 4200、字幕位于镜头窗口内、每行 ≤ 20 汉字、SFX 文件存在且在时长内。
import fs from "node:fs";
const film = await import("../src/config/film.ts");
const {shots, TOTAL_FRAMES, FPS} = film;
const errors = [];
if (TOTAL_FRAMES !== 4200 || FPS !== 30) errors.push(`TOTAL_FRAMES=${TOTAL_FRAMES} FPS=${FPS}`);
if (shots[0].start !== 0) errors.push("first shot must start at 0");
if (shots.at(-1).end !== TOTAL_FRAMES) errors.push("last shot must end at 4200");
if (shots.length !== 28) errors.push(`expected 28 shots, got ${shots.length}`);
shots.forEach((s, i) => {
  if (s.id !== `S${String(i + 1).padStart(2, "0")}`) errors.push(`id order ${s.id}`);
  if (s.end <= s.start) errors.push(`${s.id} empty`);
  if (i > 0 && shots[i - 1].end !== s.start) errors.push(`gap/overlap before ${s.id}`);
  if (s.caption) {
    const inAt = s.inAt ?? s.start + 10;
    const outAt = s.outAt ?? s.end - 6;
    if (inAt < s.start || outAt > s.end || outAt <= inAt) errors.push(`${s.id} caption window ${inAt}-${outAt} outside ${s.start}-${s.end}`);
    const secs = (outAt - inAt) / FPS;
    if (secs < 2.5) errors.push(`${s.id} caption too short (${secs.toFixed(1)}s)`);
    for (const line of s.caption.split("\n")) {
      const n = (line.replace(/[{}]/g, "").match(/[一-鿿]/g) || []).length;
      if (n > 20) errors.push(`${s.id} line has ${n} CJK chars`);
    }
  }
});
const sfx = JSON.parse(fs.readFileSync("src/config/sfx-events.json", "utf8"));
for (const e of sfx) {
  if (!fs.existsSync(`public/sfx/${e.file}`)) errors.push(`missing sfx ${e.file}`);
  if (e.startFrame < 0 || e.startFrame + e.durationFrames > TOTAL_FRAMES) errors.push(`sfx out of range ${e.file}@${e.startFrame}`);
}
console.log(`shots: ${shots.length}, captions: ${shots.filter((s) => s.caption).length}, sfx events: ${sfx.length}`);
for (const s of shots) {
  const c = s.caption ? s.caption.replace(/[{}]/g, "").replace("\n", " / ") : "（无）";
  console.log(`${s.id} ${String(s.start).padStart(4)}-${String(s.end).padEnd(4)} ${c}`);
}
if (errors.length) {
  console.error("VALIDATION FAILED:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("VALIDATION OK");
