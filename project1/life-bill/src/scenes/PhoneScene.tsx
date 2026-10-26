import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Background";
import { BalanceHUD } from "../components/BalanceHUD";
import { SceneImage } from "../components/SceneImage";
import { Camera } from "../components/Motion";
import { CountTicks, LedgerReadout, Sfx } from "../components/UI";
import { catById } from "../data/persona";
import { COLORS, FONT_STACK, SAFE_X } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const cat = catById("phone");
const NOTIFS = [
  { t: "短视频", m: "为你推荐 · 再看一个", at: 18, x: 70, y: 330 },
  { t: "购物", m: "你关注的商品降价了", at: 34, x: 130, y: 470 },
  { t: "群聊 (99+)", m: "[有人@你]", at: 50, x: 60, y: 610 },
];

/** 06 刷手机：深夜窝在沙发刷手机的场景插画，通知不断弹出 */
export const PhoneScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = interpolate(frame, [0, 26], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Backdrop color={cat.color} intensity={0.26} y={30} />
      <Sfx name="swipe" at={0} volume={0.45} />
      <Sfx name="swipe" at={24} volume={0.3} />
      <Sfx name="swipe" at={48} volume={0.3} />
      <CountTicks start={10} duration={30} every={3} />
      {NOTIFS.map((n) => (
        <Sfx key={n.t} name="notify" at={n.at} volume={0.35} />
      ))}
      <BalanceHUD catId="phone" />
      <Camera from={1} to={1.06} rotate={-1}>
        <SceneImage src="images/scenes/phone.png" focusX={0.5} focusY={0.5} glow={cat.color} driftX={12} />
        {/* 手机屏幕光：随信息流"甩动"节奏闪烁 */}
        <div
          style={{
            position: "absolute",
            left: 785 - 130,
            top: 290 + 265 - 130,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${cat.color}88, transparent 65%)`,
            mixBlendMode: "screen",
            opacity: draw * (0.55 + 0.45 * Math.abs(Math.sin((frame / 24) * Math.PI))),
          }}
        />
        {NOTIFS.map((n) => {
          const s = spring({ frame: frame - n.at, fps, config: { damping: 12, stiffness: 180 } });
          const out = interpolate(frame, [n.at + 40, n.at + 52], [1, 0.45], clamp);
          return (
            <div
              key={n.t}
              style={{
                position: "absolute",
                left: n.x,
                top: n.y,
                width: 340,
                padding: "14px 20px",
                borderRadius: 20,
                background: "rgba(22,22,34,0.86)",
                backdropFilter: "blur(12px)",
                border: `1.5px solid ${cat.color}66`,
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                fontFamily: FONT_STACK,
                opacity: s * out,
                scale: String(0.6 + 0.4 * s),
                transformOrigin: "100% 50%",
              }}
            >
              <div style={{ fontSize: 22, color: cat.color, fontWeight: 700 }}>{n.t}</div>
              <div style={{ fontSize: 26, color: COLORS.text, marginTop: 2 }}>{n.m}</div>
            </div>
          );
        })}
        <div style={{ position: "absolute", top: 1000, left: SAFE_X }}>
          <LedgerReadout cat={cat} start={8} numberSize={200} />
        </div>
      </Camera>
    </AbsoluteFill>
  );
};
