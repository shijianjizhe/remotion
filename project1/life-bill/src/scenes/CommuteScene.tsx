import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Background";
import { BalanceHUD } from "../components/BalanceHUD";
import { SceneImage } from "../components/SceneImage";
import { Camera } from "../components/Motion";
import { CountTicks, LedgerReadout, Mono, Sfx } from "../components/UI";
import { catById } from "../data/persona";
import { COLORS, FONT_STACK, SAFE_X } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const cat = catById("commute");
const STATIONS = ["南邵", "沙河高教园", "沙河", "巩华城", "朱辛庄", "生命科学园", "西二旗"];
const GAP = 300;

/** 05 通勤：拥挤车厢的场景插画 + 地铁线路图横向飞驰 + 速度线 */
export const CommuteScene: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [0, 30], [0, 1], clamp);
  const travel = interpolate(frame, [0, 140], [0, GAP * (STATIONS.length - 2.3)], { ...clamp, easing: (t) => t * (2 - t * 0.6) / 1.4 });
  const LINE_Y = 380;
  return (
    <AbsoluteFill>
      <Backdrop color={cat.color} intensity={0.14} y={40} />
      <Sfx name="whoosh" at={0} volume={0.5} />
      <CountTicks start={10} duration={30} every={3} />
      {/* 速度线 */}
      <AbsoluteFill>
        {new Array(26).fill(0).map((_, i) => {
          const y = 460 + random(`sl-y-${i}`) * 520;
          const len = 120 + random(`sl-l-${i}`) * 300;
          const speed = 30 + random(`sl-v-${i}`) * 40;
          const x = 1200 - ((frame * speed + random(`sl-x-${i}`) * 2400) % 2600);
          return <div key={i} style={{ position: "absolute", left: x, top: y, width: len, height: 2, background: `linear-gradient(90deg, transparent, ${cat.color}66)` }} />;
        })}
      </AbsoluteFill>
      <BalanceHUD catId="commute" />
      <Camera from={1} to={1.03}>
        <SceneImage src="images/scenes/commute.png" top={430} height={600} focusX={0.5} focusY={0.35} glow={cat.color} driftX={-16} />
        <div style={{ position: "absolute", top: 304, left: SAFE_X }}>
          <Mono style={{ color: cat.color }}>北京昌平线 · 南邵—西二旗 · 早 08:40 / 晚 21:30</Mono>
        </div>
        {/* 线路 */}
        <div style={{ position: "absolute", top: LINE_Y + 2, left: 0, right: 0, height: 6, background: `${cat.color}`, boxShadow: `0 0 20px ${cat.color}`, opacity: draw }} />
        {STATIONS.map((s, i) => {
          const x = 300 + i * GAP - travel;
          const near = Math.abs(x - 300) < 120;
          return (
            <div key={s} style={{ position: "absolute", left: x - 30, top: LINE_Y - 25, opacity: draw }}>
              <div style={{ width: 40, height: 40, margin: "10px 0 0 10px", borderRadius: "50%", background: near ? cat.color : COLORS.bg, border: `7px solid ${cat.color}`, boxSizing: "border-box", boxShadow: near ? `0 0 20px ${cat.color}` : "none" }} />
              <div
                style={{
                  position: "absolute",
                  top: 66,
                  left: 30,
                  translate: "-50% 0",
                  whiteSpace: "nowrap",
                  fontFamily: FONT_STACK,
                  fontSize: 28,
                  color: near ? COLORS.text : COLORS.textFaint,
                  fontWeight: near ? 700 : 400,
                }}
              >
                {s}
              </div>
            </div>
          );
        })}
        <div style={{ position: "absolute", top: 1000, left: SAFE_X }}>
          <LedgerReadout cat={cat} start={8} numberSize={200} />
        </div>
      </Camera>
    </AbsoluteFill>
  );
};
