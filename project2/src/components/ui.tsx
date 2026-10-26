import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame } from "remotion";
import { C, FPS, H, SERIF, W } from "../config/theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** 0→1 progress between frames a and b, eased. */
export const prog = (f: number, a: number, b: number, fn = ease) =>
  fn(interpolate(f, [a, b], [0, 1], clamp));

/** fade in at [a, a+d], fade out at [b-d, b] */
export const window_ = (f: number, a: number, b: number, d = 15) =>
  interpolate(f, [a, a + d, b - d, b], [0, 1, 1, 0], clamp);

/** 弹出：带轻微过冲的 0→1（读数落点、标签出现） */
export const popS = (f: number, at: number) =>
  f < at ? 0 : spring({ frame: f - at, fps: FPS, config: { damping: 11, stiffness: 210, mass: 0.6 } });

/** 解析“普通【高亮】普通”写法 */
const parse = (s: string) =>
  s.split(/(【[^】]*】)/).filter(Boolean).map((t) => (t.startsWith("【") ? { t: t.slice(1, -1), hi: true } : { t, hi: false }));

/* ---------------------------------------------------------------- 背景 */

export const Backdrop: React.FC<{ glow?: { x: number; y: number; r: number; o: number } }> = ({
  glow = { x: 960, y: 500, r: 1000, o: 0.22 },
}) => {
  return (
    <AbsoluteFill style={{ background: C.bg0 }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${glow.r}px ${glow.r * 0.68}px at ${glow.x}px ${glow.y}px, rgba(138,98,70,${glow.o}) 0%, rgba(30,26,21,0.7) 55%, rgba(13,12,11,0) 100%)`,
        }}
      />
      <ParchmentTexture />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 1300px 860px at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

export const ParchmentTexture: React.FC<{ opacity?: number }> = ({ opacity = 0.06 }) => (
  <AbsoluteFill style={{ opacity, mixBlendMode: "screen" }}>
    <svg width={W} height={H}>
      <filter id="parch">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves={4} seed={7} />
        <feColorMatrix values="0 0 0 0 0.85  0 0 0 0 0.78  0 0 0 0 0.65  0 0 0 1.1 -0.25" />
      </filter>
      <rect width={W} height={H} filter="url(#parch)" />
    </svg>
  </AbsoluteFill>
);

/** 固定 seed 的漂浮金尘，作为景深线索 */
export const GoldParticles: React.FC<{ count?: number; seed?: string; opacity?: number; drift?: number }> = ({
  count = 46,
  seed = "dust",
  opacity = 1,
  drift = 1,
}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      <svg width={W} height={H}>
        <defs>
          <radialGradient id="dustg">
            <stop offset="0%" stopColor={C.goldHi} stopOpacity={1} />
            <stop offset="100%" stopColor={C.goldHi} stopOpacity={0} />
          </radialGradient>
        </defs>
        {new Array(count).fill(0).map((_, i) => {
          const depth = random(`${seed}-d-${i}`);
          const x0 = random(`${seed}-x-${i}`) * W;
          const y0 = random(`${seed}-y-${i}`) * H;
          const sp = (0.2 + depth * 0.6) * drift;
          const x = (x0 + f * sp * 0.6 + Math.sin(f / 90 + i) * 12) % W;
          const y = (y0 - f * sp * 0.35 + H * 10) % H;
          const r = 1 + depth * 3.2;
          const tw = 0.35 + 0.65 * Math.abs(Math.sin(f / (40 + i * 3) + i));
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={r * (depth > 0.85 ? 3 : 1.6)}
              fill="url(#dustg)"
              opacity={(0.15 + depth * 0.45) * tw}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 镜头 */

export type CamKey = { f: number; x: number; y: number; s: number };

/** 镜头：在关键帧之间缓动，把 (x, y) 推到画面中心并缩放 s 倍 */
export const Camera: React.FC<{
  keys: CamKey[];
  children: React.ReactNode;
  shake?: { at: number; amp: number };
}> = ({ keys, children, shake }) => {
  const f = useCurrentFrame();
  const fs = keys.map((k) => k.f);
  const opt = { ...clamp, easing: Easing.inOut(Easing.cubic) };
  const s = keys.length > 1 ? interpolate(f, fs, keys.map((k) => k.s), opt) : keys[0].s;
  const x = keys.length > 1 ? interpolate(f, fs, keys.map((k) => k.x), opt) : keys[0].x;
  const y = keys.length > 1 ? interpolate(f, fs, keys.map((k) => k.y), opt) : keys[0].y;
  let dx = 0;
  let dy = 0;
  if (shake && f >= shake.at && f < shake.at + 14) {
    const d = Math.exp(-(f - shake.at) / 4) * shake.amp;
    dx = (random(`sx${f}`) - 0.5) * 2 * d;
    dy = (random(`sy${f}`) - 0.5) * 2 * d;
  }
  return (
    <AbsoluteFill
      style={{
        transformOrigin: "0 0",
        transform: `translate(${W / 2 + dx}px, ${H / 2 + dy}px) scale(${s}) translate(${-x}px, ${-y}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 强调 */

/** SVG 内弹出文字 */
export const PopText: React.FC<{
  x: number;
  y: number;
  at: number;
  until?: number;
  children: React.ReactNode;
  size?: number;
  color?: string;
  anchor?: "start" | "middle" | "end";
  weight?: number;
}> = ({ x, y, at, until = 99999, children, size = 26, color = C.white, anchor = "middle", weight = 500 }) => {
  const f = useCurrentFrame();
  const s = popS(f, at);
  const o = interpolate(f, [at, at + 4, until - 8, until], [0, 1, 1, 0], clamp);
  if (o <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${0.55 + 0.45 * s})`} opacity={o}>
      <text
        textAnchor={anchor}
        fill={color}
        fontFamily={SERIF}
        fontSize={size}
        fontWeight={weight}
        style={{ paintOrder: "stroke", stroke: "rgba(10,9,8,0.85)", strokeWidth: size * 0.16 }}
      >
        {children}
      </text>
    </g>
  );
};

/** 读数落点 / 关键事件：一圈扩散的金环 + 短暂光晕 */
export const Burst: React.FC<{ x: number; y: number; at: number; r?: number; color?: string }> = ({
  x,
  y,
  at,
  r = 40,
  color = C.goldHi,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 20], [0, 1], clamp);
  if (f < at || p >= 1) return null;
  const e = easeOut(p);
  return (
    <g>
      <circle cx={x} cy={y} r={r + 110 * e} fill="none" stroke={color} strokeWidth={3 * (1 - p)} opacity={1 - p} />
      <circle cx={x} cy={y} r={r + 60 * e} fill="none" stroke={color} strokeWidth={1.5} opacity={(1 - p) * 0.6} />
      <circle cx={x} cy={y} r={r * 1.6} fill={color} opacity={0.18 * (1 - p)} />
    </g>
  );
};

/* ---------------------------------------------------------------- 文字 */

/** 左上：年份 + 细线 + 地点/人物 */
export const DocumentaryYear: React.FC<{
  year: string;
  sub: string;
  start?: number;
  end?: number;
}> = ({ year, sub, start = 0, end = 99999 }) => {
  const f = useCurrentFrame();
  const o = window_(f, start, end, 8);
  const line = prog(f, start + 2, start + 18);
  const blur = interpolate(f, [start, start + 10], [8, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 104, top: 70, opacity: o }}>
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 50,
          fontWeight: 600,
          color: C.goldHi,
          letterSpacing: "0.1em",
          filter: `blur(${blur}px)`,
          textShadow: "0 0 22px rgba(226,198,138,0.3)",
          lineHeight: 1.1,
        }}
      >
        {year}
      </div>
      <div
        style={{
          width: 340 * line,
          height: 2,
          marginTop: 12,
          background: `linear-gradient(90deg, ${C.gold}, rgba(196,162,99,0))`,
        }}
      />
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 26,
          color: C.white,
          marginTop: 12,
          letterSpacing: "0.1em",
          opacity: interpolate(f, [start + 6, start + 16], [0, 1], clamp),
        }}
      >
        {sub}
      </div>
    </div>
  );
};

/** 右上：文献式注释（原题斜体 + 中文书名 + 出处 + 印章） */
export const HistoricalAnnotation: React.FC<{
  latin: string;
  title: string;
  meta: string;
  start?: number;
  end?: number;
}> = ({ latin, title, meta, start = 0, end = 99999 }) => {
  const f = useCurrentFrame();
  const o = window_(f, start, end, 10);
  const x = interpolate(f, [start, start + 16], [24, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        right: 104,
        top: 72,
        width: 680,
        textAlign: "right",
        opacity: o,
        transform: `translateX(${x}px)`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-start", gap: 14 }}>
        <div>
          <div
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: 21,
              color: C.dim,
              lineHeight: 1.3,
            }}
          >
            {latin}
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 28, color: C.goldHi, marginTop: 6, letterSpacing: "0.06em" }}>
            {title}
          </div>
        </div>
        <Seal />
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 21,
          color: C.text,
          marginTop: 8,
          marginRight: 48,
          paddingTop: 8,
          borderTop: `1px solid ${C.faint}`,
          display: "inline-block",
          letterSpacing: "0.05em",
          opacity: 0.88,
        }}
      >
        {meta}
      </div>
    </div>
  );
};

const Seal: React.FC = () => (
  <div
    style={{
      width: 32,
      height: 32,
      marginTop: 2,
      background: C.seal,
      borderRadius: 3,
      color: "#F3E2C8",
      fontFamily: SERIF,
      fontSize: 12,
      lineHeight: "13px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      flexShrink: 0,
    }}
  >
    文
    <br />
    献
  </div>
);

export type Beat = { from: number; to: number; text: string; note?: string; final?: boolean };

/**
 * 底部字幕接力：短句一条接一条，快速显影 / 退场。
 * 写法："普通【高亮】普通"。final = 本节点结论（更大、更亮）。
 */
export const Beats: React.FC<{ beats: Beat[]; y?: number }> = ({ beats, y = 880 }) => {
  const f = useCurrentFrame();
  return (
    <>
      {beats.map((b, i) => {
        if (f < b.from || f > b.to) return null;
        const o = window_(f, b.from, b.to, 7);
        const blur = interpolate(f, [b.from, b.from + 8], [10, 0], clamp);
        const dy = interpolate(f, [b.from, b.from + 10], [14, 0], clamp);
        const sc = b.final ? interpolate(f, [b.from, b.from + 14], [1.08, 1], clamp) : 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: y,
              textAlign: "center",
              opacity: o,
              transform: `translateY(${dy}px) scale(${sc})`,
            }}
          >
            <div
              style={{
                fontFamily: SERIF,
                fontSize: b.final ? 56 : 46,
                fontWeight: b.final ? 600 : 500,
                color: C.white,
                letterSpacing: "0.1em",
                filter: `blur(${blur}px)`,
                textShadow: "0 2px 18px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.9)",
              }}
            >
              {parse(b.text).map((p, k) => (
                <span
                  key={k}
                  style={
                    p.hi
                      ? { color: C.goldHi, textShadow: "0 0 20px rgba(226,198,138,0.45), 0 2px 18px rgba(0,0,0,0.95)" }
                      : undefined
                  }
                >
                  {p.t}
                </span>
              ))}
            </div>
            {b.note ? (
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: 27,
                  color: C.text,
                  marginTop: 14,
                  letterSpacing: "0.08em",
                  opacity: interpolate(f, [b.from + 8, b.from + 18], [0, 0.92], clamp),
                  textShadow: "0 2px 14px rgba(0,0,0,0.95)",
                }}
              >
                {b.note}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};

/** 小号注释（HTML，边缘说明） */
export const Note: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  o?: number;
  align?: "left" | "center" | "right";
  size?: number;
  color?: string;
  w?: number;
}> = ({ x, y, children, o = 1, align = "left", size = 23, color = C.text, w = 400 }) => (
  <div
    style={{
      position: "absolute",
      left: align === "left" ? x : align === "center" ? x - w / 2 : x - w,
      top: y,
      width: w,
      textAlign: align,
      fontFamily: SERIF,
      fontSize: size,
      color,
      opacity: o,
      letterSpacing: "0.05em",
      lineHeight: 1.5,
      textShadow: "0 2px 12px rgba(0,0,0,0.9)",
    }}
  >
    {children}
  </div>
);
