import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, Particles } from "../components/Background";
import { PhotoLayer } from "../components/PhotoLayer";
import { BalanceHUD } from "../components/BalanceHUD";
import { HomeIllo } from "../components/Illustrations";
import { Camera, EASE_OUT, Reveal } from "../components/Motion";
import { BigNumber, Body, Mono, ProgressBar, Sfx, Tag } from "../components/UI";
import { catById, PERSONA, YEAR_HOURS } from "../data/persona";
import { COLORS, FONT_STACK, SAFE_X } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const cat = catById("family");
// 2025 年：春节 1/28–2/1（第 28–32 天，0 起算 27–31），中秋 10/6（0 起算 278）
const HOME_DAYS = new Set([27, 28, 29, 30, 31, 278]);
const COLS = 21;
const DOT = 22;
const GAP = 11;

/** 09 陪家人：情绪转折。整年 365 个格子里，只有 6 格亮起暖光 */
export const FamilyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const gridIn = interpolate(frame, [0, 24, 104, 130], [0, 1, 1, 0.12], { ...clamp, easing: EASE_OUT });
  const photo = interpolate(frame, [40, 100, 110, 140], [0, 0.35, 0.35, 0.95], clamp);
  const draw = interpolate(frame, [70, 110], [0, 1], clamp);
  const punch = spring({ frame: frame - 112, fps, config: { damping: 200 }, durationInFrames: 30 });
  return (
    <AbsoluteFill>
      <Backdrop color={cat.color} intensity={interpolate(frame, [0, 120], [0.08, 0.22], clamp)} y={70} />
      <PhotoLayer src="images/home-window.png" opacity={photo} fadeIn={[0, 1]} zoom={[1.0, 1.12]} panY={-20} shade={0.85} objectPosition="70% 50%" />
      <Particles count={26} seed="family" color={cat.color} speed={0.15} opacity={0.4} maxSize={3} />
      <Sfx name="shimmer" at={18} volume={0.45} />
      <Sfx name="fill" at={50} volume={0.3} />
      <BalanceHUD catId="family" chargeAt={50} />
      <Camera from={1.05} to={1} driftY={14}>
        <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: gridIn }}>
          <div style={{ display: "flex", justifyContent: "space-between", width: COLS * (DOT + GAP) - GAP, marginBottom: 20 }}>
            <Mono>{PERSONA.year} · 365 天</Mono>
            <Mono style={{ color: cat.color }}>回家 6 天 · 距离 1,100 km</Mono>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, ${DOT}px)`, gap: GAP }}>
            {new Array(PERSONA.days).fill(0).map((_, i) => {
              const home = HOME_DAYS.has(i);
              const on = home ? interpolate(frame, [18 + (i === 278 ? 10 : (i - 27) * 3), 30 + (i === 278 ? 10 : (i - 27) * 3)], [0, 1], clamp) : 0;
              return (
                <div
                  key={i}
                  style={{
                    width: DOT,
                    height: DOT,
                    borderRadius: 6,
                    background: home && on > 0 ? cat.color : "rgba(245,247,250,0.07)",
                    opacity: home ? 0.3 + on * 0.7 : 1,
                    scale: String(home ? 1 + on * 0.25 : 1),
                    boxShadow: home && on > 0 ? `0 0 ${24 * on}px ${cat.color}` : undefined,
                  }}
                />
              );
            })}
          </div>
        </div>

        <div style={{ position: "absolute", top: 1000, left: SAFE_X, right: SAFE_X }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <Reveal delay={30} y={20}>
                <Tag color={cat.color} index={cat.index}>
                  {cat.label} · {cat.en}
                </Tag>
              </Reveal>
              <Reveal delay={34} y={30} style={{ marginTop: 22 }}>
                <BigNumber to={cat.hours} start={34} duration={24} size={200} color={cat.color} />
              </Reveal>
            </div>
            <div style={{ marginTop: 20 }}>
              <HomeIllo size={220} color={cat.color} progress={draw} />
            </div>
          </div>
          <Reveal delay={44} y={20} style={{ marginTop: 10 }}>
            <Body style={{ color: COLORS.text, fontWeight: 500 }}>{cat.formula}</Body>
            <Body size={34} style={{ color: COLORS.textFaint }}>{cat.note}</Body>
          </Reveal>
          <div style={{ marginTop: 34 }}>
            <ProgressBar value={cat.hours / YEAR_HOURS} start={52} duration={30} color={cat.color} width={900} label="占全年 8,760 小时" rightLabel={`${((cat.hours / YEAR_HOURS) * 100).toFixed(1)}%`} />
          </div>
          <div
            style={{
              marginTop: 50,
              fontFamily: FONT_STACK,
              fontSize: 78,
              fontWeight: 800,
              color: COLORS.text,
              letterSpacing: 6,
              opacity: punch,
              translate: `0px ${(1 - punch) * 30}px`,
              filter: `blur(${(1 - punch) * 12}px)`,
            }}
          >
            一年，只有 <span style={{ color: cat.color, textShadow: `0 0 40px ${cat.color}` }}>2 天</span>
          </div>
        </div>
      </Camera>
    </AbsoluteFill>
  );
};
