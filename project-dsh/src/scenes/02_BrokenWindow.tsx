import React from "react";
import { AbsoluteFill } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Camera } from "../components/Camera";
import { CoinAt } from "../components/CoinAt";
import { Glow } from "../components/Glow";
import { Parchment } from "../components/Parchment";
import { C, FONT } from "../config/film";
import { clamp, easeInOut, easeOut, lerp, seg } from "../lib/motion";
import { hash01 } from "../lib/rng";

const INK = "#33291E";
const INK2 = "#5C4A34";

/* ────────── 线描小件 ────────── */

const HatchedFigure: React.FC<{
  x: number;
  y: number;
  s?: number;
  color: string;
  opacity?: number;
  hat?: boolean;
}> = ({ x, y, s = 1, color, opacity = 1, hat = true }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity} stroke={color} fill="none" strokeWidth={1.6}>
    <circle cx={0} cy={-58} r={11} />
    {hat && <path d="M -15 -66 L 15 -66 L 11 -74 L -11 -74 Z" />}
    <path d="M 0 -47 L 0 -6" />
    <path d="M 0 -40 L -19 -22 L -22 -6" />
    <path d="M 0 -40 L 19 -26 L 24 -12" />
    <path d="M 0 -6 L -13 30 M 0 -6 L 14 30" />
    <path d="M -13 30 L -17 32 M 14 30 L 10 32" />
  </g>
);

const Shoe: React.FC<{ x: number; y: number; s?: number; color: string; opacity?: number; dotted?: boolean }> = ({
  x,
  y,
  s = 1,
  color,
  opacity = 1,
  dotted = false,
}) => (
  <g
    transform={`translate(${x} ${y}) scale(${s})`}
    opacity={opacity}
    stroke={color}
    fill="none"
    strokeWidth={1.8}
    strokeDasharray={dotted ? "5 6" : undefined}
    strokeLinejoin="round"
  >
    <path d="M -62 18 C -62 18 -54 -8 -24 -14 L 6 -20 C 28 -24 42 -10 50 2 C 56 12 56 18 56 18 L -62 18 Z" />
    <path d="M -62 18 L 56 18" strokeWidth={2.4} />
    <path d="M -44 18 L -44 6 C -34 6 -28 0 -22 -6" />
    <path d="M -60 12 L -62 24" strokeWidth={2.2} />
    <path d="M 52 16 L 54 24" strokeWidth={2.2} />
    <circle cx={-30} cy={-6} r={2.4} />
    <circle cx={-16} cy={-9} r={2.4} />
    <circle cx={-2} cy={-12} r={2.4} />
  </g>
);

