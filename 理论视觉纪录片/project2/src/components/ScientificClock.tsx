import React from "react";
import { C, SERIF } from "../config/theme";

const ROMAN = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

/**
 * 古典机械钟面。seconds = 钟面读数（秒），决定三根指针的角度。
 * tickSnap：秒针按整秒跳动（机械钟），否则平滑。
 */
export const ScientificClock: React.FC<{
  x: number;
  y: number;
  r: number;
  seconds: number;
  tickSnap?: boolean;
  opacity?: number;
  glow?: number;
  detail?: "full" | "simple";
  secondColor?: string;
  hourOffset?: number;
}> = ({
  x,
  y,
  r,
  seconds,
  tickSnap = true,
  opacity = 1,
  glow = 0.4,
  detail = "full",
  secondColor = C.goldHi,
  hourOffset = 10 * 3600 + 8 * 60,
}) => {
  const s = tickSnap ? Math.floor(seconds) + easeTick(seconds - Math.floor(seconds)) : seconds;
  const total = hourOffset + seconds;
  const secA = (s % 60) * 6;
  const minA = ((total / 60) % 60) * 6;
  const hrA = ((total / 3600) % 12) * 30;
  const full = detail === "full";
  const id = `cg${Math.round(x)}_${Math.round(y)}_${Math.round(r)}`;
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <defs>
        <radialGradient id={`${id}f`}>
          <stop offset="0%" stopColor="#1d1a15" />
          <stop offset="80%" stopColor="#12100d" />
          <stop offset="100%" stopColor="#0b0a09" />
        </radialGradient>
        <radialGradient id={`${id}h`}>
          <stop offset="78%" stopColor={C.goldHi} stopOpacity={0} />
          <stop offset="86%" stopColor={C.goldHi} stopOpacity={glow * 0.22} />
          <stop offset="100%" stopColor={C.goldHi} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.goldHi} />
          <stop offset="45%" stopColor={C.copper} />
          <stop offset="100%" stopColor={C.gold} />
        </linearGradient>
      </defs>
      <circle r={r * 1.18} fill={`url(#${id}h)`} />
      <circle r={r} fill={`url(#${id}f)`} />
      <circle r={r} fill="none" stroke={`url(#${id}rim)`} strokeWidth={Math.max(1.2, r * 0.035)} />
      {full ? <circle r={r * 0.9} fill="none" stroke={C.gold} strokeOpacity={0.35} strokeWidth={0.8} /> : null}
      {new Array(60).fill(0).map((_, i) => {
        const a = (i * 6 * Math.PI) / 180;
        const major = i % 5 === 0;
        const r1 = r * (major ? 0.8 : 0.85);
        const r2 = r * 0.9;
        return (
          <line
            key={i}
            x1={Math.sin(a) * r1}
            y1={-Math.cos(a) * r1}
            x2={Math.sin(a) * r2}
            y2={-Math.cos(a) * r2}
            stroke={major ? C.goldHi : C.gold}
            strokeOpacity={major ? 0.9 : 0.45}
            strokeWidth={major ? Math.max(1, r * 0.018) : 0.7}
          />
        );
      })}
      {full && r > 60
        ? ROMAN.map((n, i) => {
            const a = (i * 30 * Math.PI) / 180;
            const rr = r * 0.66;
            return (
              <text
                key={n}
                x={Math.sin(a) * rr}
                y={-Math.cos(a) * rr}
                fill={C.parchment}
                fillOpacity={0.8}
                fontFamily={SERIF}
                fontSize={r * 0.13}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {n}
              </text>
            );
          })
        : null}
      {/* 时针 */}
      <g transform={`rotate(${hrA})`}>
        <path
          d={`M ${-r * 0.03} ${r * 0.08} L 0 ${-r * 0.45} L ${r * 0.03} ${r * 0.08} Z`}
          fill={C.parchment}
          opacity={0.9}
        />
      </g>
      {/* 分针 */}
      <g transform={`rotate(${minA})`}>
        <path
          d={`M ${-r * 0.02} ${r * 0.1} L 0 ${-r * 0.7} L ${r * 0.02} ${r * 0.1} Z`}
          fill={C.parchment}
          opacity={0.9}
        />
      </g>
      {/* 秒针 */}
      <g transform={`rotate(${secA})`}>
        <line y1={r * 0.18} y2={-r * 0.8} stroke={secondColor} strokeWidth={Math.max(1, r * 0.012)} />
        <circle cy={-r * 0.62} r={r * 0.025} fill="none" stroke={secondColor} strokeWidth={0.8} />
      </g>
      <circle r={r * 0.035} fill={C.goldHi} />
    </g>
  );
};

// 机械秒针：在每秒开始的 ~4 帧内跳到位，带轻微回弹
const easeTick = (p: number) => {
  if (p > 0.14) return 1;
  const t = p / 0.14;
  return 1 - Math.pow(1 - t, 3) + Math.sin(t * Math.PI) * 0.08;
};

/** 数字读数用小仪表 */
export const Readout: React.FC<{
  x: number;
  y: number;
  label: string;
  value: string;
  unit?: string;
  color?: string;
  opacity?: number;
  w?: number;
}> = ({ x, y, label, value, unit, color = C.goldHi, opacity = 1, w = 220 }) => (
  <g transform={`translate(${x} ${y})`} opacity={opacity}>
    <rect x={-w / 2} y={-34} width={w} height={68} rx={3} fill="rgba(17,16,14,0.75)" stroke={C.gold} strokeOpacity={0.35} />
    <text y={-12} textAnchor="middle" fill={C.dim} fontFamily={SERIF} fontSize={15} letterSpacing={2}>
      {label}
    </text>
    <text y={20} textAnchor="middle" fill={color} fontFamily={SERIF} fontSize={28} fontWeight={500}>
      {value}
      {unit ? (
        <tspan fontSize={15} fill={C.dim} dx={4}>
          {unit}
        </tspan>
      ) : null}
    </text>
  </g>
);
