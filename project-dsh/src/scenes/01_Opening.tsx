import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Camera } from "../components/Camera";
import { CoinAt } from "../components/CoinAt";
import { Glow } from "../components/Glow";
import { C, FONT, SUBTITLE_EN, TITLE } from "../config/film";
import { buildShatter, crackPath, linePath, polyPath, polygonToCircle, type Pt } from "../lib/shatter";
import { clamp, easeInOut, easeOut, lerp, seg, slowIntegral } from "../lib/motion";
import { hash01 } from "../lib/rng";

/* ───────────── 古典窗几何（原创造型） ───────────── */
const X0 = 662;
const X1 = 1258;
const SPRING = 392;
const BOTTOM = 878;
const THICK = 20;
const SILL_H = 26;
const CX = (X0 + X1) / 2;
const RAD = (X1 - X0) / 2;
const APEX = SPRING - RAD;

const OPENING = `M ${X0} ${BOTTOM} L ${X0} ${SPRING} A ${RAD} ${RAD} 0 0 1 ${X1} ${SPRING} L ${X1} ${BOTTOM} Z`;
const FRAME_OUTER = `M ${X0 - THICK} ${BOTTOM + THICK} L ${X0 - THICK} ${SPRING} A ${RAD + THICK} ${RAD + THICK} 0 0 1 ${X1 + THICK} ${SPRING} L ${X1 + THICK} ${BOTTOM + THICK} Z`;

const IMPACT: Pt = [CX - 74, 626];

/** 金属球轨迹：轻微上抛弧线 */
const ballAt = (t: number): Pt => {
  const e = easeInOut(clamp(t));
  return [lerp(268, IMPACT[0], e), lerp(96, IMPACT[1], e) - 96 * Math.sin(Math.PI * e)];
};

