import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C } from "../config/film";

/**
 * 深黑空间 + 局部暖金照明 + 轻微不规则材质。
 * 不使用 CSS blur（渲染成本高），全部用渐变与预烘焙纹理。
 */
export const Backdrop: React.FC<{
  /** 0..1 暖光强度 */
  warm?: number;
  /** 光源中心（画面比例） */
  gx?: number;
  gy?: number;
  /** 光斑尺寸倍数 */
  spread?: number;
  /** 墙面材质强度 */
  wall?: number;
  /** 额外色调：暖金或更冷更暗 */
  tone?: "warm" | "deep" | "parch";
}> = ({ warm = 1, gx = 0.46, gy = 0.34, spread = 1, wall = 0.3, tone = "warm" }) => {
  const w = Math.max(0, warm);
  const tint =
    tone === "parch"
      ? { r: 96, g: 74, b: 48 }
      : tone === "deep"
        ? { r: 44, g: 34, b: 24 }
        : { r: 74, g: 56, b: 34 };
  const core = (a: number) => `rgba(${tint.r},${tint.g},${tint.b},${(a * w).toFixed(3)})`;

  return (
    <AbsoluteFill style={{ backgroundColor: C.black, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${62 * spread}% ${56 * spread}% at ${gx * 100}% ${gy * 100}%, ${core(
            0.11,
          )} 0%, ${core(0.055)} 32%, ${core(0.018)} 58%, rgba(9,9,8,0) 78%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 96% 88% at 50% 66%, rgba(30,23,16,${(0.14 * w).toFixed(
            3,
          )}) 0%, rgba(13,12,10,${(0.07 * w).toFixed(3)}) 46%, rgba(9,9,8,0) 74%)`,
        }}
      />
      <Img
        src={staticFile("tex/wall.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: wall,
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill style={{ backgroundColor: "rgba(9,9,8,0.6)" }} />
    </AbsoluteFill>
  );
};
