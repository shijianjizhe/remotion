import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { hash01 } from "../lib/rng";

/**
 * 低幅度胶片颗粒 + 极轻暗角。
 * 颗粒相位按“镜头”固定（不是逐帧随机）：逐帧噪点会让画面显得脏，
 * 也会让编码码率爆炸；同一镜头内保持静态，只在剪辑点更换相位。
 */
export const GrainAndVignette: React.FC<{
  /** 镜头标识（用起始帧），决定颗粒相位 */
  phaseKey: number;
  grain?: number;
  vignette?: number;
  /** 颗粒整体强度的缓慢呼吸（0..1 的幅度） */
  breathe?: number;
  frame?: number;
}> = ({ phaseKey, grain = 0.34, vignette = 1, breathe = 0.05, frame = 0 }) => {
  const ox = Math.round(hash01(phaseKey, 91) * 512);
  const oy = Math.round(hash01(phaseKey, 57) * 512);
  const op = grain * (1 + (breathe > 0 ? breathe * Math.sin(frame * 0.02) : 0));
  return (
    <>
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("tex/grain.png")})`,
          backgroundSize: "512px 512px",
          backgroundPosition: `${ox}px ${oy}px`,
          backgroundRepeat: "repeat",
          opacity: op,
          pointerEvents: "none",
        }}
      />
      <Img
        src={staticFile("tex/vignette.png")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: vignette }}
      />
    </>
  );
};
