import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CATEGORIES, YEAR_HOURS } from "../data/persona";
import { CHARGE_FRAME } from "../data/timeline";
import { COLORS, FONT_STACK, SAFE_X } from "../theme";
import { fmt } from "./format";
import { Sfx } from "./UI";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * 顶部"账户余额"抬头 —— 贯穿所有分类场景。
 * 在 CHARGE_FRAME 时扣款：余额滚动减少，红色 "-xxxx h" 飞出，
 * 下方 7 格进度显示已经扣到第几项。
 */
export const BalanceHUD: React.FC<{ catId: string; chargeAt?: number }> = ({ catId, chargeAt = CHARGE_FRAME }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = CATEGORIES.findIndex((c) => c.id === catId);
  const cat = CATEGORIES[idx];
  const before = YEAR_HOURS - CATEGORIES.slice(0, idx).reduce((a, c) => a + c.hours, 0);
  const after = before - cat.hours;

  const appear = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 20 });
  const roll = interpolate(frame, [chargeAt, chargeAt + 20], [before, after], {
    ...clamp,
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  const hit = spring({ frame: frame - chargeAt, fps, config: { damping: 9, stiffness: 180 } });
  const fly = interpolate(frame, [chargeAt, chargeAt + 34], [0, 1], clamp);
  const shake = frame >= chargeAt && frame < chargeAt + 10 ? Math.sin((frame - chargeAt) * 2.6) * (10 - (frame - chargeAt)) * 0.9 : 0;

  return (
    <div
      style={{
        position: "absolute",
        top: 120,
        left: SAFE_X,
        right: SAFE_X,
        opacity: appear,
        translate: `0px ${(1 - appear) * -30}px`,
        fontFamily: FONT_STACK,
      }}
    >
      <Sfx name="charge" at={chargeAt} volume={0.5} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 26, letterSpacing: 6, color: COLORS.textFaint }}>年度时间余额 · BALANCE</div>
          <div
            style={{
              marginTop: 6,
              fontSize: 64,
              fontWeight: 800,
              color: frame >= chargeAt && frame < chargeAt + 14 ? COLORS.red : COLORS.text,
              fontVariantNumeric: "tabular-nums",
              translate: `${shake}px 0px`,
              letterSpacing: 1,
            }}
          >
            {fmt(roll)}
            <span style={{ fontSize: 30, fontWeight: 500, opacity: 0.6, marginLeft: 8 }}>h</span>
          </div>
        </div>
        <div style={{ position: "relative", textAlign: "right", height: 90 }}>
          <div
            style={{
              fontSize: 54,
              fontWeight: 800,
              color: COLORS.red,
              fontVariantNumeric: "tabular-nums",
              opacity: frame < chargeAt ? 0 : interpolate(fly, [0, 0.15, 0.7, 1], [0, 1, 1, 0.55]),
              translate: `0px ${interpolate(hit, [0, 1], [-40, 0])}px`,
              scale: String(interpolate(hit, [0, 1], [1.5, 1])),
              textShadow: `0 0 30px ${COLORS.red}88`,
            }}
          >
            −{fmt(cat.hours)}h
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        {CATEGORIES.map((c, i) => {
          const done = i < idx || (i === idx && frame >= chargeAt);
          const active = i === idx;
          return (
            <div
              key={c.id}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background: done ? c.color : active ? `${c.color}55` : "rgba(245,247,250,0.1)",
                boxShadow: active && done ? `0 0 16px ${c.color}` : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
