import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { C, H, SERIF, W } from "../config/theme";
import { SceneShell } from "../components/SceneShell";
import { Beats, Burst, Camera, DocumentaryYear, Note, PopText, clamp, prog } from "../components/ui";
import { buildYear } from "../simulation/timelineMemory";

// 节点 8：两条同为 365 天的生活轨道。
// 阶段 1（经历视角）：两条长度相同的日历带，日子逐格点亮（月份标签快速跳动）。
// 阶段 2：A 的日子彼此相似，叠合成少数几段；B 被清晰的事件边界切成多段（边界逐个弹出）。
// 阶段 3（回忆视角）：按“记忆片段数”重新排布，B 在回望时显得更长。
const X0 = 300;
const LEN = 1200;
const YA = 400;
const YB = 640;
const FILL0 = 10;
const FILL1 = 110;
const G0 = 130;
const G1 = 200;
const R0 = 250;
const R1 = 300;
const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const B_LABELS = ["搬家", "旅行", "新工作", "演出", "生日", "毕业", "远行"];

const yearA = buildYear("A");
const yearB = buildYear("B");

const Track: React.FC<{
  y: number;
  label: string;
  sub: string;
  segs: { start: number; end: number }[];
  color: string;
  fillP: number;
  groupP: number;
  recallP: number;
  recallLen: number;
  seed: string;
}> = ({ y, label, sub, segs, color, fillP, groupP, recallP, recallLen, seed }) => {
  const daysLit = Math.floor(fillP * 365);
  const totalLen = interpolate(recallP, [0, 1], [LEN, recallLen]);
  const gap = 12 * groupP;
  const n = segs.length;
  const sliceW = (totalLen - gap * (n - 1)) / n;
  return (
    <g>
      <text x={X0} y={y - 46} fill={color} fontFamily={SERIF} fontSize={32} fontWeight={600}>
        {label}
      </text>
      <text x={X0 + 150} y={y - 48} fill={C.text} fontFamily={SERIF} fontSize={25}>
        {sub}
      </text>
      <g opacity={1 - groupP}>
        {new Array(365).fill(0).map((_, d) => (
          <rect
            key={d}
            x={X0 + (d / 365) * LEN}
            y={y - 18}
            width={LEN / 365 - 0.6}
            height={36}
            fill={color}
            opacity={d < daysLit ? (d > daysLit - 8 ? 1 : 0.6) : 0.1}
          />
        ))}
      </g>
      <g opacity={groupP}>
        {segs.map((s, i) => {
          const xLived = X0 + (s.start / 365) * LEN;
          const wLived = ((s.end - s.start) / 365) * LEN;
          const xRec = X0 + i * (sliceW + gap);
          const x = interpolate(recallP, [0, 1], [xLived + (i > 0 ? gap / 2 : 0), xRec]);
          const w = Math.max(2, interpolate(recallP, [0, 1], [wLived - gap, sliceW]));
          return (
            <g key={i}>
              <rect x={x} y={y - 22} width={w} height={44} fill={color} opacity={0.3 + 0.5 * random(`${seed}o${i}`)} />
              <rect x={x} y={y - 22} width={w} height={44} fill="none" stroke={color} strokeWidth={1.5} />
            </g>
          );
        })}
      </g>
      <line x1={X0} x2={X0 + totalLen} y1={y + 52} y2={y + 52} stroke={color} strokeOpacity={0.6} strokeWidth={2} />
      <line x1={X0 + totalLen} x2={X0 + totalLen} y1={y + 42} y2={y + 62} stroke={color} strokeWidth={2} />
      <text x={X0 + totalLen + 18} y={y + 12} fill={color} fontFamily={SERIF} fontSize={30} fontWeight={600}>
        {recallP > 0.5 ? `${n} 段记忆` : "365 天"}
      </text>
    </g>
  );
};

