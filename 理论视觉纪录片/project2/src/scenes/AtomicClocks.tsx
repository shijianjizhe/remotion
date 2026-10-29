import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, H, SERIF, W } from "../config/theme";
import { SceneShell } from "../components/SceneShell";
import { Beats, Burst, Camera, DocumentaryYear, HistoricalAnnotation, Note, PopText, clamp, popS, prog } from "../components/ui";
import { HK } from "../simulation/physics";

// 节点 4：从北极上空俯视地球；铯原子钟分别向东、向西环球飞行，回到华盛顿与参考钟比较
const E = { x: 640, y: 520, R: 220 };
const ROUTE_E = E.R + 46;
const ROUTE_W = E.R + 96;
const WEST_C = "#E6B9AC";
const F0 = 50;
const F1 = 260;
const LAND_E = F1 + 10;
const LAND_W = F1 + 40;

const Plane: React.FC<{ x: number; y: number; a: number; color: string }> = ({ x, y, a, color }) => (
  <g transform={`translate(${x} ${y}) rotate(${a}) scale(1.6)`}>
    <path d="M 0 -14 L 3 -4 L 13 2 L 13 5 L 3 2 L 2 10 L 6 13 L 6 15 L 0 13 L -6 15 L -6 13 L -2 10 L -3 2 L -13 5 L -13 2 L -3 -4 Z" fill={color} />
  </g>
);

const Dial: React.FC<{ x: number; y: number; label: string; value: number; color: string; err: number; landed: number; o: number }> = ({
  x,
  y,
  label,
  value,
  color,
  err,
  landed,
  o,
}) => {
  const f = useCurrentFrame();
  const s = popS(f, landed);
  const shown = f < landed ? 0 : value * Math.min(1, s);
  return (
    <g transform={`translate(${x} ${y})`} opacity={o}>
      <rect x={0} y={0} width={500} height={150} rx={4} fill="rgba(20,18,15,0.85)" stroke={color} strokeOpacity={f >= landed ? 0.9 : 0.4} strokeWidth={f >= landed ? 2 : 1} />
      <text x={26} y={46} fill={color} fontFamily={SERIF} fontSize={30} letterSpacing={2}>
        {label}
      </text>
      <text x={26} y={84} fill={C.text} fontFamily={SERIF} fontSize={22}>
        {f < landed ? "飞行中……" : "落地，对比参考钟"}
      </text>
      <g transform={`translate(476 124) scale(${0.8 + 0.2 * Math.min(1.2, s)})`}>
        <text textAnchor="end" fill={f < landed ? C.metal : color} fontFamily={SERIF} fontSize={66} fontWeight={600}>
          {f < landed ? "?" : `${shown > 0 ? "+" : shown < 0 ? "−" : ""}${Math.abs(Math.round(shown))}`}
          <tspan fontSize={26} fill={C.text} dx={8}>
            ns
          </tspan>
          {f >= landed ? (
            <tspan fontSize={24} fill={C.text} dx={6}>
              ± {err}
            </tspan>
          ) : null}
        </text>
      </g>
    </g>
  );
};

