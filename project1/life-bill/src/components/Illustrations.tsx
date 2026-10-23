/**
 * 极简线条插画 —— 全部为本项目手绘 SVG，无第三方版权。
 * 每个插画都接收 progress(0~1) 用于描边绘制动画。
 */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 描边绘制：pathLength=1 + dashoffset */
const draw = (p: number): React.SVGProps<SVGPathElement> => ({
  pathLength: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1 - Math.min(1, Math.max(0, p)),
});

type IlloProps = { size?: number; color: string; progress: number; style?: React.CSSProperties };

const stroke = (color: string, w = 3): React.SVGProps<SVGPathElement> => ({
  fill: "none",
  stroke: color,
  strokeWidth: w,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export const MoonIllo: React.FC<IlloProps> = ({ size = 300, color, progress, style }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible", ...style }}>
      <defs>
        <radialGradient id="moonGlow">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={100} cy={100} r={110} fill="url(#moonGlow)" opacity={progress} />
      <path d="M130 40 A70 70 0 1 0 160 130 A56 56 0 1 1 130 40 Z" {...stroke(color, 3.5)} {...draw(progress * 1.2)} fill={`${color}${progress > 0.9 ? "22" : "00"}`} />
      {[0, 1, 2].map((i) => {
        const z = interpolate((frame + i * 25) % 75, [0, 75], [0, 1]);
        return (
          <text
            key={i}
            x={150 + z * 30}
            y={60 - z * 50}
            fill={color}
            opacity={progress * (1 - z) * 0.9}
            fontSize={18 + z * 10}
            fontWeight={700}
            fontFamily="Consolas, monospace"
          >
            z
          </text>
        );
      })}
    </svg>
  );
};

export const MonitorIllo: React.FC<IlloProps> = ({ size = 300, color, progress, style }) => {
  const frame = useCurrentFrame();
  const typing = Math.floor(frame / 3) % 6;
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 200 160" style={{ overflow: "visible", ...style }}>
      <rect x={20} y={14} width={160} height={100} rx={10} {...(stroke(color, 3) as object)} {...(draw(progress * 1.3) as object)} />
      <path d="M80 114 L72 140 M120 114 L128 140 M60 142 L140 142" {...stroke(color, 3)} {...draw(progress * 1.3 - 0.3)} />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={38}
          y={32 + i * 18}
          height={6}
          rx={3}
          width={interpolate(progress, [0.5 + i * 0.1, 0.8 + i * 0.05], [0, i === 3 ? 30 + typing * 10 : 90 - i * 14], clamp)}
          fill={color}
          opacity={0.55}
        />
      ))}
    </svg>
  );
};

export const TrainIllo: React.FC<IlloProps> = ({ size = 300, color, progress, style }) => (
  <svg width={size} height={size * 0.9} viewBox="0 0 200 180" style={{ overflow: "visible", ...style }}>
    <path d="M50 20 H150 A20 20 0 0 1 170 40 V120 A16 16 0 0 1 154 136 H46 A16 16 0 0 1 30 120 V40 A20 20 0 0 1 50 20 Z" {...stroke(color, 3.5)} {...draw(progress * 1.25)} />
    <path d="M44 46 H156 V88 H44 Z" {...stroke(color, 3)} {...draw(progress * 1.25 - 0.2)} />
    <path d="M100 46 V88" {...stroke(color, 3)} {...draw(progress * 1.25 - 0.3)} />
    <circle cx={62} cy={112} r={8} {...(stroke(color, 3) as object)} {...(draw(progress * 1.4 - 0.4) as object)} />
    <circle cx={138} cy={112} r={8} {...(stroke(color, 3) as object)} {...(draw(progress * 1.4 - 0.4) as object)} />
    <path d="M60 136 L42 166 M140 136 L158 166 M56 154 H144" {...stroke(color, 3)} {...draw(progress * 1.4 - 0.4)} />
  </svg>
);

