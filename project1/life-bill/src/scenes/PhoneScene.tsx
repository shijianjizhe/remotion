import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Background";
import { BalanceHUD } from "../components/BalanceHUD";
import { PhoneIllo } from "../components/Illustrations";
import { Camera } from "../components/Motion";
import { CountTicks, LedgerReadout, Sfx } from "../components/UI";
import { catById } from "../data/persona";
import { COLORS, FONT_STACK, SAFE_X } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const cat = catById("phone");
const FEED_COLORS = ["#9B8CFF", "#4DA3FF", "#FF6B9A", "#7CFFB2", "#FFB84D", "#6BE4FF"];
const NOTIFS = [
  { t: "短视频", m: "为你推荐 · 再看一个", at: 18, x: -250, y: 120 },
  { t: "购物", m: "你关注的商品降价了", at: 34, x: 240, y: 300 },
  { t: "群聊 (99+)", m: "[有人@你]", at: 50, x: -230, y: 470 },
];

/** 无限下滑的信息流 */
const Feed: React.FC = () => {
  const frame = useCurrentFrame();
  const ITEM = 190;
  // 下滑速度带有"甩动-减速"的节奏
  const flick = (f: number) => {
    const cycle = 24;
    const n = Math.floor(f / cycle);
    const t = (f % cycle) / cycle;
    return (n + (1 - Math.pow(1 - t, 3))) * ITEM * 1.6;
  };
  const offset = flick(frame);
  const first = Math.floor(offset / ITEM);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#14161C" }}>
      {new Array(6).fill(0).map((_, k) => {
        const i = first + k;
        const c = FEED_COLORS[Math.floor(random(`feed-${i}`) * FEED_COLORS.length)];
        return (
          <div key={i} style={{ position: "absolute", left: 12, right: 12, top: i * ITEM - offset + 10, height: ITEM - 16, borderRadius: 16, background: `linear-gradient(135deg, ${c}88, ${c}22)` }}>
            <div style={{ position: "absolute", left: 14, bottom: 14, width: "55%", height: 12, borderRadius: 6, background: "rgba(255,255,255,0.6)" }} />
            <div style={{ position: "absolute", left: 14, bottom: 34, width: "35%", height: 12, borderRadius: 6, background: "rgba(255,255,255,0.35)" }} />
          </div>
        );
      })}
    </div>
  );
};

/** 06 刷手机：手机里信息流无限下滑，通知不断弹出 */
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
        <div style={{ position: "absolute", top: 360, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", filter: `drop-shadow(0 0 60px ${cat.color}55)` }}>
            <PhoneIllo size={290} color={cat.color} progress={draw}>
              <Feed />
            </PhoneIllo>
            {NOTIFS.map((n) => {
              const s = spring({ frame: frame - n.at, fps, config: { damping: 12, stiffness: 180 } });
              const out = interpolate(frame, [n.at + 40, n.at + 52], [1, 0.35], clamp);
              return (
                <div
                  key={n.t}
                  style={{
                    position: "absolute",
                    left: 145 + n.x - 150,
                    top: n.y,
                    width: 300,
                    padding: "14px 20px",
                    borderRadius: 20,
                    background: "rgba(30,32,40,0.92)",
                    border: `1.5px solid ${cat.color}66`,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                    fontFamily: FONT_STACK,
                    opacity: s * out,
                    scale: String(0.6 + 0.4 * s),
                  }}
                >
                  <div style={{ fontSize: 22, color: cat.color, fontWeight: 700 }}>{n.t}</div>
                  <div style={{ fontSize: 26, color: COLORS.text, marginTop: 2 }}>{n.m}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ position: "absolute", top: 1000, left: SAFE_X }}>
          <LedgerReadout cat={cat} start={8} numberSize={200} />
        </div>
      </Camera>
    </AbsoluteFill>
  );
};
