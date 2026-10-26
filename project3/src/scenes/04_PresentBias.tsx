import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {C, FONT_CN, FONT_LATIN, intertemporalPairs} from "../config/film";
import {Stage} from "../components/Atmosphere";
import {GoldCoin} from "../components/GoldCoin";
import {BrassScale, scaleGeom} from "../components/BrassScale";
import {Pt} from "../utils/geometry";
import {clamp01, damped, easeInOut, easeOut, lerp, prog, springTo} from "../utils/motion";
import {SCALE_PIVOT, scaleRise} from "./03_OpportunityCost";

const START = 2050;
const END = 2975;

const RULER = {x0: 440, x1: 1480, y: 800, days: 45};
const dayX = (d: number) => RULER.x0 + ((RULER.x1 - RULER.x0) * d) / RULER.days;

/** 主观权重示意角度（正 = 偏左/偏现在） */
const beamAngle = (f: number) => {
  let a = damped(f - 2150, 5, 0.16, 26);
  // S17 偏向现在
  a += springTo(f - 2350, 0, 8, 50, 0.08);
  // S18 时间整体后推：左侧不再特别，右侧可能被强调（不确定）
  a += springTo(f - 2565, 0, -11.5, 70, 0.25) + damped(f - 2600, 1.6, 0.2, 40);
  // S19 回到客观一致，天平停止摆动
  a += springTo(f - 2770, 0, 3.5, 45, 0);
  return a;
};

// S20：天平骨架 → 票券烫金边框
type Seg = [Pt, Pt];
const T = {x0: 510, y0: 310, x1: 1410, y1: 650};
const frameSegs: Seg[] = [
  [[T.x0, T.y0], [T.x1, T.y0]],
  [[T.x0, T.y0], [T.x0, T.y1]],
  [[T.x1, T.y0], [T.x1, T.y1]],
  [[T.x0, T.y1], [T.x1, T.y1]],
  [[T.x0 + 10, T.y0 + 10], [T.x0 + 10, T.y1 - 10]],
  [[T.x1 - 10, T.y0 + 10], [T.x1 - 10, T.y1 - 10]],
  [[T.x0 + 10, T.y0 + 10], [T.x1 - 10, T.y0 + 10]],
  [[T.x0 + 10, T.y1 - 10], [T.x1 - 10, T.y1 - 10]],
];
const scaleSegs = (py: number, ang: number): Seg[] => {
  const g = scaleGeom(SCALE_PIVOT[0], py, ang);
  return [
    [g.hangL, g.hangR],
    [[952, py + 14], [952, py + 400]],
    [[968, py + 14], [968, py + 400]],
    [[830, py + 422], [1090, py + 422]],
    [g.hangL, g.left],
    [g.hangR, g.right],
    [[g.left[0] - 100, g.left[1]], [g.left[0] + 100, g.left[1]]],
    [[g.right[0] - 100, g.right[1]], [g.right[0] + 100, g.right[1]]],
  ];
};

const NumLabel: React.FC<{days: number; coins: number}> = ({days, coins}) => {
  const d = Math.round(days);
  return (
    <>
      <tspan fill={d === 0 ? C.goldHi : C.parchment}>{d === 0 ? "现在" : `${d} 天后`}</tspan>
      <tspan fill={C.greyGold}> · </tspan>
      <tspan fill={C.goldHi}>{coins}</tspan>
      <tspan fill={C.parchment}> 枚</tspan>
    </>
  );
};

