import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {C, FONT_CN, hourPaths} from "../config/film";
import {Stage} from "../components/Atmosphere";
import {GoldCoin} from "../components/GoldCoin";
import {TEX} from "../components/ParchmentPage";
import {scaleGeom} from "../components/BrassScale";
import {bezier, bezierPath, gearPath, Pt} from "../utils/geometry";
import {clamp01, damped, easeIn, easeInOut, easeOut, lerp, prog} from "../utils/motion";
import {rnd, rndRange, rndSigned} from "../utils/seededRandom";

const START = 1205;
const END = 2180;

export const J: Pt = [600, 520];
const COIN_R = 72;
const ends: Pt[] = [
  [1390, 270],
  [1450, 520],
  [1390, 760],
];
const RR = 60; // 纸面刻图半径
const starts: Pt[] = [-34, 0, 34].map((deg) => {
  const a = (deg * Math.PI) / 180;
  return [J[0] + Math.cos(a) * (COIN_R + 6), J[1] + Math.sin(a) * (COIN_R + 6)] as Pt;
});
const ctrl = (i: number): [Pt, Pt, Pt, Pt] => {
  const s = starts[i];
  const e: Pt = [ends[i][0] - RR - 6, ends[i][1]];
  return [s, [s[0] + 260, s[1] + (e[1] - s[1]) * 0.05], [e[0] - 300, e[1]], e];
};
const pathD = (i: number) => {
  const [a, b, c, d] = ctrl(i);
  return bezierPath(a, b, c, d);
};

/** 第三章天平的位置（供砂粒汇聚目标使用；与 04_PresentBias 保持一致） */
export const SCALE_PIVOT: Pt = [960, 300];
export const scaleRise = (f: number) => lerp(620, 0, prog(f, 2060, 2185, easeInOut));
export const leftPanAt = (f: number): Pt => {
  const g = scaleGeom(SCALE_PIVOT[0], SCALE_PIVOT[1] + scaleRise(f), 0);
  return g.left;
};

// 砂粒：来自未选路径（学习 / 休息）与虚影金币
const SAND_N = 320;
const sand = Array.from({length: SAND_N}, (_, i) => {
  const which = i < 140 ? 1 : i < 280 ? 2 : 3; // 3 = 虚影金币
  const u = rnd(`su${i}`);
  return {which, u, dx: rndSigned(`sdx${i}`), delay: rnd(`sdl${i}`), tx: rndSigned(`stx${i}`), ty: rnd(`sty${i}`), size: rndRange(`ssz${i}`, 1, 2.4)};
});

const ghostCoinPos = (): Pt => bezier(...ctrl(2), 0.72);

/** 三种用途的纸面刻图（抽象符号，不画人物） */
const Icon: React.FC<{k: number}> = ({k}) => {
  const st = {fill: "none", stroke: C.ink, strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const};
  if (k === 0)
    // 工作：齿轮 + 锤
    return (
      <g {...st}>
        <path d={gearPath(20, 10, 5)} transform="translate(-8 6)" />
        <circle cx={-8} cy={6} r={6} />
        <path d="M6 -24 L26 16" strokeWidth={4} />
        <path d="M-2 -30 L16 -38 L20 -28 L2 -20 Z" fill={C.ink} />
      </g>
    );
  if (k === 1)
    // 学习：打开的书
    return (
      <g {...st}>
        <path d="M0 -18 C-12 -26 -26 -26 -34 -20 V20 C-26 14 -12 14 0 22 Z" />
        <path d="M0 -18 C12 -26 26 -26 34 -20 V20 C26 14 12 14 0 22 Z" />
        <path d="M-28 -10 C-20 -14 -10 -13 -5 -9 M-28 0 C-20 -4 -10 -3 -5 1 M28 -10 C20 -14 10 -13 5 -9 M28 0 C20 -4 10 -3 5 1" strokeWidth={1.2} />
      </g>
    );
  // 休息：茶杯与热气
  return (
    <g {...st}>
      <path d="M-22 -4 H18 V6 C18 20 8 26 -2 26 C-12 26 -22 20 -22 6 Z" />
      <path d="M18 0 C30 0 30 14 16 14" />
      <ellipse cx={-2} cy={30} rx={30} ry={5} />
      <path d="M-12 -12 C-16 -18 -8 -22 -12 -30 M0 -12 C-4 -18 4 -22 0 -30 M12 -12 C8 -18 16 -22 12 -30" strokeWidth={1.4} />
    </g>
  );
};

