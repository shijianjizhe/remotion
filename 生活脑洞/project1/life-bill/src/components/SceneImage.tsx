import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * 场景插画：人物生活场景图（public/images/scenes/*.png，codex-image 生成，见 ASSETS.md）。
 * - 四周羽化融入深色背景
 * - 入场：模糊 → 清晰 + 轻微上浮 + 缩放回弹
 * - 场景内：缓慢 Ken Burns 推近
 */
export const SceneImage: React.FC<{
  src: string;
  top?: number;
  height?: number;
  /** 0~1，图片焦点位置（object-position） */
  focusX?: number;
  focusY?: number;
  delay?: number;
  /** Ken Burns 终点缩放 */
  push?: number;
  /** 左右漂移像素 */
  driftX?: number;
  glow?: string;
  children?: React.ReactNode;
}> = ({ src, top = 290, height = 730, focusX = 0.5, focusY = 0.5, delay = 0, push = 1.07, driftX = 0, glow, children }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 90 } });
  const p = interpolate(frame, [delay, durationInFrames], [0, 1], clamp);
  const opacity = interpolate(frame, [delay, delay + 14], [0, 1], clamp);
  const blur = interpolate(enter, [0, 1], [14, 0]);
  const scale = interpolate(enter, [0, 1], [1.14, 1]) * interpolate(p, [0, 1], [1, push]);
  const mask = [
    "linear-gradient(to bottom, transparent 0%, black 13%, black 70%, transparent 100%)",
    "linear-gradient(to right, transparent 0%, black 9%, black 91%, transparent 100%)",
  ].join(", ");
  return (
    <div style={{ position: "absolute", top, left: 0, width: 1080, height }}>
      {glow ? (
        <div
          style={{
            position: "absolute",
            inset: "10% 12%",
            background: `radial-gradient(ellipse at 50% 50%, ${glow}33, transparent 70%)`,
            filter: "blur(40px)",
            opacity,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          maskImage: mask,
          WebkitMaskImage: mask,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
          opacity,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${focusX * 100}% ${focusY * 100}%`,
            scale: String(scale),
            transformOrigin: `${focusX * 100}% ${focusY * 100}%`,
            translate: `${driftX * p}px ${(1 - enter) * 40}px`,
            filter: `blur(${blur}px)`,
          }}
        />
      </div>
      {children}
    </div>
  );
};
