import React from "react";
import {FONT_LATIN} from "../config/film";

export type CoinProps = {
  x: number;
  y: number;
  r: number;
  /** 绕竖轴旋转（弧度），0 = 正面 */
  spin?: number;
  /** 平面内旋转（度） */
  rot?: number;
  opacity?: number;
  glow?: number;
  /** 0 = 金币浮雕，1 = 时钟刻度 */
  clock?: number;
  /** 时钟分针角度（度） */
  minuteAngle?: number;
  ghost?: boolean;
  /** 透视压扁（躺倒的金币） */
  squashY?: number;
};

const ticks72 = Array.from({length: 72}, (_, i) => (i / 72) * Math.PI * 2);
const dots48 = Array.from({length: 48}, (_, i) => (i / 48) * Math.PI * 2);
const ticks60 = Array.from({length: 60}, (_, i) => (i / 60) * Math.PI * 2);

const ARCH = "M-22 30 L-22 -8 A22 22 0 0 1 22 -8 L22 30 Z";

const leaves = (side: number) =>
  [0.15, 0.4, 0.65, 0.88].map((t, i) => {
    const x = side * (8 + 38 * t);
    const y = 52 - 28 * t * t;
    return <ellipse key={i} cx={x} cy={y} rx={5} ry={2.2} transform={`rotate(${side * (-25 - 40 * t)} ${x} ${y})`} />;
  });

/** 原创币面：拱窗 + 十字窗棂 + 月桂（不复刻任何真实法郎币） */
const Motif: React.FC<{op: number}> = ({op}) => {
  const emboss = (dx: number, dy: number, color: string, o: number) => (
    <g transform={`translate(${dx} ${dy})`} opacity={o}>
      <path d={ARCH} fill="none" stroke={color} strokeWidth={4} />
      <path d="M0 -30 V30 M-22 6 H22" stroke={color} strokeWidth={3} />
      <path d="M-6 52 C-26 50 -40 40 -46 24" fill="none" stroke={color} strokeWidth={2.4} />
      <path d="M6 52 C26 50 40 40 46 24" fill="none" stroke={color} strokeWidth={2.4} />
      <g fill={color}>
        {leaves(-1)}
        {leaves(1)}
      </g>
      <rect x={-30} y={30} width={60} height={5} fill={color} />
    </g>
  );
  return (
    <g opacity={op}>
      <path d={ARCH} fill="#6E4F27" opacity={0.25} />
      {emboss(1.6, 1.8, "#3E2A12", 0.55)}
      {emboss(-1, -1, "#FFF2C8", 0.7)}
      {emboss(0, 0, "url(#coinMotif)", 1)}
      {[-12, 0, 12].map((x) => (
        <circle key={x} cx={x} cy={-48} r={2} fill="#F3DCA0" opacity={0.8} />
      ))}
    </g>
  );
};

const ClockFace: React.FC<{op: number; minute: number}> = ({op, minute}) => (
  <g opacity={op}>
    <circle r={78} fill="#2A1D0E" opacity={0.22} />
    {ticks60.map((a, i) => {
      const major = i % 5 === 0;
      const r0 = major ? 62 : 68;
      return (
        <line
          key={i}
          x1={Math.cos(a) * r0}
          y1={Math.sin(a) * r0}
          x2={Math.cos(a) * 74}
          y2={Math.sin(a) * 74}
          stroke={major ? "#FFF0C4" : "#4A3418"}
          strokeWidth={major ? 2.6 : 1}
          opacity={major ? 0.9 : 0.7}
        />
      );
    })}
    {["XII", "III", "VI", "IX"].map((s, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 2;
      return (
        <text
          key={s}
          x={Math.cos(a) * 47}
          y={Math.sin(a) * 47 + 5}
          textAnchor="middle"
          fontFamily={FONT_LATIN}
          fontSize={15}
          fontWeight={700}
          fill="#3A2812"
        >
          {s}
        </text>
      );
    })}
    <g transform={`rotate(${minute / 12 + 300})`}>
      <path d="M-3.2 6 L0 -36 L3.2 6 Z" fill="#2E200F" />
    </g>
    <g transform={`rotate(${minute})`}>
      <path d="M-2.2 8 L0 -62 L2.2 8 Z" fill="#2E200F" />
    </g>
    <circle r={5} fill="#E8CA88" stroke="#3A2812" strokeWidth={1.5} />
  </g>
);

