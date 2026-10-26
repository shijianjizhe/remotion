import React, { useMemo } from "react";
import { Img, staticFile } from "remotion";
import { mulberry32 } from "../lib/rng";
import { C } from "../config/film";

/** 不规则手撕边：由固定种子生成的多边形。 */
const deckle = (w: number, h: number, seed: number, amp = 5) => {
  const rnd = mulberry32(seed);
  const pts: string[] = [];
  const step = 26;
  for (let x = 0; x <= w; x += step) pts.push(`${x},${(rnd() - 0.5) * amp * 2}`);
  for (let y = step; y <= h; y += step) pts.push(`${w + (rnd() - 0.5) * amp * 2},${y}`);
  for (let x = w; x >= 0; x -= step) pts.push(`${x},${h + (rnd() - 0.5) * amp * 2}`);
  for (let y = h - step; y > 0; y -= step) pts.push(`${(rnd() - 0.5) * amp * 2},${y}`);
  return `polygon(${pts.join(",")})`;
};

/**
 * 羊皮纸：只在文献、账页、档案卡出现。
 * 材质为预烘焙纹理，边缘用种子多边形裁切，避免整屏米黄。
 */
export const Parchment: React.FC<{
  width: number;
  height: number;
  x?: number;
  y?: number;
  rotate?: number;
  /** 绕 Y 轴翻转，用于“旋开” */
  tiltY?: number;
  tiltX?: number;
  opacity?: number;
  seed?: number;
  children?: React.ReactNode;
  /** 纸面暗化（0..1） */
  dim?: number;
  padding?: number;
}> = ({
  width,
  height,
  x = 0,
  y = 0,
  rotate = 0,
  tiltY = 0,
  tiltX = 0,
  opacity = 1,
  seed = 7,
  children,
  dim = 0,
  padding = 0,
}) => {
  const clip = useMemo(() => deckle(width, height, seed, 5), [width, height, seed]);
  return (
    <div
      style={{
        position: "absolute",
        left: 960 + x - width / 2,
        top: 540 + y - height / 2,
        width,
        height,
        opacity,
        transform: `perspective(1700px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotate(${rotate}deg)`,
        transformOrigin: "50% 50%",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -6,
          clipPath: clip,
          background: "rgba(28,22,15,0.85)",
          filter: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: clip,
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile("tex/parchment.png")}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 78% 68% at 44% 34%, rgba(255,246,222,0.17) 0%, rgba(255,246,222,0.04) 42%, rgba(110,84,50,0.24) 78%, rgba(76,56,32,0.55) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `rgba(42,32,20,${dim})`,
          }}
        />
        <div style={{ position: "absolute", inset: 0, padding }}>{children}</div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: `inset 0 0 46px rgba(74,52,26,0.42), inset 0 0 8px rgba(60,42,22,0.35)`,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};

export const INK = C.ink;