/** 破窗铺面线描：真实世界与反事实世界的共用图形 */
const ShopFront: React.FC<{
  color: string;
  progress: number;
  /** 0 = 破，1 = 已修 */
  repaired: number;
  opacity?: number;
  k?: number;
}> = ({ color, progress, repaired, opacity = 1, k = 1 }) => {
  const draw = (p: number, len = 1) => ({
    pathLength: len,
    strokeDasharray: len,
    strokeDashoffset: len * (1 - clamp(p)),
  });
  return (
    <g opacity={opacity} stroke={color} fill="none" strokeWidth={2 * k} strokeLinejoin="round" transform={`scale(${k})`}>
      {/* 立面 */}
      <path d="M -262 196 L -262 -150 L 262 -150 L 262 196" {...draw(progress)} />
      {/* 檐口 + 雨篷 */}
      <path d="M -278 -150 L 278 -150" strokeWidth={3.4 * k} {...draw(progress * 1.05)} />
      <path d="M -250 -150 L -250 -186 L 250 -186 L 250 -150" {...draw(progress * 1.02)} />
      {new Array(9).fill(0).map((_, i) => (
        <line key={i} x1={-244 + i * 61} y1={-186} x2={-244 + i * 61} y2={-154} strokeWidth={1 * k} {...draw(clamp(progress * 1.3 - i * 0.05))} />
      ))}
      {/* 橱窗 */}
      <rect x={-206} y={-96} width={286} height={216} strokeWidth={2.6 * k} {...draw(clamp(progress * 1.15 - 0.1))} />
      <line x1={-63} y1={-96} x2={-63} y2={120} strokeWidth={2 * k} {...draw(clamp(progress * 1.2 - 0.16))} />
      <line x1={-206} y1={12} x2={80} y2={12} strokeWidth={2 * k} {...draw(clamp(progress * 1.2 - 0.2))} />
      {/* 门 */}
      <rect x={112} y={-60} width={106} height={256} strokeWidth={2.4 * k} {...draw(clamp(progress * 1.1 - 0.14))} />
      <circle cx={196} cy={92} r={3.4} strokeWidth={1.4 * k} {...draw(clamp(progress * 1.4 - 0.4))} />
      {/* 地面 */}
      <path d="M -300 196 L 300 196" strokeWidth={2.6 * k} {...draw(clamp(progress * 1.05))} />
      {/* 招牌字位（抽象横条，不用伪文字） */}
      <line x1={-150} y1={-210} x2={-20} y2={-210} strokeWidth={2 * k} {...draw(clamp(progress * 1.2 - 0.3))} />
      <line x1={6} y1={-210} x2={96} y2={-210} strokeWidth={2 * k} {...draw(clamp(progress * 1.2 - 0.36))} />

      {/* 破裂 / 修补 的窗格（左上格） */}
      <g opacity={1}>
        {repaired < 1 && (
          <g opacity={1 - repaired} stroke={color} strokeWidth={1.3 * k}>
            <path d="M -160 -40 L -128 -18 L -96 -52 L -74 -20 L -46 -46" />
            <path d="M -128 -18 L -120 40 L -84 68" />
            <path d="M -96 -52 L -66 -66 L -34 -40" />
            <path d="M -150 24 L -120 40 L -96 96" />
            <path d="M -108 -70 L -104 -100" opacity={0.7} />
          </g>
        )}
        {repaired > 0 && (
          <g opacity={repaired}>
            <rect x={-206} y={-96} width={143} height={108} fill={C.gold} opacity={0.13} stroke="none" />
            <path d="M -196 -60 L -110 -88" stroke="#F7EED8" strokeWidth={4 * k} opacity={0.5} />
            <line x1={-63} y1={-96} x2={-63} y2={12} stroke={C.gold} strokeWidth={1.4 * k} opacity={0.8} />
            <circle cx={-70} cy={-52} r={2.6} fill="#FFF8E6" stroke="none" opacity={0.8 * repaired} />
          </g>
        )}
      </g>
    </g>
  );
};

