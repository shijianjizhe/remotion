import React from "react";
import { Audio } from "@remotion/media";
import { Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FONT_STACK, TYPE } from "../theme";
import { fmt } from "./format";
import { Reveal } from "./Motion";
import { EASE_OUT } from "./Motion";
import type { Category } from "../data/persona";
import { YEAR_HOURS } from "../data/persona";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ---------- 音效 ---------- */
export type SfxName =
  | "tick" | "click" | "whoosh" | "swipe" | "fill" | "page" | "printer"
  | "stamp" | "notify" | "boom" | "charge" | "riser" | "tear" | "shimmer";

/** 在场景内某帧触发一个音效（素材由 scripts/gen_audio.py 合成） */
export const Sfx: React.FC<{ name: SfxName; at: number; volume?: number }> = ({ name, at, volume = 0.6 }) => (
  <Audio name={`SFX ${name}`} from={Math.round(at)} src={staticFile(`audio/sfx/${name}.wav`)} volume={volume} />
);

/* ---------- 数字滚动 ---------- */
export const CountUp: React.FC<{
  from?: number;
  to: number;
  start?: number;
  duration?: number;
  decimals?: number;
  easing?: (t: number) => number;
  style?: React.CSSProperties;
}> = ({ from = 0, to, start = 0, duration = 40, decimals = 0, easing = Easing.bezier(0.22, 1, 0.36, 1), style }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [start, start + duration], [from, to], { ...clamp, easing });
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{fmt(v, decimals)}</span>;
};

/** 数字滚动时的"跳动音"：每隔几帧一个 tick，逐渐变弱 */
export const CountTicks: React.FC<{ start: number; duration: number; every?: number; volume?: number }> = ({
  start,
  duration,
  every = 3,
  volume = 0.22,
}) => (
  <>
    {new Array(Math.floor(duration / every)).fill(0).map((_, i) => (
      <Sfx key={i} name="tick" at={start + i * every} volume={volume * (1 - (i * every) / duration / 1.6)} />
    ))}
  </>
);

/* ---------- 文字样式 ---------- */
export const Tag: React.FC<{ color: string; index?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({
  color,
  index,
  children,
  style,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 16,
      padding: "10px 26px 10px 12px",
      borderRadius: 999,
      border: `1.5px solid ${color}55`,
      background: `${color}14`,
      fontFamily: FONT_STACK,
      fontSize: TYPE.label,
      letterSpacing: 4,
      color,
      fontWeight: 600,
      ...style,
    }}
  >
    {index ? (
      <span style={{ background: color, color: COLORS.bg, borderRadius: 999, padding: "2px 14px", letterSpacing: 1, fontWeight: 800 }}>
        {index}
      </span>
    ) : null}
    {children}
  </div>
);

