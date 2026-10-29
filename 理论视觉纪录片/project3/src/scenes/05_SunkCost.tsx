import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {C, FONT_CN} from "../config/film";
import {Stage} from "../components/Atmosphere";
import {GoldCoin} from "../components/GoldCoin";
import {Parchment} from "../components/ParchmentPage";
import {BrassScale, scaleGeom} from "../components/BrassScale";
import {Theater, TheaterTicket} from "../components/TheaterTicket";
import {Figure} from "../components/Figures";
import {bezier, Pt} from "../utils/geometry";
import {clamp01, damped, easeInOut, easeOut, lerp, prog} from "../utils/motion";
import {rnd, rndSigned} from "../utils/seededRandom";

const START = 2925;
const END = 3770;

const SHOW0 = 3140;
const SHOW_LEN = 34;
// 路径亮度：原价组在前几场更倾向出席，后几场差异收敛（示意，非论文数据）
const bA = [0.95, 0.92, 0.86, 0.62, 0.58];
const bB = [0.42, 0.45, 0.48, 0.56, 0.58];

const Audience: React.FC<{cx: number; y: number; bright: number; opacity: number}> = ({cx, y, bright, opacity}) => (
  <g opacity={opacity}>
    <ellipse cx={cx} cy={y + 10} rx={150} ry={40} fill="url(#glowGold)" opacity={bright * 0.6} />
    {[0, 1].map((row) =>
      Array.from({length: 6}, (_, i) => {
        const x = cx + (i - 2.5) * 38 + (row ? 19 : 0);
        const yy = y + row * 40;
        const col = bright > 0.7 ? "#D9B56E" : "#9B8A70";
        return (
          <g key={`${row}-${i}`} opacity={0.45 + 0.55 * bright} fill={col}>
            <circle cx={x} cy={yy - 22} r={8} />
            <path d={`M${x - 14} ${yy + 4} Q${x - 14} ${yy - 12} ${x} ${yy - 12} Q${x + 14} ${yy - 12} ${x + 14} ${yy + 4} Z`} />
          </g>
        );
      }),
    )}
  </g>
);

const Padlock: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-16 -8 V-24 A16 16 0 0 1 16 -24 V-8" fill="none" stroke="#B08443" strokeWidth={7} />
    <rect x={-26} y={-10} width={52} height={42} rx={4} fill="url(#brassV)" stroke="#3A2914" strokeWidth={1} />
    <circle cx={0} cy={6} r={5} fill="#2A1D0E" />
    <path d="M-2 8 L-3 20 H3 L2 8 Z" fill="#2A1D0E" />
  </g>
);

const Flame: React.FC<{x: number; y: number; f: number}> = ({x, y, f}) => {
  const k = 1 + 0.06 * Math.sin(f * 0.5) + 0.04 * Math.sin(f * 1.3);
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cy={-30} r={60} fill="url(#glowGold)" opacity={0.8} />
      <path d={`M0 ${-62 * k} C14 -40 18 -26 0 -10 C-18 -26 -14 -40 0 ${-62 * k} Z`} fill="#E8CA88" />
      <path d="M0 -40 C6 -30 6 -22 0 -14 C-6 -22 -6 -30 0 -40 Z" fill="#FFF4D6" />
      <path d="M-30 0 H30 L22 20 H-22 Z" fill="url(#brassV)" />
      <path d="M-4 -10 V0" stroke={C.ink} strokeWidth={2} />
    </g>
  );
};