/* ────────── S05：文献页 ────────── */
const Dossier: React.FC<{ p: number }> = ({ p }) => (
  <svg viewBox="0 0 1180 740" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
    {/* 文字衬底：抽象横线，不伪造文字 */}
    <g stroke={INK2} strokeWidth={1} opacity={0.3 * p}>
      {new Array(17).fill(0).map((_, i) => (
        <line
          key={i}
          x1={430}
          y1={300 + i * 22}
          x2={430 + (i % 5 === 4 ? 470 : 560 + (hash01(i, 5) - 0.5) * 60)}
          y2={300 + i * 22}
        />
      ))}
      {new Array(6).fill(0).map((_, i) => (
        <line key={`b${i}`} x1={140} y1={560 + i * 22} x2={140 + 320 + (hash01(i, 9) - 0.5) * 40} y2={560 + i * 22} />
      ))}
    </g>

    {/* 人物雕版章 */}
    <g opacity={p} transform="translate(250 300)">
      <ellipse rx={110} ry={138} fill="none" stroke={C.copper} strokeWidth={2} />
      <ellipse rx={100} ry={128} fill="none" stroke={C.copper} strokeWidth={0.8} opacity={0.7} />
      <g clipPath="url(#medalClip)">
        <clipPath id="medalClip">
          <ellipse rx={98} ry={126} />
        </clipPath>
        <rect x={-98} y={-126} width={196} height={252} fill={C.parchment} opacity={0.35} />
        {/* 侧面剪影（原创雕刻式，非真实肖像） */}
        <path
          d="M 6 96 C -14 60 -22 34 -20 6 C -18 -22 -6 -46 10 -56 C 22 -64 36 -60 42 -48 C 46 -40 44 -34 50 -30 C 56 -26 54 -18 48 -16 C 44 -15 42 -12 44 -8 C 46 -2 40 4 34 4 C 32 4 30 6 30 10 C 30 22 36 34 40 46 C 46 64 44 82 38 96 Z"
          fill={INK}
          opacity={0.82}
        />
        <g stroke={INK} strokeWidth={0.9} opacity={0.45}>
          {new Array(26).fill(0).map((_, i) => (
            <line key={i} x1={-96} y1={-120 + i * 10} x2={96} y2={-124 + i * 10} />
          ))}
        </g>
      </g>
      <text
        x={0}
        y={168}
        textAnchor="middle"
        fontFamily={FONT.latin}
        fontSize={22}
        letterSpacing={3}
        fill={C.copper}
      >
        F. BASTIAT
      </text>
    </g>

    {/* 标题层 */}
    <g opacity={p} fill={INK} fontFamily={FONT.latin}>
      <text x={430} y={250} fontSize={40} letterSpacing={1}>
        Ce qu’on voit
      </text>
      <text x={430} y={292} fontSize={40} letterSpacing={1}>
        et ce qu’on ne voit pas
      </text>
      <line x1={430} y1={318} x2={430 + 470 * p} y2={318} stroke={C.copper} strokeWidth={1.4} />
      <text x={430} y={356} fontSize={23} fill={INK2} letterSpacing={5} fontFamily={FONT.cjk}>
        破窗 · 第一则
      </text>
    </g>
    <g opacity={p} fontFamily={FONT.cjk} fill={INK2}>
      <text x={140} y={524} fontSize={26} letterSpacing={6}>
        1850 · 巴黎
      </text>
    </g>
  </svg>
);