export const Title: React.FC<{ children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({
  children,
  size = TYPE.h1,
  style,
}) => (
  <div style={{ fontFamily: FONT_STACK, fontSize: size, fontWeight: 800, color: COLORS.text, lineHeight: 1.22, letterSpacing: 2, ...style }}>
    {children}
  </div>
);

export const Body: React.FC<{ children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({
  children,
  size = TYPE.body,
  style,
}) => (
  <div style={{ fontFamily: FONT_STACK, fontSize: size, fontWeight: 350, color: COLORS.textDim, lineHeight: 1.5, letterSpacing: 1, ...style }}>
    {children}
  </div>
);

export const Mono: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <span
    style={{
      fontFamily: `Consolas, "SF Mono", ${FONT_STACK}`,
      fontSize: TYPE.label,
      letterSpacing: 3,
      color: COLORS.textFaint,
      ...style,
    }}
  >
    {children}
  </span>
);

/** 大号数字 + 单位 */
export const BigNumber: React.FC<{
  to: number;
  start?: number;
  duration?: number;
  size?: number;
  unit?: string;
  color?: string;
  glow?: boolean;
  from?: number;
  style?: React.CSSProperties;
}> = ({ to, start = 0, duration = 40, size = TYPE.hero, unit = "h", color = COLORS.text, glow = true, from = 0, style }) => (
  <div
    style={{
      fontFamily: FONT_STACK,
      display: "flex",
      alignItems: "baseline",
      gap: size * 0.06,
      color,
      lineHeight: 1,
      textShadow: glow ? `0 0 ${size * 0.35}px ${color}55` : undefined,
      ...style,
    }}
  >
    <CountUp from={from} to={to} start={start} duration={duration} style={{ fontSize: size, fontWeight: 800, letterSpacing: -size * 0.02 }} />
    <span style={{ fontSize: size * 0.3, fontWeight: 500, opacity: 0.7 }}>{unit}</span>
  </div>
);

/* ---------- 进度条 ---------- */
export const ProgressBar: React.FC<{
  value: number;
  start?: number;
  duration?: number;
  color: string;
  width?: number;
  height?: number;
  label?: React.ReactNode;
  rightLabel?: React.ReactNode;
}> = ({ value, start = 0, duration = 36, color, width = 900, height = 14, label, rightLabel }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, start + duration], [0, value], { ...clamp, easing: EASE_OUT });
  const appear = interpolate(frame, [start - 10, start], [0, 1], clamp);
  const fillW = p > 0 ? Math.max(p * width, 4) : 0;
  return (
    <div style={{ width, opacity: appear, fontFamily: FONT_STACK }}>
      {label || rightLabel ? (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: TYPE.label, color: COLORS.textDim, letterSpacing: 2 }}>
          <span>{label}</span>
          <span style={{ color, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{rightLabel}</span>
        </div>
      ) : null}
      <div style={{ position: "relative", width, height, borderRadius: height, background: "rgba(245,247,250,0.08)" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height,
            width: fillW,
            borderRadius: height,
            background: `linear-gradient(90deg, ${color}66, ${color})`,
            boxShadow: `0 0 24px ${color}88`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: fillW - height / 2 - 6,
            top: -6,
            width: height + 12,
            height: height + 12,
            borderRadius: "50%",
            background: color,
            opacity: p > 0 ? 0.85 : 0,
            filter: "blur(6px)",
          }}
        />
      </div>
    </div>
  );
};

/* ---------- 统一卡片 ---------- */
export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; accent?: string }> = ({
  children,
  style,
  accent = COLORS.text,
}) => (
  <div
    style={{
      borderRadius: 36,
      padding: "40px 48px",
      background: "linear-gradient(160deg, rgba(255,255,255,0.075), rgba(255,255,255,0.02))",
      border: "1.5px solid rgba(255,255,255,0.09)",
      boxShadow: `0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 120px ${accent}14`,
      ...style,
    }}
  >
    {children}
  </div>
);

/**
 * 分类账目读数：标签 + 大数字 + 公式 + 占比进度条 + 金句。
 * 每个分类场景复用它，但放在不同的构图里。
 */
export const LedgerReadout: React.FC<{
  cat: Category;
  start?: number;
  numberSize?: number;
  align?: "left" | "center";
  width?: number;
  showPunch?: boolean;
  punchDelay?: number;
  countDuration?: number;
  barDelay?: number;
}> = ({
  cat,
  start = 6,
  numberSize = 210,
  align = "left",
  width = 900,
  showPunch = true,
  punchDelay = 56,
  countDuration = 30,
  barDelay = 20,
}) => {
  const share = cat.hours / YEAR_HOURS;
  const items = align === "center" ? "center" : "flex-start";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: items, width, textAlign: align }}>
      <Reveal delay={start} y={20}>
        <Tag color={cat.color} index={cat.index}>
          {cat.label} · {cat.en}
        </Tag>
      </Reveal>
      <Reveal delay={start + 4} y={30} style={{ marginTop: 22 }}>
        <BigNumber to={cat.hours} start={start + 4} duration={countDuration} size={numberSize} color={COLORS.text} />
      </Reveal>
      <Reveal delay={start + 14} y={20} style={{ marginTop: 10 }}>
        <Body size={TYPE.body} style={{ color: COLORS.text, fontWeight: 500 }}>
          {cat.formula}
        </Body>
        <Body size={TYPE.small} style={{ color: COLORS.textFaint }}>
          {cat.note}
        </Body>
      </Reveal>
      <div style={{ marginTop: 34 }}>
        <ProgressBar
          value={share}
          start={start + barDelay}
          duration={34}
          color={cat.color}
          width={width}
          label="占全年 8,760 小时"
          rightLabel={`${(share * 100).toFixed(1)}%`}
        />
      </div>
      {showPunch ? (
        <Reveal delay={start + punchDelay} y={24} style={{ marginTop: 40 }}>
          <div style={{ fontFamily: FONT_STACK, fontSize: 50, fontWeight: 700, color: cat.color, letterSpacing: 2 }}>{cat.punch}</div>
        </Reveal>
      ) : null}
    </div>
  );
};
