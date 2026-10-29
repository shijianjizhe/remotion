import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {C, FONT_CN, FONT_LATIN, TITLE, TITLE_LATIN} from "../config/film";
import {Stage} from "../components/Atmosphere";
import {GoldCoin} from "../components/GoldCoin";
import {centroid, clipToRect, dist, lerpPt, polyArea, Pt, ptsToPath} from "../utils/geometry";
import {damped, easeIn, easeInOut, easeOut, lerp, prog, timeWarp} from "../utils/motion";
import {rnd, rndRange, rndSigned} from "../utils/seededRandom";

// ------------------------------------------------------------------ 窗户几何
export const WIN = {x0: 660, x1: 1260, top: 120, archCY: 420, bottom: 860, frame: 18};
const PANE = {x0: 966, y0: 426, x1: 1242, y1: 634}; // 被击中的窗格
const P: Pt = [1112, 522]; // 撞击点
const IMPACT = 132;
const RELEASE = 139;

const archPath = (inset: number) => {
  const r = 300 - inset;
  const {x0, x1, archCY, bottom} = WIN;
  return `M${x0 + inset} ${bottom - inset} L${x0 + inset} ${archCY} A${r} ${r} 0 0 1 ${x1 - inset} ${archCY} L${x1 - inset} ${bottom - inset} Z`;
};

// ------------------------------------------------------------------ 裂纹与碎片（固定种子预计算）
const NR = 11;
const BANDS = [0, 26, 64, 112, 420];
const rays = Array.from({length: NR}, (_, i) => (i / NR) * Math.PI * 2 + rndSigned(`ray${i}`) * 0.22);
const V: Pt[][] = rays.map((a, i) =>
  BANDS.map((r, j) => {
    if (j === 0) return P;
    const rr = r * (1 + rndSigned(`vr${i}-${j}`) * 0.18);
    const aa = a + rndSigned(`va${i}-${j}`) * 0.06;
    return [P[0] + Math.cos(aa) * rr, P[1] + Math.sin(aa) * rr] as Pt;
  }),
);
const M: Pt[][] = rays.map((a, i) => {
  const b = i + 1 < NR ? rays[i + 1] : rays[0] + Math.PI * 2;
  return BANDS.map((r, j) => {
    if (j === 0) return P;
    const am = (a + b) / 2 + rndSigned(`ma${i}-${j}`) * 0.08;
    const rr = r * (1.02 + rndSigned(`mr${i}-${j}`) * 0.12);
    return [P[0] + Math.cos(am) * rr, P[1] + Math.sin(am) * rr] as Pt;
  });
});

type Shard = {
  poly: Pt[];
  c: Pt;
  area: number;
  band: number;
  stays: boolean;
  rel: number;
  v: Pt;
  vz: number;
  w: number;
  wf: number;
  seed: string;
};

const shards: Shard[] = [];
for (let i = 0; i < NR; i++) {
  const n = (i + 1) % NR;
  for (let j = 0; j < 4; j++) {
    const raw: Pt[] = j === 0 ? [P, V[i][1], M[i][1], V[n][1]] : [V[i][j], V[i][j + 1], M[i][j + 1], V[n][j + 1], V[n][j], M[i][j]];
    const poly = clipToRect(raw, PANE.x0, PANE.y0, PANE.x1, PANE.y1);
    if (poly.length < 3) continue;
    const area = polyArea(poly);
    if (area < 40) continue;
    const c = centroid(poly);
    const seed = `sh${i}-${j}`;
    const d = dist(c, P) || 1;
    const dir: Pt = [(c[0] - P[0]) / d, (c[1] - P[1]) / d];
    const sp = rndRange(seed + "sp", 5, 12) * (1 + (3 - j) * 0.25);
    shards.push({
      poly,
      c,
      area,
      band: j,
      stays: j === 3 && rnd(seed + "st") < 0.5,
      rel: RELEASE + j * 1.5 + rnd(seed + "rl") * 2,
      v: [dir[0] * sp + rndSigned(seed + "vx") * 2, dir[1] * sp + rndSigned(seed + "vy") * 2 - 2.5],
      vz: rndRange(seed + "vz", 0.004, 0.028),
      w: rndSigned(seed + "w") * 7,
      wf: rndSigned(seed + "wf") * 0.16,
      seed,
    });
  }
}
const flying = shards.filter((s) => !s.stays);
// 六块主要碎片 → 六枚法郎
const main6 = [...flying]
  .filter((s) => s.band >= 1)
  .sort((a, b) => b.area - a.area)
  .slice(0, 6);
