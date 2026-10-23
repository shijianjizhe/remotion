import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, GridLines, Particles } from "../components/Background";
import { fmt } from "../components/format";
import { Camera, CharReveal, EASE_IN_OUT, EASE_OUT, Reveal } from "../components/Motion";
import { Card, CountTicks, CountUp, Mono, Sfx } from "../components/UI";
import { CATEGORIES, SELF_COLOR, SELF_HOURS, SPENT_HOURS, YEAR_HOURS } from "../data/persona";
import { COLORS, FONT_STACK, SAFE_X } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const ROW_START = 14;
const ROW_STAGGER = 7;
const PHASE_B = 118; // 从"明细"切到"结余"

/** 环形图：7 段支出依次画出，最后剩下的绿色缺口就是"自己" */
const Donut: React.FC<{ size: number }> = ({ size }) => {
  const frame = useCurrentFrame();
  const R = size / 2 - 40;
  const C = 2 * Math.PI * R;
  const focus = interpolate(frame, [PHASE_B, PHASE_B + 30], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  let acc = 0;
  const arcs = CATEGORIES.map((c, i) => {
    const start = acc;
    acc += c.hours / YEAR_HOURS;
    const t0 = ROW_START + i * ROW_STAGGER;
    const p = interpolate(frame, [t0, t0 + 16], [0, 1], { ...clamp, easing: EASE_OUT });
    return { c, start, len: (c.hours / YEAR_HOURS) * p };
  });
  const selfStart = SPENT_HOURS / YEAR_HOURS;
  const selfT = ROW_START + CATEGORIES.length * ROW_STAGGER + 6;
  const selfP = interpolate(frame, [selfT, selfT + 20], [0, 1], { ...clamp, easing: EASE_OUT });
  const pulse = 1 + Math.sin(frame / 6) * 0.12 * focus;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ rotate: "-90deg", overflow: "visible" }}>
      <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="rgba(245,247,250,0.06)" strokeWidth={46} />
      {arcs.map(({ c, start, len }) => (
        <circle
          key={c.id}
          cx={size / 2}
          cy={size / 2}
          r={R}
          fill="none"
          stroke={c.color}
          strokeWidth={46 - focus * 18}
          strokeDasharray={`${Math.max(0, len * C - 4)} ${C}`}
          strokeDashoffset={-start * C}
          opacity={1 - focus * 0.78}
        />
      ))}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={R}
        fill="none"
        stroke={SELF_COLOR}
        strokeWidth={(46 + focus * 22) * pulse}
        strokeDasharray={`${Math.max(0, (SELF_HOURS / YEAR_HOURS) * selfP * C - 4)} ${C}`}
        strokeDashoffset={-selfStart * C}
        style={{ filter: `drop-shadow(0 0 ${10 + focus * 30}px ${SELF_COLOR})` }}
      />
    </svg>
  );
};

