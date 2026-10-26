import React from "react";
import {C} from "../config/film";
import {gearPath, Pt} from "../utils/geometry";

export type ScaleGeom = {
  pivot: Pt;
  left: Pt; // 左秤盘中心（盘口）
  right: Pt;
  hangL: Pt;
  hangR: Pt;
};

export const scaleGeom = (px: number, py: number, angleDeg: number, arm = 330, chain = 230): ScaleGeom => {
  const a = (angleDeg * Math.PI) / 180;
  const hangL: Pt = [px - Math.cos(a) * arm, py + Math.sin(a) * arm];
  const hangR: Pt = [px + Math.cos(a) * arm, py - Math.sin(a) * arm];
  return {
    pivot: [px, py],
    hangL,
    hangR,
    left: [hangL[0], hangL[1] + chain],
    right: [hangR[0], hangR[1] + chain],
  };
};

const Pan: React.FC<{c: Pt; hang: Pt; w: number; glow?: number}> = ({c, hang, w, glow = 0}) => (
  <g>
    {glow > 0 && <circle cx={c[0]} cy={c[1] - 30} r={w * 1.3} fill="url(#glowGold)" opacity={glow} />}
    <g stroke={C.gold} strokeWidth={1.6} fill="none" strokeDasharray="2.5 3.5" strokeLinecap="round">
      <path d={`M${hang[0]} ${hang[1]} L${c[0] - w * 0.92} ${c[1]}`} />
      <path d={`M${hang[0]} ${hang[1]} L${c[0] + w * 0.92} ${c[1]}`} />
    </g>
    <circle cx={hang[0]} cy={hang[1]} r={5} fill="url(#brassV)" stroke="#3A2914" strokeWidth={0.8} />
    <path d={`M${c[0] - w} ${c[1]} Q${c[0]} ${c[1] + w * 0.42} ${c[0] + w} ${c[1]} Z`} fill="url(#panGrad)" stroke={C.goldHi} strokeWidth={1.2} />
    <ellipse cx={c[0]} cy={c[1]} rx={w} ry={w * 0.09} fill="#2A1D0E" stroke={C.goldHi} strokeWidth={1.2} />
  </g>
);

/** 古典精密天平。angle 为主观权重示意（正值 = 左侧更重），不是金币实际重量。 */
export const BrassScale: React.FC<{
  px: number;
  py: number;
  angle: number;
  arm?: number;
  chain?: number;
  panW?: number;
  height?: number;
  glowL?: number;
  glowR?: number;
  opacity?: number;
  ornament?: number; // 装饰（立柱/底座/指针）透明度
}> = ({px, py, angle, arm = 330, chain = 230, panW = 100, height = 400, glowL = 0, glowR = 0, opacity = 1, ornament = 1}) => {
  const g = scaleGeom(px, py, angle, arm, chain);
  return (
    <g opacity={opacity}>
      <g opacity={ornament}>
        {/* 指针刻度弧 */}
        <path d={`M${px - 58} ${py - 96} A112 112 0 0 1 ${px + 58} ${py - 96}`} fill="none" stroke={C.copper} strokeWidth={1.2} />
        {Array.from({length: 13}, (_, i) => {
          const a = ((-30 + i * 5) * Math.PI) / 180;
          const r0 = i % 3 === 0 ? 102 : 106;
          return (
            <line key={i} x1={px + Math.sin(a) * r0} y1={py - Math.cos(a) * r0} x2={px + Math.sin(a) * 112} y2={py - Math.cos(a) * 112} stroke={C.copper} strokeWidth={1} />
          );
        })}
        {/* 立柱 */}
        <rect x={px - 8} y={py + 14} width={16} height={height - 14} fill="url(#brass)" opacity={0.9} />
        {[0.18, 0.5, 0.82].map((t) => (
          <rect key={t} x={px - 13} y={py + 14 + (height - 14) * t} width={26} height={7} rx={2} fill="url(#brassV)" />
        ))}
        {/* 底座 */}
        <path d={`M${px - 70} ${py + height} H${px + 70} L${px + 96} ${py + height + 22} H${px - 96} Z`} fill="url(#brassV)" stroke="#3A2914" strokeWidth={0.8} />
        <rect x={px - 130} y={py + height + 22} width={260} height={14} fill="url(#brass)" />
        <rect x={px - 140} y={py + height + 36} width={280} height={6} fill="#4A3418" />
        {/* 顶饰 */}
        <path d={`M${px} ${py - 70} L${px} ${py - 30}`} stroke={C.gold} strokeWidth={2} />
        <circle cx={px} cy={py - 34} r={8} fill="url(#brassV)" />
      </g>
      {/* 指针（垂直于横梁） */}
      <g transform={`rotate(${-angle} ${px} ${py})`}>
        <path d={`M${px - 3} ${py} L${px} ${py - 104} L${px + 3} ${py} Z`} fill={C.goldHi} />
        {/* 横梁 */}
        <path
          d={`M${px - arm} ${py - 3} L${px - 30} ${py - 7} Q${px} ${py - 14} ${px + 30} ${py - 7} L${px + arm} ${py - 3} L${px + arm} ${py + 3} L${px + 30} ${py + 7} Q${px} ${py + 14} ${px - 30} ${py + 7} L${px - arm} ${py + 3} Z`}
          fill="url(#brassV)"
          stroke="#3A2914"
          strokeWidth={0.8}
        />
        <path d={`M${px - arm + 20} ${py} H${px + arm - 20}`} stroke="#FFF0C8" strokeWidth={0.8} opacity={0.5} />
        <circle cx={px - arm} cy={py} r={7} fill="url(#brassV)" />
        <circle cx={px + arm} cy={py} r={7} fill="url(#brassV)" />
      </g>
      {/* 齿轮 */}
      <g transform={`translate(${px} ${py}) rotate(${angle * 6})`}>
        <path d={gearPath(24, 16, 5)} fill="#1E160C" stroke={C.gold} strokeWidth={1.4} />
        <circle r={9} fill="url(#brassV)" stroke="#3A2914" />
        <circle r={14} fill="none" stroke={C.gold} strokeWidth={0.8} opacity={0.6} />
      </g>
      <Pan c={g.left} hang={g.hangL} w={panW} glow={glowL} />
      <Pan c={g.right} hang={g.hangR} w={panW} glow={glowR} />
    </g>
  );
};