export const CoinFace: React.FC<{clock?: number; minute?: number; ghost?: boolean}> = ({clock = 0, minute = 0, ghost}) => {
  if (ghost) {
    return (
      <g fill="none" stroke="#D8BE8A">
        <circle r={98} strokeWidth={4} strokeDasharray="9 7" />
        <circle r={82} strokeWidth={1.2} opacity={0.6} strokeDasharray="3 6" />
        <path d={`${ARCH} M0 -30 V30 M-22 6 H22`} strokeWidth={3} opacity={0.75} />
      </g>
    );
  }
  return (
    <g>
      <circle r={100} fill="url(#coinFace)" />
      <g stroke="#4A3418" strokeWidth={1.4} opacity={0.55}>
        {ticks72.map((a, i) => (
          <line key={i} x1={Math.cos(a) * 93} y1={Math.sin(a) * 93} x2={Math.cos(a) * 99.5} y2={Math.sin(a) * 99.5} />
        ))}
      </g>
      <circle r={99} fill="none" stroke="#3A2914" strokeWidth={1.5} opacity={0.7} />
      <circle r={86} fill="url(#coinInner)" />
      <circle r={86} fill="none" stroke="#FFF1C4" strokeWidth={2.2} opacity={0.65} transform="translate(-1 -1)" />
      <circle r={86} fill="none" stroke="#3E2A12" strokeWidth={2.2} opacity={0.5} transform="translate(1.3 1.5)" />
      <g fill="#F3DCA0" opacity={0.75 * (1 - clock)}>
        {dots48.map((a, i) => (
          <circle key={i} cx={Math.cos(a) * 76} cy={Math.sin(a) * 76} r={1.4} />
        ))}
      </g>
      {clock < 0.999 && <Motif op={1 - clock} />}
      {clock > 0.001 && <ClockFace op={clock} minute={minute} />}
    </g>
  );
};

export const GoldCoin: React.FC<CoinProps> = ({
  x,
  y,
  r,
  spin = 0,
  rot = 0,
  opacity = 1,
  glow = 0,
  clock = 0,
  minuteAngle = 0,
  ghost = false,
  squashY = 1,
}) => {
  if (opacity <= 0.001 || r <= 0.01) return null;
  const c = Math.cos(spin);
  const s = Math.sin(spin);
  const sx = Math.max(0.035, Math.abs(c));
  const k = r / 100;
  const thick = 11;
  const edgeShift = thick * s;
  const steps = ghost ? 0 : Math.ceil(Math.abs(edgeShift) / 2.2);
  const hl = Math.sin(spin * 1.3 + 0.7) * 70;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={opacity}>
      {glow > 0 && <circle r={r * 2.4} fill="url(#glowGold)" opacity={Math.min(glow, 1.5)} />}
      <g transform={`scale(${k} ${k * squashY})`}>
        {Array.from({length: steps}, (_, i) => (
          <ellipse
            key={i}
            cx={(edgeShift * (steps - i)) / steps}
            cy={0}
            rx={100 * sx}
            ry={100}
            fill="url(#coinEdge)"
            stroke="#2C1F0E"
            strokeWidth={0.6}
            strokeOpacity={0.4}
          />
        ))}
        <g transform={`scale(${sx} 1)`}>
          <CoinFace clock={clock} minute={minuteAngle} ghost={ghost} />
          {!ghost && (
            <g clipPath="url(#coinClip)">
              <ellipse cx={hl} cy={-10} rx={26} ry={130} fill="#FFF6DD" opacity={0.13} transform={`rotate(28 ${hl} 0)`} />
            </g>
          )}
          {!ghost && <path d="M-70 -71 A100 100 0 0 1 30 -95" fill="none" stroke="#FFF0C8" strokeWidth={2.4} opacity={0.55} />}
        </g>
      </g>
    </g>
  );
};