/** 10 汇总：账单明细 → 环形图 → "真正留给自己的时间" */
export const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const listOut = interpolate(frame, [PHASE_B, PHASE_B + 20], [1, 0], { ...clamp, easing: EASE_IN_OUT });
  const donutMove = interpolate(frame, [PHASE_B, PHASE_B + 36], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const centerBalance = interpolate(
    frame,
    [ROW_START, ROW_START + CATEGORIES.length * ROW_STAGGER + 10],
    [YEAR_HOURS, SELF_HOURS],
    { ...clamp, easing: (t) => t },
  );
  const stamp = spring({ frame: frame - (PHASE_B + 96), fps, config: { damping: 10, stiffness: 220, mass: 0.8 } });
  const totalT = ROW_START + CATEGORIES.length * ROW_STAGGER;

  return (
    <AbsoluteFill>
      <Backdrop color={SELF_COLOR} intensity={interpolate(frame, [PHASE_B, PHASE_B + 60], [0.06, 0.2], clamp)} y={34} />
      <GridLines opacity={0.035} />
      <Particles count={36} seed="summary" color={SELF_COLOR} speed={0.2} opacity={interpolate(frame, [PHASE_B, PHASE_B + 60], [0, 0.5], clamp)} maxSize={3} />
      <Sfx name="printer" at={ROW_START - 4} volume={0.25} />
      {CATEGORIES.map((_, i) => (
        <Sfx key={i} name="click" at={ROW_START + i * ROW_STAGGER} volume={0.28} />
      ))}
      <Sfx name="fill" at={totalT + 4} volume={0.35} />
      <Sfx name="riser" at={PHASE_B - 20} volume={0.3} />
      <Sfx name="boom" at={PHASE_B + 30} volume={0.55} />
      <CountTicks start={PHASE_B + 30} duration={40} every={3} volume={0.16} />
      <Sfx name="stamp" at={PHASE_B + 96} volume={0.65} />

      <Camera from={1} to={1.04} driftY={-10}>
        {/* 环形图 + 中心余额 */}
        <div
          style={{
            position: "absolute",
            left: 540 - 300,
            top: interpolate(donutMove, [0, 1], [150, 230]),
            width: 600,
            height: 600,
            scale: String(interpolate(donutMove, [0, 1], [1, 1.12])),
          }}
        >
          <Donut size={600} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT_STACK }}>
            <div style={{ fontSize: 28, letterSpacing: 6, color: COLORS.textFaint, opacity: listOut }}>本期结余</div>
            <div
              style={{
                fontSize: 84,
                fontWeight: 800,
                color: frame > totalT + 10 ? SELF_COLOR : COLORS.text,
                fontVariantNumeric: "tabular-nums",
                opacity: listOut,
              }}
            >
              {fmt(centerBalance)}h
            </div>
          </div>
        </div>

        {/* A：账单明细 */}
        <div style={{ position: "absolute", top: 830, left: SAFE_X, right: SAFE_X, opacity: listOut, filter: `blur(${(1 - listOut) * 10}px)` }}>
          <Card style={{ padding: "34px 44px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <Mono>本期支出明细</Mono>
              <Mono>HOURS</Mono>
            </div>
            {CATEGORIES.map((c, i) => {
              const t = ROW_START + i * ROW_STAGGER;
              const a = interpolate(frame, [t - 4, t + 8], [0, 1], { ...clamp, easing: EASE_OUT });
              return (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 0",
                    borderBottom: "1.5px dashed rgba(245,247,250,0.1)",
                    fontFamily: FONT_STACK,
                    opacity: a,
                    translate: `${(1 - a) * 30}px 0px`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 38, color: COLORS.text }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: c.color }} />
                    {c.label}
                  </div>
                  <div style={{ fontSize: 38, fontWeight: 700, color: COLORS.text, fontVariantNumeric: "tabular-nums" }}>{fmt(c.hours)}</div>
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, fontFamily: FONT_STACK, fontSize: 42, fontWeight: 800 }}>
              <span style={{ color: COLORS.red }}>本期支出合计</span>
              <span style={{ color: COLORS.red, fontVariantNumeric: "tabular-nums" }}>
                −<CountUp to={SPENT_HOURS} start={ROW_START} duration={CATEGORIES.length * ROW_STAGGER + 6} />h
              </span>
            </div>
          </Card>
        </div>

        {/* B：结余揭晓 */}
        <div style={{ position: "absolute", top: 960, left: SAFE_X, right: SAFE_X, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ fontFamily: FONT_STACK, fontSize: 64, fontWeight: 700, color: COLORS.text, letterSpacing: 4 }}>
            {frame >= PHASE_B + 14 ? <CharReveal text="真正留给自己的时间" delay={PHASE_B + 14} stagger={2} /> : null}
          </div>
          {frame >= PHASE_B + 26 ? (
            <Reveal delay={PHASE_B + 26} y={40} blur={20} style={{ marginTop: 10 }}>
              <div
                style={{
                  fontFamily: FONT_STACK,
                  color: SELF_COLOR,
                  textShadow: `0 0 80px ${SELF_COLOR}99`,
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "center",
                  gap: 12,
                }}
              >
                <CountUp from={0} to={SELF_HOURS} start={PHASE_B + 30} duration={40} style={{ fontSize: 260, fontWeight: 900, letterSpacing: -6, lineHeight: 1.05 }} />
                <span style={{ fontSize: 80, fontWeight: 600 }}>h</span>
              </div>
            </Reveal>
          ) : null}
          <div style={{ display: "flex", gap: 20, marginTop: 30 }}>
            {[
              { k: "折合", v: `${SELF_HOURS / 24} 天` },
              { k: "平均每天", v: `${(SELF_HOURS / 365).toFixed(1)} 小时` },
              { k: "占全年", v: `${((SELF_HOURS / YEAR_HOURS) * 100).toFixed(1)}%` },
            ].map((s, i) =>
              frame >= PHASE_B + 70 + i * 6 ? (
                <Reveal key={s.k} delay={PHASE_B + 70 + i * 6} y={24}>
                  <Card style={{ padding: "22px 30px", minWidth: 220 }} accent={SELF_COLOR}>
                    <div style={{ fontFamily: FONT_STACK, fontSize: 26, color: COLORS.textFaint, letterSpacing: 3 }}>{s.k}</div>
                    <div style={{ fontFamily: FONT_STACK, fontSize: 46, fontWeight: 800, color: COLORS.text, marginTop: 4 }}>{s.v}</div>
                  </Card>
                </Reveal>
              ) : (
                <div key={s.k} style={{ minWidth: 220 }} />
              ),
            )}
          </div>
          {frame >= PHASE_B + 110 ? (
            <Reveal delay={PHASE_B + 110} y={16} style={{ marginTop: 34 }}>
              <div style={{ fontFamily: FONT_STACK, fontSize: 32, color: COLORS.textFaint, lineHeight: 1.5 }}>
                洗漱、运动、发呆、见朋友、学点东西……
                <br />
                全都要从这里面挤
              </div>
            </Reveal>
          ) : null}
        </div>

        {/* 印章 */}
        <div
          style={{
            position: "absolute",
            top: 240,
            right: 60,
            opacity: frame >= PHASE_B + 96 ? 1 : 0,
            scale: String(interpolate(stamp, [0, 1], [2.4, 1])),
            rotate: "-14deg",
            border: `6px solid ${COLORS.red}`,
            borderRadius: 18,
            padding: "10px 26px",
            fontFamily: FONT_STACK,
            fontSize: 50,
            fontWeight: 900,
            letterSpacing: 8,
            color: COLORS.red,
            mixBlendMode: "screen",
            boxShadow: `0 0 30px ${COLORS.red}55`,
          }}
        >
          余额不足
        </div>
      </Camera>
    </AbsoluteFill>
  );
};
