import React from "react";
import { Coin } from "./Coin";

/** 以中心点定位的金币 */
export const CoinAt: React.FC<{
  x: number;
  y: number;
  size: number;
  tilt?: number;
  spin?: number;
  glow?: number;
  opacity?: number;
  ghost?: boolean;
  motif?: "eye" | "branch";
  spec?: number;
  shadow?: boolean;
  rotate?: number;
}> = ({ x, y, size, rotate = 0, ...rest }) => (
  <div
    style={{
      position: "absolute",
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      transform: `rotate(${rotate}deg)`,
    }}
  >
    <Coin size={size} {...rest} />
  </div>
);
