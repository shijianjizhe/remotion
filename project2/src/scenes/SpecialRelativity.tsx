import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, H, SERIF, W } from "../config/theme";
import { ScientificClock } from "../components/ScientificClock";
import { SceneShell } from "../components/SceneShell";
import {
  Beats,
  Burst,
  Camera,
  DocumentaryYear,
  HistoricalAnnotation,
  Note,
  PopText,
  clamp,
  popS,
  prog,
} from "../components/ui";
import { SR_GAMMA, SR_T, SR_V, srBx, srTauA, srTauB } from "../simulation/physics";

// 节点 2：两只钟从同一点出发，B 以 0.6c 往返，重逢时比较读数。
// 左：时空图（纵轴时间、横轴空间，光速 45°）；右：两只大钟与读数。
const O = { x: 560, y: 840 };
const U = 50;
const F0 = 36; // 出发
const F1 = 276; // 重逢
const toXY = (x: number, t: number) => ({ x: O.x + x * U, y: O.y - t * U });

export const SpecialRelativity: React.FC = () => {
  const f = useCurrentFrame();
  const t = interpolate(f, [F0, F1], [0, SR_T], clamp);
  const tauA = srTauA(t);
  const tauB = srTauB(t);
  const axesP = prog(f, 0, 16);
  const met = f >= F1;
  const turnF = F0 + (F1 - F0) / 2;

  const ptsB: string[] = [];
  for (let k = 0; k <= 60; k++) {
    const tk = (t * k) / 60;
    const p = toXY(srBx(tk), tk);
    ptsB.push(`${k === 0 ? "M" : "L"} ${p.x} ${p.y}`);
  }
  const pa = toXY(0, t);
  const pb = toXY(srBx(t), t);
  const ticksA = Array.from({ length: Math.floor(tauA + 1e-6) }, (_, i) => toXY(0, i + 1));
  const ticksB = Array.from({ length: Math.floor(tauB + 1e-6) }, (_, i) => {
    const tc = (i + 1) * SR_GAMMA;
    return toXY(srBx(tc), tc);
  });
  const pulse = met ? 1 + 0.22 * Math.exp(-(f - F1) / 7) : 1;
  const diffS = popS(f, F1 + 30);

  return (
    <SceneShell fadeIn={0}>
      <Camera
        keys={[
          { f: 0, x: 960, y: 560, s: 1.06 },
          { f: F0, x: 960, y: 540, s: 1.0 },
          { f: turnF, x: 940, y: 540, s: 1.03 },
          { f: F1, x: 960, y: 520, s: 1.0 },
          { f: F1 + 40, x: 1010, y: 540, s: 1.05 },
          { f: 510, x: 990, y: 540, s: 1.02 },
        ]}
        shake={{ at: F1, amp: 7 }}
      >
        <svg width={W} height={H}>
          {/* 坐标轴 */}
          <g opacity={axesP}>
            <line x1={O.x - 140} x2={O.x + 360} y1={O.y} y2={O.y} stroke={C.metal} strokeWidth={1.5} />
            <line x1={O.x} x2={O.x} y1={O.y + 20} y2={O.y - SR_T * U - 40} stroke={C.metal} strokeWidth={1.5} />
            <text x={O.x + 370} y={O.y + 9} fill={C.text} fontFamily={SERIF} fontSize={24}>
              空间
            </text>
            <text x={O.x - 16} y={O.y - SR_T * U - 34} fill={C.text} fontFamily={SERIF} fontSize={24} textAnchor="end">
              时间 ↑
            </text>
            <line x1={O.x} y1={O.y} x2={O.x + 5.3 * U} y2={O.y - 5.3 * U} stroke={C.parchment} strokeOpacity={0.3} strokeDasharray="5 7" />
            <text x={O.x + 5.3 * U + 10} y={O.y - 5.3 * U + 8} fill={C.dim} fontFamily={SERIF} fontSize={22}>
              光速线
            </text>
          </g>
          {/* 世界线 */}
          <path d={`M ${O.x} ${O.y} L ${pa.x} ${pa.y}`} stroke={C.white} strokeWidth={3} fill="none" />
          <path d={ptsB.join(" ")} stroke={C.goldHi} strokeWidth={3.5} fill="none" />
          {ticksA.map((p, i) => (
            <circle key={`a${i}`} cx={p.x} cy={p.y} r={6} fill={C.white} />
          ))}
          {ticksB.map((p, i) => (
            <circle key={`b${i}`} cx={p.x} cy={p.y} r={6.5} fill={C.goldHi} />
          ))}
          {!met ? (
            <>
              <ScientificClock x={pa.x - 44} y={pa.y} r={28} seconds={tauA * 6} tickSnap={false} detail="simple" glow={0.3} />
              <ScientificClock x={pb.x + 44} y={pb.y} r={28} seconds={tauB * 6} tickSnap={false} detail="simple" glow={0.6} />
              <text x={pa.x - 44} y={pa.y + 58} textAnchor="middle" fill={C.white} fontFamily={SERIF} fontSize={28} fontWeight={600}>
                A
              </text>
              <text x={pb.x + 44} y={pb.y + 58} textAnchor="middle" fill={C.goldHi} fontFamily={SERIF} fontSize={28} fontWeight={600}>
                B
              </text>
            </>
          ) : null}
          <Burst x={O.x} y={O.y} at={F0} r={20} />
          <Burst x={toXY(srBx(SR_T / 2), SR_T / 2).x} y={toXY(srBx(SR_T / 2), SR_T / 2).y} at={Math.round(turnF)} r={20} />
          <Burst x={O.x} y={O.y - SR_T * U} at={F1} r={24} />
          <PopText x={toXY(srBx(SR_T / 2), SR_T / 2).x + 26} y={toXY(srBx(SR_T / 2), SR_T / 2).y + 9} at={Math.round(turnF)} until={F1 + 20} size={26} color={C.goldHi} anchor="start">
            折返
          </PopText>
          <PopText x={O.x - 34} y={O.y - SR_T * U + 10} at={F1} size={28} color={C.goldHi} anchor="end">
            重逢 · 比较
          </PopText>

          {/* 右侧两只大钟 */}
          <g opacity={prog(f, 0, 14)}>
            <ScientificClock x={1220} y={400} r={130} seconds={tauA * 6} tickSnap={false} glow={0.35} />
            <ScientificClock x={1560} y={400} r={130} seconds={tauB * 6} tickSnap={false} glow={0.55} />
            <text x={1220} y={578} textAnchor="middle" fill={C.white} fontFamily={SERIF} fontSize={30} letterSpacing={2}>
              A · 留在原地
            </text>
            <text x={1560} y={578} textAnchor="middle" fill={C.goldHi} fontFamily={SERIF} fontSize={30} letterSpacing={2}>
              B · 出发再返回
            </text>
            <g transform={`translate(1220 652) scale(${pulse})`}>
              <text textAnchor="middle" fill={C.white} fontFamily={SERIF} fontSize={62} fontWeight={600}>
                {tauA.toFixed(1)}
                <tspan fontSize={28} fill={C.text} dx={8}>
                  年
                </tspan>
              </text>
            </g>
            <g transform={`translate(1560 652) scale(${pulse})`}>
              <text textAnchor="middle" fill={C.goldHi} fontFamily={SERIF} fontSize={62} fontWeight={600}>
                {tauB.toFixed(1)}
                <tspan fontSize={28} fill={C.text} dx={8}>
                  年
                </tspan>
              </text>
            </g>
          </g>
          {/* 差值 */}
          <g opacity={Math.min(1, diffS)} transform={`translate(1390 735) scale(${0.6 + 0.4 * diffS})`}>
            <line x1={-170} x2={170} y1={0} y2={0} stroke={C.goldHi} strokeWidth={2} />
            <line x1={-170} x2={-170} y1={-12} y2={12} stroke={C.goldHi} strokeWidth={2} />
            <line x1={170} x2={170} y1={-12} y2={12} stroke={C.goldHi} strokeWidth={2} />
            <text y={56} textAnchor="middle" fill={C.goldHi} fontFamily={SERIF} fontSize={44} fontWeight={600}>
              相差 {(srTauA(SR_T) - srTauB(SR_T)).toFixed(0)} 年
            </text>
          </g>
          <PopText x={1390} y={230} at={4} until={F0 + 20} size={30} color={C.white}>
            同一地点 · 对表归零
          </PopText>
          <PopText x={1390} y={230} at={F0 + 4} until={F1 - 4} size={30} color={C.goldHi}>
            B：{SR_V} 倍光速 · 往返
          </PopText>
        </svg>
      </Camera>
      <Note x={O.x + 60} y={O.y - SR_T * U - 60} w={520} size={22} o={prog(f, F0 + 30, F0 + 45) * (1 - prog(f, F1, F1 + 10))}>
        每个圆点 = 这只钟自己走过的 1 年
      </Note>
      <DocumentaryYear year="1905" sub="伯尔尼 · 阿尔伯特·爱因斯坦" start={0} end={500} />
      <HistoricalAnnotation latin="Zur Elektrodynamik bewegter Körper" title="《论动体的电动力学》" meta="Annalen der Physik · 1905" start={6} end={500} />
      <Beats
        beats={[
          { from: 4, to: 34, text: "两只钟，【对好时间】" },
          { from: 38, to: 150, text: "B 高速出发，A 【留在原地】" },
          { from: 152, to: 272, text: "B 折返，【飞回】A 身边" },
          { from: F1 + 4, to: 360, text: "重逢：两只钟【读数不同】" },
          {
            from: 364,
            to: 500,
            text: "运动，让时钟【不再同步】",
            note: `理想化示意：v = ${SR_V}c，A 走 ${SR_T} 年，B 只走 ${(SR_T / SR_GAMMA).toFixed(0)} 年`,
            final: true,
          },
        ]}
      />
    </SceneShell>
  );
};