const mainIndex = new Map(main6.map((s, k) => [s, k]));

const WARP: [number, number][] = [
  [RELEASE, 1],
  [149, 0.16],
  [240, 0.06],
  [300, 0.03],
];
const W = (f: number) => timeWarp(f, RELEASE, WARP);

const shardState = (s: Shard, f: number) => {
  const tau = Math.max(0, W(f) - W(s.rel));
  const g = 0.09;
  const pos: Pt = [s.c[0] + s.v[0] * tau, s.c[1] + s.v[1] * tau + 0.5 * g * tau * tau];
  const scale = 1 + s.vz * tau;
  const rot = s.w * tau;
  const flip = s.wf * tau;
  return {tau, pos, scale, rot, flip};
};

// 玻璃细屑
const specks = Array.from({length: 70}, (_, i) => {
  const a = rnd(`spa${i}`) * Math.PI * 2;
  const sp = rndRange(`sps${i}`, 6, 22);
  return {v: [Math.cos(a) * sp, Math.sin(a) * sp - 3] as Pt, r: rndRange(`spr${i}`, 0.8, 2.4)};
});

// ------------------------------------------------------------------ 镜头（世界→屏幕）
const camAt = (f: number) => {
  const s1 = lerp(1, 1.05, prog(f, 0, 120, (x) => x));
  const push = prog(f, 118, 205, easeInOut);
  const s = lerp(s1, 1.24, push) + 0.06 * prog(f, 240, 360);
  const F: Pt = lerpPt([960, 500], [1070, 520], push);
  const shake = damped(f - IMPACT, 7, 2.3, 4);
  return {s, F, sx: shake, sy: damped(f - IMPACT, 4, 2.9, 4)};
};
const toScreen = (p: Pt, cam: ReturnType<typeof camAt>): Pt => [
  (p[0] - cam.F[0]) * cam.s + 960 + cam.sx,
  (p[1] - cam.F[1]) * cam.s + 500 + cam.sy,
];

// ------------------------------------------------------------------ 硬币目标
const HEX_C: Pt = [960, 478];
const coinArrive = (k: number) => 288 + k * 4;
const hexPos = (k: number, f: number): Pt => {
  const th = -Math.PI / 2 + (k * Math.PI) / 3 + 0.0045 * Math.max(0, f - 300);
  const R = 230 + 18 * prog(f, 320, 352);
  return [HEX_C[0] + Math.cos(th) * R, HEX_C[1] + Math.sin(th) * R];
};
const rowPos = (k: number): Pt => [960 + (k - 2.5) * 46, 632];

