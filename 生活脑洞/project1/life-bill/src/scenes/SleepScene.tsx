import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Particles } from "../components/Background";
import { BalanceHUD } from "../components/BalanceHUD";
import { SceneImage } from "../components/SceneImage";
import { Camera } from "../components/Motion";
import { CountTicks, LedgerReadout, Sfx } from "../components/UI";
import { catById } from "../data/persona";
import { COLORS, FONT_STACK, SAFE_X } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const cat = catById("sleep");

/** 03 睡觉：夜里熟睡的场景插画 + 24h 表盘被涂满三分之一 */
export const SleepScene: React.FC = () => {
  const frame = useCurrentFrame();
  const arc = interpolate(frame, [20, 60], [0, 1 / 3], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const R = 96;
  const C = 2 * Math.PI * R;
  return (
    <AbsoluteFill>
      <Backdrop color={cat.color} intensity={0.24} y={30} />
      <Particles count={70} seed="sleep" speed={0.08} opacity={0.6} maxSize={2.5} />
      <Sfx name="whoosh" at={0} volume={0.4} />
      <CountTicks start={10} duration={30} every={3} />
      <BalanceHUD catId="sleep" />
      <Camera from={1.04} to={1} driftY={10}>
        <SceneImage src="images/scenes/sleep.png" focusX={0.5} focusY={0.55} glow={cat.color} driftX={-12}>
          {/* 梦呓 Zzz */}
          {[0, 1, 2].map((i) => {
            const t = ((frame + i * 22) % 66) / 66;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 740 + t * 90,
                  top: 150 - t * 150,
                  fontFamily: FONT_STACK,
                  fontWeight: 700,
                  fontSize: 30 + t * 26,
                  color: cat.color,
                  opacity: Math.sin(t * Math.PI) * interpolate(frame, [20, 34], [0, 0.9], clamp),
                  textShadow: `0 0 18px ${cat.color}`,
                }}
              >
                z
              </div>
            );
          })}
        </SceneImage>
        {/* 24h 表盘：一天被睡掉三分之一 */}
        <div style={{ position: "absolute", top: 320, left: 70, width: 220, height: 220, opacity: interpolate(frame, [14, 26], [0, 1], clamp) }}>
          <svg width={220} height={220} viewBox="0 0 220 220" style={{ position: "absolute", inset: 0, rotate: "-90deg" }}>
            <circle cx={110} cy={110} r={R} fill="rgba(8,9,12,0.55)" stroke="rgba(245,247,250,0.12)" strokeWidth={10} />
            <circle
              cx={110}
              cy={110}
              r={R}
              fill="none"
              stroke={cat.color}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={`${arc * C} ${C}`}
              style={{ filter: `drop-shadow(0 0 10px ${cat.color})` }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT_STACK }}>
            <div style={{ fontSize: 52, fontWeight: 800, color: COLORS.text, lineHeight: 1 }}>8h</div>
            <div style={{ fontSize: 22, color: COLORS.textDim, marginTop: 6 }}>/ 24h 每天</div>
          </div>
        </div>
        <div style={{ position: "absolute", top: 1000, left: SAFE_X }}>
          <LedgerReadout cat={cat} start={8} numberSize={200} />
        </div>
      </Camera>
    </AbsoluteFill>
  );
};
