import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, H, SERIF, W } from "../config/theme";
import { Burst, clamp, prog } from "../components/ui";

// 章节转折（4s）：地球收缩为瞳孔，轨道变为虹膜纹理 —— 物理时间 → 感知时间
export const EyeTransition: React.FC = () => {
  const f = useCurrentFrame();
  const shrink = prog(f, 0, 26);
  const iris = prog(f, 12, 44);
  const lids = prog(f, 26, 52);
  const out = interpolate(f, [108, 120], [1, 0], clamp);
  const zoom = interpolate(f, [100, 120], [1, 1.6], clamp);
  const cx = 960;
  const cy = 450;
  const pupilR = interpolate(shrink, [0, 1], [320, 64]);
  const irisR = 200;
  const lidW = 440 * lids;
  const lidH = 220 * lids;
  const lidPath = `M ${cx - lidW} ${cy} Q ${cx} ${cy - lidH * 1.25} ${cx + lidW} ${cy} Q ${cx} ${cy + lidH * 1.25} ${cx - lidW} ${cy} Z`;
  const qP = prog(f, 40, 52);

  return (
    <AbsoluteFill style={{ opacity: out, transform: `scale(${zoom})`, transformOrigin: `${cx}px ${cy}px` }}>
      <svg width={W} height={H}>
        <defs>
          <radialGradient id="pupil">
            <stop offset="0%" stopColor="#050505" />
            <stop offset="85%" stopColor="#0b0a08" />
            <stop offset="100%" stopColor="#3a2e20" />
          </radialGradient>
        </defs>
        {new Array(5).fill(0).map((_, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={interpolate(iris, [0, 1], [360 + i * 60, 80 + i * 26])}
            fill="none"
            stroke={C.goldHi}
            strokeOpacity={0.4 - i * 0.05}
            strokeWidth={1.5}
            strokeDasharray="3 8"
          />
        ))}
        <g opacity={iris}>
          {new Array(160).fill(0).map((_, i) => {
            const a = (i / 160) * Math.PI * 2;
            const wob = Math.sin(i * 7.3) * 0.08;
            const r2 = irisR * (0.82 + Math.abs(Math.sin(i * 3.1)) * 0.18);
            return (
              <line
                key={i}
                x1={cx + Math.cos(a) * 70}
                y1={cy + Math.sin(a) * 70}
                x2={cx + Math.cos(a + wob) * r2}
                y2={cy + Math.sin(a + wob) * r2}
                stroke={i % 3 === 0 ? C.goldHi : C.copper}
                strokeOpacity={0.55}
                strokeWidth={1.1}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={irisR} fill="none" stroke={C.goldHi} strokeOpacity={0.8} strokeWidth={2.5} />
        </g>
        <circle cx={cx} cy={cy} r={pupilR} fill="url(#pupil)" stroke={C.copper} strokeWidth={2} />
        <circle cx={cx - 24} cy={cy - 26} r={10} fill={C.white} opacity={0.75 * iris} />
        <path d={lidPath} fill="none" stroke={C.white} strokeOpacity={0.8 * lids} strokeWidth={2.5} />
        <Burst x={cx} y={cy} at={26} r={64} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 800,
          textAlign: "center",
          fontFamily: SERIF,
          fontSize: 60,
          fontWeight: 600,
          color: C.white,
          letterSpacing: "0.14em",
          opacity: qP,
          transform: `scale(${interpolate(qP, [0, 1], [1.1, 1])})`,
          filter: `blur(${(1 - qP) * 8}px)`,
          textShadow: "0 2px 20px rgba(0,0,0,0.9)",
        }}
      >
        但我们<span style={{ color: C.goldHi }}>感到</span>的时间呢？
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 890,
          textAlign: "center",
          fontFamily: SERIF,
          fontSize: 28,
          color: C.text,
          letterSpacing: "0.2em",
          opacity: prog(f, 56, 68),
        }}
      >
        物理时间 → 感知时间
      </div>
    </AbsoluteFill>
  );
};
