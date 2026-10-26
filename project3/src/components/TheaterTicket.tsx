import React from "react";
import {C, FONT_CN, FONT_LATIN} from "../config/film";
import {TEX} from "./ParchmentPage";
import {clamp01, easeOut} from "../utils/motion";

const ROMAN = ["I", "II", "III", "IV", "V"];

/** 凹印花纹（guilloche 玫瑰线） */
export const Guilloche: React.FC<{cx: number; cy: number; r: number; color?: string; reveal?: number}> = ({cx, cy, r, color = C.copper, reveal = 1}) => {
  const curves = Array.from({length: 7}, (_, k) => {
    const pts: string[] = [];
    for (let i = 0; i <= 240; i++) {
      const th = (i / 240) * Math.PI * 2;
      const rr = r * (0.72 + 0.14 * Math.sin(9 * th + k * 0.45) + 0.06 * Math.sin(3 * th - k));
      pts.push(`${i ? "L" : "M"}${(cx + Math.cos(th) * rr).toFixed(1)} ${(cy + Math.sin(th) * rr).toFixed(1)}`);
    }
    return pts.join(" ") + "Z";
  });
  return (
    <g fill="none" stroke={color} strokeWidth={0.9} opacity={0.75}>
      {curves.map((d, i) => (
        <path key={i} d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(reveal * 1.4 - i * 0.06)} />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.36} strokeWidth={1.2} opacity={reveal} />
      <circle cx={cx} cy={cy} r={r * 0.98} strokeWidth={0.8} opacity={reveal} />
    </g>
  );
};

/** 剧院季票：一张票根贯穿多场演出（5 张副券为示意）。 */
export const TheaterTicket: React.FC<{
  cx: number;
  cy: number;
  w?: number;
  h?: number;
  reveal?: number;
  torn?: number; // 已撕下的副券数（可为小数，表示正在撕）
  border?: number; // 边框粗细：原价/折扣组区分
  dim?: number;
}> = ({cx, cy, w = 900, h = 340, reveal = 1, torn = 0, border = 2.5, dim = 0}) => {
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;
  const body = w * 0.43;
  const stubW = (w - body) / 5;
  const tx = (v: number) => clamp01((reveal - v) / 0.3);
  return (
    <g>
      <g opacity={tx(0)}>
        <image href={TEX.ticket} x={x0 - 6} y={y0 - 6} width={w + 12} height={h + 12} preserveAspectRatio="none" />
      </g>
      {dim > 0 && <rect x={x0 + 4} y={y0 + 4} width={w - 8} height={h - 8} fill="#1a120a" opacity={dim} />}
      {/* 主体文字 */}
      <g opacity={tx(0.25)}>
        <Guilloche cx={x0 + body * 0.27} cy={cy + 4} r={h * 0.3} reveal={easeOut(tx(0.2))} />
        <text x={x0 + body * 0.27} y={cy + 14} textAnchor="middle" fontFamily={FONT_CN} fontSize={h * 0.1} fontWeight={700} fill={C.ink}>
          季
        </text>
        <text x={x0 + body * 0.56} y={y0 + h * 0.3} fontFamily={FONT_LATIN} fontSize={h * 0.052} letterSpacing="0.2em" fill={C.ink}>
          SEASON TICKET
        </text>
        <text x={x0 + body * 0.56} y={y0 + h * 0.52} fontFamily={FONT_CN} fontSize={h * 0.105} fontWeight={700} letterSpacing="0.06em" fill={C.ink}>
          剧院季票
        </text>
        <text x={x0 + body * 0.56} y={y0 + h * 0.68} fontFamily={FONT_CN} fontSize={h * 0.05} letterSpacing="0.1em" fill={C.inkSoft}>
          一季 · 多场演出
        </text>
        <path d={`M${x0 + body * 0.56} ${y0 + h * 0.76} H${x0 + body - 20}`} stroke={C.ink} strokeWidth={1} opacity={0.5} />
      </g>
      {/* 副券 */}
      {ROMAN.map((rn, k) => {
        const sx = x0 + body + k * stubW;
        const tear = clamp01(torn - k);
        const o = tx(0.35 + k * 0.08);
        return (
          <g key={rn} opacity={o}>
            <path d={`M${sx} ${y0 + 10} V${y0 + h - 10}`} stroke={C.ink} strokeWidth={1.6} strokeDasharray="2 6" opacity={0.6} />
            <g
              transform={`translate(${tear * 30} ${tear * 70}) rotate(${tear * 14} ${sx} ${y0 + h})`}
              opacity={1 - tear * 0.85}
            >
              {tear > 0 && <rect x={sx + 2} y={y0 + 4} width={stubW - 4} height={h - 8} fill="#E3CFA4" opacity={0.0} />}
              <text x={sx + stubW / 2} y={cy + 8} textAnchor="middle" fontFamily={FONT_LATIN} fontSize={h * 0.13} fontWeight={600} fill={C.ink}>
                {rn}
              </text>
              <text x={sx + stubW / 2} y={cy + h * 0.2} textAnchor="middle" fontFamily={FONT_CN} fontSize={h * 0.05} fill={C.inkSoft}>
                第 {k + 1} 场
              </text>
            </g>
            {tear > 0.98 && (
              <path
                d={`M${sx + 4} ${y0 + 8} l10 20 l-8 22 l10 24 l-9 26 l9 28 l-8 30 l9 30 l-8 26 l8 30`}
                fill="none"
                stroke={C.copper}
                strokeWidth={1}
                opacity={0.6}
                transform={`scale(1 ${h / 300}) translate(0 ${(y0 * (1 - h / 300)) / (h / 300)})`}
              />
            )}
          </g>
        );
      })}
      {/* 烫金边框 */}
      <g fill="none" opacity={tx(0)}>
        <rect x={x0} y={y0} width={w} height={h} stroke={C.gold} strokeWidth={border} />
        <rect x={x0 + 10} y={y0 + 10} width={w - 20} height={h - 20} stroke={C.gold} strokeWidth={Math.max(0.8, border * 0.45)} opacity={0.8} />
      </g>
    </g>
  );
};

const backdrops = [
  // 0 月
  <g key="moon">
    <path d="M30 -60 A40 40 0 1 0 30 20 A32 32 0 1 1 30 -60 Z" />
  </g>,
  // 1 树
  <g key="tree">
    <path d="M0 60 V-10 M0 0 L-30 -30 M0 -10 L28 -40 M0 20 L-20 0" />
    <circle cx={0} cy={-40} r={40} strokeDasharray="5 5" />
  </g>,
  // 2 柱廊
  <g key="cols">
    <path d="M-80 60 V-40 M-40 60 V-40 M40 60 V-60 M80 60 V-20 M-90 -40 H-30 M30 -60 H90" />
  </g>,
  // 3 帆船
  <g key="ship">
    <path d="M-70 30 H70 L50 55 H-50 Z M0 30 V-60 L50 20 Z M0 -50 L-40 20 H0" />
    <path d="M-110 66 q20 -10 40 0 t40 0 t40 0 t40 0 t40 0" />
  </g>,
  // 4 太阳
  <g key="sun">
    <circle cx={0} cy={-10} r={28} />
    {Array.from({length: 12}, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <line key={i} x1={Math.cos(a) * 38} y1={-10 + Math.sin(a) * 38} x2={Math.cos(a) * 58} y2={-10 + Math.sin(a) * 58} />;
    })}
  </g>,
];

