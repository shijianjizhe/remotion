import React from "react";
import { AbsoluteFill } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { BrassScale, panPositions } from "../components/BrassScale";
import { Camera } from "../components/Camera";
import { CoinAt } from "../components/CoinAt";
import { Glow } from "../components/Glow";
import { Parchment } from "../components/Parchment";
import { TheaterTicket } from "../components/TheaterTicket";
import { C, FONT } from "../config/film";
import { clamp, easeInOut, easeOut, lerp, seg } from "../lib/motion";
import { hash01 } from "../lib/rng";

const INK = "#33291E";

/* 古典剧院：台口、立柱、幕布、观众剪影 */
const Stage: React.FC<{
  cx: number;
  cy: number;
  s?: number;
  p: number;
  /** 幕启 0..1 */
  open?: number;
  opacity?: number;
  glow?: number;
}> = ({ cx, cy, s = 1, p, open = 0.55, opacity = 1, glow = 1 }) => {
  const W = 420;
  const H = 260;
  const draw = (q: number) => ({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - clamp(q) });
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} opacity={opacity}>
      {/* 舞台内部的暖光 */}
      <rect x={-W} y={-H} width={W * 2} height={H * 2} fill="#0C0A08" />
      <ellipse cx={0} cy={10} rx={W * 0.98} ry={H * 0.95} fill="#C49A57" opacity={0.3 * glow} />
      <ellipse cx={0} cy={-24} rx={W * 0.58} ry={H * 0.52} fill="#E8CA88" opacity={0.26 * glow} />
      <ellipse cx={0} cy={-30} rx={W * 0.3} ry={H * 0.3} fill="#FFF0CE" opacity={0.14 * glow} />
      {/* 台口拱 */}
      <path
        d={`M ${-W - 46} ${H + 30} L ${-W - 46} ${-H * 0.34} A ${W + 46} ${H * 0.66} 0 0 1 ${W + 46} ${-H * 0.34} L ${W + 46} ${H + 30}`}
        fill="none"
        stroke={C.copper}
        strokeWidth={2.2}
        opacity={0.75 * p}
        {...draw(p)}
      />
      <path
        d={`M ${-W} ${H + 20} L ${-W} ${-H * 0.26} A ${W} ${H * 0.62} 0 0 1 ${W} ${-H * 0.26} L ${W} ${H + 20}`}
        fill="none"
        stroke={C.gold}
        strokeWidth={1.2}
        opacity={0.6 * p}
        {...draw(p * 1.05)}
      />
      {/* 立柱 */}
      {[-1, 1].map((side) => (
        <g key={side} opacity={p}>
          <rect x={side * (W + 22) - 12} y={-H * 0.3} width={24} height={H * 1.4} fill="#1A1611" stroke={C.copper} strokeWidth={1.1} opacity={0.9} />
          <rect x={side * (W + 22) - 18} y={-H * 0.36} width={36} height={14} fill="#241D15" stroke={C.copper} strokeWidth={1} />
          <rect x={side * (W + 22) - 18} y={H * 0.94} width={36} height={14} fill="#241D15" stroke={C.copper} strokeWidth={1} />
        </g>
      ))}
      {/* 眉幕 */}
      <path d={`M ${-W} ${-H * 0.26} Q 0 ${-H * 0.5} ${W} ${-H * 0.26} L ${W} ${-H * 0.44} Q 0 ${-H * 0.68} ${-W} ${-H * 0.44} Z`} fill="#2A1D18" opacity={0.9 * p} />
      {/* 幕布（左右各一，随幕启移动） */}
      {[-1, 1].map((side) => {
        const spread = lerp(0.02, 0.52, clamp(open));
        const edge = W * (1 - spread * 1.9);
        const x0 = side * W;
        const x1 = side * edge;
        const folds = 7;
        return (
          <g key={side} opacity={p}>
            <path
              d={`M ${x0} ${-H * 0.3} C ${x0} ${-H * 0.3} ${x1 + side * 20} ${-H * 0.2} ${x1} ${H * 0.2} C ${x1 - side * 10} ${H * 0.7} ${x1 + side * 12} ${H} ${x1 + side * 8} ${H + 20} L ${x0} ${H + 20} Z`}
              fill="#45291F"
              opacity={0.94}
            />
            {new Array(folds).fill(0).map((_, i) => {
              const f = i / (folds - 1);
              const fx = lerp(x0, x1 + side * 8, f);
              return (
                <line
                  key={i}
                  x1={fx}
                  y1={-H * 0.28}
                  x2={fx + side * 6}
                  y2={H + 18}
                  stroke={i % 2 === 0 ? "#7A4A38" : "#251715"}
                  strokeWidth={i % 2 === 0 ? 2.2 : 1.2}
                  opacity={0.5}
                />
              );
            })}
          </g>
        );
      })}
      {/* 台唇与观众剪影 */}
      <rect x={-W - 46} y={H + 20} width={W * 2 + 92} height={10} fill="#0A0908" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} opacity={0.85 * p}>
          <circle cx={-150 + i * 100} cy={H + 34} r={17} fill="#050505" />
          <path d={`M ${-150 + i * 100 - 30} ${H + 70} Q ${-150 + i * 100} ${H + 26} ${-150 + i * 100 + 30} ${H + 70} Z`} fill="#050505" />
        </g>
      ))}
    </g>
  );
};

