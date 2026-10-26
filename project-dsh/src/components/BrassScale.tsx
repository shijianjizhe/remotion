import React, { useId } from "react";
import { C } from "../config/film";

export const BEAM_HALF = 320;
export const PAN_DROP = 150;

/** 秤盘中心（屏幕坐标），供调用方放置金币等内容 */
export const panPositions = (cx: number, cy: number, s: number, angleDeg: number) => {
  const th = (angleDeg * Math.PI) / 180;
  const lx = -BEAM_HALF * Math.cos(th);
  const ly = -BEAM_HALF * Math.sin(th);
  return {
    left: { x: cx + lx * s, y: cy + (ly + PAN_DROP) * s },
    right: { x: cx - lx * s, y: cy + (-ly + PAN_DROP) * s },
    leftBeam: { x: cx + lx * s, y: cy + ly * s },
    rightBeam: { x: cx - lx * s, y: cy - ly * s },
  };
};

/**
 * 古典精密天平：黄铜柱、细链、浅盘、指针与刻度。
 * 只有部件组装进度与倾角是动画参数，其余为静态几何。
 */
export const BrassScale: React.FC<{
  cx: number;
  cy: number;
  s?: number;
  /** 倾角（度），正值 = 右盘下沉 */
  angle: number;
  /** 0..1 组装进度 */
  progress?: number;
  opacity?: number;
  /** 指针刻度高亮 0..1 */
  tickGlow?: number;
  /** 每侧链子轻微摆动 */
  sway?: number;
}> = ({ cx, cy, s = 1, angle, progress = 1, opacity = 1, tickGlow = 0, sway = 0 }) => {
  const uid = useId().replace(/:/g, "");
  const th = (angle * Math.PI) / 180;
  const p = Math.max(0, Math.min(1, progress));
  const { left, right } = panPositions(cx, cy, s, angle);
  const colBottom = cy + 250 * s;

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity }}>
      <defs>
        <linearGradient id={`b${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6B5031" />
          <stop offset="22%" stopColor="#D3AB6D" />
          <stop offset="46%" stopColor="#F0DCAE" />
          <stop offset="72%" stopColor="#B08A51" />
          <stop offset="100%" stopColor="#5C4629" />
        </linearGradient>
        <linearGradient id={`d${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8CA88" />
          <stop offset="45%" stopColor="#A9824B" />
          <stop offset="100%" stopColor="#5A4429" />
        </linearGradient>
        <radialGradient id={`p${uid}`} cx="0.4" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#8A6E48" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#3A2E1E" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#1E1811" stopOpacity="0.9" />
        </radialGradient>
      </defs>

      {/* 底座与立柱 */}
      <g opacity={Math.min(1, p * 2.4)}>
        <ellipse cx={cx} cy={colBottom + 12 * s} rx={132 * s} ry={26 * s} fill={`url(#p${uid})`} />
        <ellipse cx={cx} cy={colBottom + 6 * s} rx={104 * s} ry={18 * s} fill={`url(#b${uid})`} opacity={0.95} />
        <path
          d={`M ${cx - 16 * s} ${cy + 8 * s} L ${cx + 16 * s} ${cy + 8 * s} L ${cx + 11 * s} ${colBottom} L ${cx - 11 * s} ${colBottom} Z`}
          fill={`url(#b${uid})`}
        />
        <path
          d={`M ${cx - 13 * s} ${cy + 10 * s} L ${cx - 10 * s} ${colBottom - 6 * s}`}
          stroke="#FFF3D6"
          strokeWidth={1.6 * s}
          opacity={0.4}
        />
        {/* 柱身环饰 */}
        {[0.28, 0.62].map((f, i) => (
          <rect
            key={i}
            x={cx - 17 * s}
            y={cy + 8 * s + (colBottom - cy) * f}
            width={34 * s}
            height={7 * s}
            fill={`url(#d${uid})`}
            opacity={0.9}
          />
        ))}
      </g>

      {/* 指针刻度 */}
      <g opacity={Math.min(1, p * 2)}>
        <path
          d={`M ${cx - 74 * s} ${cy + 96 * s} A ${84 * s} ${84 * s} 0 0 1 ${cx + 74 * s} ${cy + 96 * s}`}
          fill="none"
          stroke={C.copper}
          strokeWidth={1 * s}
          opacity={0.5}
        />
        {new Array(9).fill(0).map((_, i) => {
          const a = (-34 + i * 8.5) * (Math.PI / 180);
          const r1 = 78 * s;
          const r2 = (i === 4 ? 96 : 88) * s;
          return (
            <line
              key={i}
              x1={cx + Math.sin(a) * r1}
              y1={cy + Math.cos(a) * r1 + 0}
              x2={cx + Math.sin(a) * r2}
              y2={cy + Math.cos(a) * r2 + 0}
              stroke={i === 4 ? C.goldHi : C.copper}
              strokeWidth={i === 4 ? 1.6 * s : 0.9 * s}
              opacity={(i === 4 ? 0.85 : 0.45) + tickGlow * 0.15}
            />
          );
        })}
      </g>

      {/* 横梁 */}
      <g transform={`translate(${cx} ${cy}) rotate(${angle})`} opacity={Math.min(1, Math.max(0, (p - 0.25) / 0.4))}>
        <rect x={-BEAM_HALF * s} y={-5 * s} width={BEAM_HALF * 2 * s} height={10 * s} rx={5 * s} fill={`url(#b${uid})`} />
        <rect x={-BEAM_HALF * s} y={-5 * s} width={BEAM_HALF * 2 * s} height={3 * s} rx={1.5 * s} fill="#FFF3D6" opacity={0.35} />
        {[-BEAM_HALF, BEAM_HALF].map((x) => (
          <g key={x}>
            <circle cx={x * s} cy={0} r={7 * s} fill={`url(#d${uid})`} />
            <circle cx={x * s} cy={0} r={3 * s} fill="#2A2117" opacity={0.7} />
          </g>
        ))}
        <circle cx={0} cy={0} r={13 * s} fill={`url(#d${uid})`} />
        <circle cx={0} cy={0} r={5.5 * s} fill="#2A2117" />
        {/* 指针 */}
        <path d={`M 0 ${8 * s} L ${3.4 * s} ${92 * s} L 0 ${100 * s} L ${-3.4 * s} ${92 * s} Z`} fill={`url(#d${uid})`} opacity={0.96} />
      </g>

      {/* 链与盘 */}
      <g opacity={Math.min(1, Math.max(0, (p - 0.5) / 0.4))}>
        {[
          { pan: left, side: -1 },
          { pan: right, side: 1 },
        ].map(({ pan, side }) => {
          const beamX = cx + side * BEAM_HALF * Math.cos(th) * s;
          const beamY = cy + side * BEAM_HALF * Math.sin(th) * s;
          const wig = Math.sin(sway) * 2 * s;
          return (
            <g key={side}>
              <line x1={beamX} y1={beamY} x2={pan.x - 58 * s + wig} y2={pan.y - 6 * s} stroke={C.gold} strokeWidth={1.1 * s} opacity={0.75} />
              <line x1={beamX} y1={beamY} x2={pan.x + 58 * s + wig} y2={pan.y - 6 * s} stroke={C.gold} strokeWidth={1.1 * s} opacity={0.75} />
              <line x1={beamX} y1={beamY} x2={pan.x + wig} y2={pan.y - 10 * s} stroke={C.goldHi} strokeWidth={1 * s} opacity={0.5} />
              <ellipse cx={pan.x + wig} cy={pan.y} rx={92 * s} ry={22 * s} fill={`url(#p${uid})`} />
              <ellipse cx={pan.x + wig} cy={pan.y - 3 * s} rx={92 * s} ry={20 * s} fill="none" stroke={`url(#d${uid})`} strokeWidth={2.4 * s} />
              <ellipse cx={pan.x + wig - 30 * s} cy={pan.y - 6 * s} rx={28 * s} ry={7 * s} fill="#FFF3D6" opacity={0.12} />
            </g>
          );
        })}
      </g>
    </svg>
  );
};