/** S24 门口：向内是演出，向外是另一条路；两侧都有合理的光 */
const Doorway: React.FC<{f: number; o: number}> = ({f, o}) => {
  const walk = prog(f, 3484, 3546, (x) => x);
  const fx = lerp(420, 1010, walk);
  const walking = f < 3546;
  const facing: 1 | -1 = walking ? 1 : f < 3552 ? 1 : f < 3586 ? -1 : f < 3614 ? 1 : -1;
  const flick = 0.85 + 0.15 * Math.sin(f * 0.21) * Math.sin(f * 0.07);
  return (
    <g opacity={o}>
      {/* 墙面 */}
      <rect x={360} y={150} width={800} height={680} fill="#110D09" />
      <g stroke={C.copper} strokeWidth={0.8} opacity={0.22}>
        {Array.from({length: 11}, (_, i) => (
          <line key={i} x1={360} x2={1160} y1={190 + i * 60} y2={190 + i * 60} />
        ))}
      </g>
      <path d="M360 150 H1160" stroke={C.gold} strokeWidth={1.4} opacity={0.6} />
      <text x={760} y={210} textAnchor="middle" fontFamily="EB Garamond" fontSize={28} letterSpacing="0.5em" fill={C.gold} opacity={0.7}>
        THEATRE
      </text>
      {/* 门内：舞台光与座椅剪影 */}
      <clipPath id="doorClip">
        <path d="M590 830 V400 A170 170 0 0 1 930 400 V830 Z" />
      </clipPath>
      <g clipPath="url(#doorClip)">
        <rect x={580} y={220} width={360} height={620} fill="#2A1D0E" />
        <circle cx={760} cy={520} r={300} fill="url(#stageLight)" opacity={flick} />
        <Theater cx={760} cy={520} s={0.42} light={1} show={3} />
        {[700, 740, 780, 820].map((y, i) => (
          <path key={y} d={`M560 ${y + 20} Q760 ${y - 26 + i * 4} 960 ${y + 20} V${y + 40} H560 Z`} fill="#0C0906" opacity={0.95} />
        ))}
      </g>
      <path d="M590 830 V400 A170 170 0 0 1 930 400 V830" fill="none" stroke={C.gold} strokeWidth={2.4} />
      <path d="M574 830 V400 A186 186 0 0 1 946 400 V830" fill="none" stroke={C.gold} strokeWidth={1} opacity={0.5} />
      {/* 打开的门扇 */}
      <path d="M590 830 V400 L520 380 V850 Z" fill="#1E160C" stroke={C.gold} strokeWidth={1.2} />
      <path d="M930 830 V400 L1000 380 V850 Z" fill="#1E160C" stroke={C.gold} strokeWidth={1.2} />
      {/* 地面 */}
      <path d="M0 830 H1920" stroke={C.copper} strokeWidth={1.2} opacity={0.6} />
      <path d="M540 830 H980 L1000 846 H520 Z" fill="#1A140C" stroke={C.gold} strokeWidth={0.8} opacity={0.8} />
      {/* 门外：另一条路 */}
      <path d="M1060 1080 C1200 900 1420 640 1600 500 L1626 500 C1500 660 1420 900 1440 1080 Z" fill="url(#floorLight)" opacity={0.9} />
      <path d="M1060 1080 C1200 900 1420 640 1600 500 M1440 1080 C1420 900 1500 660 1626 500" fill="none" stroke={C.gold} strokeWidth={1.2} opacity={0.6} />
      <path d="M1260 1080 C1320 900 1450 680 1612 500" fill="none" stroke={C.gold} strokeWidth={1} strokeDasharray="8 14" opacity={0.4} />
      {/* 路灯 */}
      <circle cx={1340} cy={520} r={140} fill="url(#glowGold)" opacity={0.9 * flick} />
      <path d="M1340 830 V530 M1322 530 H1358" stroke={C.gold} strokeWidth={2} />
      <path d="M1326 530 L1332 500 H1348 L1354 530 Z" fill="#E8CA88" opacity={0.9} />
      {/* 远处亮窗的小屋 */}
      <g transform="translate(1660 460)">
        <circle cx={0} cy={0} r={80} fill="url(#glowGold)" opacity={0.7} />
        <path d="M-50 40 V-10 L0 -46 L50 -10 V40 Z" fill="#120E09" stroke={C.gold} strokeWidth={1.4} />
        <rect x={-14} y={0} width={28} height={24} fill="#E8CA88" opacity={0.85} />
      </g>
      {/* 持票人：深色剪影 + 金色轮廓光 */}
      <g>
        <Figure x={fx} y={830} s={1.55} color={C.gold} hat="cap" walk={walking ? (f - 3484) * 0.3 : undefined} facing={facing} opacity={0.55} />
        <Figure x={fx} y={829} s={1.5} color="#0A0806" hat="cap" walk={walking ? (f - 3484) * 0.3 : undefined} facing={facing} />
        <rect x={fx + facing * 30 - 9} y={830 - 160} width={18} height={10} fill={C.goldHi} transform={`rotate(-12 ${fx + facing * 30} ${830 - 155})`} />
      </g>
    </g>
  );
};

