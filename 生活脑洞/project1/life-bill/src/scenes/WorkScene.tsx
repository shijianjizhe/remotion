import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, GridLines } from "../components/Background";
import { BalanceHUD } from "../components/BalanceHUD";
import { SceneImage } from "../components/SceneImage";
import { Camera } from "../components/Motion";
import { CountTicks, LedgerReadout, Mono, Sfx } from "../components/UI";
import { catById } from "../data/persona";
import { COLORS, FONT_STACK, SAFE_X } from "../theme";

const cat = catById("work");
const PUNCHES = ["09:58 上班打卡", "12:00 午休", "13:00 回到工位", "19:30 需求评审", "21:12 下班打卡"];

/** 04 上班：深夜工位的场景插画 + 一列打卡记录快速弹出 */
export const WorkScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Backdrop color={cat.color} intensity={0.14} x={70} y={34} />
      <GridLines opacity={0.05} size={60} />
      <Sfx name="swipe" at={0} volume={0.4} />
      <CountTicks start={10} duration={30} every={3} />
      {PUNCHES.map((_, i) => (
        <Sfx key={i} name="click" at={12 + i * 6} volume={0.3} />
      ))}
      <BalanceHUD catId="work" />
      <Camera from={1} to={1.05} driftX={-14}>
        <SceneImage src="images/scenes/work.png" focusX={0.45} glow={cat.color} driftX={10} />
        <div style={{ position: "absolute", top: 340, right: 60, width: 330, display: "flex", flexDirection: "column", gap: 10 }}>
          {PUNCHES.map((p, i) => {
            const s = spring({ frame: frame - 12 - i * 6, fps, config: { damping: 16, stiffness: 200 } });
            const last = i === PUNCHES.length - 1;
            return (
              <div
                key={p}
                style={{
                  opacity: s,
                  translate: `${(1 - s) * 80}px 0px`,
                  padding: "10px 18px",
                  borderRadius: 14,
                  background: last ? "rgba(60,20,24,0.78)" : "rgba(14,16,22,0.72)",
                  backdropFilter: "blur(10px)",
                  border: `1.5px solid ${last ? COLORS.red + "66" : "rgba(255,255,255,0.08)"}`,
                  fontFamily: FONT_STACK,
                  fontSize: 26,
                  color: last ? COLORS.red : COLORS.text,
                  fontWeight: last ? 700 : 400,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {p}
              </div>
            );
          })}
          <Mono style={{ marginTop: 6, textAlign: "right", color: COLORS.text, textShadow: "0 2px 10px rgba(0,0,0,0.95)" }}>× 250 个工作日</Mono>
        </div>
        <div style={{ position: "absolute", top: 1000, left: SAFE_X }}>
          <LedgerReadout cat={cat} start={8} numberSize={200} />
        </div>
      </Camera>
    </AbsoluteFill>
  );
};
