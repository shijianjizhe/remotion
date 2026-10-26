import React from "react";
import { Img, staticFile } from "remotion";

/** 预烘焙柔光贴片（避免逐帧 CSS blur）。 */
export const Glow: React.FC<{
  x: number;
  y: number;
  size: number;
  opacity?: number;
  /** ember = 更紧更亮的核心 */
  variant?: "gold" | "ember";
  rotate?: number;
  blend?: "screen" | "plus-lighter" | "normal";
}> = ({ x, y, size, opacity = 0.5, variant = "gold", rotate = 0, blend = "screen" }) => (
  <Img
    src={staticFile(variant === "ember" ? "tex/glow-ember.png" : "tex/glow-gold.png")}
    style={{
      position: "absolute",
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      opacity,
      transform: `rotate(${rotate}deg)`,
      mixBlendMode: blend,
      pointerEvents: "none",
    }}
  />
);