/** 古典剧院模型（线描） */
export const Theater: React.FC<{
  cx: number;
  cy: number;
  s?: number;
  draw?: number;
  light?: number;
  curtain?: number; // 1 = 全开
  show?: number;
  opacity?: number;
}> = ({cx, cy, s = 1, draw = 1, light = 0.8, curtain = 1, show = 0, opacity = 1}) => {
  const ds = (d: number) => ({pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - clamp01(draw * 1.3 - d)});
  const open = curtain;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} opacity={opacity}>
      {/* 舞台光 */}
      <path d="M-180 90 V-90 A180 120 0 0 1 180 -90 V90 Z" fill="url(#stageLight)" opacity={light * clamp01(draw * 2 - 0.6)} />
      <g stroke="#B8A27C" strokeWidth={2} fill="none" opacity={0.75 * light * clamp01(draw * 2 - 0.8)}>
        {backdrops[show % backdrops.length]}
      </g>
      {/* 幕布 */}
      <g fill={C.copper} stroke={C.gold} strokeWidth={1} opacity={0.85 * clamp01(draw * 2 - 0.5)}>
        <path d={`M-180 -90 V90 H${-180 + 180 * (1 - open) + 24} C${-180 + 180 * (1 - open) + 4} 20 ${-180 + 180 * (1 - open) + 30} -40 ${-180 + 180 * (1 - open) + 10} -90 Z`} fillOpacity={0.55} />
        <path d={`M180 -90 V90 H${180 - 180 * (1 - open) - 24} C${180 - 180 * (1 - open) - 4} 20 ${180 - 180 * (1 - open) - 30} -40 ${180 - 180 * (1 - open) - 10} -90 Z`} fillOpacity={0.55} />
        <path d="M-180 -96 Q-150 -70 -120 -96 Q-90 -70 -60 -96 Q-30 -70 0 -96 Q30 -70 60 -96 Q90 -70 120 -96 Q150 -70 180 -96 V-110 H-180 Z" fillOpacity={0.8} />
      </g>
      {/* 建筑线描 */}
      <g stroke={C.gold} fill="none" strokeWidth={2}>
        <path d="M-180 90 V-90 A180 120 0 0 1 180 -90 V90" {...ds(0)} />
        <path d="M-250 150 V-200 H250 V150" {...ds(0.05)} />
        <path d="M-270 -200 L0 -290 L270 -200 Z" {...ds(0.15)} />
        <path d="M-236 140 V-190 M-212 140 V-190 M212 140 V-190 M236 140 V-190" strokeWidth={1.4} {...ds(0.2)} />
        <path d="M-244 -190 H-204 M204 -190 H244 M-244 140 H-204 M204 140 H244" strokeWidth={1.4} {...ds(0.25)} />
        <path d="M-280 150 H280 L300 172 H-300 Z" {...ds(0.3)} />
        <path d="M-180 90 L-230 150 M180 90 L230 150 M-100 90 L-120 150 M100 90 L120 150 M0 90 V150" strokeWidth={1} opacity={0.6} {...ds(0.35)} />
        <circle cx={0} cy={-232} r={22} strokeWidth={1.2} {...ds(0.4)} />
      </g>
      {/* 脚灯 */}
      {Array.from({length: 7}, (_, i) => (
        <circle key={i} cx={-150 + i * 50} cy={96} r={12} fill="url(#glowHot)" opacity={light * 0.7 * clamp01(draw * 2 - 1)} />
      ))}
    </g>
  );
};
