import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, GridLines } from "../components/Background";
import { BalanceHUD } from "../components/BalanceHUD";
import { CheckIllo } from "../components/Illustrations";
import { SceneImage } from "../components/SceneImage";
import { Camera } from "../components/Motion";
import { CountTicks, LedgerReadout, Sfx } from "../components/UI";
import { catById } from "../data/persona";
import { COLORS, FONT_STACK, SAFE_X } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const cat = catById("chores");
const TODOS = ["洗衣服 · 拖地", "超市采购", "交水电燃气费", "医院排队挂号", "取快递 · 退货"];

/** 08 琐事：做家务的场景插画 + 待办清单被逐条勾掉、划线 */
export const ChoresScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop color={cat.color} intensity={0.14} y={36} />
      <GridLines opacity={0.04} size={70} />
      <Sfx name="swipe" at={0} volume={0.35} />
      <CountTicks start={10} duration={30} every={3} />
      {TODOS.map((_, i) => (
        <Sfx key={i} name="click" at={14 + i * 7} volume={0.32} />
      ))}
      <BalanceHUD catId="chores" />
      <Camera from={1} to={1.04} driftY={-12}>
        <SceneImage src="images/scenes/chores.png" focusX={0.55} focusY={0.5} glow={cat.color} driftX={10} />
        <div style={{ position: "absolute", top: 330, left: 50, display: "flex", flexDirection: "column", gap: 8 }}>
          {TODOS.map((t, i) => {
            const at = 6 + i * 7;
            const appear = interpolate(frame, [at - 6, at + 4], [0, 1], clamp);
            const check = interpolate(frame, [at + 8, at + 20], [0, 1], clamp);
            return (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 16, opacity: appear, translate: `${(1 - appear) * -40}px 0px` }}>
                <CheckIllo size={46} color={check > 0.5 ? cat.color : COLORS.textFaint} progress={0.5 + check * 0.5} />
                <div style={{ position: "relative", fontFamily: FONT_STACK, fontSize: 29, textShadow: "0 2px 12px rgba(0,0,0,0.9)", color: check > 0.9 ? COLORS.textFaint : COLORS.text }}>
                  {t}
                  <div style={{ position: "absolute", left: 0, top: "52%", height: 3, width: `${check * 100}%`, background: COLORS.textDim }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", top: 1000, left: SAFE_X }}>
          <LedgerReadout cat={cat} start={8} numberSize={200} punchDelay={50} />
        </div>
      </Camera>
    </AbsoluteFill>
  );
};
