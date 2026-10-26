/** 确定性随机：同一 seed 必然得到同一序列（禁止无种子 Math.random）。 */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** 纯函数哈希：i 与 seed 决定唯一值，适合“每颗粒子”的参数。 */
export const hash01 = (i: number, seed = 1): number => {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(seed, 0xc2b2ae35);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2545f491);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
};

export const hashSigned = (i: number, seed = 1) => hash01(i, seed) * 2 - 1;

/** 稳定的 [-1,1] 噪声序列。 */
export const wobble = (i: number, seed = 1) => Math.sin(i * 1.7 + seed * 3.1) * 0.5 + hashSigned(i, seed) * 0.5;
