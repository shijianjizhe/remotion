import React from "react";
import { useCurrentFrame } from "remotion";
import { C, H, SERIF, W } from "../config/theme";
import { SceneShell } from "../components/SceneShell";
import { Beats, Burst, Camera, DocumentaryYear, HistoricalAnnotation, Note, PopText, prog } from "../components/ui";
import { FALL_HEIGHT, FALL_TIME, RECALL_STRETCH, fallY } from "../simulation/physics";

// 节点 7：Stetson, Fiesta & Eagleman (2007)。31 米自由落体入网（专业设施、安全网）。
// 左：下落过程（按 y = ½gt² 计算）；右：实际时长 vs 事后回忆时长；
// 腕上闪烁数字仍然看不清 → 并非视觉分辨率提升。
const TOP = 230;
const BOTTOM = 720;
const TX = 400;
const scaleY = (BOTTOM - TOP) / FALL_HEIGHT;
const F0 = 40;
const LAND = F0 + Math.round(FALL_TIME * 30);
const RECALL0 = LAND + 40;
const RECALL1 = LAND + 100;

const Figure: React.FC<{ x: number; y: number; o: number }> = ({ x, y, o }) => (
  <g transform={`translate(${x} ${y}) rotate(180) scale(1.4)`} opacity={o}>
    <circle cy={-30} r={9} fill={C.white} />
    <path d="M 0 -20 L 0 8 M 0 -14 L -16 -24 M 0 -14 L 16 -24 M 0 8 L -10 28 M 0 8 L 10 28" stroke={C.white} strokeWidth={4} strokeLinecap="round" fill="none" />
  </g>
);

