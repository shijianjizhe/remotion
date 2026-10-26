import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../config/film";
import { hash01 } from "../lib/rng";
import { fbm } from "../lib/noise";

/** 低密度浮尘：同时可见 20–60 颗，位置由固定种子决定。 */
export const Dust: React.FC<{
  frame: number;
  count?: number;
  seed?: number;
  opacity?: number;
  /** 上升速度（px/秒） */
  rise?: number;
  tint?: string;
}> = ({ frame, count = 34, seed = 3, opacity = 1, rise = 7, tint = C.goldHi }) => {
  const particles = new Array(count).fill(0).map((_, i) => {
    const h1 = hash01(i, seed);
    const h2 = hash01(i, seed + 31);
    const h3 = hash01(i, seed + 77);
    const h4 = hash01(i, seed + 131);
    const baseX = h1 * 1920;
    const baseY = h2 * 1080;
    const t = frame / 30;
    const dx = fbm(i * 0.7 + t * 0.16, h3 * 9, seed, 3) * 42;
    const dy = fbm(h4 * 9, i * 0.6 + t * 0.13, seed + 5, 3) * 30 - t * rise;
    const x = baseX + dx;
    const y = ((baseY + dy) % 1120 + 1120) % 1120 - 20;
    const fade = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.35 + h3 * 6.28));
    const r = 0.9 + h4 * 2.1;
    const a = (0.1 + h3 * 0.34) * fade * opacity;
    return { x, y, r, a, key: i };
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {particles.map((p) => (
          <circle key={p.key} cx={p.x} cy={p.y} r={p.r} fill={tint} opacity={p.a} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
