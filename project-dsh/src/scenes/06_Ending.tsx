import React from "react";
import { AbsoluteFill } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Camera } from "../components/Camera";
import { CoinAt } from "../components/CoinAt";
import { Glow } from "../components/Glow";
import { C, FONT, TITLE } from "../config/film";
import { clamp, easeInOut, easeOut, lerp, seg } from "../lib/motion";
import { hash01 } from "../lib/rng";

/** 四个章节元素的回环剪影 */
const Motif: React.FC<{ kind: number; p: number }> = ({ kind, p }) => {
  const o = Math.sin(Math.PI * clamp(p));
  const s = lerp(1.75, 0.4, p);
  const rot = p * 150;
  const stroke = C.goldHi;
  return (
    <g transform={`translate(960 500) rotate(${rot}) scale(${s})`} opacity={0.9 * o} fill="none" stroke={stroke} strokeLinejoin="round">
      {kind === 0 && (
        <g strokeWidth={3.4}>
          <path d="M -70 120 L -70 -60 Q -70 -120 0 -120 Q 70 -120 70 -60 L 70 120" />
          <path d="M -70 -40 L 70 -40" />
          <circle cx={44} cy={30} r={6} />
        </g>
      )}
      {kind === 1 && (
        <g strokeWidth={3.2}>
          <circle r={96} />
          {new Array(12).fill(0).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1={Math.cos(a) * 78} y1={Math.sin(a) * 78} x2={Math.cos(a) * 90} y2={Math.sin(a) * 90} />;
          })}
          <line x1={0} y1={0} x2={0} y2={-54} strokeWidth={3.4} />
          <line x1={0} y1={0} x2={40} y2={22} strokeWidth={2.6} />
          <circle r={5} fill={stroke} />
        </g>
      )}
      {kind === 2 && (
        <g strokeWidth={3.4}>
          <path d="M -96 -26 C -96 -26 -84 -66 -38 -76 L 8 -86 C 44 -94 66 -70 78 -48 C 86 -32 86 -26 86 -26 L -96 -26 Z" />
          <path d="M -96 -26 L 86 -26" strokeWidth={3.4} />
          <path d="M -70 -26 L -70 -46 C -52 -46 -44 -56 -34 -66" />
          <circle cx={-52} cy={-58} r={3.4} />
          <circle cx={-30} cy={-64} r={3.4} />
        </g>
      )}
      {kind === 3 && (
        <g strokeWidth={3}>
          <path d="M -80 -70 L 10 -96 L 46 -20 L -30 18 Z" />
          <path d="M 46 -20 L 96 40 L 14 62 L -30 18" />
          <path d="M 10 -96 L 74 -52 L 46 -20" />
        </g>
      )}
    </g>
  );
};

