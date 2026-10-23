import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Particles } from "../components/Background";
import { CharReveal, EASE_OUT, Reveal } from "../components/Motion";
import { PhotoLayer } from "../components/PhotoLayer";
import { Mono, Sfx } from "../components/UI";
import { PERSONA, SELF_COLOR } from "../data/persona";
import { COLORS, FONT_STACK } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 11 结尾文案：黎明的城市，逐字浮现的提问 */
export const QuestionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [70, 120], [0, 1], { ...clamp, easing: EASE_OUT });
  return (
    <AbsoluteFill style={{ background: COLORS.bgDeep }}>
      <PhotoLayer src="images/dawn-city.png" opacity={0.85} fadeIn={[0, 40]} zoom={[1.12, 1.0]} panY={-40} shade={0.8} />
      <Particles count={24} seed="q" color={SELF_COLOR} speed={0.12} opacity={0.35} maxSize={2.5} />
      <Sfx name="shimmer" at={6} volume={0.35} />

      <div style={{ position: "absolute", top: 560, left: 0, right: 0, textAlign: "center", fontFamily: FONT_STACK }}>
        <div style={{ fontSize: 76, fontWeight: 300, color: COLORS.textDim, letterSpacing: 6, lineHeight: 1.5 }}>
          <CharReveal text="如果人生" delay={8} stagger={4} />
          <br />
          <CharReveal text="真的有一张账单，" delay={26} stagger={4} />
        </div>
        <div style={{ marginTop: 50, fontSize: 104, fontWeight: 800, color: COLORS.text, letterSpacing: 6, lineHeight: 1.3, textShadow: "0 10px 60px rgba(0,0,0,0.8)" }}>
          <CharReveal text="你会满意" delay={66} stagger={5} />
          <br />
          <CharReveal text="这一年吗？" delay={88} stagger={5} charStyle={() => ({ color: COLORS.text })} />
        </div>
        <div style={{ margin: "56px auto 0", width: 520 * line, height: 2, background: `linear-gradient(90deg, transparent, ${SELF_COLOR}, transparent)` }} />
        <Reveal delay={118} y={10} style={{ marginTop: 30 }}>
          <Mono style={{ letterSpacing: 8 }}>STATEMENT CLOSED · {PERSONA.year}.12.31</Mono>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};