const WindowArt: React.FC<{f: number}> = ({f}) => {
  const appear = prog(f, 4, 78, easeOut);
  const draw = prog(f, 2, 70, easeInOut);
  const interior = prog(f, 16, 105);
  const sheen = ((f * 0.6) % 900) - 300;
  const dash = 4200;
  const lineStyle = {strokeDasharray: dash, strokeDashoffset: dash * (1 - draw)};
  const intactPane = f < RELEASE + 2;
  const panes: [number, number, number, number][] = [
    [678, 426, 954, 634],
    [678, 646, 954, 842],
    [966, 646, 1242, 842],
  ];
  return (
    <g opacity={appear}>
      {/* 室内暖光 */}
      <path d={archPath(18)} fill="url(#interiorLight)" opacity={interior} />
      <circle cx={960} cy={300} r={170} fill="url(#glowGold)" opacity={0.6 * interior} />
      {/* 室内远处：吊灯与桌面（极弱，给空间层次） */}
      <g opacity={0.35 * interior} stroke="#8C6A3C" fill="none" strokeWidth={1.4}>
        <path d="M960 140 V250" />
        <path d="M930 250 h60 l-12 26 h-36 z" fill="#3B2A16" />
        <path d="M720 760 H1200 M760 760 V842 M1160 760 V842" opacity={0.6} />
      </g>
      {/* 地面上的窗光投影 */}
      <path d="M660 876 L1260 876 L1430 1080 L490 1080 Z" fill="url(#floorLight)" opacity={interior} />
      <g opacity={0.5 * interior} fill="#090908">
        <path d="M954 876 L966 876 L992 1080 L928 1080 Z" />
        <path d="M660 876 L1260 876 L1262 890 L658 890 Z" opacity={0.3} />
      </g>
      {/* 玻璃面与扫光 */}
      <g opacity={0.9}>
        {panes.map(([x0, y0, x1, y1], i) => (
          <rect key={i} x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="rgba(232,214,177,0.035)" />
        ))}
        <path d={`M678 414 L678 420 A282 282 0 0 1 1242 420 L1242 414 Z`} fill="rgba(232,214,177,0.03)" />
        <rect x={sheen + 600} y={120} width={500} height={760} fill="url(#glassSheen)" opacity={0.7} clipPath="url(#winClip)" />
        {intactPane && <rect x={PANE.x0} y={PANE.y0} width={PANE.x1 - PANE.x0} height={PANE.y1 - PANE.y0} fill="rgba(232,214,177,0.05)" />}
      </g>
      {/* 窗框：外框/内框双线 + 窗棂 */}
      <g fill="none" stroke={C.gold} style={lineStyle}>
        <path d={archPath(0)} strokeWidth={2.2} />
        <path d={archPath(18)} strokeWidth={1.2} opacity={0.75} />
        <path d={archPath(-14)} strokeWidth={0.8} opacity={0.35} />
        <path d="M954 150 V842 M966 150 V842" strokeWidth={1.2} opacity={0.85} />
        <path d="M678 414 H1242 M678 426 H1242 M678 634 H1242 M678 646 H1242" strokeWidth={1.2} opacity={0.85} />
      </g>
      {/* 窗台 */}
      <g style={lineStyle} fill="none" stroke={C.gold}>
        <path d="M630 860 H1290 V880 H630 Z" strokeWidth={1.6} fill="#15110B" />
        <path d="M650 880 L670 900 H1250 L1270 880" strokeWidth={1} opacity={0.5} />
      </g>
      {/* 顶部拱心石 */}
      <path d="M944 108 L976 108 L970 136 L950 136 Z" fill="none" stroke={C.gold} strokeWidth={1.4} opacity={draw} />
    </g>
  );
};

const Cracks: React.FC<{f: number}> = ({f}) => {
  if (f < IMPACT || f > RELEASE + 8) return null;
  const grow = prog(f, IMPACT, IMPACT + 6, easeOut);
  const fade = 1 - prog(f, RELEASE, RELEASE + 8);
  return (
    <g clipPath="url(#paneClip)" opacity={fade}>
      {V.map((ray, i) => {
        const d = ptsToPath(ray, false);
        return (
          <path key={i} d={d} fill="none" stroke="#FFF1CF" strokeWidth={1.3} strokeDasharray={600} strokeDashoffset={600 * (1 - grow)} opacity={0.9} />
        );
      })}
      {[1, 2, 3].map((j) => {
        const p = prog(f, IMPACT + 1 + j, IMPACT + 4 + j);
        const ring: Pt[] = [];
        for (let i = 0; i < NR; i++) {
          ring.push(V[i][j], M[i][j]);
        }
        return <path key={j} d={ptsToPath(ring)} fill="none" stroke="#F3E2B8" strokeWidth={1} opacity={0.75 * p} />;
      })}
    </g>
  );
};

const ShardShape: React.FC<{s: Shard; flip: number; op: number; glow?: number}> = ({s, flip, op, glow = 0}) => {
  const glint = 0.3 + 0.7 * Math.pow(Math.abs(Math.sin(flip + 0.6)), 4);
  const d = ptsToPath(s.poly.map((q) => [q[0] - s.c[0], q[1] - s.c[1]] as Pt));
  return (
    <g opacity={op}>
      <path d={d} fill={`rgba(236,220,186,${0.06 + 0.16 * glint})`} stroke="#F4E3BC" strokeWidth={1} strokeOpacity={0.35 + 0.6 * glint} />
      {glow > 0 && <path d={d} fill="#E8CA88" opacity={glow} />}
    </g>
  );
};