const Roundel: React.FC<{c: Pt; k: number; appear: number; dim: number; glow: number}> = ({c, k, appear, dim, glow}) => {
  if (appear <= 0) return null;
  const s = lerp(0.6, 1, easeOut(appear));
  return (
    <g transform={`translate(${c[0]} ${c[1]}) scale(${s})`} opacity={clamp01(appear * 1.5)}>
      {glow > 0 && <circle r={RR * 2.2} fill="url(#glowGold)" opacity={glow} />}
      <clipPath id={`rd${k}`}>
        <circle r={RR} />
      </clipPath>
      <image href={TEX.page} x={-RR - 30} y={-RR - 40} width={RR * 2 + 60} height={RR * 2 + 80} clipPath={`url(#rd${k})`} preserveAspectRatio="none" />
      <circle r={RR} fill="none" stroke={C.gold} strokeWidth={2} />
      <circle r={RR + 6} fill="none" stroke={C.gold} strokeWidth={0.8} opacity={0.6} />
      <Icon k={k} />
      {dim > 0 && <circle r={RR + 1} fill="#0B0907" opacity={dim} />}
    </g>
  );
};

export const OpportunityCostScene: React.FC = () => {
  const f = useCurrentFrame();
  if (f < START || f > END) return null;

  // ---------------- 金币：出现 → 落到路口 → 变钟
  const emerge = prog(f, 1212, 1248, easeOut);
  const drop = prog(f, 1292, 1316, easeIn);
  const bounce = damped(f - 1316, -14, 0.55, 6);
  const coinX = lerp(960, J[0], prog(f, 1290, 1316, easeInOut));
  const coinY = lerp(500, J[1], drop) - Math.sin(prog(f, 1290, 1316) * Math.PI) * 60 + (f > 1316 ? bounce : 0);
  const coinR = lerp(110, COIN_R, prog(f, 1290, 1316, easeInOut));
  const idleSpin = 0.32 * Math.sin((f - 1248) / 28) * (1 - prog(f, 1290, 1316));
  const toClock = prog(f, 1444, 1472, easeInOut);
  const spin = (1 - emerge) * (Math.PI / 2) + idleSpin + toClock * Math.PI;
  const clock = f >= 1458 ? 1 : 0;
  const minute = 360 * prog(f, 1474, 1588, easeInOut);

  // ---------------- 路径
  const grow = [0, 1, 2].map((i) => prog(f, 1326 + i * 15, 1356 + i * 15, easeInOut));
  const appearR = [0, 1, 2].map((i) => prog(f, 1482 + i * 10, 1508 + i * 10));
  const pulse = prog(f, 1626, 1664, easeInOut);
  const locked = prog(f, 1662, 1676);
  const dashed = prog(f, 1668, 1700);
  const focus = prog(f, 1776, 1806, easeInOut);
  const extend = prog(f, 1958, 2004, easeInOut);
  const sandT = (f: number) => prog(f, 1990, 2040, (x) => x);
  const crumble = sandT(f);
  const lift = prog(f, 2056, 2160, easeInOut);
  const sceneFade = 1 - prog(f, 2120, 2160);

  // 各路径透明度
  const pathOp = (i: number) => {
    if (i === hourPaths.chosen) return 0.85 + 0.15 * locked;
    const base = lerp(0.85, 0.32, dashed);
    if (i === hourPaths.bestForgone) return lerp(base, 0.9, focus) * (1 - crumble);
    return lerp(base, 0.06, focus) * (1 - crumble);
  };

  const camScale = lerp(1, 1.05, focus) - 0.05 * prog(f, 1950, 2000);
  const camY = -lerp(0, 40, focus) * (1 - prog(f, 1950, 2000)) - lift * 640;
  const camRotX = lift * 28;

  const pulsePt = bezier(...ctrl(hourPaths.chosen), pulse);
  const gc = ghostCoinPos();
  const E0 = ends[hourPaths.chosen];
  const E2 = ends[hourPaths.bestForgone];

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{perspective: 1800, perspectiveOrigin: "960px 300px"}}>
        <AbsoluteFill
          style={{
            transformOrigin: "960px 540px",
            transform: `translateY(${camY}px) rotateX(${camRotX}deg) scale(${camScale})`,
            opacity: sceneFade,
          }}
        >
          <Stage>
            {/* 地面网格：极弱，给出“路口”的空间感 */}
            <g stroke={C.copper} strokeWidth={0.6} opacity={0.18 * prog(f, 1300, 1360)}>
              {Array.from({length: 9}, (_, i) => (
                <line key={i} x1={300} x2={1700} y1={240 + i * 70} y2={240 + i * 70} strokeDasharray="2 10" />
              ))}
            </g>
            {/* 被选路线继续向前 */}
            {extend > 0 && (
              <path d={`M${E0[0] + 30} ${E0[1] - RR + 6} C${E0[0] + 60} ${E0[1] - 150} ${E0[0] + 260} ${E0[1] - 200} 2000 ${E0[1] - 230}`} fill="none" stroke={C.goldHi} strokeWidth={2.6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - extend} />
            )}
            {[0, 1, 2].map((i) => {
              const chosen = i === hourPaths.chosen;
              const op = pathOp(i);
              const solid = chosen ? 1 : 1 - dashed;
              const bright = chosen ? locked : 0;
              const blurChosen = chosen ? focus * (1 - prog(f, 1950, 1990)) * 1.6 : 0;
              return (
                <g key={i} style={blurChosen > 0.05 ? {filter: `blur(${blurChosen}px)`} : undefined}>
                  <path d={pathD(i)} fill="none" stroke={C.gold} strokeWidth={10} opacity={0.12 * op * grow[i]} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - grow[i]} />
                  <path
                    d={pathD(i)}
                    fill="none"
                    stroke={bright > 0 ? C.goldHi : C.gold}
                    strokeWidth={2 + bright * 1.2}
                    opacity={op * solid}
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - grow[i]}
                  />
                  {!chosen && dashed > 0 && (
                    <path
                      d={pathD(i)}
                      fill="none"
                      stroke={i === hourPaths.bestForgone ? lerp(0, 1, focus) > 0.5 ? "#D8BE8A" : C.greyGold : C.greyGold}
                      strokeWidth={2}
                      strokeDasharray="0.012 0.012"
                      pathLength={1}
                      opacity={op * dashed}
                    />
                  )}
                </g>
              );
            })}
            {/* 选择脉冲 */}
            {pulse > 0 && pulse < 1 && (
              <g>
                <circle cx={pulsePt[0]} cy={pulsePt[1]} r={34} fill="url(#glowHot)" />
                <circle cx={pulsePt[0]} cy={pulsePt[1]} r={5} fill="#FFF4D6" />
              </g>
            )}
            {/* 纸面刻图 */}
            {[0, 1, 2].map((k) => {
              const chosen = k === hourPaths.chosen;
              const best = k === hourPaths.bestForgone;
              const dim = chosen ? 0 : lerp(0, 0.55, dashed) * (best ? 1 - focus * 0.85 : 1) + (!chosen && !best ? 0.35 * focus : 0);
              const vanish = chosen ? 0 : crumble;
              return (
                <g key={k} opacity={(1 - vanish) * (!chosen && !best ? 1 - focus * 0.75 : 1)}>
                  <Roundel c={ends[k]} k={k} appear={appearR[k]} dim={dim} glow={chosen ? 0.6 * locked : best ? 0.5 * focus : 0} />
                  <text
                    x={ends[k][0] + RR + 22}
                    y={ends[k][1] + 10}
                    fontFamily={FONT_CN}
                    fontSize={30}
                    letterSpacing="0.16em"
                    fill={chosen ? C.goldHi : C.parchment}
                    opacity={appearR[k] * (chosen ? 1 : lerp(1, 0.5, dashed) * (best ? lerp(1, 1.8, focus) : 1))}
                  >
                    {hourPaths.options[k]}
                  </text>
                </g>
              );
            })}
            {/* 最佳未选：虚影金币 + 注记 */}
            {focus > 0 && (
              <g opacity={focus * (1 - crumble)}>
                <circle cx={gc[0]} cy={gc[1] - 50} r={80} fill="url(#glowGold)" opacity={0.7} />
                <g style={{filter: "drop-shadow(0 0 6px rgba(232,202,136,0.7))"}}>
                  <GoldCoin x={gc[0]} y={gc[1] - 50} r={36} ghost />
                </g>
                <text x={gc[0]} y={gc[1] - 100} textAnchor="middle" fontFamily={FONT_CN} fontSize={22} letterSpacing="0.14em" fill={C.goldHi}>
                  机会成本
                </text>
                <g fontFamily={FONT_CN} fontSize={19} fill={C.greyGold} letterSpacing="0.06em">
                  <text x={E2[0] + RR + 22} y={E2[1] + 46}>
                    假设：此情境中，
                  </text>
                  <text x={E2[0] + RR + 22} y={E2[1] + 72}>
                    这条未选之路价值最高
                  </text>
                </g>
              </g>
            )}
            {/* 路口金币 → 时钟 */}
            {emerge > 0 && (
              <g>
                {f > 1300 && <ellipse cx={J[0]} cy={J[1] + COIN_R + 14} rx={COIN_R * 0.9} ry={8} fill="#000" opacity={0.5 * prog(f, 1300, 1316)} />}
                <GoldCoin x={coinX} y={coinY} r={coinR} spin={spin} clock={clock} minuteAngle={minute} glow={0.35 + 0.3 * locked} opacity={1 - prog(f, 2100, 2150)} />
              </g>
            )}
          </Stage>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* 砂粒（屏幕层）：未选之路 → 天平左盘的细小砝码 */}
      {f >= 1990 && f < 2180 && (
        <Stage>
          {sand.map((p, i) => {
            let src: Pt;
            if (p.which === 3) {
              const a = p.u * Math.PI * 2;
              src = [gc[0] + Math.cos(a) * 36, gc[1] - 50 + Math.sin(a) * 36];
            } else {
              src = bezier(...ctrl(p.which), 0.15 + p.u * 0.85);
            }
            // 世界→屏幕（仅在开始下落时 lift≈0，故近似为原坐标）
            const t0 = 1990 + (1 - p.u) * 34 + p.delay * 8;
            const fall = Math.max(0, f - t0);
            const fallPos: Pt = [src[0] + p.dx * fall * 0.6, src[1] + 0.05 * fall * fall];
            const conv = prog(f, 2050 + p.delay * 20, 2110 + p.delay * 26, easeInOut);
            const pan = leftPanAt(f);
            const target: Pt = [pan[0] + p.tx * 26 * (1 - p.ty * 0.6), pan[1] - 4 - p.ty * 26];
            const pos: Pt = [lerp(fallPos[0], target[0], conv), lerp(fallPos[1], target[1], conv) - Math.sin(conv * Math.PI) * 80];
            const op = (f < t0 ? 0 : 1) * (1 - prog(f, 2172, 2180));
            if (op <= 0) return null;
            return <circle key={i} cx={pos[0]} cy={pos[1]} r={p.size} fill={conv > 0.9 ? "#D9B56E" : "#E8CA88"} opacity={op * 0.85} />;
          })}
        </Stage>
      )}
    </AbsoluteFill>
  );
};