export const PhoneIllo: React.FC<IlloProps & { children?: React.ReactNode }> = ({ size = 300, color, progress, style, children }) => (
  <div style={{ position: "relative", width: size, height: size * 2.05, ...style }}>
    <svg width={size} height={size * 2.05} viewBox="0 0 200 410" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <rect x={4} y={4} width={192} height={402} rx={34} {...(stroke(color, 4) as object)} {...(draw(progress * 1.2) as object)} />
      <rect x={76} y={16} width={48} height={12} rx={6} fill={color} opacity={progress} />
    </svg>
    <div
      style={{
        position: "absolute",
        left: size * 0.06,
        top: size * 0.17,
        width: size * 0.88,
        height: size * 1.8,
        overflow: "hidden",
        borderRadius: size * 0.08,
        opacity: interpolate(progress, [0.6, 1], [0, 1], clamp),
      }}
    >
      {children}
    </div>
  </div>
);

export const BowlIllo: React.FC<IlloProps> = ({ size = 300, color, progress, style }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible", ...style }}>
      <path d="M24 100 H176 A76 76 0 0 1 24 100 Z" {...stroke(color, 3.5)} {...draw(progress * 1.2)} />
      <path d="M70 176 H130" {...stroke(color, 3.5)} {...draw(progress * 1.2 - 0.2)} />
      <path d="M120 20 L168 92 M140 14 L180 88" {...stroke(color, 3)} {...draw(progress * 1.3 - 0.35)} />
      {[0, 1, 2].map((i) => {
        const t = ((frame + i * 20) % 60) / 60;
        const x = 70 + i * 28;
        return (
          <path
            key={i}
            d={`M${x} ${84 - t * 40} q 8 -10 0 -20 q -8 -10 0 -20`}
            {...stroke(color, 2.5)}
            opacity={progress * Math.sin(t * Math.PI) * 0.8}
          />
        );
      })}
    </svg>
  );
};

export const CheckIllo: React.FC<IlloProps> = ({ size = 120, color, progress, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", ...style }}>
    <rect x={8} y={8} width={84} height={84} rx={22} {...(stroke(color, 5) as object)} {...(draw(progress * 1.5) as object)} />
    <path d="M28 52 L44 68 L74 34" {...stroke(color, 7)} {...draw(progress * 2 - 1)} />
  </svg>
);

export const HomeIllo: React.FC<IlloProps> = ({ size = 300, color, progress, style }) => {
  const frame = useCurrentFrame();
  const glow = 0.6 + Math.sin(frame / 12) * 0.2;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible", ...style }}>
      <defs>
        <radialGradient id="homeGlow">
          <stop offset="0%" stopColor={color} stopOpacity={0.55} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={100} cy={120} r={90} fill="url(#homeGlow)" opacity={progress * glow} />
      <path d="M30 96 L100 36 L170 96" {...stroke(color, 4)} {...draw(progress * 1.25)} />
      <path d="M48 82 V170 H152 V82" {...stroke(color, 4)} {...draw(progress * 1.25 - 0.2)} />
      <rect x={84} y={110} width={32} height={32} rx={4} fill={color} opacity={interpolate(progress, [0.7, 1], [0, glow], clamp)} />
      <path d="M100 110 V142 M84 126 H116" stroke="#0F1115" strokeWidth={3} opacity={progress > 0.8 ? 1 : 0} />
    </svg>
  );
};

/** 收据打印机出纸口 */
export const PrinterSlot: React.FC<{ width: number; color?: string }> = ({ width, color = "#F5F7FA" }) => (
  <div
    style={{
      width,
      height: 46,
      borderRadius: 23,
      background: "linear-gradient(180deg, #2A2E37, #15171C)",
      border: "1.5px solid rgba(255,255,255,0.12)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 -10px 20px rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div style={{ width: width - 70, height: 8, borderRadius: 4, background: "#000", boxShadow: `0 0 18px ${color}33` }} />
  </div>
);
