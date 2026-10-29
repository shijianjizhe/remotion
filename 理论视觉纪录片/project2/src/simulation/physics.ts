import { FPS } from "../config/theme";

/* ---------------------------------------------------------------- 狭义相对论：往返路径 */
// 单位：c = 1；B 以 v = 0.6c 匀速离开再返回，坐标时 T = 10。
export const SR_V = 0.6;
export const SR_T = 10;
export const SR_GAMMA = 1 / Math.sqrt(1 - SR_V * SR_V); // 1.25

/** 坐标时 t 下 B 的位置 */
export const srBx = (t: number) => (t <= SR_T / 2 ? SR_V * t : SR_V * (SR_T - t));

/** 固有时：A 静止 τ=t；B 全程速率 0.6 → τ = t / γ */
export const srTauA = (t: number) => t;
export const srTauB = (t: number) => t / SR_GAMMA;

/* ---------------------------------------------------------------- 广义相对论：引力红移 */
// 海拔差 h 的两只钟：Δf/f ≈ g h / c²
const G = 9.80665;
const CL = 299792458;
export const grRate = (h: number) => (G * h) / (CL * CL); // 1 km → 1.09e-13
export const grNsPerDay = (h: number) => grRate(h) * 86400 * 1e9; // 1 km → ≈ 9.4 ns/天

/** 等引力势线半径：Φ ∝ −1/r，等 ΔΦ 间隔 */
export const equipotentialRadii = (R: number, n: number, rMax: number) => {
  const d = (1 / R - 1 / rMax) / (n - 1);
  return new Array(n).fill(0).map((_, k) => 1 / (1 / R - k * d));
};

/* ---------------------------------------------------------------- 哈菲尔—基廷（实测值） */
// Hafele & Keating, Science 177 (1972)：相对美国海军天文台参考钟
export const HK = {
  east: { observed: -59, err: 10, predicted: -40 },
  west: { observed: 273, err: 7, predicted: 275 },
};

/* ---------------------------------------------------------------- GPS（典型近似值） */
// Ashby 2003：速度效应约 −7.2 μs/天，引力效应约 +45.7 μs/天，净约 +38.5 μs/天
export const GPS = { velocity: -7, gravity: 45, net: 38 };
export const gpsOffsetUs = (hours: number) => (GPS.net * hours) / 24;
/** 时钟偏差 × 光速 → 伪距误差（km） */
export const gpsRangeErrKm = (us: number) => us * 1e-6 * CL * 1e-3;

/* ---------------------------------------------------------------- 自由落体（Stetson 等 2007） */
export const FALL_HEIGHT = 31; // m
export const FALL_TIME = Math.sqrt((2 * FALL_HEIGHT) / G); // ≈ 2.51 s
export const fallY = (t: number) => Math.min(FALL_HEIGHT, 0.5 * G * t * t);
export const RECALL_STRETCH = 1.36;

export const sec = (s: number) => Math.round(s * FPS);