export const AtomicClocks: React.FC = () => {
  const f = useCurrentFrame();
  const earthP = prog(f, 0, 18);
  const p = interpolate(f, [F0, F1], [0, 1], clamp);
  const spin = f * 0.3;
  const start = Math.PI / 2;
  const aE = start - p * Math.PI * 2;
  const aW = start + p * Math.PI * 2;
  const pos = (r: number, a: number) => ({ x: E.x + r * Math.cos(a), y: E.y + r * Math.sin(a) });
  const pE = pos(ROUTE_E, aE);
  const pW = pos(ROUTE_W, aW);
  const done = prog(f, LAND_W, LAND_W + 20);
  const home = pos(E.R - 26, start);

  const arc = (r: number, a0: number, a1: number) => {
    const n = 90;
    const pts: string[] = [];
    for (let k = 0; k <= n; k++) {
      const q = pos(r, a0 + ((a1 - a0) * k) / n);
      pts.push(`${k === 0 ? "M" : "L"} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`);
    }
    return pts.join(" ");
  };
  const axX = (v: number) => 1200 + ((v + 100) / 400) * 500;

  return (
    <SceneShell>
      <Camera
        keys={[
          { f: 0, x: home.x, y: home.y, s: 1.8 },
          { f: F0, x: 760, y: 530, s: 1.05 },
          { f: (F0 + F1) / 2, x: 900, y: 530, s: 1.0 },
          { f: F1, x: 960, y: 540, s: 1.0 },
          { f: LAND_W + 20, x: 1000, y: 530, s: 1.05 },
          { f: 510, x: 980, y: 535, s: 1.02 },
        ]}
      >
        <svg width={W} height={H}>
          <defs>
            <radialGradient id="earth" cx="45%" cy="40%">
              <stop offset="0%" stopColor="#433626" />
              <stop offset="75%" stopColor="#201b15" />
              <stop offset="100%" stopColor="#14120f" />
            </radialGradient>
          </defs>
          <g opacity={earthP}>
            <circle cx={E.x} cy={E.y} r={E.R} fill="url(#earth)" stroke={C.copper} strokeWidth={2} />
            <g transform={`rotate(${-spin} ${E.x} ${E.y})`}>
              {[0.3, 0.55, 0.8].map((k) => (
                <circle key={k} cx={E.x} cy={E.y} r={E.R * k} fill="none" stroke={C.gold} strokeOpacity={0.25} />
              ))}
              {new Array(12).fill(0).map((_, i) => {
                const a = (i * Math.PI) / 6;
                return <line key={i} x1={E.x} y1={E.y} x2={E.x + E.R * Math.cos(a)} y2={E.y + E.R * Math.sin(a)} stroke={C.gold} strokeOpacity={0.2} />;
              })}
            </g>
            <circle cx={E.x} cy={E.y} r={5} fill={C.goldHi} />
            <text x={E.x} y={E.y + 34} textAnchor="middle" fill={C.text} fontFamily={SERIF} fontSize={22}>
              北极
            </text>
            <path d={arc(E.R * 0.45, -2.4, -1.1)} fill="none" stroke={C.text} strokeWidth={2} />
            <text x={E.x - 30} y={E.y - E.R * 0.52} fill={C.text} fontFamily={SERIF} fontSize={22} textAnchor="middle">
              自转 · 向东
            </text>
            <circle cx={home.x} cy={home.y} r={8} fill={C.white} />
            <text x={home.x + 16} y={home.y - 12} fill={C.white} fontFamily={SERIF} fontSize={24}>
              华盛顿 · 参考钟
            </text>
          </g>
          <circle cx={E.x} cy={E.y} r={ROUTE_E} fill="none" stroke={C.goldHi} strokeOpacity={0.18} strokeDasharray="4 8" />
          <circle cx={E.x} cy={E.y} r={ROUTE_W} fill="none" stroke={WEST_C} strokeOpacity={0.18} strokeDasharray="4 8" />
          {p > 0 ? (
            <>
              <path d={arc(ROUTE_E, start, aE)} fill="none" stroke={C.goldHi} strokeWidth={3.5} />
              <path d={arc(ROUTE_W, start, aW)} fill="none" stroke={WEST_C} strokeWidth={3.5} />
            </>
          ) : null}
          <g opacity={prog(f, 20, 40) * (1 - done)}>
            <Plane x={pE.x} y={pE.y} a={(aE * 180) / Math.PI} color={C.goldHi} />
            <Plane x={pW.x} y={pW.y} a={(aW * 180) / Math.PI + 180} color={WEST_C} />
            <text x={pE.x} y={pE.y - 30} fill={C.goldHi} fontFamily={SERIF} fontSize={26} textAnchor="middle">
              向东
            </text>
            <text x={pW.x} y={pW.y + 50} fill={WEST_C} fontFamily={SERIF} fontSize={26} textAnchor="middle">
              向西
            </text>
          </g>
          <Burst x={pos(ROUTE_E, start).x} y={pos(ROUTE_E, start).y} at={LAND_E} r={30} />
          <Burst x={pos(ROUTE_W, start).x} y={pos(ROUTE_W, start).y} at={LAND_W} r={30} color={WEST_C} />
          <PopText x={pos(ROUTE_W, -Math.PI / 2).x} y={pos(ROUTE_W, -Math.PI / 2).y - 30} at={F0 + 60} until={F0 + 130} size={28} color={C.white}>
            绕地球一整圈
          </PopText>

          <Dial x={1200} y={250} label="向东环球的铯钟" value={HK.east.observed} err={HK.east.err} color={C.goldHi} landed={LAND_E} o={prog(f, 30, 46)} />
          <Dial x={1200} y={430} label="向西环球的铯钟" value={HK.west.observed} err={HK.west.err} color={WEST_C} landed={LAND_W} o={prog(f, 36, 52)} />
          <Burst x={1600} y={340} at={LAND_E} r={50} />
          <Burst x={1600} y={520} at={LAND_W} r={50} color={WEST_C} />

          <g opacity={done}>
            <line x1={1200} x2={1700} y1={680} y2={680} stroke={C.text} strokeWidth={1.5} />
            {[-100, 0, 100, 200, 300].map((v) => (
              <g key={v}>
                <line x1={axX(v)} x2={axX(v)} y1={672} y2={688} stroke={C.text} />
                <text x={axX(v)} y={716} textAnchor="middle" fill={C.text} fontFamily={SERIF} fontSize={20}>
                  {v}
                </text>
              </g>
            ))}
            <text x={1712} y={687} fill={C.text} fontFamily={SERIF} fontSize={20}>
              ns
            </text>
            {[
              { v: HK.east.observed, e: HK.east.err, c: C.goldHi },
              { v: HK.west.observed, e: HK.west.err, c: WEST_C },
            ].map((d, i) => {
              const w = (d.e / 400) * 500;
              return (
                <g key={i}>
                  <rect x={axX(d.v) - w} y={666} width={w * 2} height={28} fill={d.c} opacity={0.3} />
                  <circle cx={axX(d.v)} cy={680} r={8} fill={d.c} />
                </g>
              );
            })}
          </g>
        </svg>
      </Camera>
      <Note x={1200} y={740} w={620} size={22} o={prog(f, LAND_W + 30, LAND_W + 45)}>
        1971 年 10 月实测值，与理论预言相符
        <br />
        预言：向东 −40 ± 23 ns · 向西 +275 ± 21 ns
      </Note>
      <DocumentaryYear year="1971" sub="华盛顿 · 哈菲尔 & 基廷" start={0} end={500} />
      <HistoricalAnnotation
        latin="Around-the-World Atomic Clocks"
        title="《环球原子钟：观测到的相对论时间增益》"
        meta="Science 177 · 1972"
        start={6}
        end={500}
      />
      <Beats
        beats={[
          { from: 6, to: 48, text: "把【原子钟】搬上民航班机" },
          { from: 52, to: 150, text: "一路【向东】，一路【向西】" },
          { from: 154, to: 262, text: "运动与高度，【同时】在起作用" },
          { from: LAND_E + 2, to: 380, text: "落地对表：东行【慢了】，西行【快了】" },
          { from: 384, to: 500, text: "差异微小，却【真实可测】", final: true },
        ]}
      />
    </SceneShell>
  );
};
