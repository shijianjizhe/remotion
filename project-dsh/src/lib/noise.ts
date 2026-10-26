import { hash01 } from "./rng";

const smooth = (t: number) => t * t * (3 - 2 * t);

/** 2D 值噪声（-1..1），确定性 */
export const valueNoise = (x: number, y: number, seed = 1): number => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const h = (i: number, j: number) => hash01((i * 73856093) ^ (j * 19349663), seed) * 2 - 1;
  const a = h(xi, yi);
  const b = h(xi + 1, yi);
  const c = h(xi, yi + 1);
  const d = h(xi + 1, yi + 1);
  const u = smooth(xf);
  const v = smooth(yf);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
};

/** 分形叠加 */
export const fbm = (x: number, y: number, seed = 1, octaves = 4): number => {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * f, y * f, seed + i * 17) * amp;
    f *= 2.03;
    amp *= 0.5;
  }
  return sum;
};

/** 平滑漂移轨迹（浮尘/余烬共用） */
export const drift = (
  frame: number,
  seed: number,
  amp = 26,
  speed = 0.004,
): { dx: number; dy: number } => ({
  dx: fbm(frame * speed, seed * 7.1, seed, 3) * amp,
  dy: fbm(seed * 3.3, frame * speed * 0.72, seed + 11, 3) * amp * 0.7 + Math.sin(frame * 0.01 + seed) * 3,
});