const Seal: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) => {
  if (p <= 0.002) return null;
  return (
    <g opacity={p} transform={`translate(${x} ${y}) scale(${lerp(1.5, 1, p)})`}>
      <circle r={46} fill="#763E32" opacity={0.92} />
      <circle r={38} fill="none" stroke="#3A1D17" strokeWidth={1.6} opacity={0.8} />
      <circle r={46} fill="none" stroke="#5A2C23" strokeWidth={2.4} />
      <text textAnchor="middle" y={7} fontFamily={FONT.cjk} fontSize={19} fill="#E5C9A0" letterSpacing={2} opacity={0.92}>
        不可追回
      </text>
    </g>
  );
};

const Ledger: React.FC<{
  x: number;
  y: number;
  p: number;
  title: string;
  rows: readonly string[];
  highlight?: number;
  seed: number;
}> = ({ x, y, p, title, rows, highlight = 0, seed }) => {
  if (p <= 0.002) return null;
  return (
    <Parchment width={520} height={400} x={x - 960} y={y - 540} opacity={p} seed={seed} dim={0.44} rotate={-0.6}>
      <svg viewBox="0 0 520 400" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <text x={44} y={70} fontFamily={FONT.cjk} fontSize={27} fill={INK} letterSpacing={6}>
          {title}
        </text>
        <line x1={44} y1={90} x2={476} y2={90} stroke={C.copper} strokeWidth={1.3} opacity={0.8} />
        {rows.map((r, i) => (
          <React.Fragment key={i}>
            <text
              x={44}
              y={132 + i * 52}
              fontFamily={FONT.cjk}
              fontSize={23}
              fill={i === 0 ? INK : "#5C4A34"}
              letterSpacing={3}
              opacity={clamp((p - i * 0.12) / 0.5)}
            >
              {r}
            </text>
            <line x1={44} y1={146 + i * 52} x2={44 + 300 * clamp((p - i * 0.12) / 0.5)} y2={146 + i * 52} stroke={C.copper} strokeWidth={0.6} opacity={0.45} />
          </React.Fragment>
        ))}
        {highlight > 0 && <rect x={40} y={106} width={440} height={62} fill={C.rust} opacity={0.12 * highlight} />}
      </svg>
    </Parchment>
  );
};