export const FreeFall: React.FC = () => {
  const f = useCurrentFrame();
  const intro = prog(f, 0, 12);
  const tReal = Math.max(0, (f - F0) / 30);
  const t = Math.min(tReal, FALL_TIME);
  const y = TOP + fallY(t) * scaleY;
  const landed = f >= LAND;
  const recallP = prog(f, RECALL0, RECALL1);

  const BAR_X = 900;
  const PX_PER_S = 240;
  const objLen = t * PX_PER_S;
  const recallLen = FALL_TIME * PX_PER_S * (1 + (RECALL_STRETCH - 1) * recallP);
  const beat = Math.pow(Math.max(0, Math.sin((f / 30) * Math.PI * 2.6)), 12);

  return (
    <SceneShell>
      <Camera
        keys={[
          { f: 0, x: TX + 260, y: TOP + 260, s: 1.18 },
          { f: F0, x: TX + 260, y: TOP + 260, s: 1.2 },
          { f: LAND - 10, x: TX + 260, y: BOTTOM - 260, s: 1.12 },
          { f: LAND + 20, x: 960, y: 540, s: 1.0 },
          { f: RECALL1, x: 1040, y: 520, s: 1.06 },
          { f: 420, x: 1000, y: 530, s: 1.02 },
        ]}
        shake={{ at: LAND, amp: 16 }}
      >
        <svg width={W} height={H}>
          <g opacity={intro}>
            <line x1={TX - 120} x2={TX - 120} y1={TOP - 30} y2={BOTTOM + 30} stroke={C.text} strokeOpacity={0.6} strokeWidth={2} />
            {new Array(8).fill(0).map((_, i) => {
              const yy = TOP + ((BOTTOM - TOP) * i) / 7;
              return (
                <g key={i}>
                  <line x1={TX - 130} x2={TX - 110} y1={yy} y2={yy} stroke={C.text} />
                  <text x={TX - 140} y={yy + 8} textAnchor="end" fill={C.text} fontFamily={SERIF} fontSize={22}>
                    {Math.round(FALL_HEIGHT - (FALL_HEIGHT * i) / 7)} m
                  </text>
                </g>
              );
            })}
            <line x1={TX - 70} x2={TX + 80} y1={TOP - 34} y2={TOP - 34} stroke={C.white} strokeWidth={3} />
            <path d={`M ${TX - 100} ${BOTTOM + 34} Q ${TX} ${BOTTOM + (landed ? 74 : 50)} ${TX + 100} ${BOTTOM + 34}`} fill="none" stroke={C.goldHi} strokeWidth={2.5} />
            <text x={TX + 112} y={BOTTOM + 46} fill={C.text} fontFamily={SERIF} fontSize={22}>
              安全网
            </text>
          </g>
          {[0.24, 0.16, 0.08].map((dt, i) => (
            <Figure key={i} x={TX} y={TOP + fallY(Math.max(0, t - dt)) * scaleY} o={intro * (landed || tReal === 0 ? 0 : 0.12 + i * 0.07)} />
          ))}
          <Figure x={TX} y={y} o={intro} />
          {!landed && tReal > 0
            ? new Array(7).fill(0).map((_, i) => {
                const xx = TX - 60 + i * 20;
                return <line key={i} x1={xx} x2={xx} y1={y + 56} y2={y + 56 + 30 + t * 40} stroke={C.white} strokeOpacity={0.3} strokeWidth={1.5} />;
              })
            : null}
          <Burst x={TX} y={BOTTOM + 30} at={LAND} r={50} />
          <g opacity={!landed && tReal > 0 ? 1 : 0}>
            <text x={TX + 140} y={y + 10} fill={C.white} fontFamily={SERIF} fontSize={48} fontWeight={600}>
              {t.toFixed(2)}
              <tspan fontSize={24} fill={C.text} dx={6}>
                s
              </tspan>
            </text>
          </g>
          {/* 腕上闪烁数字：数字与其负像高速交替，人眼只能看到叠影（静态呈现，避免频闪） */}
          <g transform={`translate(${TX + 400} ${TOP + 50})`} opacity={prog(f, 6, 18)}>
            <rect x={-80} y={-46} width={160} height={92} rx={6} fill="rgba(20,18,15,0.9)" stroke={C.gold} strokeOpacity={0.6} />
            <g style={{ filter: "blur(2.4px)" }} opacity={0.85}>
              <text textAnchor="middle" y={16} fill={C.goldHi} fontFamily={SERIF} fontSize={46} opacity={0.6}>
                7
              </text>
              <rect x={-16} y={-18} width={32} height={40} fill={C.goldHi} opacity={0.35} />
            </g>
            <text textAnchor="middle" y={78} fill={C.white} fontFamily={SERIF} fontSize={22}>
              腕上闪烁的数字
            </text>
            <text textAnchor="middle" y={108} fill={landed ? C.goldHi : C.text} fontFamily={SERIF} fontSize={22}>
              {landed ? "下落中也没看清 ✗" : "闪得太快，看不清"}
            </text>
          </g>

          <g opacity={prog(f, LAND, LAND + 12)}>
            <text x={BAR_X} y={330} fill={C.white} fontFamily={SERIF} fontSize={30}>
              实际下落时间
            </text>
            <rect x={BAR_X} y={356} width={objLen} height={22} fill={C.white} />
            <text x={BAR_X + FALL_TIME * PX_PER_S + 24} y={378} fill={C.white} fontFamily={SERIF} fontSize={40} fontWeight={600}>
              {t.toFixed(1)}
              <tspan fontSize={24} fill={C.text} dx={6}>
                秒
              </tspan>
            </text>
            <text x={BAR_X} y={414} fill={C.text} fontFamily={SERIF} fontSize={22}>
              由 h = ½gt² 算出 · 31 米
            </text>
          </g>
          <g opacity={prog(f, RECALL0 - 10, RECALL0)}>
            <text x={BAR_X} y={500} fill={C.goldHi} fontFamily={SERIF} fontSize={30}>
              事后回忆的时长
            </text>
            <rect x={BAR_X} y={526} width={recallLen} height={22} fill={C.goldHi} />
            <line x1={BAR_X + FALL_TIME * PX_PER_S} x2={BAR_X + FALL_TIME * PX_PER_S} y1={346} y2={560} stroke={C.white} strokeOpacity={0.6} strokeDasharray="4 5" strokeWidth={1.5} />
            <text x={BAR_X + recallLen + 24} y={550} fill={C.goldHi} fontFamily={SERIF} fontSize={48} fontWeight={700}>
              +{Math.round((RECALL_STRETCH - 1) * 100 * recallP)}%
            </text>
            <text x={BAR_X} y={590} fill={C.text} fontFamily={SERIF} fontSize={22}>
              估自己下落的时长，平均比估别人下落长约 36%
            </text>
          </g>
          <Burst x={BAR_X + recallLen} y={537} at={RECALL1} r={30} />
          <g opacity={prog(f, 6, 20) * (1 - recallP)} transform={`translate(${TX + 360} ${TOP + 260})`}>
            <circle r={24 + beat * 14} fill="none" stroke={C.warn} strokeWidth={2.5} strokeOpacity={0.5 + beat * 0.5} />
            <circle r={9} fill={C.warn} />
            <text x={44} y={9} fill={C.warn} fontFamily={SERIF} fontSize={24}>
              心跳加速
            </text>
          </g>
          <PopText x={TX + 140} y={BOTTOM - 40} at={LAND} until={LAND + 40} size={44} color={C.white} anchor="start">
            2.5 秒，结束
          </PopText>
        </svg>
      </Camera>
      <Note x={900} y={660} w={860} size={26} o={prog(f, RECALL1 + 20, RECALL1 + 34)} color={C.white}>
        回忆被拉长了，但下落时<span style={{ color: C.goldHi }}>并没有“看得更快”</span>——
        <br />
        更可能是强烈情绪让记忆记得更密
      </Note>
      <DocumentaryYear year="2007" sub="达拉斯 · 斯泰森、伊格曼 等" start={0} end={412} />
      <HistoricalAnnotation
        latin="Does Time Really Slow Down during a Frightening Event?"
        title="《惊恐时，时间真的变慢了吗？》"
        meta="PLoS ONE · 2007 · 专业设施与安全网"
        start={6}
        end={412}
      />
      <Beats
        y={920}
        beats={[
          { from: 4, to: 38, text: "受试者从【31 米】高处自由落体" },
          { from: 42, to: LAND, text: "实际只有【2.5 秒】" },
          { from: LAND + 4, to: RECALL1 + 10, text: "可在回忆里，它【长得多】" },
          { from: RECALL1 + 14, to: 412, text: "惊险的瞬间，【回忆】更长", final: true },
        ]}
      />
    </SceneShell>
  );
};