export const PresentBiasScene: React.FC = () => {
  const f = useCurrentFrame();
  if (f < START || f > END) return null;

  const rise = scaleRise(f);
  const py = SCALE_PIVOT[1] + rise;
  const morph = prog(f, 2872, 2928, easeInOut);
  const ornament = 1 - prog(f, 2852, 2882);
  const ang = beamAngle(f) * (1 - prog(f, 2856, 2880));
  const g = scaleGeom(SCALE_PIVOT[0], py, ang);

  // 时间平移
  const shift = prog(f, 2500, 2560, easeInOut);
  const [A, B] = intertemporalPairs;
  const dL = lerp(A.left.days, B.left.days, shift);
  const dR = lerp(A.right.days, B.right.days, shift);

  // 主观光
  const glowNow = prog(f, 2340, 2390) * (1 - prog(f, 2500, 2550));
  const flash = prog(f, 2700, 2722);
  const restore = prog(f, 2762, 2800, easeInOut);
  // 远期金币“看起来”变小变暗（主观），随后恢复客观大小与亮度
  const shrinkAmt = prog(f, 2702, 2735, easeInOut) * (1 - restore);
  const farShrink = 1 - 0.32 * shrinkAmt;
  const farDim = 1 - 0.45 * shrinkAmt;
  const nearBoost = Math.sin(flash * Math.PI) * 0.9;
  const glowR = prog(f, 2590, 2640) * (1 - restore) * 0.5;

  // 硬币：砝码化为 1 枚；右盘 2 枚
  const weightToCoin = prog(f, 2172, 2196);
  const rightCoins = prog(f, 2200, 2214, easeOut);
  const coinsOut = 1 - prog(f, 2852, 2872);
  const coinR = 30;

  const labelsIn = prog(f, 2318, 2342);
  const rulerIn = prog(f, 2200, 2250);
  const panLabelY = Math.max(g.left[1], g.right[1]) + 72;
  const qMark = prog(f, 2600, 2625) * (1 - restore);

  const segsFrom = scaleSegs(py, 0);
  const lineOut = 1 - prog(f, 2958, 2975);

  return (
    <AbsoluteFill>
      <Stage>
        {/* 时间刻度（低亮度） */}
        <g opacity={0.65 * rulerIn * ornament}>
          <line x1={RULER.x0} x2={RULER.x1} y1={RULER.y} y2={RULER.y} stroke={C.copper} strokeWidth={1.2} />
          {Array.from({length: RULER.days + 1}, (_, d) => (
            <line key={d} x1={dayX(d)} x2={dayX(d)} y1={RULER.y} y2={RULER.y - (d % 7 === 0 ? 12 : 5)} stroke={C.copper} strokeWidth={d % 7 === 0 ? 1.2 : 0.7} />
          ))}
          <text x={RULER.x1 + 16} y={RULER.y + 6} fontFamily={FONT_CN} fontSize={18} fill={C.greyGold}>
            天
          </text>
          {[0, 7, 30, 37].map((d) => (
            <text key={d} x={dayX(d)} y={RULER.y + 28} textAnchor="middle" fontFamily={FONT_LATIN} fontSize={19} fill={C.greyGold} opacity={d < 30 ? 1 - shift * 0.6 : 0.4 + shift * 0.6}>
              {d}
            </text>
          ))}
        </g>
        {/* 刻度上的两个时间标记 + 连向秤盘的细线 */}
        {labelsIn > 0 && ornament > 0 && (
          <g opacity={labelsIn * ornament}>
            {[
              {d: dL, pan: g.left, hi: glowNow > 0.3},
              {d: dR, pan: g.right, hi: false},
            ].map((m, i) => (
              <g key={i}>
                <path d={`M${m.pan[0]} ${panLabelY + 14} C${m.pan[0]} ${RULER.y - 80} ${dayX(m.d)} ${RULER.y - 90} ${dayX(m.d)} ${RULER.y - 16}`} fill="none" stroke={C.greyGold} strokeWidth={1} strokeDasharray="3 5" opacity={0.6} />
                <path d={`M${dayX(m.d) - 7} ${RULER.y - 18} L${dayX(m.d) + 7} ${RULER.y - 18} L${dayX(m.d)} ${RULER.y - 6} Z`} fill={i === 0 ? C.goldHi : C.gold} />
              </g>
            ))}
          </g>
        )}

        {/* 天平 */}
        <BrassScale px={SCALE_PIVOT[0]} py={py} angle={ang} glowL={glowNow * 1.1 + nearBoost * 0.6} glowR={glowR} ornament={ornament} opacity={1 - prog(f, 2868, 2880)} />

        {/* 左盘：砂粒砝码 → 1 枚金币 */}
        {f < 2200 && (
          <path d={`M${g.left[0] - 24} ${g.left[1] - 2} L${g.left[0] - 14} ${g.left[1] - 30} H${g.left[0] + 14} L${g.left[0] + 24} ${g.left[1] - 2} Z`} fill="#B08443" stroke={C.goldHi} strokeWidth={1} opacity={prog(f, 2150, 2172) * (1 - weightToCoin)} />
        )}
        <g opacity={coinsOut}>
          <GoldCoin x={g.left[0]} y={g.left[1] - coinR - 4} r={coinR * (1 + nearBoost * 0.15)} spin={(1 - weightToCoin) * 1.2} opacity={weightToCoin} glow={0.2 + glowNow * 0.8 + nearBoost} />
          {nearBoost > 0.02 && <circle cx={g.left[0]} cy={g.left[1] - coinR - 4} r={coinR + 10 + flash * 40} fill="none" stroke="#FFF0C8" strokeWidth={2.5} opacity={1 - flash} />}
          {[-1, 1].map((s, i) => (
            <GoldCoin
              key={i}
              x={g.right[0] + s * 34 * farShrink}
              y={g.right[1] - coinR * farShrink - 4}
              r={coinR * farShrink}
              spin={(1 - rightCoins) * 1.5}
              opacity={rightCoins * farDim}
              glow={0.2}
            />
          ))}
        </g>

        {/* 秤盘下的选项文字 */}
        {labelsIn > 0 && (
          <g fontFamily={FONT_CN} fontSize={32} letterSpacing="0.06em" textAnchor="middle" opacity={labelsIn * ornament}>
            <text x={g.left[0]} y={panLabelY}>
              <NumLabel days={dL} coins={A.left.coins} />
            </text>
            <text x={g.right[0]} y={panLabelY}>
              <NumLabel days={dR} coins={A.right.coins} />
            </text>
          </g>
        )}
        {/* 偏向现在（示意） */}
        {glowNow > 0 && (
          <text x={g.left[0]} y={g.left[1] - 110} textAnchor="middle" fontFamily={FONT_CN} fontSize={21} letterSpacing="0.14em" fill={C.goldHi} opacity={glowNow * ornament}>
            偏向现在 · 示意
          </text>
        )}
        {/* 右侧：可能（问号，而非必然） */}
        {qMark > 0 && (
          <text x={g.right[0]} y={g.right[1] - 104} textAnchor="middle" fontFamily={FONT_LATIN} fontStyle="italic" fontSize={46} fill={C.goldHi} opacity={qMark * (0.65 + 0.35 * Math.sin(f / 8))}>
            ?
          </text>
        )}
        {/* S19：数量未变 */}
        {restore > 0 && (
          <text x={g.right[0]} y={panLabelY + 42} textAnchor="middle" fontFamily={FONT_CN} fontSize={20} letterSpacing="0.12em" fill={C.greyGold} opacity={restore * (1 - prog(f, 2840, 2856))}>
            数量没有变
          </text>
        )}

        {/* S20：骨架线条 → 票券边框 */}
        {f >= 2856 && (
          <g stroke={C.gold} strokeLinecap="round" opacity={lineOut}>
            {segsFrom.map((s, i) => {
              const t = clamp01(morph * 1.08 - i * 0.01);
              const a: Pt = [lerp(s[0][0], frameSegs[i][0][0], t), lerp(s[0][1], frameSegs[i][0][1], t)];
              const b: Pt = [lerp(s[1][0], frameSegs[i][1][0], t), lerp(s[1][1], frameSegs[i][1][1], t)];
              return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={i < 4 ? 2.5 : 1.2} opacity={prog(f, 2856, 2870)} />;
            })}
          </g>
        )}
      </Stage>
    </AbsoluteFill>
  );
};
