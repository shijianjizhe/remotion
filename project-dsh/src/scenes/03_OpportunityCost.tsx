import React from "react";
import { AbsoluteFill } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { BrassScale, panPositions } from "../components/BrassScale";
import { Camera } from "../components/Camera";
import { CoinAt } from "../components/CoinAt";
import { Glow } from "../components/Glow";
import { C, FONT } from "../config/film";
import { clamp, easeInOut, easeOut, envelope, lerp, seg, springy } from "../lib/motion";
import { hash01 } from "../lib/rng";

const CLOCK = { x: 960, y: 640, r: 158 };
const NODES = {
  left: { x: 430, y: 272 },
  center: { x: 960, y: 216 },
  right: { x: 1490, y: 272 },
};
const PATHS = {
  left: `M 858 545 C 760 468 520 372 430 334`,
  center: `M 960 500 C 960 424 960 300 960 278`,
  right: `M 1062 545 C 1160 468 1400 372 1490 334`,
};

type Side = "left" | "center" | "right";

/* ── 路径 ── */
const PathLine: React.FC<{
  d: string;
  progress: number;
  opacity?: number;
  width?: number;
  color?: string;
  dashed?: boolean;
  glow?: number;
}> = ({ d, progress, opacity = 1, width = 1.6, color = C.gold, dashed = false, glow = 0 }) => {
  if (progress <= 0 || opacity <= 0.002) return null;
  return (
    <g opacity={opacity}>
      {glow > 0 && (
        <path d={d} pathLength={1} fill="none" stroke={C.goldHi} strokeWidth={width * 4} strokeDasharray={1} strokeDashoffset={1 - progress} opacity={0.12 * glow} strokeLinecap="round" />
      )}
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? "5 9" : 1}
        strokeDashoffset={dashed ? 0 : 1 - progress}
        strokeLinecap="round"
        opacity={dashed ? progress : 1}
      />
    </g>
  );
};

const travellingDot = (frame: number, speed = 0.02) => 0.5 + 0.5 * Math.sin(frame * speed);

