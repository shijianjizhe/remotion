import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, GridLines } from "../components/Background";
import { CharReveal, EASE_OUT, Reveal } from "../components/Motion";
import { fmt } from "../components/format";
import { Body, Mono, Sfx } from "../components/UI";
import { CATEGORIES, PERSONA } from "../data/persona";
import { COLORS, FONT_STACK, SAFE_X } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const TAP_AT = 92;
const TAP_ID = "family";

/** 12 互动页：七个分类变成可"点选"的按钮，手指点中「陪家人」 */
export const InteractScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tapIdx = CATEGORIES.findIndex((c) => c.id === TAP_ID);
  // 手指轨迹：从右下角滑向目标按钮
  const col = tapIdx % 2;
  const row = Math.floor(tapIdx / 2);
  const BTN_W = 430;
  const BTN_H = 130;
  const GAP = 30;
  const GRID_TOP = 640;
  const tx = SAFE_X + col * (BTN_W + GAP) + BTN_W * 0.62;
  const ty = GRID_TOP + row * (BTN_H + GAP) + BTN_H * 0.6;
  const move = interpolate(frame, [TAP_AT - 30, TAP_AT - 4], [0, 1], { ...clamp, easing: EASE_OUT });
  const fx = interpolate(move, [0, 1], [1000, tx]);
  const fy = interpolate(move, [0, 1], [1900, ty]);
  const press = frame >= TAP_AT && frame < TAP_AT + 6 ? 0.85 : 1;
  const ripple = interpolate(frame, [TAP_AT, TAP_AT + 24], [0, 1], clamp);
  const fade = interpolate(frame, [150, 170], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Backdrop color={COLORS.amber} intensity={interpolate(frame, [TAP_AT, TAP_AT + 30], [0.08, 0.2], clamp)} y={50} />
      <GridLines opacity={0.035} />
      <Sfx name="whoosh" at={0} volume={0.3} />
      <Sfx name="click" at={TAP_AT} volume={0.7} />
      <Sfx name="shimmer" at={TAP_AT + 2} volume={0.35} />

      <div style={{ position: "absolute", top: 230, left: SAFE_X, right: SAFE_X, fontFamily: FONT_STACK }}>
        <Reveal delay={2} y={10}>
          <Mono style={{ color: COLORS.amber, letterSpacing: 8 }}>YOUR TURN · 互动</Mono>
        </Reveal>
        <div style={{ marginTop: 24, fontSize: 92, fontWeight: 800, color: COLORS.text, lineHeight: 1.25, letterSpacing: 3 }}>
          <CharReveal text="你最想拿回" delay={6} stagger={3} />
          <br />
          <CharReveal text="哪一项时间？" delay={22} stagger={3} charStyle={(i) => (i < 3 ? { color: COLORS.amber } : {})} />
        </div>
      </div>

      <div style={{ position: "absolute", top: GRID_TOP, left: SAFE_X, width: BTN_W * 2 + GAP, display: "flex", flexWrap: "wrap", gap: GAP }}>
        {CATEGORIES.map((c, i) => {
          const s = spring({ frame: frame - 30 - i * 4, fps, config: { damping: 14, stiffness: 160 } });
          const selected = c.id === TAP_ID && frame >= TAP_AT;
          const dim = frame >= TAP_AT && !selected ? interpolate(frame, [TAP_AT, TAP_AT + 14], [1, 0.4], clamp) : 1;
          return (
            <div
              key={c.id}
              style={{
                position: "relative",
                width: BTN_W,
                height: BTN_H,
                boxSizing: "border-box",
                borderRadius: 28,
                padding: "0 34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: selected ? `${c.color}2e` : "rgba(255,255,255,0.05)",
                border: `2px solid ${selected ? c.color : "rgba(255,255,255,0.1)"}`,
                boxShadow: selected ? `0 0 50px ${c.color}66` : undefined,
                opacity: s * dim,
                translate: `0px ${(1 - s) * 50}px`,
                scale: String(selected ? press * (1 + 0.04 * Math.sin(Math.min(1, ripple) * Math.PI)) : 1),
                fontFamily: FONT_STACK,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: c.color }} />
                <span style={{ fontSize: 44, fontWeight: 700, color: COLORS.text }}>{c.label}</span>
              </div>
              <span style={{ fontSize: 30, color: selected ? c.color : COLORS.textFaint, fontVariantNumeric: "tabular-nums" }}>{fmt(c.hours)}h</span>
              {selected ? (
                <div
                  style={{
                    position: "absolute",
                    left: tx - (SAFE_X + col * (BTN_W + GAP)) - 160,
                    top: ty - (GRID_TOP + row * (BTN_H + GAP)) - 160,
                    width: 320,
                    height: 320,
                    borderRadius: "50%",
                    border: `3px solid ${c.color}`,
                    scale: String(0.1 + ripple * 0.9),
                    opacity: 1 - ripple,
                    pointerEvents: "none",
                  }}
                />
              ) : null}
            </div>
          );
        })}
        {/* 第 8 格：留给自己 —— 本来就属于你 */}
        <div style={{ width: BTN_W, height: BTN_H, display: "flex", alignItems: "center", justifyContent: "center", opacity: interpolate(frame, [62, 78], [0, 0.8], clamp) }}>
          <Body size={30} style={{ color: COLORS.textFaint, textAlign: "center" }}>
            点一个，留在评论区
          </Body>
        </div>
      </div>

      {/* 手指光标 */}
      <div
        style={{
          position: "absolute",
          left: fx - 40,
          top: fy - 40,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(245,247,250,0.9)",
          boxShadow: "0 0 0 10px rgba(245,247,250,0.18), 0 10px 30px rgba(0,0,0,0.5)",
          scale: String(press),
          opacity: interpolate(frame, [TAP_AT - 30, TAP_AT - 20, TAP_AT + 30, TAP_AT + 44], [0, 1, 1, 0], clamp),
        }}
      />

      <div style={{ position: "absolute", top: 1340, left: SAFE_X, right: SAFE_X, fontFamily: FONT_STACK, textAlign: "center" }}>
        {frame >= TAP_AT + 12 ? (
          <Reveal delay={TAP_AT + 12} y={20}>
            <div style={{ fontSize: 50, fontWeight: 700, color: COLORS.amber }}>我选「陪家人」—— 你呢？</div>
          </Reveal>
        ) : null}
        <Reveal delay={TAP_AT + 30} y={16} style={{ marginTop: 26 }}>
          <Body size={36}>评论区告诉我 ↓</Body>
        </Reveal>
      </div>

      <div style={{ position: "absolute", bottom: 110, left: 0, right: 0, textAlign: "center" }}>
        <Mono style={{ fontSize: 22, letterSpacing: 2 }}>
          * 数据基于虚构人物「{PERSONA.name}」的作息设定计算，仅供参考
        </Mono>
      </div>
    </AbsoluteFill>
  );
};
