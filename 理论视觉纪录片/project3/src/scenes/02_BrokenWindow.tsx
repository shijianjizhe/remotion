import React from "react";
import {AbsoluteFill, Img, useCurrentFrame} from "remotion";
import {BASTIAT_FR, C, FONT_CN, FONT_LATIN} from "../config/film";
import {Stage} from "../components/Atmosphere";
import {GoldCoin} from "../components/GoldCoin";
import {Parchment, TEX} from "../components/ParchmentPage";
import {Figure, Shoes} from "../components/Figures";
import {bezier, Pt, ptsToPath, resampleMany} from "../utils/geometry";
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog} from "../utils/motion";
import {rnd, rndRange, rndSigned} from "../utils/seededRandom";

const START = 450;
const END = 1300;

// 页面（S05–S06）
const PG = {x: 340, y: 128, w: 1240, h: 710};
const PC: Pt = [960, 483];
// 破碎窗格
const BP = {x0: 770, y0: 470, x1: 900, y1: 580};
const CRACK_C: Pt = [842, 522];
const crackRays = Array.from({length: 8}, (_, i) => {
  const a = (i / 8) * Math.PI * 2 + rndSigned(`cw${i}`) * 0.3;
  const pts: Pt[] = [CRACK_C];
  for (let k = 1; k <= 5; k++) {
    const r = k * 22;
    pts.push([CRACK_C[0] + Math.cos(a + rndSigned(`cw${i}${k}`) * 0.15) * r, CRACK_C[1] + Math.sin(a + rndSigned(`cw${i}${k}b`) * 0.15) * r]);
  }
  return pts;
});

// 两页布局（S07 起）
const SPLIT_S = 0.58;
const LC: Pt = [575, 520];
const RC: Pt = [1345, 520];
const mapTo = (c: Pt, s: number) => (p: Pt): Pt => [c[0] + (p[0] - PC[0]) * s, c[1] + (p[1] - PC[1]) * s];
const mapL = mapTo(LC, SPLIT_S);
const mapR = mapTo(RC, SPLIT_S);

const GLAZIER_STOP = 1190;
const SHOE_AT: Pt = [1160, 796];

// 鞋子轮廓点（用于化灰）：与 <Shoes s=1.6> 的外形一致
const shoeOutline: Pt[] = [[0, 0], [0, -20], [4, -29], [18, -31], [30, -27], [46, -19], [58, -15], [72, -11], [80, -6], [80, 0], [0, 0]];
const shoePts: Pt[] = [
  ...resampleMany([shoeOutline.map(([x, y]) => [SHOE_AT[0] - 20 + x * 1.6, SHOE_AT[1] + y * 1.6] as Pt)], 60),
  ...resampleMany([shoeOutline.map(([x, y]) => [SHOE_AT[0] - 20 + (x - 30) * 1.6, SHOE_AT[1] + (y - 6) * 1.6] as Pt)], 40),
];

const ink = C.ink;

