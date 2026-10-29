import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * 全幅照片层：Ken Burns 推拉 + 渐变压暗，保证上层文字可读。
 * 图片由 codex-image（GPT Image）生成，见 ASSETS.md。
 */
export const PhotoLayer: React.FC<{
  src: string;
  opacity?: number;
  fadeIn?: [number, number];
  zoom?: [number, number];
  panY?: number;
  /** 上下压暗强度 0~1 */
  shade?: number;
  objectPosition?: string;
}> = ({ src, opacity = 1, fadeIn = [0, 20], zoom = [1.08, 1.0], panY = -30, shade = 0.75, objectPosition = "50% 50%" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [0, durationInFrames], [0, 1], clamp);
  const a = interpolate(frame, fadeIn, [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: opacity * a }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition,
          scale: String(zoom[0] + (zoom[1] - zoom[0]) * p),
          translate: `0px ${panY * p}px`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${COLORS.bgDeep}${Math.round(shade * 230).toString(16).padStart(2, "0")} 0%, transparent 32%, transparent 55%, ${COLORS.bgDeep}${Math.round(shade * 255).toString(16).padStart(2, "0")} 88%)`,
        }}
      />
    </AbsoluteFill>
  );
};