const GlassWindow: React.FC<{
  /** 自撞击起算的局部帧 */
  local: number;
  glassAlpha: number;
  warm: number;
  showShards: boolean;
}> = ({ local, glassAlpha, warm, showShards }) => {
  const model = useMemo(
    () => buildShatter({ ix: IMPACT[0], iy: IMPACT[1], seed: 17, rays: 15, rings: 6, maxR: 640, minR: 30 }),
    [],
  );
  const tFly = Math.max(0, (local - 24) / 30);
  const crackGrow = easeOut(seg(local, 14, 44));

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <clipPath id="winClip">
          <path d={OPENING} />
        </clipPath>
        <linearGradient id="glassFill" x1="0.1" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#4A4136" stopOpacity="0.92" />
          <stop offset="45%" stopColor="#262019" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#17140F" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="glassSheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F0E2C0" stopOpacity="0.18" />
          <stop offset="34%" stopColor="#F0E2C0" stopOpacity="0.02" />
          <stop offset="58%" stopColor="#F0E2C0" stopOpacity="0.13" />
          <stop offset="80%" stopColor="#F0E2C0" stopOpacity="0.01" />
          <stop offset="100%" stopColor="#F0E2C0" stopOpacity="0.08" />
        </linearGradient>
        <radialGradient id="glassWarm" cx="0.5" cy="0.12" r="0.95">
          <stop offset="0%" stopColor="#D8AE6C" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#8A6C42" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#C49A57" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="frameGrad" x1="0.15" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#2A241B" />
          <stop offset="55%" stopColor="#161310" />
          <stop offset="100%" stopColor="#0C0B09" />
        </linearGradient>
        <linearGradient id="sillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2F271C" />
          <stop offset="40%" stopColor="#1C1812" />
          <stop offset="100%" stopColor="#0B0A08" />
        </linearGradient>
        <linearGradient id="shardEdge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F4EEDC" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#D8CDB4" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#9E9484" stopOpacity="0.42" />
        </linearGradient>
      </defs>

      <g clipPath="url(#winClip)">
        <rect x={X0} y={APEX} width={X1 - X0} height={BOTTOM - APEX} fill="url(#glassFill)" opacity={glassAlpha} />
        <rect
          x={X0}
          y={APEX}
          width={X1 - X0}
          height={BOTTOM - APEX}
          fill="url(#glassWarm)"
          opacity={0.5 + 0.5 * warm}
        />
        <rect x={X0} y={APEX} width={X1 - X0} height={BOTTOM - APEX} fill="url(#glassSheen)" opacity={glassAlpha} />
        <path
          d={`M ${X0 - 40} ${BOTTOM} L ${X0 + 210} ${APEX} L ${X0 + 300} ${APEX} L ${X0 + 60} ${BOTTOM} Z`}
          fill="#F6EBD2"
          opacity={0.07 * glassAlpha}
        />
        <path
          d={`M ${CX - RAD + 26} ${SPRING - 6} A ${RAD - 26} ${RAD - 26} 0 0 1 ${CX + 30} ${APEX + 16}`}
          fill="none"
          stroke="#FFF6E2"
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.3 * glassAlpha}
        />
        <path
          d={`M ${X1 - 200} ${BOTTOM} L ${X1 + 10} ${APEX + 90} L ${X1 + 60} ${APEX + 90} L ${X1 - 140} ${BOTTOM} Z`}
          fill="#F6EBD2"
          opacity={0.035 * glassAlpha}
        />

        {crackGrow > 0 &&
          model.radialCracks.map((line, i) => {
            const p = clamp((crackGrow - i * 0.035) / 0.7);
            if (p <= 0) return null;
            return (
              <path
                key={`rc${i}`}
                d={crackPath(line)}
                pathLength={1}
                fill="none"
                stroke="#EFE6D0"
                strokeWidth={i % 3 === 0 ? 1.9 : 1.1}
                strokeDasharray={1}
                strokeDashoffset={1 - p}
                opacity={0.55}
                strokeLinecap="round"
              />
            );
          })}
        {crackGrow > 0.35 &&
          model.ringCracks.map((loop, j) => {
            const p = clamp((crackGrow - 0.3 - j * 0.06) / 0.65);
            if (p <= 0) return null;
            return (
              <path
                key={`rg${j}`}
                d={linePath(loop)}
                pathLength={1}
                fill="none"
                stroke="#E7DCC2"
                strokeWidth={0.9}
                strokeDasharray={1}
                strokeDashoffset={1 - p}
                opacity={0.4}
              />
            );
          })}

        {local >= 14 && local < 44 && (
          <g opacity={1 - seg(local, 14, 44)}>
            <circle cx={IMPACT[0]} cy={IMPACT[1]} r={5.5} fill="#FFFDF4" opacity={0.85} />
            {new Array(12).fill(0).map((_, i) => {
              const a = (i / 12) * Math.PI * 2;
              const len = 16 + hash01(i, 3) * 22;
              return (
                <line
                  key={i}
                  x1={IMPACT[0]}
                  y1={IMPACT[1]}
                  x2={IMPACT[0] + Math.cos(a) * len}
                  y2={IMPACT[1] + Math.sin(a) * len}
                  stroke="#FFF6E0"
                  strokeWidth={1.2}
                  opacity={0.5}
                />
              );
            })}
          </g>
        )}
      </g>

      {/* 窗框正面 */}
      <path d={FRAME_OUTER} fill="none" stroke="url(#frameGrad)" strokeWidth={THICK * 2} strokeLinejoin="miter" />
      <path d={OPENING} fill="none" stroke="#0A0908" strokeWidth={3} />
      <path
        d={`M ${X0 - THICK - 6} ${BOTTOM + THICK} L ${X0 - THICK - 6} ${SPRING} A ${RAD + THICK + 6} ${RAD + THICK + 6} 0 0 1 ${CX + 40} ${APEX - 8}`}
        fill="none"
        stroke={C.goldHi}
        strokeWidth={2.4}
        opacity={0.42}
        strokeLinecap="round"
      />
      <path
        d={`M ${X0 - THICK + 4} ${BOTTOM + 6} L ${X0 - THICK + 4} ${SPRING + 8}`}
        fill="none"
        stroke={C.gold}
        strokeWidth={1.2}
        opacity={0.3}
      />

      {/* 窗棂 */}
      <g stroke="#0A0908" strokeWidth={1.5} fill="#15120E">
        <rect x={CX - 7} y={APEX + 6} width={14} height={BOTTOM - APEX - 6} />
        <rect x={X0} y={560} width={X1 - X0} height={11} />
        <rect x={X0} y={700} width={X1 - X0} height={11} />
      </g>
      <g stroke={C.gold} strokeWidth={1} opacity={0.18}>
        <line x1={CX - 7} y1={APEX + 10} x2={CX - 7} y2={BOTTOM - 4} />
        <line x1={X0 + 4} y1={557} x2={X1 - 4} y2={557} />
        <line x1={X0 + 4} y1={697} x2={X1 - 4} y2={697} />
      </g>

      {/* 窗台 */}
      <rect x={X0 - 58} y={BOTTOM} width={X1 - X0 + 116} height={SILL_H} fill="url(#sillGrad)" />
      <rect x={X0 - 58} y={BOTTOM} width={X1 - X0 + 116} height={2.5} fill={C.goldHi} opacity={0.3} />
      <rect x={X0 - 36} y={BOTTOM + SILL_H} width={X1 - X0 + 72} height={14} fill="#0A0908" opacity={0.92} />

      {showShards && (
        <g>
          {model.shards.map((s) => {
            const t = tFly - s.delay;
            if (t <= 0) return null;
            const moved = Math.max(0, slowIntegral(t + s.delay) - slowIntegral(s.delay));
            const dx = Math.cos(s.dir) * s.speed * moved;
            const dy = Math.sin(s.dir) * s.speed * moved + 40 * t * t;
            const rot = s.spin * moved;
            const fade = 1 - clamp(seg(t, 2.4, 4.6)) * 0.72;
            return (
              <g
                key={s.id}
                transform={`translate(${dx.toFixed(2)} ${dy.toFixed(2)}) rotate(${rot.toFixed(2)} ${s.cx.toFixed(1)} ${s.cy.toFixed(1)})`}
                opacity={fade}
              >
                <path d={polyPath(s.poly)} fill="rgba(214,206,188,0.13)" stroke="url(#shardEdge)" strokeWidth={1} />
                {s.glint && t < 1.2 && (
                  <path d={polyPath(s.poly)} fill="#FFFCF2" opacity={0.22 * (1 - t / 1.2)} />
                )}
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
};

/** 六枚金币的落位（向上的弧） */
const coinSlot = (i: number): { x: number; y: number } => {
  const ang = (-85 + i * 34) * (Math.PI / 180);
  const r = 286;
  return { x: 960 + Math.sin(ang) * r, y: 512 - Math.cos(ang) * r };
};
const HERO = 2;
const HERO_POS = { x: 960, y: 452 };

export const Opening: React.FC<{ frame: number }> = ({ frame }) => {
  const model = useMemo(
    () => buildShatter({ ix: IMPACT[0], iy: IMPACT[1], seed: 17, rays: 15, rings: 6, maxR: 640, minR: 30 }),
    [],
  );
  const s1 = frame < 120;
  const s2 = frame >= 120 && frame < 240;
  const s3 = frame >= 240 && frame < 360;
  const s4 = frame >= 360;
  const l2 = frame - 120;
  const l3 = frame - 240;
  const l4 = frame - 360;
  const local = frame - 120; // 自撞击镜头起算

  // 相机：缓慢推进 + 撞击震动
  const push = s1
    ? lerp(1.008, 1.055, easeInOut(seg(frame, 0, 120)))
    : s2
      ? lerp(1.055, 1.085, easeInOut(seg(l2, 0, 120)))
      : s3
        ? lerp(1.085, 1.045, easeInOut(seg(l3, 0, 120)))
        : lerp(1.045, 0.98, easeInOut(seg(l4, 0, 90)));
  const shakeT = s2 ? Math.max(0, l2 - 14) : 0;
  const shake = s2 && l2 >= 14 ? 5.5 * Math.exp(-shakeT / 7) : 0;
  const camX = Math.sin(shakeT * 2.3) * shake;
  const camY = Math.cos(shakeT * 1.9) * shake * 0.8;

  const glassAlpha = s1 ? 1 - easeInOut(seg(frame, 6, 64)) * 0.22 : s2 ? lerp(0.78, 0.5, seg(l2, 0, 60)) : 0.42;
  const warm = s1
    ? 0.2 + 0.35 * easeInOut(seg(frame, 0, 100))
    : s2
      ? lerp(0.55, 0.75, easeInOut(seg(l2, 0, 120)))
      : 0.8;

  const ballT = clamp(l2 / 14);
  const ballP = ballAt(ballT);

  // 六枚金币的生成源（撞击环附近的碎片）
  const sources = useMemo(
    () =>
      [4, 6, 7, 9, 10, 12].map((ray) => {
        const sh = model.shards.find((s) => s.ring === 1 && s.ray === ray) ?? model.shards[ray];
        return { cx: sh.cx, cy: sh.cy, poly: sh.poly, dir: sh.dir, speed: sh.speed, delay: sh.delay };
      }),
    [model],
  );

  const morph = s3 ? easeInOut(seg(l3, 10, 58)) : s4 ? 1 : 0;
  const travel = s3 ? easeInOut(seg(l3, 62, 116)) : s4 ? 1 : 0;

  // S04：收束 + 片名
  const converge = s4 ? easeInOut(seg(l4, 0, 30)) : 0;
  const titleIn = s4 ? easeInOut(seg(l4, 16, 52)) : 0;
  const dialIn = s4 ? easeInOut(seg(l4, 0, 44)) : s3 ? easeInOut(seg(l3, 98, 120)) * 0.3 : 0;
  const heroOpen = s4 ? easeInOut(seg(l4, 4, 40)) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: C.black }}>
      <Backdrop warm={warm} wall={s1 ? 0.14 : 0.18} gx={0.5} gy={0.32} spread={1.06} />
      <Glow
        x={960}
        y={520}
        size={1240}
        opacity={(s1 ? 0.09 + 0.09 * easeInOut(seg(frame, 20, 110)) : 0.19) * (0.7 + 0.3 * warm)}
      />
      <Glow x={960} y={380} size={620} opacity={0.1} variant="ember" />
      <Glow x={960} y={915} size={880} opacity={0.09} />

      <Camera scale={push} x={camX} y={camY}>
        <GlassWindow local={local} glassAlpha={glassAlpha} warm={warm} showShards={!s1} />

        {s2 && l2 >= 14 && l2 < 32 && (
          <Glow x={IMPACT[0]} y={IMPACT[1]} size={460} opacity={0.55 * (1 - seg(l2, 14, 32))} variant="ember" />
        )}

        {s2 && l2 < 14 && (
          <>
            <Glow x={ballP[0]} y={ballP[1]} size={140} opacity={0.32} variant="ember" />
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
              {new Array(7).fill(0).map((_, i) => {
                const tt = clamp(ballT - i * 0.035);
                const p = ballAt(tt);
                return <circle key={i} cx={p[0]} cy={p[1]} r={3.6 - i * 0.42} fill={C.goldHi} opacity={0.18 - i * 0.022} />;
              })}
              <circle cx={ballP[0]} cy={ballP[1]} r={9} fill="#3A3229" />
              <circle cx={ballP[0]} cy={ballP[1]} r={9} fill="none" stroke={C.goldHi} strokeWidth={1.6} opacity={0.8} />
              <circle cx={ballP[0] - 3} cy={ballP[1] - 3} r={2.4} fill="#FFF6E2" opacity={0.75} />
            </svg>
          </>
        )}

        {/* S03：碎片圆成金币（连续形变） */}
        {s3 && morph > 0 && (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {sources.map((src, i) => {
              const slot = coinSlot(i);
              const tFly = Math.max(0, (local - 24) / 30);
              const moved = Math.max(0, slowIntegral(tFly + src.delay) - slowIntegral(src.delay));
              const bx = src.cx + Math.cos(src.dir) * src.speed * moved;
              const by = src.cy + Math.sin(src.dir) * src.speed * moved + 40 * tFly * tFly;
              const px = lerp(bx, slot.x, travel);
              const py = lerp(by, slot.y, travel);
              const poly = polygonToCircle(
                src.poly.map((p) => [p[0] + (bx - src.cx), p[1] + (by - src.cy)] as Pt),
                px,
                py,
                morph,
                56,
              );
              const warmMix = Math.round(200 + 30 * morph);
              return (
                <path
                  key={i}
                  d={polyPath(poly)}
                  fill={`rgba(${warmMix},${Math.round(192 + 22 * morph)},${Math.round(172 - 44 * morph)},${(
                    0.14 +
                    0.3 * morph
                  ).toFixed(3)})`}
                  stroke={C.goldHi}
                  strokeWidth={1.1}
                  opacity={1 - 0.6 * morph}
                />
              );
            })}
          </svg>
        )}

        {(s3 || s4) && (
          <>
            {new Array(6).fill(0).map((_, i) => {
              const slot = coinSlot(i);
              const isHero = i === HERO;
              const appear = s3 ? easeInOut(seg(l3, 44 + i * 2, 68 + i * 2)) : 1;
              if (appear <= 0.002) return null;
              const phase = (s3 ? l3 : 120 + l4) * (Math.PI / 44) + i * 1.15;
              const tilt = Math.cos(phase);
              let x = slot.x;
              let y = slot.y;
              let size = 116;
              let op = appear;
              if (s4) {
                if (isHero) {
                  x = lerp(slot.x, HERO_POS.x, heroOpen);
                  y = lerp(slot.y, HERO_POS.y, heroOpen);
                  size = lerp(116, 336, heroOpen);
                  op = appear * (1 - 0.68 * titleIn);
                } else {
                  x = lerp(slot.x, HERO_POS.x, converge);
                  y = lerp(slot.y, HERO_POS.y, converge);
                  size = lerp(116, 26, converge);
                  op = appear * (1 - converge);
                }
              }
              return (
                <CoinAt
                  key={i}
                  x={x}
                  y={y}
                  size={size}
                  tilt={s4 && isHero ? lerp(tilt, 1, heroOpen) : tilt}
                  spin={s4 && isHero ? l4 * 0.28 : 0}
                  glow={s3 ? 0.55 * appear : 0}
                  opacity={op}
                  shadow={size > 60}
                />
              );
            })}
          </>
        )}

        {dialIn > 0 && <Dial progress={dialIn} frame={frame} />}
      </Camera>

      {s4 && <TitleCard p={titleIn * (1 - easeInOut(seg(l4, 70, 90)))} />}
    </AbsoluteFill>
  );
};

const Dial: React.FC<{ progress: number; frame: number }> = ({ progress, frame }) => {
  const rot = frame * 0.06;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: progress }}>
      <g transform={`translate(960 520) rotate(${rot})`}>
        {new Array(96).fill(0).map((_, i) => {
          const a = (i / 96) * Math.PI * 2;
          const long = i % 8 === 0;
          const r1 = 372;
          const r2 = r1 + (long ? 26 : 12);
          const grow = clamp((progress - (i / 96) * 0.6) / 0.4);
          if (grow <= 0) return null;
          return (
            <line
              key={i}
              x1={Math.cos(a) * r1}
              y1={Math.sin(a) * r1}
              x2={Math.cos(a) * lerp(r1, r2, grow)}
              y2={Math.sin(a) * lerp(r1, r2, grow)}
              stroke={long ? C.gold : C.copper}
              strokeWidth={long ? 1.5 : 0.8}
              opacity={long ? 0.5 : 0.32}
            />
          );
        })}
        <circle r={366} fill="none" stroke={C.copper} strokeWidth={0.8} opacity={0.3} />
        <circle r={404} fill="none" stroke={C.copper} strokeWidth={0.6} opacity={0.2} />
      </g>
      <g opacity={0.55}>
        {new Array(6).fill(0).map((_, i) => {
          const a0 = -Math.PI / 2 + (i - 2.5) * 0.3;
          const p = clamp((progress - 0.1 - i * 0.04) / 0.75);
          if (p <= 0) return null;
          const x0 = 960 + Math.cos(a0) * 180;
          const y0 = 520 + Math.sin(a0) * 180;
          const x1 = 960 + Math.cos(a0) * 640;
          const y1 = 520 + Math.sin(a0) * 640;
          return (
            <g key={i}>
              <path
                d={`M ${x0} ${y0} Q ${(x0 + x1) / 2 + (i % 2 === 0 ? 44 : -44)} ${(y0 + y1) / 2} ${x1} ${y1}`}
                pathLength={1}
                fill="none"
                stroke={C.copper}
                strokeWidth={0.9}
                strokeDasharray={1}
                strokeDashoffset={1 - p}
                opacity={0.55}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

const TitleCard: React.FC<{ p: number }> = ({ p }) => {
  if (p <= 0.002) return null;
  const tracking = lerp(44, 12, p);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: p }}>
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 84,
          right: 96,
          bottom: 84,
          border: `1px solid rgba(130,97,66,${0.35 * p})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 108,
          top: 96,
          right: 108,
          bottom: 96,
          border: `1px solid rgba(196,154,87,${0.16 * p})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 418,
          textAlign: "center",
          fontFamily: FONT.cjk,
          fontSize: 104,
          fontWeight: 500,
          letterSpacing: `${tracking}px`,
          color: C.parchment,
          textShadow: "0 4px 30px rgba(0,0,0,0.8)",
          transform: `translateY(${(1 - p) * 10}px)`,
        }}
      >
        {TITLE}
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <line x1={960 - 200 * p} y1={574} x2={960 - 34} y2={574} stroke={C.gold} strokeWidth={1} opacity={0.55 * p} />
        <line x1={960 + 34} y1={574} x2={960 + 200 * p} y2={574} stroke={C.gold} strokeWidth={1} opacity={0.55 * p} />
        <path d="M 960 568 L 966 574 L 960 580 L 954 574 Z" fill={C.goldHi} opacity={0.85 * p} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 598,
          textAlign: "center",
          fontFamily: FONT.latin,
          fontSize: 21,
          letterSpacing: "14px",
          color: C.grayGold,
          opacity: 0.85 * p,
        }}
      >
        {SUBTITLE_EN}
      </div>
    </div>
  );
};