/* 剧院入口：门内与门外并置，两边都有合理光线 */
const Doorway: React.FC<{ p: number; frame: number }> = ({ p, frame }) => {
  const half = 470;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: p }}>
      <defs>
        <linearGradient id="doorIn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DCB574" stopOpacity="0.72" />
          <stop offset="60%" stopColor="#8A6A3E" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#2A2016" stopOpacity="0.62" />
        </linearGradient>
        <linearGradient id="doorOut" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A6A491" stopOpacity="0.34" />
          <stop offset="60%" stopColor="#5A5A52" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#191914" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {/* 门内：舞台 */}
      <rect x={960 - half} y={250} width={half} height={520} fill="url(#doorIn)" />
      <rect x={960 - half} y={250} width={half} height={520} fill="none" stroke={C.gold} strokeWidth={2} opacity={0.7} />
      <g opacity={0.8}>
        <Stage cx={960 - half / 2} cy={470} s={0.28} p={1} open={0.5} glow={1.2} />
      </g>
      {/* 门外：另一条路 */}
      <rect x={960} y={250} width={half} height={520} fill="url(#doorOut)" />
      <rect x={960} y={250} width={half} height={520} fill="none" stroke={C.grayGold} strokeWidth={2} opacity={0.55} />
      <g opacity={0.75}>
        <path d="M 1010 770 Q 1180 700 1390 690" fill="none" stroke={C.grayGold} strokeWidth={1.4} strokeDasharray="6 8" />
        <circle cx={1120} cy={652} r={13} fill="#1B1B17" />
        <path d="M 1096 700 Q 1120 656 1146 700 Z" fill="#1B1B17" />
        <circle cx={1300} cy={628} r={13} fill="#1B1B17" />
        <path d="M 1276 690 Q 1300 632 1326 690 Z" fill="#1B1B17" />
        <circle cx={1380} cy={470} r={34} fill="none" stroke="#B9B4A0" strokeWidth={0.9} opacity={0.5} />
      </g>
      {/* 门框 */}
      <rect x={960 - 18} y={236} width={36} height={548} fill="#0C0B09" stroke={C.copper} strokeWidth={1.6} opacity={0.95} />
      <path d={`M ${960 - half - 46} ${790} L ${960 - half - 46} ${300} Q ${960 - half - 46} ${212} ${960 - half / 2} ${206} Q 960 ${200} ${960 + half / 2} ${206} Q ${960 + half + 46} ${212} ${960 + half + 46} ${300} L ${960 + half + 46} ${790}`} fill="none" stroke={C.copper} strokeWidth={2.4} opacity={0.8} />
      <text x={960 - half / 2} y={806} textAnchor="middle" fontFamily={FONT.cjk} fontSize={21} fill={C.gold} letterSpacing={5} opacity={0.85}>
        演出还在继续
      </text>
      <text x={960 + half / 2} y={806} textAnchor="middle" fontFamily={FONT.cjk} fontSize={21} fill={C.grayGold} letterSpacing={5} opacity={0.8}>
        也可以做别的
      </text>
    </svg>
  );
};