const TitleCard: React.FC<{f: number}> = ({f}) => {
  if (f < 360) return null;
  const pin = prog(f, 384, 420, easeOut);
  const exit = prog(f, 436, 458, easeIn);
  const sweep = -20 + 140 * prog(f, 384, 422, (x) => x);
  const mask = `linear-gradient(90deg, #000 ${sweep - 20}%, rgba(0,0,0,0) ${sweep + 8}%)`;
  const latin = prog(f, 392, 420);
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - exit,
        transform: `scale(${1 - 0.08 * exit})`,
        filter: exit > 0 ? `blur(${exit * 8}px)` : undefined,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 352,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT_LATIN,
          fontSize: 21,
          letterSpacing: `${0.62 - 0.1 * latin}em`,
          color: C.greyGold,
          opacity: latin * 0.9,
        }}
      >
        {TITLE_LATIN}
      </div>
      <div
        style={{
          position: "absolute",
          top: 398,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT_CN,
          fontWeight: 700,
          fontSize: 112,
          lineHeight: 1.1,
          letterSpacing: `${0.18 + 0.12 * (1 - pin)}em`,
          paddingLeft: "0.18em",
          backgroundImage: "linear-gradient(180deg, #F6E2AA 0%, #D9B46C 45%, #A87C3E 78%, #7A5528 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter: `drop-shadow(0 0 22px rgba(196,154,87,${0.35 * pin})) blur(${(1 - pin) * 6}px)`,
          WebkitMaskImage: pin < 1 ? mask : undefined,
          maskImage: pin < 1 ? mask : undefined,
        }}
      >
        {TITLE}
      </div>
    </AbsoluteFill>
  );
};