/* ────────── S07–S09：两页账簿 ────────── */
const PageWorld: React.FC<{
  side: "left" | "right";
  p: number;
  drawP: number;
  repaired: number;
  /** 反事实世界的不透明度衰减 */
  ghost: number;
  ash: number;
  ledger: number;
  coinsPaying: number;
}> = ({ side, p, drawP, repaired, ghost, ash, ledger, coinsPaying }) => {
  const isLeft = side === "left";
  const tint = isLeft ? INK : "#6A5740";
  return (
    <svg viewBox="0 0 790 720" width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: p }}>
      {/* 页眉 */}
      <g opacity={0.9} fontFamily={FONT.cjk} fill={INK2}>
        <text x={54} y={64} fontSize={23} letterSpacing={7}>
          {isLeft ? "已发生" : "未发生 · 假如"}
        </text>
        <line x1={54} y1={80} x2={54 + 120 * p} y2={80} stroke={C.copper} strokeWidth={1.2} opacity={0.7} />
      </g>

      <g transform="translate(395 300)">
        <g opacity={isLeft ? 1 : ghost}>
          <ShopFront color={tint} progress={drawP} repaired={repaired} k={0.86} opacity={isLeft ? 0.95 : 0.72} />
        </g>
        {/* 反事实：一双鞋，来自同一笔钱 */}
        {!isLeft && (
          <g opacity={ghost * (0.35 + 0.65 * ash)}>
            <Shoe
              x={168}
              y={150}
              s={0.82}
              color={C.gold}
              dotted={ash < 0.45}
              opacity={0.5 + 0.5 * ash}
            />
          </g>
        )}
        {/* 工匠位置：左 = 玻璃匠收到钱；右 = 鞋匠 */}
        <g opacity={0.9}>
          <HatchedFigure x={-238} y={196} s={0.92} color={tint} opacity={isLeft ? 0.9 : 0.6 * ghost} />
        </g>
      </g>

      {/* 金币去向轨迹 */}
      <g opacity={0.85}>
        <path
          d={isLeft ? "M 300 466 Q 220 470 176 436" : "M 300 466 Q 380 470 470 430"}
          pathLength={1}
          fill="none"
          stroke={isLeft ? C.gold : C.copper}
          strokeWidth={1.6}
          strokeDasharray={isLeft ? 1 : "4 6"}
          strokeDashoffset={1 - coinsPaying}
          opacity={isLeft ? 0.85 : 0.55 * ghost}
        />
        {new Array(3).fill(0).map((_, i) => (
          <circle
            key={i}
            cx={lerp(isLeft ? 300 : 300, isLeft ? 176 : 470, coinsPaying * 0.9 + i * 0.05)}
            cy={466 - i * 4}
            r={5}
            fill={isLeft ? C.gold : C.copper}
            opacity={clamp(coinsPaying * 1.4 - i * 0.2) * (isLeft ? 0.9 : 0.5 * ghost)}
          />
        ))}
      </g>

      {/* 账簿 */}
      <g opacity={ledger} fontFamily={FONT.cjk}>
        <line x1={54} y1={556} x2={736} y2={556} stroke={C.copper} strokeWidth={1.2} opacity={0.7} />
        <line x1={54} y1={648} x2={736} y2={648} stroke={C.copper} strokeWidth={1.4} opacity={0.8} />
        <g fill={INK} fontSize={27} letterSpacing={2}>
          <text x={54} y={598}>
            {isLeft ? "支出　6 法郎　→ 玻璃匠" : "支出　6 法郎　→ 鞋匠"}
          </text>
          <text x={54} y={636} fill={isLeft ? INK : "#7A6446"}>
            {isLeft ? "得到　窗（复原）" : "得到　窗 · 鞋"}
          </text>
        </g>
        <text x={736} y={598} textAnchor="end" fontSize={20} fill={INK2} letterSpacing={3}>
          {isLeft ? "可见" : "不可见"}
        </text>
        <text x={736} y={636} textAnchor="end" fontSize={22} fill={isLeft ? C.copper : C.rust} letterSpacing={2}>
          {isLeft ? "合计：窗" : "合计：窗 + 鞋"}
        </text>
      </g>

      {/* 反事实世界的灰烬 */}
      {!isLeft && ash < 1 && (
        <g>
          {new Array(34).fill(0).map((_, i) => {
            const t = clamp((1 - ash) * 1.6 - hash01(i, 61) * 0.6);
            const x = 395 + 100 + (hash01(i, 3) - 0.5) * 260 + t * 90 * (hash01(i, 7) - 0.3);
            const y = 300 + 120 - t * 120 - hash01(i, 11) * 60;
            return (
              <circle key={i} cx={x} cy={y} r={1.1 + hash01(i, 13) * 1.6} fill={C.goldHi} opacity={clamp(t * 1.2) * 0.5 * (1 - t * 0.4)} />
            );
          })}
        </g>
      )}
    </svg>
  );
};

