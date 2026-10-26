import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Background";
import { BalanceHUD } from "../components/BalanceHUD";
import { SceneImage } from "../components/SceneImage";
import { Camera } from "../components/Motion";
import { CountTicks, LedgerReadout, Sfx } from "../components/UI";
import { catById } from "../data/persona";
import { COLORS, FONT_STACK, SAFE_X } from "../theme";

const cat = catById("meals");
const ORDERS = [
  { t: "外卖已送达", s: "11:52 · 公司前台", r: -6 },
  { t: "外卖已送达", s: "20:47 · 小区门口", r: 4 },
  { t: "外卖已送达", s: "12:03 · 公司前台", r: -2 },
  { t: "外卖已送达", s: "21:15 · 小区门口", r: 7 },
];

/** 07 吃饭：一个人对着平板吃外卖的场景插画，外卖小票一张张叠上来 */
export const MealsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Backdrop color={cat.color} intensity={0.16} x={30} y={34} />
      <Sfx name="whoosh" at={0} volume={0.35} />
      <CountTicks start={10} duration={30} every={3} />
      {ORDERS.map((_, i) => (
        <Sfx key={i} name="page" at={10 + i * 7} volume={0.25} />
      ))}
      <BalanceHUD catId="meals" />
      <Camera from={1.02} to={1.06} driftX={10}>
        <SceneImage src="images/scenes/meals.png" focusX={0.45} focusY={0.5} glow={cat.color} driftX={-10} />
        <div style={{ position: "absolute", top: 320, left: 60, width: 300, height: 420 }}>
          {ORDERS.map((o, i) => {
            const s = spring({ frame: frame - 10 - i * 7, fps, config: { damping: 14, stiffness: 170 } });
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  top: i * 82,
                  width: 290,
                  padding: "12px 20px",
                  borderRadius: 14,
                  background: COLORS.paper,
                  color: COLORS.ink,
                  fontFamily: FONT_STACK,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                  opacity: s,
                  rotate: `${o.r * s}deg`,
                  translate: `${(1 - s) * -200}px ${(1 - s) * -60}px`,
                }}
              >
                <div style={{ fontSize: 26, fontWeight: 800 }}>{o.t}</div>
                <div style={{ fontSize: 20, color: "#6B6E75", marginTop: 2 }}>{o.s}</div>
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