/** 店面线描。mode: actual（实际）/ alt（反事实，灰金虚线） */
const Facade: React.FC<{f: number; mode: "actual" | "alt"; draw: number; repaired: number; glazierX: number; walking: boolean}> = ({
  f,
  mode,
  draw,
  repaired,
  glazierX,
  walking,
}) => {
  const col = mode === "alt" ? "#BCA67E" : ink;
  const dash = 3000;
  const ds = mode === "alt" ? {strokeDasharray: "8 6"} : {strokeDasharray: dash, strokeDashoffset: dash * (1 - draw)};
  const broken = mode === "actual";
  return (
    <g fill="none" stroke={col} strokeWidth={2.2} strokeLinecap="round">
      {/* 地面与建筑 */}
      <path d="M400 800 H1520" style={ds} strokeWidth={1.6} />
      <path d="M540 372 H1140 M550 384 H1130 M580 384 V800 M1100 384 V800" style={ds} />
      <path d="M560 360 L960 336 L1120 360" style={ds} strokeWidth={1.4} opacity={0.7} />
      {/* 招牌 */}
      <rect x={690} y={398} width={300} height={44} style={ds} strokeWidth={1.6} />
      <text x={840} y={429} textAnchor="middle" fontFamily={FONT_LATIN} fontSize={24} letterSpacing="0.22em" fill={col} stroke="none" opacity={draw}>
        J. BONHOMME
      </text>
      {/* 橱窗 */}
      <rect x={640} y={470} width={260} height={220} style={ds} strokeWidth={2.6} />
      <path d="M770 470 V690 M640 580 H900" style={ds} />
      <path d="M626 696 H914" style={ds} strokeWidth={3} />
      {/* 窗内的影线（玻璃） */}
      <g strokeWidth={1} opacity={0.35 * draw}>
        <path d="M652 560 L700 482 M664 570 L716 486 M786 680 L840 592 M660 680 L720 590" />
      </g>
      {/* 门 */}
      <path d="M960 800 V560 A50 50 0 0 1 1060 560 V800" style={ds} />
      <circle cx={1046} cy={690} r={4} fill={col} opacity={draw} />
      {/* 破碎与修复 */}
      {broken && (
        <g>
          <g opacity={(1 - repaired) * draw} strokeWidth={1.3}>
            {crackRays.map((r, i) => (
              <path key={i} d={ptsToPath(r, false)} clipPath="url(#bwPane)" />
            ))}
            <path d="M826 512 L852 506 L860 532 L832 538 Z" strokeWidth={1} />
          </g>
          {/* 修补线：金色沿窗格描出 */}
          {repaired > 0 && (
            <rect
              x={BP.x0 + 3}
              y={BP.y0 + 3}
              width={BP.x1 - BP.x0 - 6}
              height={BP.y1 - BP.y0 - 6}
              stroke={C.gold}
              strokeWidth={2}
              strokeDasharray={460}
              strokeDashoffset={460 * (1 - repaired)}
              opacity={0.9}
            />
          )}
          {repaired >= 1 && (
            <rect x={BP.x0 + 4} y={BP.y0 + 4} width={BP.x1 - BP.x0 - 8} height={BP.y1 - BP.y0 - 8} fill="#E8CA88" stroke="none" opacity={0.18 * Math.max(0, Math.sin(((f - 712) / 40) * Math.PI))} />
          )}
        </g>
      )}
      {/* 屋主 */}
      <Figure x={480} y={800} color={col} hat="top" armOut={mode === "actual" ? prog(f, 636, 652) * (1 - prog(f, 712, 730)) : 0} opacity={draw} dashed={mode === "alt"} />
      {/* 玻璃匠（仅实际世界） */}
      {mode === "actual" && glazierX < 1600 && (
        <Figure x={glazierX} y={800} color={col} hat="cap" carry walk={walking ? (f - 575) * 0.32 : undefined} facing={-1} opacity={clamp01(draw * 1.5)} />
      )}
    </g>
  );
};

/** 账页 */
const LedgerPage: React.FC<{
  f: number;
  title: string;
  sub: string;
  rows: {name: string; value: string; kind: "has" | "none"}[];
  footer: string;
  t0: number;
  ghost?: boolean;
}> = ({f, title, sub, rows, footer, t0, ghost}) => {
  const reveal = (a: number) => {
    const p = prog(f, a, a + 14, easeOut);
    return {
      opacity: p,
      WebkitMaskImage: `linear-gradient(90deg, #000 ${p * 120 - 20}%, transparent ${p * 120}%)`,
      maskImage: `linear-gradient(90deg, #000 ${p * 120 - 20}%, transparent ${p * 120}%)`,
    } as React.CSSProperties;
  };
  return (
    <div style={{position: "absolute", inset: 0, padding: "62px 64px", fontFamily: FONT_CN, color: ink}}>
      <div style={{fontSize: 34, fontWeight: 700, letterSpacing: "0.12em", ...reveal(t0)}}>{title}</div>
      <div style={{fontSize: 21, marginTop: 6, color: C.inkSoft, letterSpacing: "0.1em", ...reveal(t0 + 4)}}>{sub}</div>
      <div style={{height: 2, background: ink, opacity: 0.6, marginTop: 18}} />
      <div style={{height: 1, background: ink, opacity: 0.4, marginTop: 3}} />
      {rows.map((r, i) => (
        <div key={i} style={{display: "flex", alignItems: "baseline", marginTop: 34, fontSize: 32, ...reveal(t0 + 34 + i * 15)}}>
          <span style={{fontWeight: 600}}>{r.name}</span>
          <span style={{flex: 1, borderBottom: `2px dotted ${C.inkSoft}`, margin: "0 14px", opacity: 0.6}} />
          <span
            style={{
              fontWeight: 600,
              color: r.kind === "none" ? C.rust : ghost ? "#7A5520" : ink,
              textDecoration: r.kind === "none" ? "line-through" : undefined,
              borderBottom: r.kind === "has" && ghost && r.name === "鞋" ? `3px solid ${C.gold}` : undefined,
            }}
          >
            {r.value}
          </span>
        </div>
      ))}
      <div style={{position: "absolute", left: 64, right: 64, bottom: 64, ...reveal(t0 + 70)}}>
        <div style={{height: 1, background: ink, opacity: 0.4, marginBottom: 14}} />
        <div style={{fontSize: 26, letterSpacing: "0.06em", color: C.inkSoft}}>{footer}</div>
      </div>
      {/* 竖向红棕边线：账簿格式 */}
      <div style={{position: "absolute", top: 40, bottom: 40, left: 44, width: 1, background: C.rust, opacity: 0.35}} />
    </div>
  );
};

