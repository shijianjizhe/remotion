import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { C, H, SERIF, W } from "../config/theme";
import { ScientificClock } from "../components/ScientificClock";
import { Burst, clamp, popS, prog } from "../components/ui";

// 尾声：记忆碎片沿螺旋回到第一幕的钟面 → 三层时间逐个弹出 → 片名静置后淡出
const CX = 960;
const CY = 440;
const LAYERS = [
  { t: "物理时钟", sub: "运动与引力改变走时", at: 76 },
  { t: "感知", sub: "大脑会改写一瞬", at: 100 },
  { t: "记忆", sub: "回望时，长短被重塑", at: 124 },
];

export const Ending: React.FC = () => {
  const f = useCurrentFrame();
  const spiral = prog(f, 0, 60);
  const clockO = prog(f, 20, 50);
  const ring = prog(f, 10, 64);
  const layersO = interpolate(f, [170, 186], [1, 0], clamp);
  const fadeAll = interpolate(f, [170, 190], [1, 0.3], clamp);
  const titleO = interpolate(f, [184, 200, 252, 270], [0, 1, 1, 0], clamp);
  const scale = interpolate(f, [0, 270], [1.1, 1.0], clamp);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: `${CX}px ${CY}px` }}>
        <svg width={W} height={H}>
          {new Array(80).fill(0).map((_, i) => {
            const a0 = random(`ea${i}`) * Math.PI * 2;
            const r0 = 520 + random(`er${i}`) * 420;
            const p = interpolate(spiral, [random(`ed${i}`) * 0.3, 1], [0, 1], clamp);
            const r = interpolate(p, [0, 1], [r0, 250 + random(`ef${i}`) * 30]);
            const a = a0 + p * 2.6;
            const w = 8 + random(`ew${i}`) * 22;
            const px = CX + Math.cos(a) * r;
            const py = CY + Math.sin(a) * r * 0.92;
            return (
              <rect
                key={i}
                x={px - w / 2}
                y={py - 4}
                width={w * (1 - p * 0.7)}
                height={8 * (1 - p * 0.5)}
                fill={i % 3 === 0 ? C.goldHi : C.white}
                opacity={(0.3 + 0.5 * random(`eo${i}`)) * (1 - p * 0.9)}
                transform={`rotate(${(a * 180) / Math.PI} ${px} ${py})`}
              />
            );
          })}
          <g opacity={fadeAll}>
            {new Array(120).fill(0).map((_, i) => {
              const p = i / 120;
              if (p > ring) return null;
              const a = p * Math.PI * 2;
              const major = i % 10 === 0;
              return (
                <line
                  key={i}
                  x1={CX + Math.sin(a) * (major ? 312 : 322)}
                  y1={CY - Math.cos(a) * (major ? 312 : 322)}
                  x2={CX + Math.sin(a) * 336}
                  y2={CY - Math.cos(a) * 336}
                  stroke={major ? C.goldHi : C.gold}
                  strokeOpacity={major ? 0.95 : 0.5}
                  strokeWidth={major ? 2 : 1}
                />
              );
            })}
            <ScientificClock x={CX} y={CY} r={270} seconds={12 + f / 30} opacity={clockO} glow={0.6} />
          </g>
          <Burst x={CX} y={CY} at={60} r={270} />
        </svg>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 820,
          display: "flex",
          justifyContent: "center",
          gap: 90,
          opacity: layersO,
        }}
      >
        {LAYERS.map((l) => {
          const s = popS(f, l.at);
          return (
            <div
              key={l.t}
              style={{
                textAlign: "center",
                opacity: Math.min(1, s),
                transform: `scale(${0.6 + 0.4 * s})`,
                width: 360,
              }}
            >
              <div style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 600, color: C.goldHi, letterSpacing: "0.12em" }}>
                {l.t}
              </div>
              <div style={{ fontFamily: SERIF, fontSize: 26, color: C.white, marginTop: 10, letterSpacing: "0.06em" }}>
                {l.sub}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 810,
          textAlign: "center",
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 96,
          color: C.goldHi,
          letterSpacing: "0.3em",
          paddingLeft: "0.3em",
          opacity: titleO,
          filter: `blur(${(1 - Math.min(1, titleO * 1.5)) * 8}px)`,
          textShadow: "0 0 36px rgba(226,198,138,0.4)",
        }}
      >
        时间并不均匀
      </div>
    </AbsoluteFill>
  );
};