export const OpeningScene: React.FC = () => {
  const f = useCurrentFrame();
  if (f > 500) return null;
  const cam = camAt(f);
  const worldT = `translate(${960 + cam.sx} ${500 + cam.sy}) scale(${cam.s}) translate(${-cam.F[0]} ${-cam.F[1]})`;
  const windowFade = 1 - prog(f, 248, 330);
  const titleExit = prog(f, 436, 458, easeIn);

  // 金属球
  const ballT = prog(f, 114, IMPACT, (x) => x);
  const ballIn: Pt = lerpPt([430, 1160], P, ballT);
  const after = prog(f, IMPACT, IMPACT + 14, easeOut);
  const ballPos: Pt = f < IMPACT ? ballIn : lerpPt(P, [1160, 470], after);
  const ballR = f < IMPACT ? lerp(30, 9, ballT) : lerp(9, 4, after);
  const ballOp = f < 114 ? 0 : f < IMPACT ? 1 : 1 - after;

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <clipPath id="paneClip">
            <rect x={PANE.x0} y={PANE.y0} width={PANE.x1 - PANE.x0} height={PANE.y1 - PANE.y0} />
          </clipPath>
          <clipPath id="winClip">
            <path d={archPath(18)} />
          </clipPath>
        </defs>
        {/* ---------------- 世界层 ---------------- */}
        <g transform={worldT}>
          <g opacity={windowFade}>
            <WindowArt f={f} />
            <Cracks f={f} />
            {/* 留在窗框上的碎玻璃 */}
            {f >= RELEASE &&
              shards
                .filter((s) => s.stays)
                .map((s) => (
                  <g key={s.seed} transform={`translate(${s.c[0]} ${s.c[1]})`}>
                    <ShardShape s={s} flip={0.4} op={0.9} />
                  </g>
                ))}
          </g>
          {/* 撞击闪光 */}
          {f >= IMPACT && f < IMPACT + 12 && (
            <circle cx={P[0]} cy={P[1]} r={20 + 130 * prog(f, IMPACT, IMPACT + 10, easeOut)} fill="url(#glowHot)" opacity={1 - prog(f, IMPACT, IMPACT + 12)} />
          )}
          {/* 金属球 + 运动模糊残影 */}
          {ballOp > 0 &&
            [0.36, 0.24, 0.12, 0].map((lag, i) => {
              const tt = Math.max(0, ballT - lag * 0.25);
              const pp = f < IMPACT ? lerpPt([430, 1160], P, tt) : ballPos;
              return (
                <circle
                  key={i}
                  cx={pp[0]}
                  cy={pp[1]}
                  r={f < IMPACT ? lerp(30, 9, tt) : ballR}
                  fill="url(#metalBall)"
                  opacity={ballOp * (i === 3 ? 1 : 0.15)}
                />
              );
            })}
          {/* 玻璃细屑 */}
          {f >= IMPACT &&
            specks.map((s, i) => {
              const tau = Math.max(0, W(f) + (f < RELEASE ? (f - IMPACT) * 0.5 : 3.5));
              const op = (1 - prog(f, 200, 300)) * (0.5 + 0.5 * Math.sin(i + f * 0.3));
              return (
                <circle key={i} cx={P[0] + s.v[0] * tau} cy={P[1] + s.v[1] * tau + 0.04 * tau * tau} r={s.r} fill="#FFF0CC" opacity={op * 0.8} />
              );
            })}
          {/* 飞散碎片（非主碎片） */}
          {f >= RELEASE &&
            flying.map((s) => {
              if (mainIndex.has(s)) return null;
              const st = shardState(s, f);
              const dissolve = prog(f, 252 + rnd(s.seed + "d") * 30, 300 + rnd(s.seed + "d2") * 20);
              const op = f < s.rel ? 0 : 1 - dissolve;
              const trail = f < 156 && f >= s.rel;
              const prev = shardState(s, f - 3).pos;
              return (
                <g key={s.seed}>
                  {trail && (
                    <line x1={prev[0]} y1={prev[1]} x2={st.pos[0]} y2={st.pos[1]} stroke="#F4E3BC" strokeWidth={2} opacity={0.35 * (1 - prog(f, 146, 156))} />
                  )}
                  {op > 0.01 && (
                    <g transform={`translate(${st.pos[0]} ${st.pos[1]}) rotate(${st.rot}) scale(${st.scale * Math.max(0.08, Math.abs(Math.cos(st.flip)))} ${st.scale})`}>
                      <ShardShape s={s} flip={st.flip} op={op} />
                    </g>
                  )}
                  {/* 化尘：碎片顶点变为光点漂散 */}
                  {dissolve > 0 &&
                    dissolve < 1 &&
                    s.poly.slice(0, 4).map((q, k) => {
                      const dx = (q[0] - s.c[0]) * st.scale;
                      const dy = (q[1] - s.c[1]) * st.scale;
                      const spread = 1 + dissolve * 2.5;
                      return (
                        <circle
                          key={k}
                          cx={st.pos[0] + dx * spread}
                          cy={st.pos[1] + dy * spread - dissolve * 30}
                          r={1.6}
                          fill="#E8CA88"
                          opacity={Math.sin(dissolve * Math.PI) * 0.8}
                        />
                      );
                    })}
                </g>
              );
            })}
        </g>

        {/* ---------------- 屏幕层：主碎片 → 六枚金币 ---------------- */}
        <g opacity={1 - titleExit}>
          {/* 中心光环 */}
          {f > 312 && (
            <g opacity={prog(f, 315, 350) * (1 - prog(f, 372, 410))}>
              <circle cx={HEX_C[0]} cy={HEX_C[1]} r={170} fill="url(#glowSoft)" />
              <circle cx={HEX_C[0]} cy={HEX_C[1]} r={158} fill="none" stroke={C.gold} strokeWidth={1} opacity={0.55} strokeDasharray={`${990 * prog(f, 315, 352)} 2000`} transform={`rotate(-90 ${HEX_C[0]} ${HEX_C[1]})`} />
              <circle cx={HEX_C[0]} cy={HEX_C[1]} r={172} fill="none" stroke={C.copper} strokeWidth={0.8} opacity={0.4} />
            </g>
          )}
          {main6.map((s) => {
            const k = mainIndex.get(s)!;
            if (f < s.rel) return null;
            const st = shardState(s, Math.min(f, 250));
            const wScreen = toScreen(st.pos, cam);
            const go = prog(f, 250 + k * 3, coinArrive(k), easeInOut);
            const target = hexPos(k, f);
            const pos = lerpPt(wScreen, target, go);
            const sc = cam.s * st.scale * lerp(1, 0.55, go);
            const arrive = coinArrive(k);
            const shardOp = 1 - prog(f, arrive - 4, arrive + 6);
            const coinP = prog(f, arrive - 2, arrive + 16, easeOut);
            // 金币阶段
            const isCenter = k === 0;
            const grow = isCenter ? prog(f, 318, 352, easeInOut) : 0;
            const toRow = prog(f, 350 + k * 3, 382 + k * 3, easeInOut);
            let cpos = lerpPt(target, HEX_C, grow);
            let r = lerp(44, 84, grow) * (isCenter ? 1 : lerp(1, 0.86, prog(f, 320, 352)));
            cpos = lerpPt(cpos, rowPos(k), toRow);
            r = lerp(r, 15, toRow);
            const flash = prog(f, arrive - 2, arrive + 10);
            return (
              <g key={s.seed}>
                {shardOp > 0 && (
                  <g transform={`translate(${pos[0]} ${pos[1]}) rotate(${st.rot * (1 - go)}) scale(${sc * Math.max(0.1, Math.abs(Math.cos(st.flip * (1 - go))))} ${sc})`}>
                    <ShardShape s={s} flip={st.flip} op={shardOp} glow={0.5 * go} />
                  </g>
                )}
                {flash > 0 && flash < 1 && (
                  <circle cx={target[0]} cy={target[1]} r={20 + 70 * flash} fill="none" stroke="#F3DDA6" strokeWidth={1.5} opacity={1 - flash} />
                )}
                {coinP > 0 && (
                  <GoldCoin
                    x={cpos[0]}
                    y={cpos[1]}
                    r={r}
                    spin={(1 - coinP) * (Math.PI / 2) + 0.25 * Math.sin((f - arrive) / 26 + k) * (1 - toRow)}
                    glow={lerp(0.9 * (1 - coinP) + 0.35 + 0.4 * grow, 0.15, toRow)}
                    opacity={Math.min(1, coinP * 1.5)}
                  />
                )}
              </g>
            );
          })}
          {/* 片名卡：精密刻度与分岔细线 */}
          {f >= 360 && (
            <g opacity={1 - prog(f, 436, 456)}>
              <g stroke={C.gold} opacity={0.75}>
                {Array.from({length: 83}, (_, i) => {
                  const x = 960 + (i - 41) * 10;
                  const reveal = prog(f, 366 + Math.abs(i - 41) * 0.7, 380 + Math.abs(i - 41) * 0.7);
                  const h = i % 10 === 1 ? 14 : i % 5 === 1 ? 9 : 5;
                  return <line key={i} x1={x} x2={x} y1={590} y2={590 - h} strokeWidth={i % 10 === 1 ? 1.2 : 0.8} opacity={reveal} />;
                })}
                <line x1={960 - 410 * prog(f, 364, 395)} x2={960 + 410 * prog(f, 364, 395)} y1={590} y2={590} strokeWidth={1} />
              </g>
              {/* 背景纤细分岔：一条实线，一条虚线 */}
              <g fill="none" strokeWidth={1} opacity={0.32 * prog(f, 380, 430)}>
                <path d="M120 700 C520 700 700 700 900 700" stroke={C.gold} strokeDasharray={900} strokeDashoffset={900 * (1 - prog(f, 380, 420))} />
                <path d="M900 700 C1150 700 1350 640 1800 600" stroke={C.gold} strokeDasharray={1000} strokeDashoffset={1000 * (1 - prog(f, 405, 440))} />
                <path d="M900 700 C1150 700 1350 760 1800 800" stroke={C.greyGold} strokeDasharray="5 7" opacity={prog(f, 412, 440)} />
              </g>
            </g>
          )}
        </g>
      </Stage>
      <TitleCard f={f} />
    </AbsoluteFill>
  );
};