export const SunkCost: React.FC<{ frame: number }> = ({ frame }) => {
  const s21 = frame < 3120;
  const s22 = frame >= 3120 && frame < 3300;
  const s23 = frame >= 3300 && frame < 3480;
  const s24 = frame >= 3480 && frame < 3630;
  const s25 = frame >= 3630;

  const l21 = frame - 2970;
  const l22 = frame - 3120;
  const l23 = frame - 3300;
  const l24 = frame - 3480;
  const l25 = frame - 3630;

  // 剧院位置随镜头推进
  const stageCx = s21 ? 960 : s22 ? lerp(960, 760, easeInOut(seg(l22, 0, 40))) : lerp(760, 960, easeInOut(seg(l23, 0, 40)));
  const stageCy = 452;
  const stageS = s21 ? lerp(0.9, 0.94, easeInOut(seg(l21, 0, 150))) : s22 ? 0.8 : s23 ? 0.62 : 0.7;

  const theatreP = s21 ? easeOut(seg(l21, 0, 52)) : 1;
  const ticketIn = s21 ? easeOut(seg(l21, 30, 70)) : 1;

  // S22：六场演出，幕启幕落
  const actF = s22 ? seg(l22, 10, 170) : 1;
  const act = Math.floor(actF * 6);
  const curtainOpen = s22 ? 0.35 + 0.5 * Math.abs(Math.sin(actF * Math.PI * 6)) : 0.5;
  const highEmph = s22 ? easeInOut(seg(l22, 10, 60)) : 1;
  const lowEmph = s22 ? 1 - easeInOut(seg(l22, 60, 130)) : 0.25;

  // S23
  const ledgerIn = s23 ? easeOut(seg(l23, 4, 40)) : 1;
  const sealIn = s23 ? easeOut(seg(l23, 46, 76)) : 1;

  // S24
  const doorIn = s24 ? 0.34 + 0.66 * easeInOut(seg(l24, 0, 34)) : 1;
  // S25
  const ticketAway = s25 ? easeInOut(seg(l25, 0, 40)) : 0;
  const scaleIn = s25 ? easeInOut(seg(l25, 6, 46)) : 0;
  const dust = s25 ? easeInOut(seg(l25, 30, 100)) : 0;
  const panS = 0.78;
  const pans = panPositions(960, 470, panS, 0);
  const angle = s25 ? -4 * easeInOut(seg(l25, 60, 110)) + 4 * easeInOut(seg(l25, 90, 118)) : 0;

  const cam = s21
    ? lerp(1.0, 1.03, easeInOut(seg(l21, 0, 150)))
    : s22
      ? lerp(1.03, 0.99, easeInOut(seg(l22, 0, 180)))
      : s23
        ? lerp(0.99, 1.02, easeInOut(seg(l23, 0, 180)))
        : s24
          ? lerp(0.97, 1.0, easeInOut(seg(l24, 0, 150)))
          : lerp(1.0, 1.02, easeInOut(seg(l25, 0, 120)));

  return (
    <AbsoluteFill style={{ backgroundColor: C.black }}>
      <Backdrop warm={0.58} wall={0.12} gx={0.5} gy={0.36} spread={1.04} />
      <Glow x={960} y={470} size={1200} opacity={0.12} />
      <Glow x={960} y={440} size={620} opacity={0.14} variant="ember" />

      <Camera scale={cam}>
        {/* S21–S23：剧院 */}
        {!s24 && !s25 && (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - (s23 ? easeInOut(seg(l23, 120, 180)) * 0.75 : 0) }}>
            <Stage cx={stageCx} cy={stageCy} s={stageS} p={theatreP} open={curtainOpen} glow={0.9 + highEmph * 0.3} opacity={0.95} />
          </svg>
        )}

        {/* S21：一张季票 */}
        {s21 && ticketIn > 0.01 && (
          <>
            <TheaterTicket x={1440} y={520} w={lerp(280, 380, ticketIn)} rotate={lerp(-9, -4.5, ticketIn)} opacity={ticketIn} borderWeight={1.1} used={0} dim={0.2} serial="N° 0134" />
            <Glow x={1440} y={520} size={460} opacity={0.16 * ticketIn} />
          </>
        )}

        {/* S22：两张不同票价的季票 + 出席倾向 */}
        {s22 && (
          <>
            <TheaterTicket x={340} y={520} w={300} rotate={-5} opacity={easeInOut(seg(l22, 0, 20))} borderWeight={2.1} used={0} dim={0.2} serial="N° 0218" />
            <TheaterTicket x={1580} y={520} w={300} rotate={5} opacity={easeInOut(seg(l22, 6, 26))} borderWeight={0.6} used={0} dim={0.26} serial="N° 0887" />
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
              <path d="M 470 470 C 560 400 640 380 700 380" fill="none" stroke={C.gold} strokeWidth={2.2} opacity={0.25 + 0.6 * highEmph} strokeDasharray={1} pathLength={1} />
              <path d="M 1450 470 C 1360 400 1280 380 1220 380" fill="none" stroke={C.grayGold} strokeWidth={1.6} opacity={0.2 + 0.45 * lowEmph} />
              <circle cx={470} cy={470} r={5} fill={C.goldHi} opacity={0.8 * highEmph} />
              <circle cx={1450} cy={470} r={5} fill={C.grayGold} opacity={0.7 * lowEmph} />
            </svg>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 726,
                textAlign: "center",
                fontFamily: FONT.cjk,
                fontSize: 22,
                letterSpacing: "5px",
                color: C.grayGold,
                opacity: 0.8,
              }}
            >
              第 {Math.min(6, act + 1)} 场 · 曲目单翻动中
            </div>
          </>
        )}

        {/* S23：两本账 */}
        {s23 && (
          <div style={{ position: "absolute", inset: 0, opacity: 1 - easeInOut(seg(l23, 150, 180)) }}>
            <Ledger x={520} y={430} p={ledgerIn} title="已经付出" rows={["票价　已付", "无法收回"]} highlight={sealIn} seed={71} />
            <Ledger x={1400} y={430} p={easeInOut(seg(l23, 14, 50))} title="接下来" rows={["时间　要继续投入", "精力　也要继续投入"]} seed={83} />
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
              <Seal x={672} y={362} p={sealIn} />
            </svg>
          </div>
        )}

        {/* S24：门内 / 门外 */}
        {s24 && <Doorway p={doorIn} frame={frame} />}

        {/* S25：未来的得失化为金粉，落到秤盘上 */}
        {s25 && (
          <>
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - scaleIn * 0.4 }}>
              <Stage cx={960} cy={400} s={0.5} p={1} open={0.5} glow={1.1} opacity={0.55 * (1 - scaleIn * 0.45)} />
            </svg>
            <TheaterTicket
              x={960}
              y={392}
              w={lerp(300, 220, ticketAway)}
              rotate={-2}
              opacity={0.5 * (1 - ticketAway * 0.6)}
              borderWeight={1.1}
              used={3}
              dim={0.5 + 0.2 * ticketAway}
            />
            <BrassScale cx={960} cy={586} s={panS} angle={angle} progress={scaleIn} opacity={scaleIn} tickGlow={dust} sway={frame * 0.02} />
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
              {new Array(90).fill(0).map((_, i) => {
                const t0 = hash01(i, 101);
                const t = clamp((dust - t0 * 0.6) / 0.4);
                if (t <= 0) return null;
                const side = i % 2 === 0 ? pans.left : pans.right;
                const sx = 960 + (hash01(i, 103) - 0.5) * 620;
                const sy = 300 + hash01(i, 107) * 60;
                const tx = side.x + (hash01(i, 109) - 0.5) * 60;
                const ty = side.y - 12 - hash01(i, 113) * 12;
                const e = t * t * (3 - 2 * t);
                return (
                  <circle
                    key={i}
                    cx={lerp(sx, tx, e)}
                    cy={lerp(sy, ty, e)}
                    r={1 + hash01(i, 127) * 1.5}
                    fill={C.goldHi}
                    opacity={0.55 * (1 - clamp((t - 0.85) / 0.15))}
                  />
                );
              })}
            </svg>
            {dust > 0.6 && (
              <>
                <CoinAt x={pans.left.x} y={pans.left.y - 20} size={64} tilt={0.85} opacity={clamp((dust - 0.6) / 0.3)} shadow={false} />
                <CoinAt x={pans.right.x - 26} y={pans.right.y - 20} size={54} tilt={0.7} opacity={clamp((dust - 0.65) / 0.3)} shadow={false} />
                <CoinAt x={pans.right.x + 26} y={pans.right.y - 20} size={54} tilt={0.9} opacity={clamp((dust - 0.7) / 0.3)} shadow={false} />
              </>
            )}
          </>
        )}
      </Camera>
    </AbsoluteFill>
  );
};