export const Memory: React.FC = () => {
  const f = useCurrentFrame();
  const intro = prog(f, 0, 12);
  const fillP = prog(f, FILL0, FILL1, (t) => t);
  const groupP = prog(f, G0, G1);
  const recallP = prog(f, R0, R1);
  const month = Math.min(11, Math.floor(fillP * 12));
  const boundaries = yearB.slice(1);

  return (
    <SceneShell>
      <Camera
        keys={[
          { f: 0, x: 960, y: 500, s: 1.12 },
          { f: FILL1, x: 980, y: 520, s: 1.06 },
          { f: G0, x: 960, y: 530, s: 1.0 },
          { f: G1, x: 960, y: YB - 60, s: 1.08 },
          { f: R0, x: 960, y: 530, s: 1.0 },
          { f: R1 + 20, x: 980, y: 520, s: 1.06 },
          { f: 510, x: 960, y: 540, s: 1.02 },
        ]}
      >
        <svg width={W} height={H} opacity={intro}>
          <text x={X0} y={262} fill={recallP > 0.5 ? C.goldHi : C.white} fontFamily={SERIF} fontSize={30} letterSpacing={3}>
            {recallP > 0.5 ? "◆ 回忆视角 · 一年后回头看" : "◇ 经历视角 · 日历上的时间"}
          </text>
          <line x1={X0} x2={X0 + LEN} y1={282} y2={282} stroke={C.faint} />
          {f >= FILL0 && f < G0 ? (
            <text x={X0 + LEN} y={262} textAnchor="end" fill={C.goldHi} fontFamily={SERIF} fontSize={40} fontWeight={600}>
              {MONTHS[month]}
            </text>
          ) : null}
          <Track
            y={YA}
            label="一年 A"
            sub="日复一日，相似的日子叠在一起"
            segs={yearA}
            color={C.white}
            fillP={fillP}
            groupP={groupP}
            recallP={recallP}
            recallLen={LEN * 0.5}
            seed="A"
          />
          <Track
            y={YB}
            label="一年 B"
            sub="搬家、旅行、新工作……充满新事件"
            segs={yearB}
            color={C.goldHi}
            fillP={fillP}
            groupP={groupP}
            recallP={recallP}
            recallLen={LEN}
            seed="B"
          />
          <PopText x={X0 + LEN + 70} y={(YA + YB) / 2 + 14} at={FILL1 - 4} until={G0 + 10} size={44} color={C.goldHi}>
            =
          </PopText>
          {/* 事件边界逐个弹出 */}
          <g opacity={1 - recallP}>
            {boundaries.map((s, i) => {
              const at = G0 + Math.round((i / boundaries.length) * (G1 - G0));
              if (f < at) return null;
              const x = X0 + (s.start / 365) * LEN;
              const o = interpolate(f, [at, at + 4], [0, 1], clamp);
              return (
                <g key={i} opacity={o}>
                  <line x1={x} x2={x} y1={YB - 44} y2={YB + 40} stroke={C.white} strokeWidth={2.5} />
                  {i % 3 === 0 ? (
                    <text x={x} y={YB + 92} textAnchor="middle" fill={C.white} fontFamily={SERIF} fontSize={22}>
                      {B_LABELS[(i / 3) % B_LABELS.length]}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
          <Burst x={X0 + LEN * 0.25} y={YA} at={R1} r={30} color={C.white} />
          <Burst x={X0 + LEN} y={YB} at={R1} r={40} />
          <PopText x={X0 + LEN * 0.5 + 170} y={YA + 14} at={R1 + 6} size={30} color={C.white} anchor="start">
            ← 回想起来，好像“一晃就过去了”
          </PopText>
        </svg>
      </Camera>
      <Note x={X0} y={800} w={1320} size={22} o={prog(f, R1 + 30, R1 + 44)}>
        示意：事后判断一段时间有多长，常与记忆中能区分的片段多少有关——这是一种倾向，并非对每个人都成立的规律
      </Note>
      <DocumentaryYear year="回顾时间" sub="事件分段 · 记忆研究" start={0} end={500} />
      <Beats
        y={900}
        beats={[
          { from: 4, to: G0 - 4, text: "两个人，各过了【一年】" },
          { from: G0, to: R0 - 4, text: "新鲜事，在记忆里切出【边界】" },
          { from: R0, to: 370, text: "回头看：一年 B【长得多】" },
          { from: 374, to: 500, text: "同样一年，【回望】时未必一样长", final: true },
        ]}
      />
    </SceneShell>
  );
};
