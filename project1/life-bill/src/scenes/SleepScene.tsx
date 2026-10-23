import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Particles } from "../components/Background";
import { BalanceHUD } from "../components/BalanceHUD";
import { MoonIllo } from "../components/Illustrations";
import { Camera } from "../components/Motion";
import { CountTicks, LedgerReadout, Sfx } from "../components/UI";
import { catById } from "../data/persona";
import { SAFE_X } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const cat = catById("sleep");

/** 03 睡觉：夜空、月亮、表盘一圈三分之一被涂满 */
export const SleepScene: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [4, 40], [0, 1], clamp);
  const arc = interpolate(frame, [20, 60], [0, 1 / 3], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const R = 230;
  const C = 2 * Math.PI * R;
  return (
    <AbsoluteFill>
      <Backdrop color={cat.color} intensity={0.24} y={30} />
      <Particles count={70} seed="sleep" speed={0.08} opacity={0.6} maxSize={2.5} />
      <Sfx name="whoosh" at={0} volume={0.4} />
      <CountTicks start={10} duration={30} every={3} />
      <BalanceHUD catId="sleep" />
      <Camera from={1.04} to={1} driftY={10}>
        <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", width: 560, height: 560 }}>
            <svg width={560} height={560} viewBox="0 0 560 560" style={{ position: "absolute", inset: 0, rotate: "-90deg" }}>
              <circle cx={280} cy={280} r={R} fill="none" stroke="rgba(245,247,250,0.08)" strokeWidth={18} />
              <circle
                cx={280}
                cy={280}
                r={R}
                fill="none"
                stroke={cat.color}
                strokeWidth={18}
                strokeLinecap="round"
                strokeDasharray={`${arc * C} ${C}`}
                style={{ filter: `drop-shadow(0 0 16px ${cat.color})` }}
              />
              {new Array(24).fill(0).map((_, i) => {
                const a = (i / 24) * Math.PI * 2;
                return (
                  <line
                    key={i}
                    x1={280 + Math.cos(a) * 196}
                    y1={280 + Math.sin(a) * 196}
                    x2={280 + Math.cos(a) * (i % 6 === 0 ? 176 : 186)}
                    y2={280 + Math.sin(a) * (i % 6 === 0 ? 176 : 186)}
                    stroke="rgba(245,247,250,0.3)"
                    strokeWidth={i % 6 === 0 ? 4 : 2}
                  />
                );
              })}
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MoonIllo size={260} color={cat.color} progress={draw} />
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", top: 1000, left: SAFE_X }}>
          <LedgerReadout cat={cat} start={8} numberSize={200} />
        </div>
      </Camera>
    </AbsoluteFill>
  );
};
