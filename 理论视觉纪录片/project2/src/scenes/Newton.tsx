import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, H, SERIF, W } from "../config/theme";
import { ScientificClock } from "../components/ScientificClock";
import { SceneShell } from "../components/SceneShell";
import { Beats, Burst, Camera, DocumentaryYear, HistoricalAnnotation, PopText, clamp, prog } from "../components/ui";

// 节点 1：同步钟阵 → 扫描线逐只点亮 → 等距时间轴
const COLS = 5;
const ROWS = 3;
const cx = (c: number) => 560 + c * 200;
const cy = (r: number) => 330 + r * 165;
const SCAN0 = 70;
const SCAN1 = 120;
const AXIS = 150;

export const Newton: React.FC = () => {
  const f = useCurrentFrame();
  const secs = 3 + f / 30;
  const scanX = interpolate(f, [SCAN0, SCAN1], [420, 1500], clamp);
  const axisP = prog(f, AXIS, AXIS + 30);
  const axisShift = (Math.max(0, f - AXIS) * 4) % 120;
  const keep = (r: number, c: number) => r === 1 && (c === 1 || c === 3);
  const outP = prog(f, 290, 322);

  return (
    <SceneShell fadeIn={0} fadeOut={0}>
      <Camera
        keys={[
          { f: 0, x: 960, y: 495, s: 1.45 },
          { f: 60, x: 960, y: 520, s: 1.0 },
          { f: 150, x: 960, y: 560, s: 0.98 },
          { f: 330, x: 960, y: 520, s: 1.06 },
        ]}
      >
        <svg width={W} height={H}>
          {new Array(ROWS).fill(0).map((_, r) =>
            new Array(COLS).fill(0).map((__, c) => {
              const i = r * COLS + c;
              const appear = prog(f, i * 2, 12 + i * 2);
              const lit = f >= SCAN0 && scanX > cx(c);
              const o = keep(r, c) ? 1 : 1 - outP;
              return (
                <g key={i}>
                  <ScientificClock
                    x={cx(c)}
                    y={cy(r)}
                    r={64 * (0.8 + 0.2 * appear)}
                    seconds={secs}
                    opacity={appear * o}
                    detail="simple"
                    glow={lit ? 0.6 : 0.25}
                    secondColor={lit ? C.white : C.goldHi}
                  />
                  {r === 0 ? (
                    <Burst x={cx(c)} y={cy(1)} at={SCAN0 + Math.round(((cx(c) - 420) / 1080) * (SCAN1 - SCAN0))} r={60} />
                  ) : null}
                </g>
              );
            }),
          )}
          {/* 扫描线 */}
          {f >= SCAN0 && f <= SCAN1 + 6 ? (
            <g opacity={interpolate(f, [SCAN1, SCAN1 + 6], [1, 0], clamp)}>
              <rect x={scanX - 3} y={220} width={6} height={440} fill={C.goldHi} opacity={0.9} />
              <rect x={scanX - 40} y={220} width={40} height={440} fill={C.goldHi} opacity={0.12} />
            </g>
          ) : null}
          {/* 同步连线 */}
          <g opacity={prog(f, SCAN1, SCAN1 + 10) * (1 - outP)}>
            {new Array(ROWS).fill(0).map((_, r) => (
              <line key={r} x1={560} x2={1360} y1={cy(r)} y2={cy(r)} stroke={C.goldHi} strokeOpacity={0.35} strokeDasharray="3 8" />
            ))}
          </g>
          {/* 时间轴：等距刻度匀速流过 */}
          <g opacity={1 - outP}>
            <line x1={960 - 720 * axisP} x2={960 + 720 * axisP} y1={790} y2={790} stroke={C.goldHi} strokeOpacity={0.8} strokeWidth={2} />
            {new Array(14).fill(0).map((_, i) => {
              const x = 240 + i * 120 - axisShift + 120;
              const edge = interpolate(Math.abs(x - 960), [520, 720], [1, 0], clamp);
              return (
                <g key={i} opacity={axisP * edge}>
                  <line x1={x} x2={x} y1={774} y2={806} stroke={C.white} strokeWidth={2} />
                  <text x={x + 60} y={770} textAnchor="middle" fill={C.text} fontFamily={SERIF} fontSize={22}>
                    1 s
                  </text>
                </g>
              );
            })}
            <path d={`M ${960 + 720 * axisP} 790 l -16 -8 l 0 16 z`} fill={C.goldHi} opacity={axisP} />
          </g>
          <PopText x={960} y={190} at={SCAN1 + 2} until={AXIS + 10} size={34} color={C.goldHi}>
            15 只钟 · 同一读数
          </PopText>
        </svg>
      </Camera>
      <DocumentaryYear year="1687" sub="剑桥 · 艾萨克·牛顿" start={0} end={322} />
      <HistoricalAnnotation
        latin="Philosophiæ Naturalis Principia Mathematica"
        title="《自然哲学的数学原理》"
        meta="“绝对的、真实的数学时间……均匀地流逝”"
        start={6}
        end={322}
      />
      <Beats
        beats={[
          { from: 10, to: 66, text: "牛顿：时间是【绝对】的" },
          { from: 70, to: 145, text: "宇宙中所有的钟，【同一节拍】" },
          { from: 150, to: 205, text: "每一秒，【一样长】" },
          { from: 210, to: 322, text: "时间，被视作【均匀流动】", note: "经典物理的默认假设——两百多年无人怀疑", final: true },
        ]}
      />
    </SceneShell>
  );
};
