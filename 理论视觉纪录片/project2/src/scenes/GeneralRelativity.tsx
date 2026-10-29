import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, H, SERIF, W } from "../config/theme";
import { ScientificClock } from "../components/ScientificClock";
import { SceneShell } from "../components/SceneShell";
import { Beats, Burst, Camera, DocumentaryYear, HistoricalAnnotation, PopText, clamp, prog } from "../components/ui";
import { equipotentialRadii, grNsPerDay } from "../simulation/physics";

// 节点 3：星球 + 等引力势线；地面钟与高处钟；按 gh/c² 计算的走时差逐日累积
const P = { x: 520, y: 560, R: 190 };
const H_KM = 1;
const DAYS = 365;
const RUN0 = 120;
const RUN1 = 330;

export const GeneralRelativity: React.FC = () => {
  const f = useCurrentFrame();
  const radii = equipotentialRadii(P.R, 7, P.R * 2.4);
  const planetP = prog(f, 0, 16);
  const ringsP = prog(f, 6, 46);
  const clocksP = prog(f, 40, 56);
  const runP = interpolate(f, [RUN0, RUN1], [0, 1], { ...clamp, easing: (t) => t * t });
  const day = runP * DAYS;
  const diffNs = grNsPerDay(H_KM * 1000) * day;
  const diffUs = diffNs / 1000;
  const rot = f * 0.06;
  const rHigh = radii[3];
  const ang = -0.5;
  const lowPos = { x: P.x + P.R * Math.cos(ang), y: P.y + P.R * Math.sin(ang) };
  const highPos = { x: P.x + rHigh * Math.cos(ang), y: P.y + rHigh * Math.sin(ang) };

  const tape = (y: number, rate: number, color: string, label: string) => {
    const shift = (Math.max(0, f - 60) * 3 * rate) % 48;
    const len = 620;
    return (
      <g>
        <text x={1080} y={y - 30} fill={color} fontFamily={SERIF} fontSize={28} letterSpacing={2}>
          {label}
        </text>
        <line x1={1080} x2={1080 + len} y1={y} y2={y} stroke={color} strokeOpacity={0.6} strokeWidth={2} />
        {new Array(15).fill(0).map((_, i) => {
          const x = 1080 + i * 48 - shift + 48;
          if (x < 1080 || x > 1080 + len) return null;
          return <line key={i} x1={x} x2={x} y1={y - 14} y2={y + 14} stroke={color} strokeWidth={2} />;
        })}
      </g>
    );
  };

  return (
    <SceneShell>
      <Camera
        keys={[
          { f: 0, x: 560, y: 540, s: 1.35 },
          { f: 40, x: highPos.x, y: highPos.y, s: 1.5 },
          { f: 100, x: 960, y: 540, s: 1.0 },
          { f: RUN1, x: 1000, y: 540, s: 1.02 },
          { f: RUN1 + 30, x: 1020, y: 545, s: 1.06 },
          { f: 450, x: 990, y: 540, s: 1.02 },
        ]}
      >
        <svg width={W} height={H}>
          <defs>
            <radialGradient id="planet" cx="40%" cy="35%">
              <stop offset="0%" stopColor="#4a3a28" />
              <stop offset="70%" stopColor="#241d15" />
              <stop offset="100%" stopColor="#14110d" />
            </radialGradient>
          </defs>
          {radii.map((r, i) => (
            <circle
              key={i}
              cx={P.x}
              cy={P.y}
              r={r}
              fill="none"
              stroke={C.goldHi}
              strokeWidth={1.6}
              strokeOpacity={(0.6 - i * 0.06) * ringsP}
              strokeDasharray={`${2 * Math.PI * r * interpolate(ringsP, [i / 10, i / 10 + 0.4], [0, 1], clamp)} 9999`}
              transform={`rotate(${-90 + i * 8} ${P.x} ${P.y})`}
            />
          ))}
          <circle cx={P.x} cy={P.y} r={P.R} fill="url(#planet)" stroke={C.copper} strokeWidth={2} opacity={planetP} />
          <g opacity={planetP * 0.35} transform={`rotate(${rot} ${P.x} ${P.y})`}>
            {[-0.6, -0.2, 0.2, 0.6].map((k) => (
              <ellipse key={k} cx={P.x} cy={P.y} rx={P.R * Math.sqrt(1 - k * k)} ry={P.R} fill="none" stroke={C.gold} />
            ))}
          </g>
          <g opacity={clocksP}>
            <line x1={lowPos.x} y1={lowPos.y} x2={highPos.x} y2={highPos.y} stroke={C.white} strokeOpacity={0.6} strokeDasharray="4 6" strokeWidth={2} />
            <ScientificClock x={lowPos.x} y={lowPos.y} r={38} seconds={f / 30} detail="simple" glow={0.3} />
            <ScientificClock x={highPos.x} y={highPos.y} r={38} seconds={f / 30} detail="simple" glow={0.6} />
            <text x={lowPos.x + 50} y={lowPos.y + 52} fill={C.white} fontFamily={SERIF} fontSize={28}>
              地面钟
            </text>
            <text x={highPos.x + 52} y={highPos.y - 12} fill={C.goldHi} fontFamily={SERIF} fontSize={28}>
              高处钟 · +{H_KM} km
            </text>
          </g>
          <Burst x={lowPos.x} y={lowPos.y} at={40} r={38} color={C.white} />
          <Burst x={highPos.x} y={highPos.y} at={46} r={38} />

          <g opacity={prog(f, 90, 106)}>
            {tape(330, 1, C.white, "地面钟")}
            {tape(450, 1.12, C.goldHi, "高处钟 · 走得快一点")}
            <text x={1080} y={512} fill={C.dim} fontFamily={SERIF} fontSize={22}>
              刻度快慢已放大 · 等势线为示意，非引力完整图像
            </text>
          </g>
          <g opacity={prog(f, RUN0 - 10, RUN0)}>
            <line x1={1080} x2={1700} y1={548} y2={548} stroke={C.faint} />
            <text x={1080} y={610} fill={C.text} fontFamily={SERIF} fontSize={28}>
              经过
            </text>
            <text x={1160} y={614} fill={C.white} fontFamily={SERIF} fontSize={54} fontWeight={600}>
              {Math.floor(day)}
              <tspan fontSize={28} fill={C.text} dx={8}>
                天
              </tspan>
            </text>
            <text x={1080} y={694} fill={C.text} fontFamily={SERIF} fontSize={28}>
              高处钟领先
            </text>
            <text x={1250} y={704} fill={C.goldHi} fontFamily={SERIF} fontSize={72} fontWeight={600}>
              {diffNs < 1000 ? diffNs.toFixed(0) : diffUs.toFixed(2)}
              <tspan fontSize={30} fill={C.text} dx={10}>
                {diffNs < 1000 ? "纳秒" : "微秒"}
              </tspan>
            </text>
          </g>
          <Burst x={1400} y={680} at={RUN1} r={70} />
          <PopText x={1080} y={790} at={RUN1 + 6} size={30} color={C.white} anchor="start">
            一年 ≈ 3.4 微秒 —— 小，但原子钟测得出
          </PopText>
        </svg>
      </Camera>
      <DocumentaryYear year="1915" sub="柏林 · 阿尔伯特·爱因斯坦" start={0} end={440} />
      <HistoricalAnnotation latin="Die Feldgleichungen der Gravitation" title="《引力场方程》" meta="普鲁士科学院会议报告 · 1915" start={6} end={440} />
      <Beats
        beats={[
          { from: 6, to: 52, text: "十年后：【引力】登场" },
          { from: 56, to: 116, text: "一只钟在地面，一只在【1 公里高处】" },
          { from: 120, to: 210, text: "越靠近引力源，钟【走得越慢】", note: "按 Δt/t ≈ gh/c² 计算：每天约 9.4 纳秒" },
          { from: 214, to: 330, text: "差距，一天天【累积】" },
          { from: 336, to: 440, text: "引力，也会改变【走时】", final: true },
        ]}
      />
    </SceneShell>
  );
};
