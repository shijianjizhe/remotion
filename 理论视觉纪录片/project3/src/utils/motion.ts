import {Easing} from "remotion";

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const easeInOut = Easing.bezier(0.45, 0, 0.2, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.5, 0, 0.9, 0.4);
export const linear = (x: number) => x;

/** f 在 [a,b] 的归一化进度并施加缓动 */
export const prog = (f: number, a: number, b: number, e: (x: number) => number = easeInOut) =>
  e(clamp01((f - a) / (b - a)));

/** 淡入淡出窗口：[a, a+fin] 淡入，[b-fout, b] 淡出 */
export const win = (f: number, a: number, b: number, fin = 15, fout = 15) =>
  Math.min(prog(f, a, a + fin), 1 - prog(f, b - fout, b));

/** 阻尼振荡（物理合理的回弹） */
export const damped = (t: number, amp: number, freq: number, decay: number) =>
  t < 0 ? 0 : amp * Math.exp(-t / decay) * Math.sin(t * freq);

/** 弹簧趋近：从 from 到 to，带少量过冲 */
export const springTo = (t: number, from: number, to: number, dur: number, bounce = 0.12) => {
  if (t <= 0) return from;
  const x = Math.min(t / dur, 1.6);
  const base = 1 - Math.exp(-5 * x) * Math.cos(x * Math.PI * (1 + bounce * 4));
  return from + (to - from) * (x >= 1.6 ? 1 : base);
};

/** 分段时间扭曲：用于“碎裂瞬间→慢动作”。segments: [frame, rate] 从该帧起的速率 */
export const timeWarp = (f: number, start: number, segments: [number, number][]) => {
  let tau = 0;
  for (let i = 0; i < segments.length; i++) {
    const [s, rate] = segments[i];
    const e = i + 1 < segments.length ? segments[i + 1][0] : Infinity;
    if (f <= s) break;
    tau += (Math.min(f, e) - s) * rate;
  }
  return f < start ? 0 : tau;
};
