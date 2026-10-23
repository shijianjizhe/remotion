import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";

/** 场景底色：深色 + 主题色径向光晕（缓慢呼吸漂移） */
export const Backdrop: React.FC<{
  color?: string;
  intensity?: number;
  x?: number;
  y?: number;
}> = ({ color = COLORS.blue, intensity = 0.22, x = 50, y = 38 }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 45) * 4;
  const breathe = 1 + Math.sin(frame / 30) * 0.06;
  const alpha = Math.round(intensity * breathe * 255)
    .toString(16)
    .padStart(2, "0");
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 85% 55% at ${x + drift}% ${y}%, ${color}${alpha} 0%, transparent 70%), linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.bgDeep} 100%)`,
      }}
    />
  );
};

/** 细微网格 —— 轻科技感 */
export const GridLines: React.FC<{ opacity?: number; size?: number }> = ({
  opacity = 0.05,
  size = 90,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundImage: `linear-gradient(${COLORS.text} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.text} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `0px ${(frame * 0.6) % size}px`,
        maskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, black 0%, transparent 80%)",
        WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, black 0%, transparent 80%)",
      }}
    />
  );
};

/** 全局胶片颗粒 + 暗角 */
export const FilmFinish: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 50;
  const flicker = interpolate(random(`fl-${Math.floor(frame / 3)}`), [0, 1], [0.97, 1]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ opacity: 0.075, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id={`grain-${seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          opacity: flicker,
          background:
            "radial-gradient(ellipse 75% 60% at 50% 48%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/** 确定性星点 / 粒子 */
export const Particles: React.FC<{
  count?: number;
  color?: string;
  seed?: string;
  speed?: number;
  maxSize?: number;
  opacity?: number;
}> = ({ count = 40, color = COLORS.text, seed = "p", speed = 0.4, maxSize = 4, opacity = 0.5 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {new Array(count).fill(0).map((_, i) => {
        const x = random(`${seed}-x-${i}`) * 1080;
        const y0 = random(`${seed}-y-${i}`) * 1920;
        const s = 1 + random(`${seed}-s-${i}`) * maxSize;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(frame / (12 + i % 9) + i));
        const y = (((y0 - frame * speed * (0.5 + random(`${seed}-v-${i}`))) % 1920) + 1920) % 1920;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: s,
              height: s,
              borderRadius: "50%",
              background: color,
              opacity: opacity * tw,
              boxShadow: `0 0 ${s * 3}px ${color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
