import React from "react";
import {C} from "../config/film";

/** 线描人物剪影（原创雕刻式，非肖像） */
export const Figure: React.FC<{
  x: number;
  y: number; // 脚底
  s?: number;
  color?: string;
  hat?: "top" | "cap";
  walk?: number; // 步态相位（弧度），NaN 为静止
  armOut?: number; // 0..1 手臂前伸
  carry?: boolean; // 背玻璃架
  facing?: 1 | -1;
  opacity?: number;
  dashed?: boolean;
}> = ({x, y, s = 1, color = C.ink, hat = "top", walk, armOut = 0, carry = false, facing = 1, opacity = 1, dashed}) => {
  const swing = walk === undefined ? 0 : Math.sin(walk) * 16;
  const bob = walk === undefined ? 0 : Math.abs(Math.cos(walk)) * 2;
  const stroke = dashed ? {strokeDasharray: "4 4"} : {};
  const fill = dashed ? "none" : color;
  return (
    <g transform={`translate(${x} ${y - bob}) scale(${s * facing} ${s})`} opacity={opacity} stroke={color} strokeWidth={2} strokeLinecap="round" {...stroke}>
      {carry && (
        <g transform="translate(-30 -190) rotate(-6)">
          <rect x={-34} y={0} width={60} height={110} fill="none" strokeWidth={2.4} />
          <path d="M-34 0 L26 110 M-20 0 L26 84" strokeWidth={1} opacity={0.5} />
          <rect x={-30} y={4} width={52} height={102} fill={color} opacity={0.08} stroke="none" />
        </g>
      )}
      {/* 腿 */}
      <g transform={`rotate(${swing} 0 -86)`}>
        <path d="M-4 -86 L-8 -6 L6 -6" fill="none" strokeWidth={6} />
      </g>
      <g transform={`rotate(${-swing} 0 -86)`}>
        <path d="M4 -86 L6 -6 L20 -6" fill="none" strokeWidth={6} />
      </g>
      {/* 外套 */}
      <path d="M-18 -160 L18 -160 L26 -78 L-24 -78 Z" fill={fill} fillOpacity={0.9} />
      <path d="M0 -158 V-90" stroke={dashed ? color : "#E8D6B1"} strokeWidth={1} opacity={0.35} />
      {/* 手臂 */}
      <g transform={`rotate(${-70 * armOut + (walk === undefined ? 0 : -swing * 0.6)} 14 -152)`}>
        <path d="M14 -152 L22 -104" fill="none" strokeWidth={6} />
      </g>
      <path d="M-14 -152 L-20 -104" fill="none" strokeWidth={6} transform={`rotate(${walk === undefined ? 0 : swing * 0.6} -14 -152)`} />
      {/* 头 */}
      <circle cx={0} cy={-176} r={13} fill={fill} />
      {hat === "top" ? (
        <g fill={fill}>
          <rect x={-11} y={-214} width={22} height={26} />
          <rect x={-18} y={-190} width={36} height={4} />
        </g>
      ) : (
        <path d="M-14 -184 C-12 -198 12 -198 16 -184 L22 -182 Z" fill={fill} />
      )}
    </g>
  );
};

/** 一双鞋（侧视线描） */
export const SHOE = "M0 0 L0 -20 C0 -30 9 -34 18 -31 L30 -27 C38 -24 46 -18 58 -15 C72 -12 80 -8 80 0 Z";
export const Shoes: React.FC<{x: number; y: number; color?: string; s?: number; opacity?: number; dashed?: boolean}> = ({
  x,
  y,
  color = C.ink,
  s = 1,
  opacity = 1,
  dashed,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity} fill="none" stroke={color} strokeWidth={2} strokeDasharray={dashed ? "4 4" : undefined}>
    <g transform="translate(-30 -6)" opacity={0.75}>
      <path d={SHOE} />
      <path d="M2 -6 H80" strokeWidth={1} />
    </g>
    <g>
      <path d={SHOE} fill={color} fillOpacity={0.12} />
      <path d="M2 -6 H80 M14 -26 L22 -18 M22 -28 L30 -20" strokeWidth={1.2} />
      <path d="M0 0 h16 v5 h-16 z" />
    </g>
  </g>
);
