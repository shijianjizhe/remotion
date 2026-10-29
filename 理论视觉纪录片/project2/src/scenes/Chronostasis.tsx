import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, H, SERIF, W } from "../config/theme";
import { ScientificClock } from "../components/ScientificClock";
import { SceneShell } from "../components/SceneShell";
import { Beats, Burst, Camera, DocumentaryYear, Note, PopText, prog } from "../components/ui";

// 节点 6：停钟错觉。眼睛快速扫视到墙钟上，落点后的第一秒“看起来”更长。
// 上方大钟 = 感知到的画面；下方两条标尺 = 墙钟实际走过 vs 你感到的。
const SACCADE = 54;
const STRETCH = 1.4; // 首个间隔的主观延长（示意）
const SEG = 170;
const EYE = { x: 320, y: 400 };
const CLOCK = { x: 1180, y: 400, r: 190 };
const AWAY = { x: 640, y: 190 };

export const Chronostasis: React.FC = () => {
  const f = useCurrentFrame();
  const intro = prog(f, 0, 12);
  const tObj = Math.max(0, (f - SACCADE) / 30);
  const perceived = tObj < STRETCH ? 0 : Math.floor(tObj - STRETCH) + 1;
  const sacP = prog(f, SACCADE - 5, SACCADE);
  const gaze = {
    x: interpolate(sacP, [0, 1], [AWAY.x, CLOCK.x]),
    y: interpolate(sacP, [0, 1], [AWAY.y, CLOCK.y]),
  };
  const inSaccade = f > SACCADE - 5 && f < SACCADE + 2;
  const frozen = f >= SACCADE && tObj < STRETCH;

  const rulerX = 520;
  const maxT = 5;
  const tShown = Math.min(tObj, maxT);
  const objN = Math.floor(tShown);
  const feltUntil = (t: number) => (t <= 1 ? t * SEG * STRETCH : SEG * STRETCH + (t - 1) * SEG);
  const rulerP = prog(f, SACCADE + 4, SACCADE + 16);

  return (
    <SceneShell>
      <Camera
        keys={[
          { f: 0, x: 700, y: 330, s: 1.25 },
          { f: SACCADE - 4, x: 760, y: 360, s: 1.18 },
          { f: SACCADE + 2, x: CLOCK.x, y: CLOCK.y, s: 1.5 },
          { f: SACCADE + 44, x: CLOCK.x, y: CLOCK.y, s: 1.42 },
          { f: SACCADE + 70, x: 960, y: 540, s: 1.0 },
          { f: 420, x: 960, y: 560, s: 1.04 },
        ]}
        shake={{ at: SACCADE, amp: 10 }}
      >
        <svg width={W} height={H}>
          <g opacity={intro} transform={`translate(${EYE.x} ${EYE.y})`}>
            <path d="M -90 0 Q 0 -66 90 0 Q 0 66 -90 0 Z" fill="none" stroke={C.white} strokeWidth={2.5} />
            {(() => {
              const dx = gaze.x - EYE.x;
              const dy = gaze.y - EYE.y;
              const d = Math.hypot(dx, dy);
              return (
                <g transform={`translate(${(dx / d) * 28} ${(dy / d) * 18})`}>
                  <circle r={28} fill="none" stroke={C.goldHi} strokeWidth={2} />
                  <circle r={13} fill="#050505" stroke={C.copper} />
                </g>
              );
            })()}
          </g>
          <line
            x1={EYE.x + 80}
            y1={EYE.y}
            x2={gaze.x}
            y2={gaze.y}
            stroke={C.goldHi}
            strokeOpacity={intro * (inSaccade ? 1 : 0.45)}
            strokeWidth={inSaccade ? 4 : 2}
            strokeDasharray="6 8"
          />
          <g opacity={intro * (1 - sacP)}>
            <circle cx={AWAY.x} cy={AWAY.y} r={9} fill={C.white} />
            <text x={AWAY.x + 20} y={AWAY.y + 9} fill={C.white} fontFamily={SERIF} fontSize={26}>
              原本在看这里
            </text>
          </g>
          {inSaccade ? (
            <text x={(AWAY.x + CLOCK.x) / 2} y={(AWAY.y + CLOCK.y) / 2 - 40} fill={C.goldHi} fontFamily={SERIF} fontSize={34} fontWeight={600} textAnchor="middle">
              唰——扫视
            </text>
          ) : null}
          <g opacity={intro} style={{ filter: inSaccade ? "blur(7px)" : undefined }}>
            <ScientificClock
              x={CLOCK.x}
              y={CLOCK.y}
              r={CLOCK.r}
              seconds={f < SACCADE ? 57 + f / 30 : 60 + perceived}
              tickSnap
              glow={frozen ? 0.9 : 0.45}
              secondColor={frozen ? C.white : C.goldHi}
              hourOffset={3 * 3600 + 15 * 60}
            />
          </g>
          {frozen ? (
            <circle
              cx={CLOCK.x}
              cy={CLOCK.y}
              r={CLOCK.r + 20}
              fill="none"
              stroke={C.goldHi}
              strokeWidth={4}
              strokeDasharray={`${(tObj / STRETCH) * 2 * Math.PI * (CLOCK.r + 20)} 9999`}
              transform={`rotate(-90 ${CLOCK.x} ${CLOCK.y})`}
            />
          ) : null}
          <Burst x={CLOCK.x} y={CLOCK.y} at={SACCADE} r={CLOCK.r} />
          <PopText x={CLOCK.x} y={CLOCK.y + CLOCK.r + 60} at={SACCADE + 3} until={SACCADE + Math.round(STRETCH * 30) + 6} size={38} color={C.white}>
            秒针……好像停住了？
          </PopText>
          <PopText x={CLOCK.x + CLOCK.r + 40} y={CLOCK.y - 40} at={SACCADE + 70} size={28} color={C.goldHi} anchor="start">
            你看到的
          </PopText>

          <g opacity={rulerP}>
            <text x={rulerX - 30} y={722} textAnchor="end" fill={C.white} fontFamily={SERIF} fontSize={28}>
              墙钟实际
            </text>
            <line x1={rulerX} x2={rulerX + SEG * tShown} y1={712} y2={712} stroke={C.white} strokeWidth={4} />
            {new Array(objN + 1).fill(0).map((_, k) => (
              <g key={k}>
                <line x1={rulerX + k * SEG} x2={rulerX + k * SEG} y1={696} y2={728} stroke={C.white} strokeWidth={2} />
                <text x={rulerX + k * SEG} y={760} textAnchor="middle" fill={C.text} fontFamily={SERIF} fontSize={22}>
                  {k}s
                </text>
              </g>
            ))}
            <text x={rulerX - 30} y={822} textAnchor="end" fill={C.goldHi} fontFamily={SERIF} fontSize={28}>
              你感到的
            </text>
            <line x1={rulerX} x2={rulerX + feltUntil(tShown)} y1={812} y2={812} stroke={C.goldHi} strokeWidth={4} />
            {new Array(objN + 1).fill(0).map((_, k) => {
              const x = rulerX + (k === 0 ? 0 : SEG * STRETCH + (k - 1) * SEG);
              return <line key={k} x1={x} x2={x} y1={796} y2={828} stroke={C.goldHi} strokeWidth={2} />;
            })}
            {tObj >= 1 ? (
              <g>
                <rect x={rulerX} y={794} width={SEG * STRETCH} height={36} fill={C.goldHi} opacity={0.22} />
                <text x={rulerX + (SEG * STRETCH) / 2} y={862} textAnchor="middle" fill={C.goldHi} fontFamily={SERIF} fontSize={24}>
                  第一秒 · 被拉长
                </text>
              </g>
            ) : null}
          </g>
          <Burst x={rulerX + SEG * STRETCH} y={812} at={SACCADE + 30} r={20} />
        </svg>
      </Camera>
      <Note x={1490} y={680} w={400} size={24} o={prog(f, 190, 204)}>
        扫视途中的模糊画面被大脑删掉，
        <br />
        再用落点画面<span style={{ color: C.goldHi }}>“回填”</span>空白。
        <br />
        <span style={{ color: C.white }}>墙钟本身没有变慢。</span>
      </Note>
      <DocumentaryYear year="停钟错觉" sub="Chronostasis · 感知研究" start={0} end={412} />
      <Beats
        y={920}
        beats={[
          { from: 4, to: 50, text: "试试看：【突然】看向一只钟" },
          { from: 110, to: 190, text: "第一下滴答，总显得【特别长】" },
          { from: 194, to: 280, text: "被拉长的，是【你的感受】" },
          { from: 284, to: 412, text: "停住的，是【感觉】，不是钟", final: true },
        ]}
      />
    </SceneShell>
  );
};
