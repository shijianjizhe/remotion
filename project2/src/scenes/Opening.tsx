import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, H, SERIF, W } from "../config/theme";
import { ScientificClock } from "../components/ScientificClock";
import { Backdrop, Beats, Burst, Camera, GoldParticles, clamp, popS, prog } from "../components/ui";

// 片头 0–9s：钟响 → 秒针特写 → 拉出整钟 → 提问 → 一分为五 → 片名
export const Opening: React.FC = () => {
  const f = useCurrentFrame();
  const bgO = interpolate(f, [0, 30], [0.4, 1], clamp);
  const ticksP = prog(f, 2, 34);
  const clockO = interpolate(f, [4, 24], [0, 1], clamp);
  const SPLIT = 120;
  const split = popS(f, SPLIT);
  const titleP = prog(f, 150, 176);
  const outro = interpolate(f, [255, 270], [1, 0], clamp);

  const secs = 55 + f / 30;
  const R = interpolate(split, [0, 1], [270, 96]);
  const offsets = [-2, -1, 0, 1, 2];

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: bgO }}>
        <Backdrop glow={{ x: 960, y: 470, r: 1000, o: 0.2 + 0.1 * clockO }} />
      </AbsoluteFill>
      <GoldParticles count={40} seed="open" opacity={interpolate(f, [10, 60], [0, 0.9], clamp)} />
      <AbsoluteFill style={{ opacity: outro }}>
        <Camera
          keys={[
            { f: 0, x: 960, y: 330, s: 2.3 },
            { f: 40, x: 960, y: 420, s: 1.6 },
            { f: 80, x: 960, y: 500, s: 1.05 },
            { f: SPLIT, x: 960, y: 500, s: 1.0 },
            { f: 270, x: 960, y: 520, s: 1.03 },
          ]}
        >
          <svg width={W} height={H}>
            <g transform={`translate(0 ${interpolate(split, [0, 1], [0, -110])})`}>
              <g opacity={Math.max(0, 1 - split)}>
                {new Array(120).fill(0).map((_, i) => {
                  const p = i / 120;
                  if (p > ticksP) return null;
                  const a = p * Math.PI * 2;
                  const major = i % 10 === 0;
                  const r1 = major ? 312 : 322;
                  return (
                    <line
                      key={i}
                      x1={960 + Math.sin(a) * r1}
                      y1={500 - Math.cos(a) * r1}
                      x2={960 + Math.sin(a) * 336}
                      y2={500 - Math.cos(a) * 336}
                      stroke={major ? C.goldHi : C.gold}
                      strokeOpacity={major ? 0.95 : 0.5}
                      strokeWidth={major ? 2 : 1}
                    />
                  );
                })}
              </g>
              {offsets.map((k) => {
                const x = 960 + k * 310 * split;
                const o = k === 0 ? clockO : clockO * Math.min(1, split);
                return (
                  <ScientificClock
                    key={k}
                    x={x}
                    y={500}
                    r={R}
                    seconds={secs}
                    opacity={o}
                    glow={k === 0 ? 0.6 : 0.4}
                    detail={split > 0.6 && k !== 0 ? "simple" : "full"}
                  />
                );
              })}
              <Burst x={960} y={500} at={SPLIT} r={100} />
            </g>
          </svg>
        </Camera>
        {/* 片名 */}
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          <g opacity={titleP}>
            {new Array(41).fill(0).map((_, i) => {
              const x = 560 + i * 20;
              const h = i % 5 === 0 ? 18 : 9;
              const reveal = titleP * 41 > Math.abs(i - 20) * 2 ? 1 : 0;
              return (
                <line
                  key={i}
                  x1={x}
                  x2={x}
                  y1={800 - h}
                  y2={800}
                  stroke={C.gold}
                  strokeOpacity={0.7 * reveal}
                  strokeWidth={i % 5 === 0 ? 1.6 : 1}
                />
              );
            })}
            <line x1={560} x2={1360} y1={800} y2={800} stroke={C.gold} strokeOpacity={0.5} />
          </g>
        </svg>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 640,
            textAlign: "center",
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: 96,
            color: C.goldHi,
            opacity: titleP,
            letterSpacing: `${interpolate(titleP, [0, 1], [0.6, 0.3])}em`,
            paddingLeft: "0.3em",
            filter: `blur(${(1 - titleP) * 12}px)`,
            textShadow: "0 0 36px rgba(226,198,138,0.4)",
          }}
        >
          时间并不均匀
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 828,
            textAlign: "center",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            fontSize: 28,
            color: C.text,
            letterSpacing: "0.4em",
            opacity: prog(f, 170, 195),
          }}
        >
          TIME IS NOT UNIFORM
        </div>
      </AbsoluteFill>
      <Beats
        y={860}
        beats={[
          { from: 40, to: 112, text: "【每一秒】，都一样长吗？", final: true },
        ]}
      />
    </AbsoluteFill>
  );
};
