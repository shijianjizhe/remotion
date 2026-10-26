// 生成 src/config/sfx-events.json —— 全片 SFX 事件表（帧为单位）。
// 字段：file, startFrame, durationFrames, volume, fadeInFrames, fadeOutFrames, pan(-1..1)
import fs from "node:fs";
import {execFileSync} from "node:child_process";

const SR = 48000;
const wavDur = (file) => {
  const b = fs.readFileSync(`public/sfx/${file}`);
  // 标准 44 字节 PCM 头：data 大小位于 40
  const dataSize = b.readUInt32LE(40);
  return dataSize / (SR * 4);
};
const E = [];
const ev = (file, startFrame, volume, o = {}) => {
  if (!fs.existsSync(`public/sfx/${file}`)) throw new Error(`Missing SFX file: ${file}`);
  const full = Math.floor(wavDur(file) * 30);
  E.push({
    file,
    startFrame,
    durationFrames: Math.min(o.dur ?? full, full),
    volume,
    fadeInFrames: o.fin ?? 0,
    fadeOutFrames: o.fout ?? 6,
    pan: o.pan ?? 0,
    note: o.note ?? "",
  });
};

// ---------------- 序 · 一块破碎的玻璃 (0–450)
ev("room_air.wav", 0, 0.55, {fin: 40, fout: 50, note: "S01 房间空气 + 远处机械低鸣"});
ev("wind_soft.wav", 6, 0.22, {fin: 40, fout: 40, note: "S01 轻风"});
ev("glass_impact.wav", 132, 1.0, {note: "S02 玻璃碎裂"});
ev("low_thump.wav", 132, 0.4, {note: "S02 极轻低频尾响"});
ev("glass_tail.wav", 150, 0.45, {fout: 30, note: "S02 碎片细尾音"});
ev("glass_tail.wav", 252, 0.3, {fout: 30, pan: 0.2, note: "S03 碎片化尘"});
[0, 1, 2, 3, 4, 5].forEach((k) => ev(k % 2 ? "coin_tap_b.wav" : "coin_tap.wav", 286 + k * 4, 0.42, {pan: [0, 0.4, 0.4, 0, -0.4, -0.4][k], note: `S03 金币成形 ${k + 1}/6`}));
ev("coin_chime.wav", 318, 0.45, {note: "S03 中心金币轻鸣"});
ev("title_swell.wav", 360, 0.6, {fout: 20, note: "S04 片名低频重音"});
ev("paper_rustle.wav", 392, 0.3, {note: "S04 纸张摩擦"});

// ---------------- 壹 · 1850 破窗 (450–1290)
ev("page_turn.wav", 458, 0.5, {note: "S05 羊皮纸旋开"});
ev("paper_rustle.wav", 474, 0.3);
ev("engrave.wav", 478, 0.35, {note: "S05 薄金属刻字（年份）"});
ev("pencil_draw.wav", 576, 0.3, {note: "S06 线描出现"});
ev("room_air.wav", 600, 0.25, {fin: 30, fout: 40});
[0, 1, 2, 3, 4, 5].forEach((k) => ev(k % 2 ? "coin_tap_b.wav" : "coin_tap.wav", 664 + k * 9, 0.4, {pan: -0.1 + k * 0.05, note: `S06 金币叩击 ${k + 1}/6`}));
ev("glass_restore.wav", 700, 0.35, {note: "S06 玻璃复原"});
ev("paper_rustle.wav", 724, 0.32, {note: "S07 移动划纸"});
ev("coin_tap_b.wav", 772, 0.22, {note: "S07 轻金属触碰"});
ev("ash_disperse.wav", 904, 0.5, {pan: 0.35, note: "S08 灰烬散逸"});
ev("fade_whoosh.wav", 910, 0.22, {pan: 0.35, note: "S08 尾音渐弱"});
ev("ledger_drop.wav", 1028, 0.5, {pan: -0.3, note: "S09 账页落下"});
ev("ledger_drop.wav", 1036, 0.45, {pan: 0.3});
[1062, 1076, 1092, 1106, 1124, 1138].forEach((s, i) => ev("ink_dot.wav", s, 0.35, {pan: i % 2 ? 0.3 : -0.3, note: "S09 点墨"}));
ev("book_close.wav", 1206, 0.55, {note: "S10 账簿合拢"});
ev("coin_chime.wav", 1222, 0.35, {note: "S10 金币显现"});