export const BrokenWindowScene: React.FC = () => {
  const f = useCurrentFrame();
  if (f < START || f > END) return null;

  // ---- S05 卷轴展开
  const unroll = prog(f, 462, 516, easeInOut);
  const tilt = lerp(16, 0, prog(f, 452, 520, easeOut));
  const pageIn = prog(f, 456, 470);
  const halfH = (PG.h / 2) * unroll;
  // ---- S06 线描与金币
  const draw = prog(f, 572, 640, easeInOut);
  const textDim = lerp(1, 0.28, prog(f, 566, 600));
  const glazierX = lerp(1560, GLAZIER_STOP, prog(f, 575, 642, (x) => x));
  const walking = f >= 575 && f < 642;
  const coinFly = (k: number) => 652 + k * 9;
  const repaired = clamp01(Array.from({length: 6}, (_, k) => prog(f, coinFly(k) + 12, coinFly(k) + 14)).reduce((a, b) => a + b, 0) / 6);
  // ---- S07 分裂
  const split = prog(f, 722, 770, easeInOut);
  const sA = lerp(1, SPLIT_S, split);
  const cA = [lerp(PC[0], LC[0], split), lerp(PC[1], LC[1], split)];
  const altIn = prog(f, 742, 790);
  const forkIn = prog(f, 772, 812, easeInOut);
  // ---- S08 鞋子消失
  const ash = prog(f, 884, 960, (x) => x);
  const altDim = lerp(1, 0.45, prog(f, 900, 990));
  // ---- S09 账簿
  const drawingsOut = prog(f, 1016, 1036);
  const dropL = prog(f, 1022, 1046, easeOut);
  const dropR = prog(f, 1030, 1054, easeOut);
  // ---- S10 合拢
  const slide = prog(f, 1172, 1194, easeInOut);
  const fold = prog(f, 1192, 1214, easeIn);
  const ledgersVisible = f >= 1020 && f < 1216;
  const sceneOut = 1 - prog(f, 1282, 1300);

  const pageTransform = `translate(${cA[0]} ${cA[1]}) scale(${sA}) translate(${-PC[0]} ${-PC[1]})`;
  const altTransform = `translate(${RC[0]} ${RC[1]}) scale(${SPLIT_S}) translate(${-PC[0]} ${-PC[1]})`;

  // 资金分叉线（屏幕坐标）
  const stackPos: Pt = [960, 238];
  const junction: Pt = [960, 300];
  const toGlazier = mapL([GLAZIER_STOP - 40, 640]);
  const toShoes = mapR([SHOE_AT[0] + 40, SHOE_AT[1] - 40]);
  const solidD = `M${junction[0]} ${junction[1]} C${junction[0] - 120} ${junction[1] + 10} ${toGlazier[0] + 160} ${toGlazier[1] - 200} ${toGlazier[0]} ${toGlazier[1]}`;
  const dashD = `M${junction[0]} ${junction[1]} C${junction[0] + 120} ${junction[1] + 10} ${toShoes[0] - 100} ${toShoes[1] - 260} ${toShoes[0]} ${toShoes[1]}`;
  const dashFade = 1 - prog(f, 890, 940);

  return (
    <AbsoluteFill style={{opacity: sceneOut}}>
      <Stage>
        <defs>
          <clipPath id="bwPane">
            <rect x={BP.x0} y={BP.y0} width={BP.x1 - BP.x0} height={BP.y1 - BP.y0} />
          </clipPath>
          <clipPath id="unrollClip">
            <rect x={PG.x - 40} y={PC[1] - halfH - 20} width={PG.w + 80} height={halfH * 2 + 40} />
          </clipPath>
        </defs>

        {/* ================= 实际世界页（S05–S08） ================= */}
        {f < 1040 && (
          <g opacity={pageIn * (1 - drawingsOut)} transform={pageTransform}>
            <g style={{transform: `perspective(1600px) rotateX(${tilt}deg)`, transformOrigin: "960px 483px"}}>
              <g clipPath="url(#unrollClip)">
                <Parchment x={PG.x} y={PG.y} w={PG.w} h={PG.h} kind="wide" />
                {/* 法文原文衬底（公有领域，1850） */}
                <g opacity={textDim}>
                  <text x={960} y={196} textAnchor="middle" fontFamily={FONT_LATIN} fontSize={30} letterSpacing="0.32em" fill={ink} opacity={0.82}>
                    LA VITRE CASSÉE
                  </text>
                  <path d="M760 214 H1160" stroke={ink} strokeWidth={1} opacity={0.5} />
                  <foreignObject x={420} y={232} width={1080} height={120}>
                    <div
                      style={{
                        fontFamily: FONT_LATIN,
                        fontStyle: "italic",
                        fontSize: 21,
                        lineHeight: 1.45,
                        color: ink,
                        opacity: 0.5,
                        textAlign: "justify",
                      }}
                    >
                      {BASTIAT_FR}
                    </div>
                  </foreignObject>
                </g>
                <Facade f={f} mode="actual" draw={draw} repaired={repaired} glazierX={glazierX} walking={walking} />
                {f > 700 && <text x={1300} y={780} fontFamily={FONT_LATIN} fontStyle="italic" fontSize={22} fill={ink} opacity={0.6 * prog(f, 700, 720)}>6 fr. — payés</text>}
              </g>
              {/* 卷轴两端的圆杆 */}
              {unroll < 1 && (
                <g opacity={1 - prog(f, 510, 520)}>
                  {[PC[1] - halfH - 10, PC[1] + halfH + 10].map((y, i) => (
                    <g key={i}>
                      <rect x={PG.x - 20} y={y - 11} width={PG.w + 40} height={22} rx={11} fill="url(#brassV)" />
                      <rect x={PG.x - 20} y={y - 9} width={PG.w + 40} height={5} rx={3} fill="#FFF0C8" opacity={0.35} />
                    </g>
                  ))}
                </g>
              )}
            </g>
          </g>
        )}

        {/* S06：六枚金币（屏幕层，与页面同坐标） */}
        {f >= 630 && f < 730 &&
          Array.from({length: 6}, (_, k) => {
            const appear = prog(f, 632 + k * 2, 644 + k * 2, easeOut);
            const fly = prog(f, coinFly(k), coinFly(k) + 14, easeInOut);
            const row: Pt = [560 + k * 40, 748];
            const arc = Math.sin(fly * Math.PI) * -120;
            const p: Pt = [lerp(row[0], CRACK_C[0], fly), lerp(row[1], CRACK_C[1], fly) + arc];
            const vanish = prog(f, coinFly(k) + 11, coinFly(k) + 15);
            return (
              <g key={k}>
                <GoldCoin x={p[0]} y={p[1]} r={lerp(16, 7, fly)} spin={fly * 3} opacity={appear * (1 - vanish)} glow={0.3 + fly * 0.5} />
                {vanish > 0 && vanish < 1 && <circle cx={CRACK_C[0]} cy={CRACK_C[1]} r={6 + 26 * vanish} fill="url(#glowHot)" opacity={1 - vanish} />}
              </g>
            );
          })}
        {f >= 632 && f < 660 && (
          <text x={660} y={790} textAnchor="middle" fontFamily={FONT_LATIN} fontStyle="italic" fontSize={22} fill={ink} opacity={prog(f, 636, 646) * (1 - prog(f, 650, 660))}>
            6 francs
          </text>
        )}

        {/* ================= 反事实页（S07–S08） ================= */}
        {f >= 740 && f < 1040 && (
          <g opacity={altIn * altDim * (1 - drawingsOut)} transform={altTransform}>
            {/* 反事实：没有发生的可行世界 —— 暗色半透明“投影页” */}
            <rect x={PG.x + 10} y={PG.y + 10} width={PG.w - 20} height={PG.h - 20} fill="#1A150F" opacity={0.72} />
            <rect x={PG.x + 10} y={PG.y + 10} width={PG.w - 20} height={PG.h - 20} fill="url(#glowSoft)" opacity={0.8} />
            <rect x={PG.x + 26} y={PG.y + 26} width={PG.w - 52} height={PG.h - 52} fill="none" stroke={C.greyGold} strokeWidth={2.4} strokeDasharray="12 9" opacity={0.85} />
            <Facade f={f} mode="alt" draw={1} repaired={1} glazierX={9999} walking={false} />
            {/* 鞋子 + 化灰 */}
            <circle cx={SHOE_AT[0] + 30} cy={SHOE_AT[1] - 20} r={110} fill="url(#glowGold)" opacity={0.7 * (1 - ash)} />
            <Shoes x={SHOE_AT[0] - 20} y={SHOE_AT[1]} color={C.goldHi} s={1.6} opacity={1 - ash} />
            {ash > 0 &&
              shoePts.map((p, i) => {
                const t = clamp01(ash * 1.4 - rnd(`as${i}`) * 0.4);
                const dx = rndSigned(`ax${i}`) * 60 * t + Math.sin(t * 6 + i) * 10;
                const dy = -rndRange(`ay${i}`, 60, 220) * t;
                return <circle key={i} cx={p[0] + dx} cy={p[1] + dy} r={3.6 * (1 - t) + 1.2} fill="#E8CA88" opacity={Math.sin(t * Math.PI) * 0.9} />;
              })}
            {/* 残金 */}
            {ash > 0.6 && <circle cx={SHOE_AT[0] + 40} cy={SHOE_AT[1] - 14} r={14} fill="url(#glowHot)" opacity={0.25 + 0.15 * Math.sin(f / 9)} />}
          </g>
        )}

        {/* 页眉标签 */}
        {f >= 760 && f < 1040 && (
          <g opacity={prog(f, 770, 795) * (1 - drawingsOut)} fontFamily={FONT_CN} fontSize={26} letterSpacing="0.12em">
            <text x={LC[0]} y={760} textAnchor="middle" fill={C.parchment}>
              实际：窗修好了
            </text>
            <text x={RC[0]} y={760} textAnchor="middle" fill={C.greyGold}>
              假如：这笔钱用于鞋子
            </text>
          </g>
        )}

        {/* 同一笔 6 法郎 → 两种互斥用途 */}
        {f >= 768 && f < 1040 && (
          <g opacity={(1 - drawingsOut) * prog(f, 768, 786)}>
            <text x={960} y={196} textAnchor="middle" fontFamily={FONT_CN} fontSize={22} fill={C.greyGold} letterSpacing="0.14em">
              同一笔 6 法郎
            </text>
            {Array.from({length: 6}, (_, k) => (
              <GoldCoin key={k} x={960 + (k - 2.5) * 22} y={stackPos[1]} r={10} spin={0.2 * Math.sin(f / 20 + k)} glow={0.15} />
            ))}
            <path d={`M960 250 V${junction[1] - 16}`} stroke={C.gold} strokeWidth={1.4} />
            <path d={solidD} fill="none" stroke={C.gold} strokeWidth={2} strokeDasharray={700} strokeDashoffset={700 * (1 - forkIn)} />
            <path d={dashD} fill="none" stroke={C.greyGold} strokeWidth={2} strokeDasharray="6 8" opacity={forkIn * dashFade * 0.9} />
            {/* 金币在实线上流向玻璃匠 */}
            {forkIn >= 1 &&
              [0, 1, 2].map((i) => {
                const t = ((f - 812 + i * 22) % 66) / 66;
                const p = bezier(junction, [junction[0] - 120, junction[1] + 10], [toGlazier[0] + 160, toGlazier[1] - 200], toGlazier, t);
                return <circle key={i} cx={p[0]} cy={p[1]} r={4} fill="#F3DDA6" opacity={Math.sin(t * Math.PI) * 0.9} />;
              })}
            <circle cx={junction[0]} cy={junction[1]} r={17} fill="#0E0C0A" stroke={C.gold} strokeWidth={1.2} />
            <text x={junction[0]} y={junction[1] + 7} textAnchor="middle" fontFamily={FONT_CN} fontSize={19} fill={C.goldHi}>
              或
            </text>
          </g>
        )}
      </Stage>

      {/* ================= 账簿（S09–S10，HTML 3D 合拢） ================= */}
      {ledgersVisible && (
        <AbsoluteFill style={{perspective: 1800, perspectiveOrigin: "960px 520px"}}>
          {[
            {c: LC, drop: dropL, side: -1, t0: 1040},
            {c: RC, drop: dropR, side: 1, t0: 1052},
          ].map(({c, drop, side, t0}, i) => {
            const W = 600;
            const H = 660;
            const cx = lerp(c[0], 960 + side * (W / 2), slide);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: cx - W / 2,
                  top: c[1] - H / 2 + 10 - (1 - drop) * 90,
                  width: W,
                  height: H,
                  opacity: drop,
                  transformOrigin: side < 0 ? "100% 50%" : "0% 50%",
                  transform: `rotate(${(1 - drop) * side * 3}deg) rotateY(${side * -90 * fold}deg)`,
                  filter: `brightness(${1 - fold * 0.6})`,
                }}
              >
                <Img src={TEX.page} style={{position: "absolute", inset: 0, width: "100%", height: "100%", filter: "drop-shadow(0 18px 24px rgba(0,0,0,0.6))"}} />
                {i === 0 ? (
                  <LedgerPage
                    f={f}
                    t0={t0}
                    title="实际的世界"
                    sub="窗被打破，钱付给玻璃匠"
                    rows={[
                      {name: "窗", value: "修好了", kind: "has"},
                      {name: "鞋", value: "没有", kind: "none"},
                    ]}
                    footer="6 法郎 → 玻璃匠"
                  />
                ) : (
                  <LedgerPage
                    f={f}
                    t0={t0}
                    ghost
                    title="没有破窗的世界"
                    sub="假如：同一笔钱用于鞋子"
                    rows={[
                      {name: "窗", value: "完好", kind: "has"},
                      {name: "鞋", value: "一双", kind: "has"},
                    ]}
                    footer="6 法郎 → 鞋匠"
                  />
                )}
              </div>
            );
          })}
        </AbsoluteFill>
      )}

      {/* 合拢后的金色缝线 → 交给下一章的金币 */}
      {f >= 1205 && f < 1232 && (
        <Stage>
          <rect x={958} y={190} width={4} height={660} fill={C.goldHi} opacity={prog(f, 1206, 1212) * (1 - prog(f, 1214, 1230))} />
          <rect x={950} y={190} width={20} height={660} fill="url(#glowGold)" opacity={0.6 * (1 - prog(f, 1214, 1230))} />
        </Stage>
      )}

      {/* S10 背景法文小字 */}
      {f >= 1214 && (
        <Stage>
          <g fontFamily={FONT_LATIN} fontSize={30} letterSpacing="0.42em" textAnchor="middle" opacity={0.5 * prog(f, 1218, 1250)}>
            <text x={960} y={300} fill={C.greyGold}>
              CE QU'ON VOIT
            </text>
            <text x={960} y={730} fill={C.copper}>
              CE QU'ON NE VOIT PAS
            </text>
          </g>
        </Stage>
      )}
    </AbsoluteFill>
  );
};