export const BrokenWindow: React.FC<{ frame: number }> = ({ frame }) => {
  const s5 = frame < 570;
  const s6 = frame >= 570 && frame < 720;
  const s7 = frame >= 720 && frame < 870;
  const s8 = frame >= 870 && frame < 1020;
  const s9 = frame >= 1020 && frame < 1170;
  const s10 = frame >= 1170;

  const l6 = frame - 570;
  const l7 = frame - 720;
  const l8 = frame - 870;
  const l9 = frame - 1020;
  const l10 = frame - 1170;

  const camScale = s5
    ? lerp(1.0, 1.03, easeInOut(seg(frame, 450, 570)))
    : s6
      ? lerp(1.03, 1.06, easeInOut(seg(l6, 0, 150)))
      : s7
        ? lerp(1.02, 0.985, easeInOut(seg(l7, 0, 150)))
        : s8
          ? lerp(0.985, 1.005, easeInOut(seg(l8, 0, 150)))
          : s9
            ? lerp(1.005, 1.0, easeInOut(seg(l9, 0, 150)))
            : lerp(1.0, 0.96, easeInOut(seg(l10, 0, 120)));
  const camX = s7 ? lerp(0, -30, easeInOut(seg(l7, 0, 150))) : s8 ? lerp(-30, 20, easeInOut(seg(l8, 0, 150))) : s8 || s9 ? 0 : 0;

  // 单页
  const singleOpen = s5 ? easeInOut(seg(frame, 452, 500)) : 1;
  const singleFade = s6 ? 1 : s7 ? 1 - easeInOut(seg(l7, 0, 16)) : 0;
  const twinIn = s7 ? easeInOut(seg(l7, 2, 26)) : 1;

  // S06 六枚金币
  const payTimes = [26, 44, 62, 80, 98, 116];
  const repaired = s6 ? easeOut(seg(l6, 26, 140)) : 1;
  const drawP = s6 ? easeOut(seg(l6, 4, 46)) : 1;

  // S07/S08
  const drawP7 = s7 ? easeOut(seg(l7, 0, 34)) : 1;
  const ghost = s7 ? 1 : s8 ? lerp(1, 0.32, easeInOut(seg(l8, 0, 120))) : 0.3;
  const ash = s7 ? 1 : s8 ? 1 - easeInOut(seg(l8, 20, 128)) : 0.06;
  const ledgerIn = s9 ? easeInOut(seg(l9, 0, 40)) : s10 ? 1 : 0;
  const coinsPaying = s7 ? easeOut(seg(l7, 10, 70)) : 1;

  // S10 合拢
  const close = s10 ? easeInOut(seg(l10, 0, 60)) : 0;
  const coinIn = s10 ? easeInOut(seg(l10, 44, 86)) : 0;
  const coinTilt = s10 ? 0.93 + 0.07 * Math.cos(l10 * 0.055) : 0;

  const pagePx = { w: 960, h: 590 };
  const twinW = 640;
  const twinH = 580;
  /** 美术坐标(1180x740) → 单页实际尺寸的换算 */
  const artKx = pagePx.w / 1180;
  const artKy = pagePx.h / 740;
  const leftX = 960 - twinW / 2 - 35;
  const rightX = 960 + twinW / 2 + 35;

  return (
    <AbsoluteFill style={{ backgroundColor: C.black }}>
      <Backdrop warm={0.62} wall={0.18} gx={0.5} gy={0.36} spread={1.05} tone="parch" />
      <Glow x={960} y={470} size={1500} opacity={0.11} />

      <Camera scale={camScale} x={camX}>
        {/* 单页（S05–S06） */}
        {singleFade > 0.01 && (
          <Parchment
            width={pagePx.w}
            height={pagePx.h}
            dim={0.61}
            rotate={s5 ? lerp(-2.4, 0, singleOpen) : 0}
            tiltY={s5 ? lerp(74, 0, singleOpen) : 0}
            y={s5 ? lerp(16, 0, singleOpen) : 0}
            opacity={singleFade}
            seed={23}
          >
            <div style={{ position: "absolute", inset: 0, opacity: s5 ? 1 - easeInOut(seg(frame, 552, 580)) : 0 }}>
              <Dossier p={singleOpen} />
            </div>
            {s6 && (
              <svg viewBox="0 0 1180 740" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
                <g opacity={easeInOut(seg(l6, 0, 20))}>
                  <g transform="translate(700 320)">
                    <ShopFront color={INK} progress={drawP} repaired={repaired} k={1} />
                  </g>
                  {/* 六道刻记 */}
                  <g stroke={INK} strokeWidth={3} fill="none">
                    {payTimes.map((t, i) => {
                      const on = clamp((l6 - t) / 6);
                      if (on <= 0) return null;
                      const gx = 132 + i * 26;
                      return (
                        <g key={i} opacity={on}>
                          <line x1={gx} y1={700} x2={gx} y2={700 - 46 * on} />
                          {i === 2 && <line x1={118} y1={686} x2={200} y2={668} strokeWidth={2.4} opacity={0.8} />}
                          {i === 5 && <line x1={118} y1={668} x2={222} y2={692} strokeWidth={2.4} opacity={0.8} />}
                        </g>
                      );
                    })}
                  </g>
                  <text x={132} y={730} fontFamily={FONT.cjk} fontSize={22} fill={INK2} letterSpacing={4}>
                    6 法郎
                  </text>
                  {/* 修补提示 */}
                  <g opacity={clamp((drawP - 0.7) / 0.3)} fontFamily={FONT.cjk} fill={C.copper}>
                    <text x={700} y={640} fontSize={22} textAnchor="middle" letterSpacing={5}>
                      玻璃匠 · 修好了
                    </text>
                  </g>
                </g>
              </svg>
            )}
          </Parchment>
        )}

        {/* 双页（S07–S09） */}
        {twinIn > 0.01 && (
          <>
            <Parchment
              width={twinW}
              height={twinH}
              x={lerp(0, leftX - 960, twinIn) - close * 210}
              y={0}
              rotate={lerp(-1.4, -0.5, twinIn)}
              dim={0.57}
              tiltY={-close * 62}
              opacity={twinIn * (s10 ? 1 - easeInOut(seg(l10, 30, 62)) : 1)}
              seed={41}
            >
              <PageWorld
                side="left"
                p={1}
                drawP={drawP7}
                repaired={1}
                ghost={1}
                ash={1}
                ledger={ledgerIn}
                coinsPaying={coinsPaying}
              />
            </Parchment>
            <Parchment
              width={twinW}
              height={twinH}
              x={lerp(0, rightX - 960, twinIn) + close * 210}
              y={0}
              rotate={lerp(1.4, 0.5, twinIn)}
              dim={0.57}
              tiltY={close * 62}
              opacity={twinIn * (s10 ? 1 - easeInOut(seg(l10, 30, 62)) : 1)}
              seed={59}
            >
              <PageWorld
                side="right"
                p={1}
                drawP={drawP7}
                repaired={0}
                ghost={ghost}
                ash={ash}
                ledger={ledgerIn}
                coinsPaying={coinsPaying}
              />
            </Parchment>
          </>
        )}

        {/* S06：六枚金币从右上方飞入，逐一消失在修补线上 */}
        {s6 &&
          payTimes.map((t, i) => {
            const lt = l6 - (t - 26);
            if (lt < 0 || lt > 34) return null;
            const p = clamp(lt / 26);
            const e = easeOut(p);
            const startX = 1560 + (hash01(i, 71) - 0.5) * 120;
            const startY = 180 + (hash01(i, 91) - 0.5) * 90;
            const tx = 700 - 63;
            const ty = 320 - 42;
            const pageX = 960 - pagePx.w / 2 + 700 * artKx;
            const pageY = 540 - pagePx.h / 2 + 320 * artKy;
            const x = lerp(startX, pageX + (tx - 700) * artKx, e);
            const y = lerp(startY, pageY + (ty - 320) * artKy, e) - 60 * Math.sin(Math.PI * e);
            const op = lt > 26 ? 1 - clamp((lt - 26) / 8) : 1;
            if (op <= 0) return null;
            return (
              <div key={i}>
                <CoinAt
                  x={x}
                  y={y}
                  size={64}
                  tilt={Math.cos(p * Math.PI * 2.2 + i)}
                  opacity={op}
                  glow={0.5}
                  shadow={false}
                  spec={0.9}
                />
                {lt > 24 && (
                  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
                    <circle
                      cx={pageX + (tx - 700) * artKx}
                      cy={pageY + (ty - 320) * artKy}
                      r={8 + 26 * clamp((lt - 24) / 10)}
                      fill="none"
                      stroke={C.goldHi}
                      strokeWidth={1.6}
                      opacity={0.7 * (1 - clamp((lt - 24) / 10))}
                    />
                  </svg>
                )}
              </div>
            );
          })}

        {/* S10：账簿合拢 → 一枚金币 */}
        {s10 && coinIn > 0 && (
          <>
            <Glow x={960} y={470} size={520} opacity={0.35 * coinIn} />
            <CoinAt x={960} y={470} size={lerp(90, 250, coinIn)} tilt={coinTilt} spin={l10 * 0.4} opacity={coinIn} glow={0.6} />
          </>
        )}
      </Camera>

      {/* 法文文献小注 */}
      {s10 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 250,
            textAlign: "center",
            opacity: easeInOut(seg(l10, 30, 62)) * 0.85,
            fontFamily: FONT.latin,
            fontSize: 20,
            letterSpacing: "9px",
            color: C.copper,
            lineHeight: 1.9,
          }}
        >
          <div>CE QU’ON VOIT</div>
          <div>CE QU’ON NE VOIT PAS</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
