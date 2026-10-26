import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "./ui";

/** 场景外壳：快速推入 / 冲出式转场（不做慢淡） */
export const SceneShell: React.FC<{
  children: React.ReactNode;
  fadeIn?: number;
  fadeOut?: number;
}> = ({ children, fadeIn = 8, fadeOut = 10 }) => {
  const f = useCurrentFrame();
  const { durationInFrames: d } = useVideoConfig();
  const fi = Math.max(1, fadeIn);
  const fo = Math.max(1, fadeOut);
  const o = interpolate(f, [0, fi, d - fo, d], [fadeIn ? 0 : 1, 1, 1, fadeOut ? 0 : 1], clamp);
  const sIn = fadeIn ? interpolate(f, [0, fi], [0.96, 1], clamp) : 1;
  const sOut = fadeOut ? interpolate(f, [d - fo, d], [1, 1.08], clamp) : 1;
  const blur = fadeOut ? interpolate(f, [d - fo, d], [0, 6], clamp) : 0;
  return (
    <AbsoluteFill
      style={{ opacity: o, transform: `scale(${sIn * sOut})`, filter: blur > 0 ? `blur(${blur}px)` : undefined }}
    >
      {children}
    </AbsoluteFill>
  );
};
