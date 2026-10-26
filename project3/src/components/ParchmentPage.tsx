import React from "react";
import {AbsoluteFill, Img, staticFile} from "remotion";

export const TEX = {
  wide: staticFile("textures/parchment_wide.png"),
  page: staticFile("textures/parchment_page.png"),
  ticket: staticFile("textures/parchment_ticket.png"),
};

/** 隐藏挂载全部纹理：Remotion 会等待 <Img> 加载，之后 SVG <image> 使用缓存，避免闪烁。 */
export const TexturePreloader: React.FC = () => (
  <AbsoluteFill style={{opacity: 0, pointerEvents: "none"}}>
    {Object.values(TEX).map((src) => (
      <Img key={src} src={src} style={{width: 4, height: 4}} />
    ))}
  </AbsoluteFill>
);

/** SVG 内的羊皮纸（不规则边缘与纤维来自原创程序纹理） */
export const Parchment: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  kind?: keyof typeof TEX;
  opacity?: number;
  tint?: number; // 0..1 压暗
}> = ({x, y, w, h, kind = "wide", opacity = 1, tint = 0}) => (
  <g opacity={opacity}>
    <rect x={x + 10} y={y + 16} width={w - 8} height={h - 8} fill="#000" opacity={0.45} rx={6} style={{filter: "blur(10px)"}} />
    <image href={TEX[kind]} x={x} y={y} width={w} height={h} preserveAspectRatio="none" />
    {tint > 0 && <rect x={x + 14} y={y + 14} width={w - 28} height={h - 28} fill="#1a120a" opacity={tint} />}
  </g>
);
