import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {C, FONT_CN, FONT_LATIN, TITLE, TITLE_LATIN} from "../config/film";
import {Stage} from "../components/Atmosphere";
import {GoldCoin} from "../components/GoldCoin";
import {circlePts, dist, Pt, resampleMany} from "../utils/geometry";
import {easeIn, easeInOut, easeOut, lerp, prog} from "../utils/motion";
import {rnd, rndSigned} from "../utils/seededRandom";

const START = 3740;
const N = 320;
const CX = 960;
const CY = 480;

// 回忆中的五种形态（全部取自前文物件）
const doorShape = resampleMany(
  [
    [[CX - 140, CY + 190], [CX - 140, CY - 40], ...circlePts(CX, CY - 40, 140, 30, Math.PI, Math.PI * 2).slice(1), [CX + 140, CY + 190]],
    [[CX - 175, CY + 190], [CX + 175, CY + 190]],
  ],
  N,
);
const clockShape = resampleMany(
  [
    circlePts(CX, CY, 170, 60),
    ...Array.from({length: 12}, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return [
        [CX + Math.cos(a) * 130, CY + Math.sin(a) * 130],
        [CX + Math.cos(a) * 158, CY + Math.sin(a) * 158],
      ] as Pt[];
    }),
    [[CX, CY], [CX, CY - 110]],
    [[CX, CY], [CX + 70, CY + 20]],
  ],
  N,
);
const shoeOutline: Pt[] = [[0, 0], [0, -20], [4, -29], [18, -31], [30, -27], [46, -19], [58, -15], [72, -11], [80, -6], [80, 0], [0, 0]];
const shoeShape = resampleMany(
  [shoeOutline.map(([x, y]) => [CX - 150 + x * 3.8, CY + 80 + y * 3.8] as Pt), [[CX - 145, CY + 58], [CX + 150, CY + 58]]],
  N,
);
const shardTris: Pt[][] = Array.from({length: 6}, (_, i) => {
  const c: Pt = [CX + Math.cos(i * 1.05 + 0.3) * 150 * (0.5 + rnd(`es${i}`) * 0.6), CY + Math.sin(i * 1.05 + 0.3) * 120 * (0.5 + rnd(`es2${i}`) * 0.6)];
  const pts: Pt[] = Array.from({length: 3}, (_, k) => {
    const a = (k / 3) * Math.PI * 2 + rndSigned(`ea${i}${k}`) * 0.6;
    const r = 40 + rnd(`er${i}${k}`) * 45;
    return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r];
  });
  return [...pts, pts[0]];
});
const shardShape = resampleMany(shardTris, N);
const spiralShape: Pt[] = Array.from({length: N}, (_, i) => {
  const t = i / N;
  const a = t * Math.PI * 2 * 3.2;
  const r = 14 + t * 230;
  return [CX + Math.cos(a) * r, CY + Math.sin(a) * r * 0.82];
});
const scattered: Pt[] = Array.from({length: N}, (_, i) => [CX + rndSigned(`sx${i}`) * 700, CY + rndSigned(`sy${i}`) * 380]);

const shapes = [scattered, doorShape, clockShape, shoeShape, shardShape, spiralShape];
const keys = [3748, 3768, 3796, 3824, 3852, 3884]; // 每个形态完成的帧
const MORPH = 12;

const pointsAt = (f: number): {pts: Pt[]; idx: number; m: number} => {
  let idx = 0;
  for (let i = 1; i < keys.length; i++) if (f >= keys[i] - MORPH) idx = i;
  const a = shapes[Math.max(0, idx - 1)];
  const b = shapes[idx];
  const m = idx === 0 ? 1 : prog(f, keys[idx] - MORPH, keys[idx], easeInOut);
  return {
    pts: a.map((p, i) => {
      const q = b[i];
      const sw = Math.sin(m * Math.PI) * 22 * rndSigned(`w${i}`);
      return [lerp(p[0], q[0], m) + sw, lerp(p[1], q[1], m) - sw * 0.5] as Pt;
    }),
    idx,
    m,
  };
};

