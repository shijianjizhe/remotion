import { hash01 } from "./rng";

export type Pt = [number, number];

export type Shard = {
  id: number;
  ring: number;
  ray: number;
  poly: Pt[];
  cx: number;
  cy: number;
  /** 距撞击点的距离（0..1，按最大半径归一） */
  dist: number;
  /** 飞散方向（弧度） */
  dir: number;
  /** 飞散速度 px/s */
  speed: number;
  /** 自转速度 deg/s（带符号） */
  spin: number;
  /** 撞击瞬间的初始延迟（秒） */
  delay: number;
  glint: boolean;
};

export type ShatterModel = {
  shards: Shard[];
  /** 每条径向裂纹（从撞击点向外） */
  radialCracks: Pt[][];
  /** 同心裂纹环 */
  ringCracks: Pt[][];
  impact: Pt;
};

/**
 * 径向 + 同心网格的玻璃碎裂（固定种子，确定性）。
 * 相邻单元共享顶点，因此裂纹连续、不会穿帮。
 */
export const buildShatter = (opts: {
  ix: number;
  iy: number;
  seed?: number;
  rays?: number;
  rings?: number;
  maxR?: number;
  minR?: number;
}): ShatterModel => {
  const { ix, iy, seed = 5, rays = 15, rings = 6, maxR = 620, minR = 26 } = opts;
  const pt = (i: number, j: number): Pt => {
    const ang = (i / rays) * Math.PI * 2 + (hash01(i, seed) - 0.5) * 0.16;
    const rBase = minR + (maxR - minR) * Math.pow(j / rings, 1.55);
    const r = rBase * (1 + (hash01(i * 31 + j * 7, seed + 3) - 0.5) * 0.34);
    const bow = 1 + (hash01(i, seed + 11) - 0.5) * 0.05 * j;
    return [ix + Math.cos(ang) * r * bow, iy + Math.sin(ang) * r * bow];
  };

  const shards: Shard[] = [];
  let id = 0;
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < rays; i++) {
      const i2 = (i + 1) % rays;
      const poly: Pt[] = [pt(i, j), pt(i2, j), pt(i2, j + 1), pt(i, j + 1)];
      let cx = 0;
      let cy = 0;
      for (const p of poly) {
        cx += p[0];
        cy += p[1];
      }
      cx /= 4;
      cy /= 4;
      const dx = cx - ix;
      const dy = cy - iy;
      const d = Math.hypot(dx, dy);
      const dist = Math.min(1, d / maxR);
      shards.push({
        id: id++,
        ring: j,
        ray: i,
        poly,
        cx,
        cy,
        dist,
        dir: Math.atan2(dy, dx),
        speed: 150 + 520 * Math.pow(dist, 1.35) + hash01(id, seed + 9) * 130,
        spin: (hash01(id, seed + 21) - 0.5) * 460,
        delay: 0.06 + dist * 0.1 + hash01(id, seed + 33) * 0.05,
        glint: hash01(id, seed + 44) > 0.62,
      });
    }
  }

  const radialCracks: Pt[][] = [];
  for (let i = 0; i < rays; i++) {
    const line: Pt[] = [[ix, iy]];
    for (let j = 1; j <= rings; j++) line.push(pt(i, j));
    radialCracks.push(line);
  }

  const ringCracks: Pt[][] = [];
  for (let j = 1; j <= rings; j++) {
    const loop: Pt[] = [];
    for (let i = 0; i < rays; i++) loop.push(pt(i, j));
    loop.push(pt(0, j));
    ringCracks.push(loop);
  }

  return { shards, radialCracks, ringCracks, impact: [ix, iy] };
};

export const polyPath = (poly: Pt[]): string =>
  poly.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ") + " Z";

export const linePath = (pts: Pt[]): string =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");

/** 从撞击点向外按弧长逐段画出的裂纹（用 pathLength=1 归一化）。 */
export const crackPath = (pts: Pt[]): string => {
  if (pts.length < 2) return "";
  const out: string[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const mx = (a[0] + b[0]) / 2 + (hash01(i + pts.length * 13, 7) - 0.5) * 12;
    const my = (a[1] + b[1]) / 2 + (hash01(i + pts.length * 17, 13) - 0.5) * 12;
    out.push(`${i === 0 ? `M ${a[0]} ${a[1]}` : ""} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`);
  }
  return out.join(" ");
};

/** 多边形 → 等角圆点（同一顶点数），用于“碎片圆成金币”的形变 */
export const polygonToCircle = (poly: Pt[], cx: number, cy: number, t: number, radius: number): Pt[] => {
  return poly.map((p, i) => {
    const ang = (i / poly.length) * Math.PI * 2;
    const target: Pt = [cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius];
    return [p[0] + (target[0] - p[0]) * t, p[1] + (target[1] - p[1]) * t];
  });
};