/* ── 用途徽章 ── */
const Insignia: React.FC<{ kind: Side; p: number; color: string }> = ({ kind, p, color }) => {
  const s = { fill: "none", stroke: color, strokeWidth: 1.7, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const dash = { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p };
  if (kind === "left")
    return (
      <g {...s}>
        {/* 工作：砧与锤 */}
        <path d="M -30 16 L 30 16 L 22 22 L -22 22 Z" {...dash} />
        <path d="M -22 16 L -22 6 L 22 6 L 22 16" {...dash} />
        <path d="M 22 12 L 34 6 L 30 2 L 18 8" {...dash} />
        <path d="M -6 -6 L 6 -14" {...dash} />
        <path d="M 4 -18 L 14 -24" strokeWidth={3.4} {...dash} />
      </g>
    );
  if (kind === "center")
    return (
      <g {...s}>
        {/* 休息：月与星 */}
        <path d="M 6 -20 A 20 20 0 1 0 6 20 A 16 16 0 1 1 6 -20 Z" {...dash} />
        <path d="M 18 -14 L 20 -8 L 26 -6 L 20 -4 L 18 2 L 16 -4 L 10 -6 L 16 -8 Z" {...dash} />
        <path d="M 12 12 L 13 16 L 17 17 L 13 18 L 12 22 L 11 18 L 7 17 L 11 16 Z" {...dash} />
      </g>
    );
  return (
    <g {...s}>
      {/* 学习：摊开的书 */}
      <path d="M -28 -12 C -18 -18 -6 -16 0 -10 C 6 -16 18 -18 28 -12 L 28 16 C 18 11 6 13 0 19 C -6 13 -18 11 -28 16 Z" {...dash} />
      <path d="M 0 -10 L 0 19" {...dash} />
      <path d="M -22 -6 L -6 -4 M -22 2 L -6 4 M 6 -4 L 22 -6 M 6 4 L 22 2" strokeWidth={1.1} opacity={0.7} {...dash} />
    </g>
  );
};

const Medallion: React.FC<{ side: Side; p: number; opacity?: number; glow?: number; ghost?: boolean }> = ({
  side,
  p,
  opacity = 1,
  glow = 0,
  ghost = false,
}) => {
  const n = NODES[side];
  if (p <= 0 || opacity <= 0.002) return null;
  return (
    <g opacity={opacity}>
      {glow > 0 && <circle cx={n.x} cy={n.y} r={62 + 26 * glow} fill="none" stroke={C.goldHi} strokeWidth={1} opacity={0.28 * glow} />}
      <circle cx={n.x} cy={n.y} r={62} fill="#12100D" opacity={0.85} />
      <circle cx={n.x} cy={n.y} r={62} fill="none" stroke={ghost ? C.copper : C.goldHi} strokeWidth={2} opacity={0.9} />
      <circle cx={n.x} cy={n.y} r={55} fill="none" stroke={C.gold} strokeWidth={0.9} opacity={0.6} />
      <g transform={`translate(${n.x} ${n.y}) scale(0.86)`}>
        <Insignia kind={side} p={p} color={ghost ? C.grayGold : C.goldHi} />
      </g>
    </g>
  );
};

/* ── 钟面 ── */
const ClockDial: React.FC<{ p: number; frame: number; hands?: number }> = ({ p, frame, hands = 1 }) => {
  if (p <= 0.002) return null;
  const numerals = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
  const minAngle = -90 + ((frame * 6) % 360) * 0.35;
  const hourAngle = -90 + ((frame * 0.5) % 360) * 0.35;
  return (
    <g opacity={p}>
      <circle cx={CLOCK.x} cy={CLOCK.y} r={CLOCK.r - 6} fill="url(#dialGlow)" opacity={0.9} />
      {new Array(60).fill(0).map((_, i) => {
        const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const long = i % 5 === 0;
        const g = clamp((p - i / 60 * 0.5) / 0.5);
        if (g <= 0) return null;
        const r1 = CLOCK.r - 22;
        const r2 = r1 - (long ? 14 : 6) * g;
        return (
          <line
            key={i}
            x1={CLOCK.x + Math.cos(a) * r1}
            y1={CLOCK.y + Math.sin(a) * r1}
            x2={CLOCK.x + Math.cos(a) * r2}
            y2={CLOCK.y + Math.sin(a) * r2}
            stroke={long ? "#3A2C1A" : "#52402A"}
            strokeWidth={long ? 2.4 : 1.1}
            opacity={(long ? 0.92 : 0.6) * g}
          />
        );
      })}
      {numerals.map((n, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const g = clamp((p - 0.25 - (i / 12) * 0.5) / 0.5);
        if (g <= 0) return null;
        return (
          <text
            key={n}
            x={CLOCK.x + Math.cos(a) * (CLOCK.r - 46)}
            y={CLOCK.y + Math.sin(a) * (CLOCK.r - 46) + 7}
            textAnchor="middle"
            fontFamily={FONT.latin}
            fontSize={i % 3 === 0 ? 25 : 19}
            fill={i % 3 === 0 ? "#2E2214" : "#3E3020"}
            opacity={0.94 * g}
            letterSpacing={1}
          >
            {n}
          </text>
        );
      })}
      <g opacity={hands}>
        <line
          x1={CLOCK.x}
          y1={CLOCK.y}
          x2={CLOCK.x + Math.cos((hourAngle * Math.PI) / 180) * 62}
          y2={CLOCK.y + Math.sin((hourAngle * Math.PI) / 180) * 62}
          stroke="#2A2014"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.92}
        />
        <line
          x1={CLOCK.x}
          y1={CLOCK.y}
          x2={CLOCK.x + Math.cos((minAngle * Math.PI) / 180) * 98}
          y2={CLOCK.y + Math.sin((minAngle * Math.PI) / 180) * 98}
          stroke="#2A2014"
          strokeWidth={2.8}
          strokeLinecap="round"
          opacity={0.9}
        />
        <circle cx={CLOCK.x} cy={CLOCK.y} r={7} fill="#3A2C1A" />
        <circle cx={CLOCK.x} cy={CLOCK.y} r={3} fill={C.goldHi} opacity={0.9} />
      </g>
    </g>
  );
};

