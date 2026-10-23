import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CAPTIONS } from "../data/captions";
import { SCENE_START } from "../data/timeline";
import { COLORS, FONT_STACK } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 底部字幕条（预留轨道）：读取 data/captions.ts，自动换算到总时间轴 */
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const line = CAPTIONS.find((c) => {
    const s = SCENE_START[c.scene] + c.at;
    const e = SCENE_START[c.scene] + c.end;
    return frame >= s && frame < e;
  });
  if (!line) return null;
  const s = SCENE_START[line.scene] + line.at;
  const e = SCENE_START[line.scene] + line.end;
  const o = interpolate(frame, [s, s + 6, e - 6, e], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 150, pointerEvents: "none" }}>
      <div
        style={{
          opacity: o,
          fontFamily: FONT_STACK,
          fontSize: 40,
          fontWeight: 500,
          color: COLORS.text,
          padding: "12px 28px",
          borderRadius: 14,
          background: "rgba(8,9,12,0.6)",
          maxWidth: 880,
          textAlign: "center",
        }}
      >
        {line.text}
      </div>
    </AbsoluteFill>
  );
};
