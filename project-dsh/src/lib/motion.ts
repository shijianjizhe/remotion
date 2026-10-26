export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mapRange = (v: number, a: number, b: number, c: number, d: number) => c + ((clamp((v - a) / (b - a)) * (d - c)) || 0);
export const lerpArr = (a: readonly number[], b: readonly number[], t: number) => a.map((v, i) => lerp(v, b[i], t));

/** 局部进度：frame 在 [a,b] 内的线性 0..1（自动 clamp） */
export const seg = (frame: number, a: number, b: number) => clamp((frame - a) / Math.max(1e-6, b - a));

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t: number) => t * t * t;
export const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
export const smoothstep = (t: number) => t * t * (3 - 2 * t);
export const linear = (t: number) => t;

/** 带缓动的段进度 */
export const ramp = (
  frame: number,
  a: number,
  b: number,
  fn: (t: number) => number = easeInOut,
) => fn(seg(frame, a, b));

/** 进出包络：在 [a,b] 内淡入、[c,d] 内淡出，其余为 1 */
export const envelope = (
  frame: number,
  a: number,
  b: number,
  c: number,
  d: number,
  fin: (t: number) => number = easeInOut,
  fout: (t: number) => number = easeInOut,
) => Math.min(ramp(frame, a, b, fin), 1 - ramp(frame, c, d, fout));

/** 阻尼回弹：t 从 0 开始，回到 1 并有轻微过冲。用于物理合理的撞击回弹。 */
export const springy = (t: number, overshoot = 0.18, decay = 5.2) => {
  const c = clamp(t);
  if (c >= 1) return 1;
  return 1 - Math.exp(-decay * c) * Math.cos((Math.PI * 1.35 + overshoot * 4) * c);
};

/** 慢动作积分表：speed(t) 从 1 衰减到 0.06，返回 ∫speed dt（用于碎片减速悬停）。 */
const SLOW_TABLE = (() => {
  const N = 240;
  const dt = 0.02;
  const tbl = new Float64Array(N + 1);
  let acc = 0;
  for (let i = 0; i <= N; i++) {
    const t = i * dt;
    const s = t <= 1.2 ? 1 : Math.max(0.06, 1 - 0.94 * smoothstep(clamp((t - 1.2) / 0.85)));
    tbl[i] = acc;
    acc += s * dt;
  }
  return tbl;
})();

/** 以“可感知时间”返回某时刻已积分的位移倍数。 */
export const slowIntegral = (t: number) => {
  const dt = 0.02;
  const x = clamp(t / dt, 0, SLOW_TABLE.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = SLOW_TABLE[i];
  const b = SLOW_TABLE[Math.min(SLOW_TABLE.length - 1, i + 1)];
  return lerp(a, b, f);
};
