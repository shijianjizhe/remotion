import React from "react";

/** 只做变换，不做模糊：保证 1920x1080 边缘稳定与渲染速度。 */
export const Camera: React.FC<{
  scale?: number;
  x?: number;
  y?: number;
  rot?: number;
  origin?: string;
  children: React.ReactNode;
}> = ({ scale = 1, x = 0, y = 0, rot = 0, origin = "50% 50%", children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      transform: `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rot}deg)`,
      transformOrigin: origin,
      willChange: "transform",
    }}
  >
    {children}
  </div>
);