export const EndingScene: React.FC = () => {
  const f = useCurrentFrame();
  if (f < START) return null;

  const {pts, idx, m} = pointsAt(Math.min(f, 3900));
  // S27：螺旋旋转并收束到中心
  const spin = prog(f, 3884, 3960, (x) => x) * 2.4;
  const collapse = prog(f, 3905, 3958, easeIn);
  const ptsOp = prog(f, 3742, 3760) * (1 - prog(f, 3950, 3966));
  const finalPts = pts.map((p) => {
    if (f < 3884) return p;
    const dx = p[0] - CX;
    const dy = (p[1] - CY) / 0.82;
    const r = Math.hypot(dx, dy) * (1 - collapse);
    const a = Math.atan2(dy, dx) + spin;
    return [CX + Math.cos(a) * r, CY + Math.sin(a) * r * 0.82] as Pt;
  });

  // 金币
  const coinIn = prog(f, 3944, 3976, easeOut);
  const pull = prog(f, 4050, 4170, easeInOut);
  const coinR = lerp(lerp(30, 118, coinIn), 92, pull);
  const coinY = lerp(CY, 500, pull);
  const coinSpin = (1 - coinIn) * 1.2 + 0.35 * Math.sin((f - 3976) / 24) * (1 - prog(f, 4050, 4112, easeOut));
  // 第二条路：只亮一下，随后熄灭
  const second = Math.sin(prog(f, 3990, 4030) * Math.PI) * (f < 4010 ? 1 : 1);
  const secondGone = prog(f, 4010, 4040);
  const chosenOp = 0.35 * prog(f, 3970, 3995);
  const titleIn = prog(f, 4074, 4108, easeOut);
  const zoom = lerp(1, 0.93, pull);

  return (
    <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: "960px 500px"}}>
      <Stage>
        {/* 回忆：点阵形态 + 近邻连线 */}
        {ptsOp > 0 && (
          <g opacity={ptsOp}>
            <g stroke={C.gold} strokeWidth={1} opacity={0.45 * (idx > 0 ? 1 - Math.sin(m * Math.PI) * 0.7 : 0)}>
              {finalPts.map((p, i) => {
                if (i === 0) return null;
                const q = finalPts[i - 1];
                if (dist(p, q) > 34) return null;
                return <line key={i} x1={q[0]} y1={q[1]} x2={p[0]} y2={p[1]} />;
              })}
            </g>
            {finalPts.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r={i % 7 === 0 ? 3 : 1.9} fill={i % 5 === 0 ? C.goldHi : C.gold} opacity={0.6 + 0.4 * Math.sin(i + f * 0.2)} />
            ))}
          </g>
        )}
        {/* 金币背后的两条路 */}
        {f >= 3966 && (
          <g fill="none">
            <path d={`M${CX - 120} ${CY + 10} C${CX - 380} ${CY + 30} ${CX - 560} ${CY + 120} 260 ${CY + 170}`} stroke={C.gold} strokeWidth={2} opacity={chosenOp * (1 - pull * 0.6)} />
            <path
              d={`M${CX + 120} ${CY - 10} C${CX + 380} ${CY - 30} ${CX + 560} ${CY - 120} 1660 ${CY - 170}`}
              stroke={C.goldHi}
              strokeWidth={2.4}
              strokeDasharray="10 9"
              opacity={0.9 * second * (1 - secondGone)}
            />
            {secondGone > 0 &&
              secondGone < 1 &&
              Array.from({length: 24}, (_, i) => {
                const t = i / 24;
                const x = lerp(CX + 140, 1640, t);
                const y = CY - 14 - 150 * t * t;
                return <circle key={i} cx={x + rndSigned(`gx${i}`) * 20 * secondGone} cy={y - secondGone * 40 * rnd(`gy${i}`)} r={1.8} fill="#E8CA88" opacity={(1 - secondGone) * 0.8} />;
              })}
          </g>
        )}
        {coinIn > 0 && (
          <g>
            {coinIn < 1 && <circle cx={CX} cy={CY} r={40 + 220 * coinIn} fill="none" stroke="#F3DDA6" strokeWidth={1.5} opacity={1 - coinIn} />}
            <GoldCoin x={CX} y={coinY} r={coinR} spin={coinSpin} glow={0.5 + 0.4 * Math.sin(prog(f, 3950, 4000) * Math.PI)} />
          </g>
        )}
        {/* 片名回归 */}
        {titleIn > 0 && (
          <g opacity={titleIn}>
            <line x1={960 - 300 * titleIn} x2={960 + 300 * titleIn} y1={292} y2={292} stroke={C.gold} strokeWidth={1} opacity={0.6} />
            <text x={960} y={150} textAnchor="middle" fontFamily={FONT_LATIN} fontSize={19} letterSpacing="0.55em" fill={C.greyGold}>
              {TITLE_LATIN}
            </text>
          </g>
        )}
      </Stage>
      {titleIn > 0 && (
        <div
          style={{
            position: "absolute",
            top: 168,
            width: "100%",
            textAlign: "center",
            fontFamily: FONT_CN,
            fontWeight: 700,
            fontSize: 84,
            letterSpacing: `${0.2 + 0.1 * (1 - titleIn)}em`,
            paddingLeft: "0.2em",
            backgroundImage: "linear-gradient(180deg, #F6E2AA 0%, #D9B46C 45%, #A87C3E 78%, #7A5528 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            opacity: titleIn,
            filter: `blur(${(1 - titleIn) * 6}px) drop-shadow(0 0 18px rgba(196,154,87,0.3))`,
          }}
        >
          {TITLE}
        </div>
      )}
    </AbsoluteFill>
  );
};
