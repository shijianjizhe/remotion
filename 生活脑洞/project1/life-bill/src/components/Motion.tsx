import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

/** 模糊 + 上移 渐显（电影字幕式入场），可选退场 */
export const Reveal: React.FC<{
  delay?: number;
  duration?: number;
  y?: number;
  blur?: number;
  exitAt?: number;
  exitDuration?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ delay = 0, duration = 22, y = 40, blur = 14, exitAt, exitDuration = 14, style, children }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + duration], [0, 1], { ...clamp, easing: EASE_OUT });
  const out =
    exitAt === undefined
      ? 1
      : interpolate(frame, [exitAt, exitAt + exitDuration], [1, 0], { ...clamp, easing: EASE_IN_OUT });
  return (
    <div
      style={{
        opacity: p * out,
        translate: `0px ${(1 - p) * y - (1 - out) * 20}px`,
        filter: `blur(${(1 - p) * blur + (1 - out) * 8}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** 逐字出现（中文按字拆分） */
export const CharReveal: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  style?: React.CSSProperties;
  charStyle?: (i: number) => React.CSSProperties;
}> = ({ text, delay = 0, stagger = 2, style, charStyle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <span style={{ display: "inline-block", whiteSpace: "pre", ...style }}>
      {Array.from(text).map((ch, i) => {
        const s = spring({ frame: frame - delay - i * stagger, fps, config: { damping: 200 }, durationInFrames: 18 });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: s,
              translate: `0px ${(1 - s) * 30}px`,
              filter: `blur(${(1 - s) * 10}px)`,
              ...(charStyle ? charStyle(i) : {}),
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};

/** 镜头：整场景缓慢推进 + 轻微漂移，营造电影感 */
export const Camera: React.FC<{
  from?: number;
  to?: number;
  driftX?: number;
  driftY?: number;
  rotate?: number;
  children: React.ReactNode;
}> = ({ from = 1, to = 1.06, driftX = 0, driftY = -20, rotate = 0, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [0, durationInFrames], [0, 1], clamp);
  return (
    <AbsoluteFill
      style={{
        scale: String(from + (to - from) * p),
        translate: `${driftX * p}px ${driftY * p}px`,
        rotate: `${rotate * p}deg`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const useSpring = (delay: number, config: { damping?: number; stiffness?: number; mass?: number } = { damping: 200 }, durationInFrames?: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config, durationInFrames });
};

export const lerp = (frame: number, input: number[], output: number[], easing = EASE_OUT) =>
  interpolate(frame, input, output, { ...clamp, easing });
