import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Background";
import { PhotoLayer } from "../components/PhotoLayer";
import { BalanceHUD } from "../components/BalanceHUD";
import { TrainIllo } from "../components/Illustrations";
import { Camera } from "../components/Motion";
import { CountTicks, LedgerReadout, Mono, Sfx } from "../components/UI";
import { catById } from "../data/persona";
import { COLORS, FONT_STACK, SAFE_X } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const cat = catById("commute");
const STATIONS = ["张江高科", "龙阳路", "世纪大道", "陆家嘴", "南京东路", "人民广场", "静安寺"];
const GAP = 300;

/** 05 通勤：地铁线路图横向飞驰 + 速度线 */
export const CommuteScene: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [0, 30], [0, 1], clamp);
  const travel = interpolate(frame, [0, 115], [0, GAP * (STATIONS.length - 2.3)], { ...clamp, easing: (t) => t * (2 - t * 0.6) / 1.4 });
  const LINE_Y = 760;
  return (
    <AbsoluteFill>
      <Backdrop color={cat.color} intensity={0.14} y={40} />
      <PhotoLayer src="images/metro-night.png" opacity={0.5} fadeIn={[0, 24]} zoom={[1.15, 1.05]} panY={0} shade={0.95} />
      <Sfx name="whoosh" at={0} volume={0.5} />
      <CountTicks start={10} duration={30} every={3} />
      {/* 速度线 */}
      <AbsoluteFill>
        {new Array(26).fill(0).map((_, i) => {
          const y = 340 + random(`sl-y-${i}`) * 900;
          const len = 120 + random(`sl-l-${i}`) * 300;
          const speed = 30 + random(`sl-v-${i}`) * 40;
          const x = 1200 - ((frame * speed + random(`sl-x-${i}`) * 2400) % 2600);
          return <div key={i} style={{ position: "absolute", left: x, top: y, width: len, height: 2, background: `linear-gradient(90deg, transparent, ${cat.color}66)` }} />;
        })}
      </AbsoluteFill>
      <BalanceHUD catId="commute" />
      <Camera from={1} to={1.03}>
        <div style={{ position: "absolute", top: 400, left: SAFE_X }}>
          <Mono style={{ color: cat.color }}>LINE 02 · 往返 22 站 · 早 08:40 / 晚 21:30</Mono>
        </div>
        {/* 线路 */}
        <div style={{ position: "absolute", top: LINE_Y, left: 0, right: 0, height: 10, background: `${cat.color}`, boxShadow: `0 0 20px ${cat.color}`, opacity: draw }} />
        {STATIONS.map((s, i) => {
          const x = 300 + i * GAP - travel;
          const near = Math.abs(x - 300) < 120;
          return (
            <div key={s} style={{ position: "absolute", left: x - 30, top: LINE_Y - 25, opacity: draw }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: near ? cat.color : COLORS.bg, border: `8px solid ${cat.color}`, boxSizing: "border-box" }} />
              <div
                style={{
                  position: "absolute",
                  top: 80,
                  left: 30,
                  translate: "-50% 0",
                  whiteSpace: "nowrap",
                  fontFamily: FONT_STACK,
                  fontSize: 32,
                  color: near ? COLORS.text : COLORS.textFaint,
                  fontWeight: near ? 700 : 400,
                }}
              >
                {s}
              </div>
            </div>
          );
        })}
        <div style={{ position: "absolute", top: LINE_Y - 270, left: 200, translate: `0px ${Math.sin(frame * 1.7) * 2}px` }}>
          <TrainIllo size={210} color={COLORS.text} progress={draw} />
        </div>
        <div style={{ position: "absolute", top: 1000, left: SAFE_X }}>
          <LedgerReadout cat={cat} start={8} numberSize={200} />
        </div>
      </Camera>
    </AbsoluteFill>
  );
};