export const SunkCostScene: React.FC = () => {
  const f = useCurrentFrame();
  if (f < START || f > END) return null;

  // ---- 票（S20 尾 → S21）
  const reveal = prog(f, 2925, 2968, (x) => x);
  const move = prog(f, 2986, 3030, easeInOut);
  const tCx = lerp(960, 680, move);
  const tCy = lerp(480, 520, move);
  const tS = lerp(1, 0.68, move);
  const bigTicketOut = 1 - prog(f, 3118, 3138);
  // ---- 剧院
  const thDraw = prog(f, 2998, 3070, easeInOut);
  const thMove = prog(f, 3118, 3150, easeInOut);
  const thX = lerp(1390, 960, thMove);
  const thY = lerp(490, 300, thMove);
  const thS = lerp(0.78, 0.58, thMove);
  const k = Math.min(4, Math.max(0, Math.floor((f - SHOW0) / SHOW_LEN)));
  let curtain = f < SHOW0 ? lerp(0.15, 1, prog(f, 3020, 3070)) : 1;
  for (let i = 1; i < 5; i++) curtain = Math.min(curtain, clamp01(Math.abs(f - (SHOW0 + i * SHOW_LEN)) / 7));
  const torn = [0, 1, 2, 3, 4].reduce((s, i) => s + prog(f, SHOW0 + 6 + i * SHOW_LEN, SHOW0 + 14 + i * SHOW_LEN), 0);
  const groupsIn = prog(f, 3132, 3156);
  const s22Out = 1 - prog(f, 3296, 3316);
  // ---- S23 账本
  const ledIn = prog(f, 3304, 3330, easeOut);
  const ledOut = 1 - prog(f, 3474, 3494);
  const stamp = prog(f, 3370, 3378, easeOut);
  const lockY = f < 3400 ? -200 : lerp(130, 232, prog(f, 3400, 3410, (x) => x * x)) + damped(f - 3410, -8, 0.8, 4);
  // ---- S24 门口 / S25 天平
  const doorIn = prog(f, 3482, 3506);
  const toBack = prog(f, 3630, 3662, easeInOut);
  const scaleIn = prog(f, 3634, 3662);
  const sceneOut = 1 - prog(f, 3742, 3768);
  const ang = 2.2 * Math.sin((f - 3650) / 20) * Math.exp(-Math.max(0, f - 3650) / 70);
  const sg = scaleGeom(960, 320, ang, 250, 170);
  const mapBack = (p: Pt): Pt => [960 + (p[0] - 960) * lerp(1, 0.9, toBack), 540 + (p[1] - 540) * lerp(1, 0.9, toBack)];

  const gA: Pt = [640, 740];
  const gB: Pt = [1280, 740];
  const stageA: Pt = [thX - 80, thY + 110];
  const stageB: Pt = [thX + 80, thY + 110];

  return (
    <AbsoluteFill style={{opacity: sceneOut}}>
      <Stage>
        {/* ================= S21–S22 ================= */}
        {f < 3320 && (
          <g opacity={s22Out}>
            <Theater cx={thX} cy={thY} s={thS} draw={thDraw} curtain={curtain} show={f < SHOW0 ? 0 : k} light={0.85} />
            {f >= SHOW0 - 10 && (
              <text x={thX} y={thY + 140} textAnchor="middle" fontFamily={FONT_CN} fontSize={24} letterSpacing="0.2em" fill={C.goldHi} opacity={groupsIn * (0.4 + 0.6 * curtain)}>
                第 {k + 1} 场
              </text>
            )}
            {/* 大季票 */}
            {bigTicketOut > 0 && (
              <g transform={`translate(${tCx} ${tCy}) scale(${tS}) translate(-960 -480)`} opacity={bigTicketOut}>
                <TheaterTicket cx={960} cy={480} reveal={reveal} />
              </g>
            )}
            {/* 两组观众：原价 / 折扣（同一种季票，边框粗细区分） */}
            {groupsIn > 0 && (
              <g opacity={groupsIn}>
                {[
                  {g: gA, label: "原价购票", border: 5.5, b: bA, st: stageA},
                  {g: gB, label: "获得折扣", border: 1, b: bB, st: stageB},
                ].map((G, gi) => {
                  const br = f < SHOW0 ? 0.5 : G.b[k];
                  const p0: Pt = [G.g[0], G.g[1] - 112];
                  const c1: Pt = [G.g[0], G.g[1] - 260];
                  const c2: Pt = [G.st[0], G.st[1] + 120];
                  return (
                    <g key={gi}>
                      <path
                        d={`M${p0[0]} ${p0[1]} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${G.st[0]} ${G.st[1]}`}
                        fill="none"
                        stroke={C.gold}
                        strokeWidth={1 + br * 3}
                        opacity={0.15 + br * 0.75}
                      />
                      {f >= SHOW0 &&
                        Array.from({length: 6}, (_, i) => {
                          const t = (((f - SHOW0) / 40 + i / 6) % 1 + 1) % 1;
                          const p = bezier(p0, c1, c2, G.st, t);
                          return <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill="#FFF0C8" opacity={br * br * Math.sin(t * Math.PI)} />;
                        })}
                      <g transform={`translate(${G.g[0]} ${G.g[1] - 70}) scale(0.34) translate(-960 -480)`}>
                        <TheaterTicket cx={960} cy={480} torn={f < SHOW0 ? 0 : torn} border={G.border * 2.2} />
                      </g>
                      <Audience cx={G.g[0]} y={G.g[1] + 20} bright={br} opacity={1} />
                      <text x={G.g[0]} y={G.g[1] + 108} textAnchor="middle" fontFamily={FONT_CN} fontSize={25} letterSpacing="0.18em" fill={gi === 0 ? C.goldHi : C.parchment}>
                        {G.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        )}

        {/* ================= S23 两本账 ================= */}
        {f >= 3300 && f < 3500 && (
          <g opacity={ledIn * ledOut}>
            {/* 左：过去 */}
            <g transform={`translate(0 ${(1 - ledIn) * -40})`}>
              <Parchment x={350} y={180} w={540} h={650} kind="page" tint={0.22 * stamp} />
              <text x={410} y={262} fontFamily={FONT_CN} fontSize={40} fontWeight={700} letterSpacing="0.14em" fill={C.ink}>
                已经付出
              </text>
              <text x={412} y={306} fontFamily={FONT_CN} fontSize={26} letterSpacing="0.2em" fill={C.rust}>
                无法收回
              </text>
              <path d="M410 326 H830" stroke={C.ink} strokeWidth={1.6} opacity={0.6} />
              <g transform="translate(620 420) scale(0.42) translate(-960 -480)">
                <TheaterTicket cx={960} cy={480} torn={2} border={5} />
              </g>
              {[0, 1, 2].map((i) => (
                <GoldCoin key={i} x={560 + i * 60} y={560} r={22} squashY={1} />
              ))}
              <text x={620} y={620} textAnchor="middle" fontFamily={FONT_CN} fontSize={22} letterSpacing="0.2em" fill={C.inkSoft}>
                票价
              </text>
              {/* 封印 */}
              {stamp > 0 && (
                <g transform={`translate(720 700) rotate(-9) scale(${lerp(1.9, 1, stamp)})`} opacity={stamp}>
                  <circle r={64} fill="url(#waxSeal)" />
                  <circle r={52} fill="none" stroke="#E3B8A4" strokeWidth={1.4} opacity={0.6} />
                  <text y={-4} textAnchor="middle" fontFamily={FONT_CN} fontSize={26} fontWeight={700} fill="#F2DCC8">
                    不可
                  </text>
                  <text y={28} textAnchor="middle" fontFamily={FONT_CN} fontSize={26} fontWeight={700} fill="#F2DCC8">
                    追回
                  </text>
                </g>
              )}
              {f >= 3400 && <Padlock x={840} y={lockY} s={1} />}
            </g>
            {/* 右：未来 */}
            <g transform={`translate(0 ${(1 - prog(f, 3316, 3342, easeOut)) * -40})`} opacity={prog(f, 3316, 3342)}>
              <circle cx={1300} cy={480} r={330} fill="url(#glowSoft)" />
              <Parchment x={1030} y={180} w={540} h={650} kind="page" />
              <text x={1090} y={262} fontFamily={FONT_CN} fontSize={40} fontWeight={700} letterSpacing="0.14em" fill={C.ink}>
                接下来
              </text>
              <text x={1092} y={306} fontFamily={FONT_CN} fontSize={26} letterSpacing="0.2em" fill="#7A5520">
                时间与精力
              </text>
              <path d="M1090 326 H1510" stroke={C.ink} strokeWidth={1.6} opacity={0.6} />
              <GoldCoin x={1190} y={470} r={58} clock={1} minuteAngle={(f - 3316) * 4} glow={0.2} />
              <Flame x={1410} y={520} f={f} />
              <g fontFamily={FONT_CN} fontSize={24} letterSpacing="0.2em" fill={C.ink} textAnchor="middle">
                <text x={1190} y={572}>
                  时间
                </text>
                <text x={1410} y={572}>
                  精力
                </text>
              </g>
              <path d="M1110 680 H1480" stroke={C.inkSoft} strokeWidth={2} strokeDasharray="3 8" />
              <path d="M1470 670 L1490 680 L1470 690" fill="none" stroke={C.inkSoft} strokeWidth={2} />
              <text x={1110} y={730} fontFamily={FONT_CN} fontSize={22} letterSpacing="0.14em" fill={C.inkSoft}>
                仍未发生，仍可安排
              </text>
            </g>
          </g>
        )}

        {/* ================= S24–S25 ================= */}
        {f >= 3480 && (
          <g transform={`translate(960 540) scale(${lerp(1, 0.9, toBack)}) translate(-960 -540)`}>
            <Doorway f={f} o={doorIn * lerp(1, 0.2, toBack)} />
          </g>
        )}
        {f >= 3630 && (
          <g opacity={scaleIn}>
            {/* 旧票价退居背景 */}
            <g opacity={0.28} transform="translate(250 330) rotate(-4)">
              <Parchment x={0} y={0} w={170} h={200} kind="page" />
              <circle cx={110} cy={140} r={26} fill="url(#waxSeal)" />
              <Padlock x={140} y={34} s={0.4} />
            </g>
            <BrassScale px={960} py={320} angle={ang} arm={250} chain={170} panW={90} height={330} />
            {/* 金粉流：两个未来 → 两个秤盘 */}
            {[
              {from: mapBack([760, 520]), pan: sg.left, seed: "dL"},
              {from: mapBack([1600, 470]), pan: sg.right, seed: "dR"},
            ].map((S, si) => (
              <g key={si}>
                {Array.from({length: 46}, (_, i) => {
                  const t0 = 3652 + rnd(`${S.seed}${i}`) * 70;
                  const t = clamp01((f - t0) / 26);
                  if (t <= 0 || t >= 1) return null;
                  const mid: Pt = [(S.from[0] + S.pan[0]) / 2 + rndSigned(`${S.seed}m${i}`) * 40, Math.min(S.from[1], S.pan[1]) - 140];
                  const p = bezier(S.from, mid, mid, [S.pan[0] + rndSigned(`${S.seed}x${i}`) * 30, S.pan[1] - 6], easeInOut(t));
                  return <circle key={i} cx={p[0]} cy={p[1]} r={2} fill="#E8CA88" opacity={Math.sin(t * Math.PI)} />;
                })}
                <ellipse cx={S.pan[0]} cy={S.pan[1] - 4} rx={42 * prog(f, 3670, 3730)} ry={14 * prog(f, 3670, 3730)} fill="#D9B56E" opacity={0.9} />
              </g>
            ))}
            <g fontFamily={FONT_CN} fontSize={25} letterSpacing="0.1em" textAnchor="middle" fill={C.parchment} opacity={prog(f, 3650, 3672)}>
              <text x={sg.left[0]} y={sg.left[1] + 74}>
                进场 · 此后的得失
              </text>
              <text x={sg.right[0]} y={sg.right[1] + 74}>
                另作安排 · 此后的得失
              </text>
            </g>
          </g>
        )}
      </Stage>
    </AbsoluteFill>
  );
};
