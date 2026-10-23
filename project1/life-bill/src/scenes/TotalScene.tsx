import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, GridLines } from "../components/Background";
import { Camera, EASE_OUT, Reveal } from "../components/Motion";
import { BigNumber, Body, Card, CountTicks, Mono, Sfx } from "../components/UI";
import { PERSONA, YEAR_HOURS } from "../data/persona";
import { COLORS, FONT_STACK, SAFE_X } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const COLS = 21;
const DOT = 26;
const GAP = 14;

/** 365 天日历点阵：逐日点亮 */
const YearGrid: React.FC<{ start: number; duration: number }> = ({ start, duration }) => {
  const frame = useCurrentFrame();
  const lit = interpolate(frame, [start, start + duration], [0, PERSONA.days], { ...clamp, easing: (t) => t * t * (3 - 2 * t) });
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, ${DOT}px)`, gap: GAP }}>
      {new Array(PERSONA.days).fill(0).map((_, i) => {
        const on = Math.min(1, Math.max(0, lit - i));
        const head = Math.abs(lit - i) < 6;
        return (
          <div
            key={i}
            style={{
              width: DOT,
              height: DOT,
              borderRadius: 7,
              background: on > 0 ? COLORS.blue : "rgba(245,247,250,0.07)",
              opacity: 0.25 + on * 0.75,
              scale: String(head && on > 0 ? 1.25 : 1),
              boxShadow: head && on > 0 ? `0 0 18px ${COLORS.blue}` : undefined,
            }}
          />
        );
      })}
    </div>
  );
};

/** 02 总时长：365 天点阵点亮，数字滚到 8,760 h */
export const TotalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const GRID_START = 30;
  const GRID_DUR = 62;
  const day = Math.round(interpolate(frame, [GRID_START, GRID_START + GRID_DUR], [0, PERSONA.days], { ...clamp, easing: (t) => t * t * (3 - 2 * t) }));
  const lock = spring({ frame: frame - (GRID_START + GRID_DUR), fps, config: { damping: 11, stiffness: 160 } });
  const flash = interpolate(frame, [GRID_START + GRID_DUR, GRID_START + GRID_DUR + 4, GRID_START + GRID_DUR + 22], [0, 0.5, 0], clamp);
  const gridFade = interpolate(frame, [GRID_START + GRID_DUR + 6, GRID_START + GRID_DUR + 30], [1, 0.25], { ...clamp, easing: EASE_OUT });

  return (
    <AbsoluteFill>
      <Backdrop color={COLORS.blue} intensity={0.2} y={42} />
      <GridLines opacity={0.04} />
      <Sfx name="click" at={8} volume={0.5} />
      <Sfx name="page" at={GRID_START} volume={0.35} />
      <CountTicks start={GRID_START} duration={GRID_DUR} every={3} volume={0.18} />
      <Sfx name="boom" at={GRID_START + GRID_DUR} volume={0.6} />

      <Camera from={1} to={1.05} driftY={-10}>
        {/* 人物卡 */}
        <div style={{ position: "absolute", top: 130, left: SAFE_X, right: SAFE_X }}>
          <Reveal delay={4} y={30}>
            <Card style={{ display: "flex", alignItems: "center", gap: 34, padding: "30px 40px" }} accent={COLORS.blue}>
              <div
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.green})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONT_STACK,
                  fontSize: 50,
                  fontWeight: 800,
                  color: COLORS.bg,
                  flexShrink: 0,
                }}
              >
                {PERSONA.name.slice(-1)}
              </div>
              <div style={{ fontFamily: FONT_STACK }}>
                <div style={{ fontSize: 26, letterSpacing: 6, color: COLORS.textFaint }}>账户持有人 · 虚构人物</div>
                <div style={{ fontSize: 50, fontWeight: 800, color: COLORS.text, marginTop: 4 }}>
                  {PERSONA.name}
                  <span style={{ fontSize: 34, fontWeight: 400, color: COLORS.textDim, marginLeft: 18 }}>
                    {PERSONA.age}岁 · {PERSONA.city} · {PERSONA.job}
                  </span>
                </div>
              </div>
            </Card>
          </Reveal>
        </div>

        {/* 日历点阵 */}
        <div style={{ position: "absolute", top: 400, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: gridFade }}>
          <Reveal delay={18} y={20}>
            <div style={{ display: "flex", justifyContent: "space-between", width: COLS * (DOT + GAP) - GAP, marginBottom: 26 }}>
              <Mono>JAN 01</Mono>
              <Mono style={{ color: COLORS.blue }}>DAY {String(day).padStart(3, "0")} / 365</Mono>
              <Mono>DEC 31</Mono>
            </div>
          </Reveal>
          <Reveal delay={18} y={30} blur={0}>
            <YearGrid start={GRID_START} duration={GRID_DUR} />
          </Reveal>
        </div>

        {/* 大数字 */}
        <div style={{ position: "absolute", top: 1170, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Reveal delay={GRID_START - 6} y={20}>
            <Body style={{ textAlign: "center", color: COLORS.text, fontWeight: 500 }}>365 天 × 24 小时</Body>
          </Reveal>
          <div style={{ scale: String(interpolate(lock, [0, 1], [0.92, 1])), marginTop: 6 }}>
            <BigNumber to={YEAR_HOURS} start={GRID_START} duration={GRID_DUR} size={250} color={COLORS.text} />
          </div>
          <Reveal delay={GRID_START + GRID_DUR + 14} y={24} style={{ marginTop: 26 }}>
            <Body style={{ textAlign: "center", fontSize: 46 }}>
              这是你全年的时间<span style={{ color: COLORS.blue, fontWeight: 700 }}>总额度</span>
            </Body>
            <Body style={{ textAlign: "center", fontSize: 38, color: COLORS.textFaint, marginTop: 6 }}>每一小时，都会被记账</Body>
          </Reveal>
        </div>
      </Camera>
      <AbsoluteFill style={{ background: COLORS.blue, opacity: flash, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};