export const Ending: React.FC<{ frame: number }> = ({ frame }) => {
  const s26 = frame < 3900;
  const s27 = frame >= 3900 && frame < 4050;
  const s28 = frame >= 4050;

  const l26 = frame - 3750;
  const l27 = frame - 3900;
  const l28 = frame - 4050;

  // S26：四个元素依次回环
  const motifs = [0, 1, 2, 3];
  const converge = s27 ? easeInOut(seg(l27, 0, 60)) : s28 ? 1 : 0;
  const coinIn = s27 ? easeOut(seg(l27, 2, 46)) : 1;
  /** S26 末尾聚成的金核；S27 开头由它长成金币 */
  const coreA = s26 ? easeInOut(seg(l26, 116, 150)) : 0;
  const coreB = s27 ? 1 - easeOut(seg(l27, 0, 30)) : 0;
  const ghostPath = s27 ? easeInOut(seg(l27, 56, 88)) * (1 - easeInOut(seg(l27, 96, 130))) : 0;
  const pullBack = s28 ? easeInOut(seg(l28, 0, 150)) : 0;
  const titleIn = s28 ? easeInOut(seg(l28, 24, 62)) : 0;

  const camScale = s26
    ? lerp(1.0, 1.06, easeInOut(seg(l26, 0, 150)))
    : s27
      ? lerp(1.06, 1.0, easeInOut(seg(l27, 0, 90)))
      : lerp(1.0, 0.9, pullBack);
  const camY = s28 ? lerp(0, 46, pullBack) : 0;

  const coinSize = s27 ? lerp(120, 300, coinIn) : s28 ? lerp(300, 250, pullBack) : 0;
  const coinY = 500;

  return (
    <AbsoluteFill style={{ backgroundColor: C.black }}>
      <Backdrop warm={s28 ? 0.5 : 0.62} wall={0.11} gx={0.5} gy={0.4} spread={1.06} />
      <Glow x={960} y={500} size={s28 ? 900 : 1100} opacity={0.13 + 0.06 * coinIn} />

      <Camera scale={camScale} y={camY}>
        {s26 && <Glow x={960} y={500} size={660} opacity={0.13} />}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {/* S26：元素回环 + 螺旋粒子 */}
          {s26 && (
            <g>
              {motifs.map((k) => {
                const t0 = k * 32;
                const p = seg(l26 - t0, 0, 60);
                if (l26 < t0 || p >= 1) return null;
                return (
                  <g key={k}>
                    <Motif kind={k} p={p} />
                    <Motif kind={k} p={clamp(p * 0.72)} />
                  </g>
                );
              })}
              {new Array(260).fill(0).map((_, i) => {
                const a0 = hash01(i, 211) * Math.PI * 2;
                const r0 = 260 + hash01(i, 213) * 520;
                const ph = hash01(i, 217);
                const p = clamp(seg(l26, 10 + ph * 90, 130 + ph * 20));
                if (p <= 0) return null;
                const r = r0 * (1 - p);
                const a = a0 + p * Math.PI * 2.4;
                const x = 960 + Math.cos(a) * r;
                const y = 500 + Math.sin(a) * r * 0.86;
                return (
                  <circle key={i} cx={x} cy={y} r={1 + hash01(i, 219) * 1.8} fill={hash01(i, 223) > 0.7 ? C.goldHi : C.gold} opacity={0.72 * Math.sin(Math.PI * p)} />
                );
              })}
            </g>
          )}

          {/* S27/S28：回收为同一枚金币 */}
          {(s27 || s28) && (
            <>
              {s27 &&
                new Array(140).fill(0).map((_, i) => {
                  const a0 = hash01(i, 231) * Math.PI * 2;
                  const r0 = 240 + hash01(i, 233) * 560;
                  const ph = hash01(i, 237);
                  const p = clamp((converge - ph * 0.25) / 0.75);
                  if (p <= 0) return null;
                  const r = r0 * (1 - p);
                  const a = a0 + p * Math.PI * 2.2;
                  return (
                    <circle
                      key={i}
                      cx={960 + Math.cos(a) * r}
                      cy={500 + Math.sin(a) * r * 0.88}
                      r={1 + hash01(i, 239) * 1.6}
                      fill={C.goldHi}
                      opacity={0.6 * (1 - clamp((p - 0.8) / 0.2))}
                    />
                  );
                })}
              {/* 第二条路：只亮一下，随后熄灭 */}
              {ghostPath > 0.01 && (
                <g>
                  <path
                    d="M 960 500 C 820 460 660 430 470 470"
                    fill="none"
                    stroke={C.goldHi}
                    strokeWidth={2}
                    opacity={0.85 * ghostPath}
                  />
                  <path d="M 960 500 C 820 460 660 430 470 470" fill="none" stroke={C.copper} strokeWidth={1} opacity={0.18} strokeDasharray="4 8" />
                </g>
              )}
            </>
          )}
        </svg>

        {coreA > 0.01 && (
          <>
            <Glow x={960} y={500} size={lerp(160, 420, coreA)} opacity={0.5 * coreA} variant="ember" />
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
              <circle cx={960} cy={500} r={lerp(4, 52, coreA)} fill="#F3DFAF" opacity={0.85 * coreA} />
              <circle cx={960} cy={500} r={lerp(2, 22, coreA)} fill="#FFFCF0" opacity={0.9 * coreA} />
            </svg>
          </>
        )}
        {coreB > 0.01 && (
          <Glow x={960} y={500} size={420} opacity={0.45 * coreB} variant="ember" />
        )}
        {(s27 || s28) && coinIn > 0.01 && (
          <CoinAt
            x={960}
            y={coinY}
            size={coinSize}
            tilt={s28 ? 0.965 + 0.035 * Math.cos(l28 * 0.03) : lerp(Math.cos(l27 * 0.1), 1, easeOut(seg(l27, 16, 54)))}
            spin={s28 ? l28 * 0.1 : 0}
            opacity={1}
            glow={0.5}
          />
        )}
      </Camera>

      {/* S28：片名回扣 */}
      {s28 && titleIn > 0.002 && (
        <div style={{ position: "absolute", inset: 0, opacity: titleIn }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 214,
              textAlign: "center",
              fontFamily: FONT.cjk,
              fontSize: 72,
              fontWeight: 500,
              letterSpacing: `${lerp(30, 12, titleIn)}px`,
              color: C.parchment,
              textShadow: "0 4px 26px rgba(0,0,0,0.85)",
            }}
          >
            {TITLE}
          </div>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <line x1={960 - 150 * titleIn} y1={318} x2={960 - 26} y2={318} stroke={C.gold} strokeWidth={1} opacity={0.5 * titleIn} />
            <line x1={960 + 26} y1={318} x2={960 + 150 * titleIn} y2={318} stroke={C.gold} strokeWidth={1} opacity={0.5 * titleIn} />
            <path d="M 960 313 L 965 318 L 960 323 L 955 318 Z" fill={C.goldHi} opacity={0.8 * titleIn} />
          </svg>
        </div>
      )}
    </AbsoluteFill>
  );
};