/* ── 场景 ── */
export const OpportunityCost: React.FC<{ frame: number }> = ({ frame }) => {
  const s11 = frame < 1440;
  const s12 = frame >= 1440 && frame < 1590;
  const s13 = frame >= 1590 && frame < 1770;
  const s14 = frame >= 1770 && frame < 1950;
  const s15 = frame >= 1950;

  const l11 = frame - 1290;
  const l12 = frame - 1440;
  const l13 = frame - 1590;
  const l14 = frame - 1770;
  const l15 = frame - 1950;

  // 相机
  const zoomToLeft = s14 ? easeInOut(seg(l14, 6, 60)) : s15 ? 1 - easeInOut(seg(l15, 0, 40)) : 0;
  const push = s11
    ? lerp(1.0, 1.02, easeInOut(seg(l11, 0, 150)))
    : s12
      ? lerp(1.02, 1.0, easeInOut(seg(l12, 0, 150)))
      : s13
        ? lerp(1.0, 1.03, easeInOut(seg(l13, 0, 180)))
        : s14
          ? lerp(1.03, 1.2, easeInOut(seg(l14, 6, 60)))
          : lerp(1.2, 1.04, easeInOut(seg(l15, 0, 40)));
  const camX = zoomToLeft * 480;
  const camY = -zoomToLeft * 40;

  // 金币 / 钟
  const drop = s11 ? springy(seg(l11, 2, 22), 0.22, 5.5) : 1;
  const coinY = s11 ? lerp(400, CLOCK.y, drop) : CLOCK.y;
  const coinSize = s11 ? lerp(260, 306, drop) : 336;
  const clockMorph = s11 ? 0 : s12 ? easeInOut(seg(l12, 0, 34)) : 1;
  const coinOpacity = s11 ? easeInOut(seg(l11, 0, 8)) : 1;

  // 三条路径生长
  const grow = {
    left: s11 ? easeOut(seg(l11, 30, 70)) : 1,
    center: s11 ? easeOut(seg(l11, 44, 86)) : 1,
    right: s11 ? easeOut(seg(l11, 58, 102)) : 1,
  };

  // 选择脉冲（S13）
  const pulse = s13 ? easeInOut(seg(l13, 8, 44)) : s14 || s15 ? 1 : 0;
  const dimUnchosen = s13 ? easeInOut(seg(l13, 58, 116)) : 1;
  const ghostUnchosen = s13 ? easeInOut(seg(l13, 70, 140)) : 1;
  const focusLeft = s14 ? easeInOut(seg(l14, 20, 70)) : s15 ? 1 : 0;
  const rightGone = s14 ? easeInOut(seg(l14, 30, 100)) : 0;

  const medalIn = {
    left: s12 ? easeOut(seg(l12, 34, 66)) : 1,
    center: s12 ? easeOut(seg(l12, 44, 76)) : 1,
    right: s12 ? easeOut(seg(l12, 54, 86)) : 1,
  };

  // S14：虚影金币
  const ghostCoin = s14 ? easeInOut(seg(l14, 40, 80)) : s15 ? 1 : 0;
  const ghostFade = s15 ? 1 - easeInOut(seg(l15, 20, 90)) : 1;

  // S15：沙化 → 砝码
  const sand = s15 ? easeInOut(seg(l15, 16, 96)) : 0;
  const scaleRise = s15 ? easeInOut(seg(l15, 70, 170)) : 0;
  const scaleX = 1408;
  const scaleY = lerp(900, 664, scaleRise);
  const scaleS = 0.8;
  const weight = s15 ? easeInOut(seg(l15, 96, 150)) : 0;
  const pans = panPositions(scaleX, scaleY, scaleS, -6 * weight);
  const angle = -6 * weight;

  // 被选路径继续向前
  const chosenExtend = s15 ? easeOut(seg(l15, 10, 80)) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: C.black }}>
      <Backdrop warm={0.62} wall={0.14} gx={0.5} gy={0.42} spread={1.05} />
      <Glow x={CLOCK.x} y={CLOCK.y - 60} size={900} opacity={0.2} />
      <Glow x={CLOCK.x} y={CLOCK.y - 10} size={440} opacity={0.16} variant="ember" />
      <Glow x={NODES.center.x} y={NODES.center.y + 60} size={620} opacity={0.08} />

      <Camera scale={push} x={camX} y={camY}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {/* 未选道路：残影虚线 */}
          {(["left", "right"] as const).map((side) => (
            <React.Fragment key={side}>
              <PathLine
                d={PATHS[side]}
                progress={grow[side]}
                opacity={1 - dimUnchosen}
                width={2.2}
                color={C.gold}
                glow={0.7}
              />
              <PathLine
                d={PATHS[side]}
                progress={ghostUnchosen}
                opacity={0.42 * dimUnchosen * (side === "right" ? 1 - rightGone * 0.85 : 1)}
                width={1.2}
                color={C.copper}
                dashed
              />
              {side === "left" && focusLeft > 0 && (
                <PathLine d={PATHS[side]} progress={1} opacity={0.85 * focusLeft} width={2.2} color={C.goldHi} glow={0.8} />
              )}
            </React.Fragment>
          ))}

          {/* 被选道路 */}
          <PathLine d={PATHS.center} progress={grow.center} width={2.4} color={C.gold} glow={0.6} />
          {pulse > 0 && <PathLine d={PATHS.center} progress={pulse} width={3} color={C.goldHi} glow={1} />}

          {/* 选择脉冲的移动光点 */}
          {s13 && pulse > 0 && pulse < 1 && (
            <g>
              <circle cx={960} cy={lerp(500, 278, pulse)} r={5} fill="#FFF8E6" />
              <circle cx={960} cy={lerp(500, 278, pulse)} r={16} fill="none" stroke={C.goldHi} strokeWidth={1} opacity={0.5} />
            </g>
          )}

          {/* 前进方向：被选路线继续延伸 */}
          {chosenExtend > 0 && (
            <PathLine d="M 960 278 C 960 210 992 168 1046 148" progress={chosenExtend} width={2.2} color={C.goldHi} glow={0.7} />
          )}

          <Medallion side="left" p={medalIn.left} opacity={1 - rightGone * 0.7} glow={s14 ? focusLeft : 0} ghost={!s14} />
          <Medallion side="center" p={medalIn.center} glow={pulse * 0.8} />
          <Medallion side="right" p={medalIn.right} opacity={1 - rightGone * 0.88} ghost />
        </svg>

        {/* 金币 → 钟 */}
        {s11 && <CoinAt x={960} y={coinY} size={coinSize} tilt={Math.cos(l11 * 0.06)} spin={l11 * 0.5} opacity={coinOpacity} glow={0.6} />}
        {!s11 && (
          <CoinAt
            x={CLOCK.x}
            y={CLOCK.y}
            size={coinSize}
            tilt={lerp(Math.cos((l12 + 40) * 0.05), 1 - 0.05 * Math.sin(frame * 0.03), clockMorph)}
            opacity={coinOpacity}
            glow={0.35}
          />
        )}

        {/* 钟面 */}
        {clockMorph > 0 && (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <radialGradient id="dialGlow" cx="0.4" cy="0.32" r="0.78">
                <stop offset="0%" stopColor="#F2DFB0" stopOpacity="0.34" />
                <stop offset="52%" stopColor="#C49A57" stopOpacity="0.1" />
                <stop offset="86%" stopColor="#3A2C1A" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#241A10" stopOpacity="0.5" />
              </radialGradient>
            </defs>
            <ClockDial p={clockMorph} frame={frame} />
            {/* 摆锤 */}
            <g opacity={clockMorph * clamp((l12 - 30) / 30)}>
              <line
                x1={CLOCK.x}
                y1={CLOCK.y + CLOCK.r - 8}
                x2={CLOCK.x + Math.sin(l12 * 0.09) * 34}
                y2={CLOCK.y + CLOCK.r + 34}
                stroke={C.gold}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={0.9}
              />
              <circle cx={CLOCK.x + Math.sin(l12 * 0.09) * 34} cy={CLOCK.y + CLOCK.r + 40} r={10} fill={C.gold} opacity={0.95} />
              <circle cx={CLOCK.x + Math.sin(l12 * 0.09) * 34 - 3} cy={CLOCK.y + CLOCK.r + 36} r={3} fill="#FFF3D6" opacity={0.6} />
            </g>
          </svg>
        )}

        {/* 用途名 */}
        {clockMorph > 0 && (
          <>
            {[
              { side: "left" as Side, label: "工作" },
              { side: "center" as Side, label: "休息" },
              { side: "right" as Side, label: "学习" },
            ].map(({ side, label }) => {
              const n = NODES[side];
              const o = clamp((medalIn[side] - 0.6) / 0.4);
              if (o <= 0) return null;
              return (
                <div
                  key={side}
                  style={{
                    position: "absolute",
                    left: n.x - 60,
                    top: n.y + 74,
                    width: 120,
                    textAlign: "center",
                    fontFamily: FONT.cjk,
                    fontSize: 24,
                    letterSpacing: "4px",
                    color: C.grayGold,
                    opacity: o * (side === "right" ? 1 - rightGone * 0.75 : 1),
                  }}
                >
                  {label}
                </div>
              );
            })}
          </>
        )}

        {/* S14：最佳未选之路的虚影金币与注记 */}
        {ghostCoin > 0 && (
          <>
            <CoinAt
              x={NODES.left.x + 162}
              y={NODES.left.y - 4}
              size={150}
              tilt={0.92}
              opacity={0.55 * ghostCoin * ghostFade}
              ghost
              glow={0.5}
            />
            <div
              style={{
                position: "absolute",
                left: NODES.left.x - 240,
                top: NODES.left.y + 96,
                width: 440,
                textAlign: "center",
                fontFamily: FONT.cjk,
                fontSize: 22,
                letterSpacing: "3px",
                color: C.grayGold,
                opacity: 0.9 * ghostCoin * ghostFade,
                lineHeight: 1.6,
              }}
            >
              假如：这条未选之路，最有价值
            </div>
          </>
        )}

        {/* S15：沙化 → 天平砝码 */}
        {sand > 0 && (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {new Array(120).fill(0).map((_, i) => {
              const t0 = hash01(i, 13);
              const t = clamp((sand - t0 * 0.55) / 0.45);
              if (t <= 0) return null;
              const sx = lerp(858, NODES.left.x, hash01(i, 29));
              const sy = lerp(545, NODES.left.y, hash01(i, 31)) + (hash01(i, 37) - 0.5) * 60;
              const tx = pans.left.x + (hash01(i, 41) - 0.5) * 70;
              const ty = pans.left.y - 12 - hash01(i, 43) * 10;
              const e = t * t * (3 - 2 * t);
              const x = lerp(sx, tx, e) + Math.sin(t * 6 + i) * 12 * (1 - e);
              const y = lerp(sy, ty, e) + Math.cos(t * 5 + i * 0.7) * 16 * (1 - e);
              return <circle key={i} cx={x} cy={y} r={1.1 + hash01(i, 47) * 1.5} fill={C.goldHi} opacity={0.65 * (1 - clamp((t - 0.85) / 0.15))} />;
            })}
          </svg>
        )}

        {scaleRise > 0 && (
          <BrassScale cx={scaleX} cy={scaleY} s={scaleS} angle={angle} progress={scaleRise} opacity={0.96} tickGlow={weight} />
        )}
        {weight > 0 && (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <g transform={`translate(${pans.left.x} ${pans.left.y - 16}) scale(${0.62})`} opacity={weight}>
              <path d="M -34 0 L 34 0 L 28 -34 L -28 -34 Z" fill="#8A6C42" stroke={C.goldHi} strokeWidth={1.6} opacity={0.95} />
              <path d="M -28 -34 L 28 -34 L 20 -42 L -20 -42 Z" fill="#B08A51" stroke={C.goldHi} strokeWidth={1.2} opacity={0.9} />
              <line x1={-16} y1={-14} x2={16} y2={-14} stroke="#5B4527" strokeWidth={1.4} opacity={0.8} />
            </g>
          </svg>
        )}
      </Camera>
    </AbsoluteFill>
  );
};