// ---------------- 贰 · 没走的那条路 (1290–2160)
ev("room_air.wav", 1290, 0.22, {fin: 30, fout: 60});
ev("coin_tap.wav", 1316, 0.45, {pan: -0.3, note: "S11 金币落在路口"});
ev("low_thump.wav", 1316, 0.18);
[1328, 1343, 1358].forEach((s, i) => ev("line_light.wav", s, 0.3, {pan: 0.2 + i * 0.1, note: "S11 细线依次点亮"}));
ev("coin_chime.wav", 1444, 0.3, {pan: -0.3, note: "S12 金币旋转"});
ev("clock_ticks.wav", 1470, 0.42, {pan: -0.3, note: "S12 钟摆滴答"});
ev("engrave.wav", 1490, 0.22, {pan: 0.3, note: "S12 纸面刻图"});
ev("line_light.wav", 1626, 0.3, {note: "S13 选择脉冲"});
ev("lock_on.wav", 1664, 0.45, {pan: 0.3, note: "S13 轨道锁定"});
ev("fade_whoosh.wav", 1672, 0.3, {pan: 0.3, note: "S13 远路消散"});
ev("focus_ping.wav", 1792, 0.38, {pan: 0.3, note: "S14 焦点切换"});
ev("line_light.wav", 1958, 0.22, {pan: 0.4, note: "S15 选中路线前行"});
ev("sand_flow.wav", 1996, 0.5, {note: "S15 砂粒流"});
ev("scale_clink.wav", 2108, 0.32, {note: "S15 天平轻响"});

// ---------------- 叁 · 未来的重量 (2160–2970)
ev("chain_gear.wav", 2166, 0.45, {note: "S16 天平链条、细齿轮"});
ev("scale_clink.wav", 2196, 0.3, {pan: -0.3});
ev("scale_clink.wav", 2206, 0.3, {pan: 0.3});
ev("breath_low.wav", 2330, 0.45, {note: "S17 轻呼吸低频"});
ev("coin_bright.wav", 2362, 0.32, {pan: -0.35, note: "S17 即时金币亮音"});
ev("dial_wheel.wav", 2496, 0.42, {note: "S18 时间拨轮"});
ev("chain_gear.wav", 2575, 0.22, {note: "S18 金属转轴"});
ev("focus_short.wav", 2702, 0.42, {pan: -0.35, note: "S19 短促聚焦"});
ev("echo_far.wav", 2716, 0.32, {pan: 0.35, note: "S19 远近回响"});
ev("scale_hum.wav", 2776, 0.25, {note: "S19 天平停摆"});
ev("ticket_fold.wav", 2880, 0.42, {note: "S20 票纸翻折"});
ev("paper_rustle.wav", 2928, 0.28, {note: "S20 纸纤维摩擦"});

// ---------------- 肆 · 无法退回的票 (2970–3750)
ev("theater_room.wav", 2985, 0.32, {fin: 40, fout: 60, note: "S21 旧剧院环境"});
ev("ticket_tear.wav", 3044, 0.4, {note: "S21 票券撕口"});
ev("door_creak.wav", 3122, 0.28, {pan: -0.2, note: "S22 剧院门轴"});
ev("theater_room.wav", 3135, 0.3, {fin: 30, fout: 50, note: "S22 压低的人群环境（无语义）"});
[3140, 3174, 3208, 3242, 3276].forEach((s, i) => ev("ticket_tear.wav", s + 6, 0.3, {pan: -0.2 + i * 0.1, note: `S22 第 ${i + 1} 场翻票`}));
ev("ledger_drop.wav", 3306, 0.45, {note: "S23 账页"});
ev("stamp.wav", 3372, 0.6, {pan: -0.3, note: "S23 账页盖章"});
ev("lock_drop.wav", 3402, 0.48, {pan: -0.3, note: "S23 铜锁落下"});
ev("door_creak.wav", 3486, 0.38, {note: "S24 低沉门轴"});
ev("wind_soft.wav", 3500, 0.32, {fin: 20, fout: 40, note: "S24 两路轻风"});
ev("scale_hum.wav", 3636, 0.3, {note: "S25 天平低鸣"});
ev("sand_fall.wav", 3650, 0.42, {note: "S25 沙落"});

// ---------------- 终 · 未打印的账单 (3750–4200)
ev("glass_tail.wav", 3756, 0.16, {fout: 20, note: "S26 前文音效淡淡重现"});
ev("clock_ticks.wav", 3785, 0.14, {dur: 40, fout: 15});
ev("coin_tap.wav", 3812, 0.15);
ev("page_turn.wav", 3840, 0.14);
ev("fade_whoosh.wav", 3862, 0.2, {note: "S26 逐渐远去"});
ev("sand_flow.wav", 3900, 0.3, {fout: 30, note: "S27 细粒回收"});
ev("coin_low.wav", 3962, 0.55, {note: "S27 单次金币低鸣"});
ev("line_light.wav", 3992, 0.16, {pan: 0.3, note: "S27 第二条路亮一下"});
ev("paper_close.wav", 4080, 0.32, {note: "S28 纸张收拢"});
ev("room_air.wav", 3980, 0.2, {fin: 40, fout: 60, dur: 215, note: "S28 声尾留白"});

// ---------------- 全片极低的房间底噪（避免绝对静默；交叉淡化循环）
for (let s = 180; s < 4100; s += 200) ev("room_air.wav", s, 0.16, {fin: 45, fout: 45, note: "环境底噪 bed"});

E.sort((a, b) => a.startFrame - b.startFrame);
for (const e of E) {
  if (e.startFrame + e.durationFrames > 4200) e.durationFrames = 4200 - e.startFrame;
}
fs.writeFileSync("src/config/sfx-events.json", JSON.stringify(E, null, 1));
console.log(`${E.length} events written`);
