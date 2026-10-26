import React, { useId } from "react";
import { C, FONT } from "../config/film";

/**
 * 剧院季票：一张贯穿多场演出的票根（非单次门票）。
 * 凹印版画边框 + 齿孔撕线 + 六场演出记位。
 */
export const TheaterTicket: React.FC<{
  x: number;
  y: number;
  w?: number;
  rotate?: number;
  opacity?: number;
  /** 边框厚度（区分票价高低，不使用虚构数字） */
  borderWeight?: number;
  /** 已消费场次 0..6 */
  used?: number;
  serial?: string;
  label?: string;
  dim?: number;
}> = ({ x, y, w = 420, rotate = 0, opacity = 1, borderWeight = 1, used = 0, serial = "N° 0134", label = "季票", dim = 0 }) => {
  const uid = useId().replace(/:/g, "");
  const h = w * 0.56;
  return (
    <svg
      width={1920}
      height={1080}
      style={{ position: "absolute", inset: 0, opacity }}
    >
      <defs>
        <linearGradient id={`tk${uid}`} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#E5D3AA" />
          <stop offset="52%" stopColor="#D3BE95" />
          <stop offset="100%" stopColor="#B49C74" />
        </linearGradient>
        <linearGradient id={`gb${uid}`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#F1DDB0" />
          <stop offset="50%" stopColor="#BE9455" />
          <stop offset="100%" stopColor="#7E6136" />
        </linearGradient>
      </defs>
      <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${w / 420})`}>
        {/* 票纸 */}
        <rect x={-210} y={-118} width={420} height={236} rx={7} fill={`url(#tk${uid})`} />
        <rect x={-210} y={-118} width={420} height={236} rx={7} fill="none" stroke="#7A5F3A" strokeWidth={1.4} />
        {/* 凹印边框 */}
        <rect
          x={-196}
          y={-104}
          width={392}
          height={208}
          rx={3}
          fill="none"
          stroke={`url(#gb${uid})`}
          strokeWidth={1.6 * borderWeight}
        />
        <rect
          x={-188}
          y={-96}
          width={376}
          height={192}
          rx={2}
          fill="none"
          stroke="#8A6C42"
          strokeWidth={0.8}
        />
        {/* 角饰 */}
        {[
          [-196, -104, 1, 1],
          [196, -104, -1, 1],
          [-196, 104, 1, -1],
          [196, 104, -1, -1],
        ].map(([cx, cy, sx, sy], i) => (
          <path
            key={i}
            d={`M ${cx + 16 * sx} ${cy} L ${cx} ${cy} L ${cx} ${cy + 16 * sy}`}
            fill="none"
            stroke={`url(#gb${uid})`}
            strokeWidth={2 * borderWeight}
          />
        ))}
        {/* 撕线 */}
        <line x1={-118} y1={-108} x2={-118} y2={108} stroke="#8A6C42" strokeWidth={1} strokeDasharray="2 5" opacity={0.85} />
        {/* 票根区文字（竖排感 → 横排小字） */}
        <text x={-142} y={-6} textAnchor="middle" fontFamily={FONT.cjk} fontSize={17} fill="#5B4527" letterSpacing={3}>
          {label}
        </text>
        <text x={-142} y={16} textAnchor="middle" fontFamily={FONT.latin} fontSize={11} fill="#7A5F3A" letterSpacing={2}>
          1985
        </text>
        {/* 主区 */}
        <text x={-92} y={-46} fontFamily={FONT.latin} fontSize={13} fill="#6B5334" letterSpacing={5}>
          SAISON
        </text>
        <text x={-92} y={-8} fontFamily={FONT.cjk} fontSize={26} fill="#3E3222" letterSpacing={4}>
          剧院 · 全季
        </text>
        <text x={-92} y={22} fontFamily={FONT.latin} fontSize={14} fill="#6B5334" letterSpacing={3}>
          SIX PERFORMANCES
        </text>
        {/* 六场记位 */}
        {new Array(6).fill(0).map((_, i) => {
          const on = i < used;
          return (
            <g key={i}>
              <circle cx={-96 + i * 34} cy={62} r={9} fill="none" stroke="#7A5F3A" strokeWidth={1.1} />
              {on && <circle cx={-96 + i * 34} cy={62} r={9} fill="#826142" opacity={0.85} />}
              <text x={-96 + i * 34} y={88} textAnchor="middle" fontFamily={FONT.latin} fontSize={9} fill="#7A5F3A">
                {i + 1}
              </text>
            </g>
          );
        })}
        <text x={196} y={-92} textAnchor="end" fontFamily={FONT.latin} fontSize={12} fill="#6B5334" letterSpacing={2}>
          {serial}
        </text>
        {/* 压印暗部 */}
        <rect x={-210} y={-118} width={420} height={236} rx={7} fill="#3A2E1E" opacity={dim} />
      </g>
    </svg>
  );
};

export const TICKET_W = 420;
export const ticketColor = C.copper;
