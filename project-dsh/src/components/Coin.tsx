import React, { useId } from "react";
import { C } from "../config/film";
import { clamp } from "../lib/motion";

type Motif = "eye" | "branch";

/**
 * 全片视觉连续性基因：旧金材质、浅浮雕内圈、细密齿纹。
 * 主光来自画面左上约 35°。同一组件贯穿片头、金币、票券凹印与片尾。
 */
export const Coin: React.FC<{
  /** 直径 px */
  size: number;
  /** 面朝系数：1 = 正面，0 = 立边（cos 值，负值表示背面） */
  tilt?: number;
  /** 币面自转（度） */
  spin?: number;
  /** 环境金光，0..1 */
  glow?: number;
  opacity?: number;
  /** 虚影：低透明度 + 虚线币缘 */
  ghost?: boolean;
  motif?: Motif;
  /** 顶部高光强度 */
  spec?: number;
  shadow?: boolean;
}> = ({
  size,
  tilt = 1,
  spin = 0,
  glow = 0,
  opacity = 1,
  ghost = false,
  motif = "eye",
  spec = 1,
  shadow = true,
}) => {
  const uid = useId().replace(/:/g, "");
  const t = clamp(Math.abs(tilt), 0, 1);
  const faceOp = clamp((t - 0.1) / 0.28);
  const edgeOp = 1 - faceOp;
  const mirror = tilt < 0 ? -1 : 1;
  const gold = C.gold;
  const goldHi = C.goldHi;

  const leaves: { x: number; y: number; rot: number }[] = [];
  for (const side of [1, -1]) {
    for (let k = 0; k < 9; k++) {
      const th = ((300 + k * 15) * Math.PI) / 180;
      leaves.push({
        x: side * 41.2 * Math.cos(th),
        y: -41.2 * Math.sin(th),
        rot: (th * 180) / Math.PI + 90,
      });
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      style={{ position: "absolute", overflow: "visible", opacity }}
    >
      <defs>
        <linearGradient id={`f${uid}`} x1="0.08" y1="0" x2="0.88" y2="1">
          <stop offset="0%" stopColor="#F3E2B7" />
          <stop offset="16%" stopColor="#D8B173" />
          <stop offset="42%" stopColor="#BC9155" />
          <stop offset="68%" stopColor="#8E6C3F" />
          <stop offset="86%" stopColor="#6C5132" />
          <stop offset="100%" stopColor="#A2804B" />
        </linearGradient>
        <radialGradient id={`g${uid}`} cx="0.32" cy="0.26" r="0.85">
          <stop offset="0%" stopColor="#E9CF96" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#B98F51" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#5E472C" stopOpacity="0.35" />
        </radialGradient>
        <radialGradient id={`s${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFF8E6" stopOpacity="0.95" />
          <stop offset="62%" stopColor="#FFF3D6" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#FFF3D6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`e${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8CA88" />
          <stop offset="45%" stopColor="#A9824B" />
          <stop offset="100%" stopColor="#6E5334" />
        </linearGradient>
      </defs>

      {shadow && (
        <ellipse cx={2} cy={44} rx={33} ry={6.5} fill="#000" opacity={0.55 * faceOp} />
      )}

      {/* 立边（面朝系数很小时显现） */}
      <g opacity={edgeOp}>
        <rect x={-46.5} y={-3.2} width={93} height={6.4} rx={3.2} fill={`url(#e${uid})`} />
        <rect x={-45.5} y={-2.4} width={91} height={2.2} rx={1.1} fill={`url(#s${uid})`} opacity={0.5} />
        {new Array(16).fill(0).map((_, i) => (
          <line
            key={i}
            x1={-44 + i * 5.6}
            y1={-3.2}
            x2={-44 + i * 5.6}
            y2={3.2}
            stroke="#6B5031"
            strokeWidth={0.7}
            opacity={0.6}
          />
        ))}
      </g>

      <g opacity={faceOp} transform={`scale(${Math.max(0.02, t) * mirror}, 1)`}>
        <circle r={47.5} fill={`url(#f${uid})`} />
        {/* 细密齿纹 */}
        <circle
          r={46}
          fill="none"
          stroke={goldHi}
          strokeWidth={1.5}
          strokeDasharray="1.1 2.3"
          opacity={ghost ? 0.3 : 0.42}
        />
        <circle r={47.4} fill="none" stroke="#2A2117" strokeWidth={0.8} opacity={0.5} />
        {/* 内圈浮雕 */}
        <circle r={37} fill="none" stroke="#7A5C36" strokeWidth={2.2} opacity={0.55} />
        <circle r={34.4} fill="none" stroke={goldHi} strokeWidth={0.8} opacity={0.5} />
        <circle r={35.7} fill={`url(#g${uid})`} opacity={0.55} />

        <g transform={`rotate(${spin})`} opacity={ghost ? 0.5 : 0.92}>
          {leaves.map((l, i) => (
            <ellipse
              key={i}
              cx={l.x}
              cy={l.y}
              rx={3.5}
              ry={1.7}
              fill="none"
              stroke="#6B5031"
              strokeWidth={0.85}
              transform={`rotate(${l.rot} ${l.x} ${l.y})`}
              opacity={0.75}
            />
          ))}
          <path d="M 0 -43.5 L 1.9 -41.4 L 0 -39.3 L -1.9 -41.4 Z" fill={gold} opacity={0.85} />

          {motif === "eye" ? (
            <g>
              <path
                d="M -21 0 C -13 -12.5 13 -12.5 21 0 C 13 12.5 -13 12.5 -21 0 Z"
                fill="none"
                stroke="#6B5031"
                strokeWidth={1.5}
              />
              <path d="M -17 -1.6 C -10 -11 10 -11 17 -1.6" fill="none" stroke="#6B5031" strokeWidth={0.7} opacity={0.7} />
              <circle r={6.4} fill={gold} opacity={0.9} />
              <circle r={2.5} fill="#2E2619" />
              <circle cx={-1.9} cy={-2.2} r={1.1} fill="#FFF3D6" opacity={0.9} />
              {[-58, -32, 0, 32, 58].map((deg, i) => {
                const r1 = 25.5;
                const r2 = 31;
                const a = (deg * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1={Math.sin(a) * r1}
                    y1={-Math.cos(a) * r1}
                    x2={Math.sin(a) * r2}
                    y2={-Math.cos(a) * r2}
                    stroke="#6B5031"
                    strokeWidth={0.8}
                    opacity={0.65}
                  />
                );
              })}
            </g>
          ) : (
            <g stroke="#6B5031" strokeWidth={1.2} fill="none" opacity={0.85}>
              <path d="M 0 20 L 0 2" />
              <path d="M 0 2 C -8 -4 -14 -8 -20 -18" />
              <path d="M 0 2 C 8 -4 14 -8 20 -18" />
              <path d="M 0 2 C 0 -6 0 -10 0 -20" />
              <path d="M -4 20 L 4 20" />
            </g>
          )}
        </g>

        {/* 主光：左上 35° */}
        <ellipse cx={-14} cy={-17} rx={17} ry={10.5} fill={`url(#s${uid})`} opacity={spec} transform="rotate(-30 -14 -17)" />
        <circle cx={-19} cy={-22} r={2.6} fill="#FFFDF2" opacity={0.75 * spec} />
        <path
          d="M -44 -14 A 46 46 0 0 1 -10 -45"
          fill="none"
          stroke="#FFF4DA"
          strokeWidth={2.1}
          strokeLinecap="round"
          opacity={0.5 * spec}
        />
        <path
          d="M 16 45 A 46 46 0 0 1 43 18"
          fill="none"
          stroke="#C79A5C"
          strokeWidth={1.2}
          strokeLinecap="round"
          opacity={0.45}
        />
        {ghost && (
          <circle r={46} fill="none" stroke={goldHi} strokeWidth={1.4} strokeDasharray="4 7" opacity={0.5} />
        )}
      </g>

      {glow > 0 && (
        <circle r={47} fill="none" stroke={goldHi} strokeWidth={1.2} opacity={0.5 * glow} />
      )}
    </svg>
  );
};

export const coinLight = C.gold;
