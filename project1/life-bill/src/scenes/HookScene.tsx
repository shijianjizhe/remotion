import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, GridLines, Particles } from "../components/Background";
import { PrinterSlot } from "../components/Illustrations";
import { Camera, CharReveal, EASE_OUT, Reveal } from "../components/Motion";
import { Mono, Sfx } from "../components/UI";
import { PERSONA } from "../data/persona";
import { COLORS, FONT_STACK } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Barcode: React.FC<{ width: number }> = ({ width }) => {
  const bars = [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 4, 1, 1, 2, 1, 3, 2, 1, 1, 4, 2, 1, 3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 4, 1, 2];
  const total = bars.reduce((a, b) => a + b, 0) * 2;
  const unit = width / total;
  return (
    <div style={{ display: "flex", height: 70 }}>
      {bars.map((b, i) => (
        <React.Fragment key={i}>
          <div style={{ width: b * unit, background: COLORS.ink }} />
          <div style={{ width: b * unit }} />
        </React.Fragment>
      ))}
    </div>
  );
};

const ReceiptLine: React.FC<{ l: string; r: string; bold?: boolean }> = ({ l, r, bold }) => (
  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, fontWeight: bold ? 800 : 500, color: COLORS.ink, letterSpacing: 1 }}>
    <span>{l}</span>
    <span style={{ fontVariantNumeric: "tabular-nums" }}>{r}</span>
  </div>
);

/** 01 开场钩子：黑暗中亮起一台"人生打印机"，吐出一张年度账单 */
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const paperLen = interpolate(frame, [26, 112], [0, 820], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 2.2) });
  const slotGlow = interpolate(frame, [0, 18], [0, 1], clamp);
  const jitter = frame > 26 && frame < 112 ? Math.sin(frame * 3.1) * 1.2 : 0;
  // 结尾冲进纸面
  const dive = interpolate(frame, [124, 150], [1, 1.25], { ...clamp, easing: EASE_OUT });

  return (
    <AbsoluteFill>
      <Backdrop color={COLORS.blue} intensity={0.16} y={45} />
      <GridLines opacity={0.045} />
      <Particles count={30} seed="hook" speed={0.25} opacity={0.35} maxSize={3} />
      <Sfx name="riser" at={0} volume={0.35} />
      <Sfx name="printer" at={26} volume={0.42} />

      <Camera from={1.06} to={1} driftY={0}>
        <AbsoluteFill style={{ scale: String(dive) }}>
          {/* 主标题 */}
          <div style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center", fontFamily: FONT_STACK }}>
            <Reveal delay={4} y={10}>
              <Mono style={{ letterSpacing: 10, color: COLORS.blue }}>LIFE STATEMENT · {PERSONA.year}</Mono>
            </Reveal>
            <div style={{ marginTop: 34, fontSize: 92, fontWeight: 800, color: COLORS.text, lineHeight: 1.25, letterSpacing: 4 }}>
              <CharReveal text="如果你的人生" delay={10} stagger={3} />
              <br />
              <CharReveal
                text="也有一张年度账单"
                delay={30}
                stagger={3}
                charStyle={(i) => (i >= 4 ? { color: COLORS.blue, textShadow: `0 0 40px ${COLORS.blue}88` } : {})}
              />
            </div>
          </div>

          {/* 打印机 + 纸 */}
          <div style={{ position: "absolute", top: 720, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ opacity: slotGlow, zIndex: 2, filter: `drop-shadow(0 0 ${30 * slotGlow}px ${COLORS.blue}55)` }}>
              <PrinterSlot width={760} color={COLORS.blue} />
            </div>
            <div style={{ marginTop: -22, height: paperLen, overflow: "hidden", width: 660, translate: `${jitter}px 0px` }}>
              <div
                style={{
                  width: 660,
                  height: 820,
                  translate: "0px 0px",
                  background: COLORS.paper,
                  padding: "56px 52px",
                  boxSizing: "border-box",
                  fontFamily: FONT_STACK,
                  boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
                  backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0) 30%)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 22,
                }}
              >
                <div style={{ textAlign: "center", fontSize: 44, fontWeight: 900, letterSpacing: 10, color: COLORS.ink }}>年度人生账单</div>
                <div style={{ textAlign: "center", fontSize: 24, letterSpacing: 6, color: "#6B6E75" }}>ANNUAL LIFE STATEMENT</div>
                <div style={{ borderTop: "3px dashed #9A9CA1" }} />
                <ReceiptLine l="账单周期" r={`${PERSONA.year}.01.01 – 12.31`} />
                <ReceiptLine l="账户持有人" r={`${PERSONA.name} · ${PERSONA.age}岁`} />
                <ReceiptLine l="所在城市" r={PERSONA.city} />
                <ReceiptLine l="计价单位" r="小时 (h)" />
                <div style={{ borderTop: "3px dashed #9A9CA1" }} />
                <ReceiptLine l="本期额度" r="████ h" bold />
                <ReceiptLine l="本期支出" r="████ h" bold />
                <ReceiptLine l="本期结余" r="?" bold />
                <div style={{ borderTop: "3px dashed #9A9CA1" }} />
                <Barcode width={556} />
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </Camera>
    </AbsoluteFill>
  );
};
