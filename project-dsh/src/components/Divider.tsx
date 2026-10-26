import React from "react";
import { C } from "../config/film";

/** 细金线 + 菱形节点，用于版式分隔（原创排版语言）。 */
export const Divider: React.FC<{
  x?: number;
  y?: number;
  width: number;
  opacity?: number;
  /** 生长进度 0..1 */
  grow?: number;
}> = ({ x = 960, y = 0, width, opacity = 0.5, grow = 1 }) => {
  const w = width * Math.max(0, Math.min(1, grow));
  return (
    <svg
      width={1920}
      height={1080}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity }}
    >
      <line x1={x - w / 2} y1={y} x2={x + w / 2} y2={y} stroke={C.gold} strokeWidth={1} opacity={0.55} />
      <path
        d={`M ${x} ${y - 4.4} L ${x + 4.4} ${y} L ${x} ${y + 4.4} L ${x - 4.4} ${y} Z`}
        fill={C.goldHi}
        opacity={0.8 * Math.min(1, w / 40)}
      />
    </svg>
  );
};
