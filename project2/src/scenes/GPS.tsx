import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { C, H, SERIF, W } from "../config/theme";
import { SceneShell } from "../components/SceneShell";
import { Beats, Burst, Camera, DocumentaryYear, Note, PopText, clamp, prog } from "../components/ui";
import { GPS, gpsOffsetUs, gpsRangeErrKm } from "../simulation/physics";

// 节点 5：卫星 → 地面接收机定位。
// 阶段 A（未校正）：卫星钟每天快约 38 μs，测距误差随时间积累，定位点漂离目标。
// 阶段 B（校正后）：误差收敛回目标点。
const E = { x: 620, y: 600 };
const TARGET = { x: 620, y: 470 };
const A0 = 70;
const A1 = 250;
const B0 = 290;
const B1 = 320;

export const GPSScene: React.FC = () => {
  const f = useCurrentFrame();
  const intro = prog(f, 0, 14);
  const hours = interpolate(f, [A0, A1], [0, 24], clamp);
  const corrected = prog(f, B0, B1);
  const us = gpsOffsetUs(hours) * (1 - corrected);
  const km = gpsRangeErrKm(us);
  const drift = Math.min(km, 11.5) * 24;
  const dir = -0.55;
  const fix = { x: TARGET.x + drift * Math.cos(dir), y: TARGET.y + drift * Math.sin(dir) };
  const ok = corrected > 0.9;

  const sats = [0, 1, 2, 3].map((i) => {
    const a = -Math.PI / 2 + (i - 1.5) * 0.62 + Math.sin(f / 80 + i) * 0.05;
    const r = 430;
    return { x: E.x + r * Math.cos(a), y: E.y + 140 + r * Math.sin(a), a };
  });
  const alarm = f > 160 && f < B0 && Math.floor(f / 8) % 2 === 0;

  return (
    <SceneShell>
      <Camera
        keys={[
          { f: 0, x: 620, y: 300, s: 1.4 },
          { f: 50, x: 900, y: 520, s: 1.0 },
          { f: A1, x: 980, y: 520, s: 1.06 },
          { f: B0, x: 960, y: 520, s: 1.07 },
          { f: B1 + 20, x: 960, y: 540, s: 1.0 },
          { f: 450, x: 960, y: 540, s: 1.04 },
        ]}
        shake={{ at: B0, amp: 6 }}
      >
        <svg width={W} height={H}>
          <defs>
            <radialGradient id="gearth" cx="50%" cy="30%">
              <stop offset="0%" stopColor="#433626" />
              <stop offset="100%" stopColor="#14120f" />
            </radialGradient>
          </defs>
          <g opacity={intro}>
            <path d={`M 100 ${E.y + 240} Q 620 ${E.y - 20} 1140 ${E.y + 240} L 1140 1080 L 100 1080 Z`} fill="url(#gearth)" />
            <path d={`M 100 ${E.y + 240} Q 620 ${E.y - 20} 1140 ${E.y + 240}`} fill="none" stroke={C.copper} strokeWidth={2} />
            <path d={`M 40 ${E.y - 10} Q 620 ${E.y - 580} 1200 ${E.y - 10}`} fill="none" stroke={C.gold} strokeOpacity={0.35} strokeDasharray="4 8" />
            <text x={980} y={250} fill={C.text} fontFamily={SERIF} fontSize={22}>
              轨道高度 ≈ 20,200 km
            </text>
            {sats.map((s, i) => {
              const ph = ((f + i * 11) % 30) / 30;
              return (
                <g key={i}>
                  <line x1={s.x} y1={s.y} x2={fix.x} y2={fix.y} stroke={ok || f < A0 ? C.gold : C.warn} strokeOpacity={0.4} strokeWidth={1.5} />
                  <circle cx={s.x + (fix.x - s.x) * ph} cy={s.y + (fix.y - s.y) * ph} r={4} fill={C.goldHi} />
                  <g transform={`translate(${s.x} ${s.y}) rotate(${(s.a * 180) / Math.PI + 90}) scale(1.4)`}>
                    <rect x={-8} y={-8} width={16} height={16} fill="#2a241b" stroke={C.goldHi} />
                    <rect x={-34} y={-4} width={22} height={8} fill={C.copper} />
                    <rect x={12} y={-4} width={22} height={8} fill={C.copper} />
                  </g>
                  <text x={s.x} y={s.y - 32} textAnchor="middle" fill={C.text} fontFamily={SERIF} fontSize={20}>
                    卫星钟
                  </text>
                </g>
              );
            })}
            <g>
              <circle cx={TARGET.x} cy={TARGET.y} r={14} fill="none" stroke={C.white} strokeWidth={2} />
              <line x1={TARGET.x - 26} x2={TARGET.x + 26} y1={TARGET.y} y2={TARGET.y} stroke={C.white} />
              <line x1={TARGET.x} x2={TARGET.x} y1={TARGET.y - 26} y2={TARGET.y + 26} stroke={C.white} />
              <text x={TARGET.x - 30} y={TARGET.y + 54} textAnchor="end" fill={C.white} fontFamily={SERIF} fontSize={26}>
                你的真实位置
              </text>
            </g>
            {f > A0 ? (
              <g>
                {new Array(12).fill(0).map((_, i) => (
                  <circle
                    key={i}
                    cx={fix.x + (random(`gx${i}`) - 0.5) * (8 + drift * 0.25)}
                    cy={fix.y + (random(`gy${i}`) - 0.5) * (8 + drift * 0.25)}
                    r={2.5}
                    fill={ok ? C.goldHi : C.warn}
                    opacity={0.6}
                  />
                ))}
                <circle cx={fix.x} cy={fix.y} r={10} fill={ok ? C.goldHi : C.warn} />
                {drift > 24 ? (
                  <g>
                    <line x1={TARGET.x} y1={TARGET.y} x2={fix.x} y2={fix.y} stroke={C.warn} strokeWidth={2} strokeDasharray="6 5" />
                    <text x={(TARGET.x + fix.x) / 2 + 10} y={(TARGET.y + fix.y) / 2 + 40} fill={C.warn} fontFamily={SERIF} fontSize={30} fontWeight={600}>
                      偏 {km.toFixed(1)} km
                    </text>
                  </g>
                ) : null}
                <text x={fix.x + 22} y={fix.y - 18} fill={ok ? C.goldHi : C.warn} fontFamily={SERIF} fontSize={26}>
                  {ok ? "定位 ✓" : "导航算出的位置"}
                </text>
              </g>
            ) : null}
            {alarm ? <rect x={TARGET.x - 150} y={TARGET.y - 280} width={300} height={2} fill={C.warn} /> : null}
          </g>
          <Burst x={TARGET.x} y={TARGET.y} at={B0 + 20} r={30} />

          {/* 右侧面板 */}
          <g opacity={prog(f, 20, 40)}>
            <line x1={1230} x2={1230} y1={250} y2={800} stroke={C.faint} />
            <text x={1280} y={290} fill={C.white} fontFamily={SERIF} fontSize={28}>
              卫星钟比地面钟，每天
            </text>
            <g fontFamily={SERIF} fontSize={25}>
              <text x={1280} y={342} fill={C.text}>
                速度效应（狭义）
              </text>
              <text x={1760} y={342} fill={C.white} textAnchor="end">
                约 −{Math.abs(GPS.velocity)} μs
              </text>
              <text x={1280} y={386} fill={C.text}>
                引力效应（广义）
              </text>
              <text x={1760} y={386} fill={C.white} textAnchor="end">
                约 +{GPS.gravity} μs
              </text>
              <line x1={1280} x2={1760} y1={408} y2={408} stroke={C.faint} />
              <text x={1280} y={452} fill={C.goldHi} fontSize={30}>
                净效应
              </text>
              <text x={1760} y={456} fill={C.goldHi} textAnchor="end" fontSize={40} fontWeight={600}>
                约 +{GPS.net} μs
              </text>
            </g>
            <text x={1280} y={540} fill={corrected > 0.5 ? C.goldHi : C.white} fontFamily={SERIF} fontSize={28}>
              {corrected > 0.5 ? "✓ 已做相对论校正" : `✗ 不校正 · 第 ${hours.toFixed(0)} 小时`}
            </text>
            <text x={1280} y={610} fill={C.text} fontFamily={SERIF} fontSize={24}>
              时钟偏差
            </text>
            <text x={1420} y={614} fill={corrected > 0.5 ? C.goldHi : C.white} fontFamily={SERIF} fontSize={56} fontWeight={600}>
              {us.toFixed(1)}
              <tspan fontSize={26} fill={C.text} dx={8}>
                μs
              </tspan>
            </text>
            <text x={1280} y={690} fill={C.text} fontFamily={SERIF} fontSize={24}>
              测距误差
            </text>
            <text x={1420} y={696} fill={corrected > 0.5 ? C.goldHi : C.warn} fontFamily={SERIF} fontSize={66} fontWeight={600}>
              {km.toFixed(1)}
              <tspan fontSize={26} fill={C.text} dx={8}>
                km
              </tspan>
            </text>
          </g>
          <PopText x={1500} y={760} at={A1 - 20} until={B0} size={30} color={C.warn}>
            一天就偏出十多公里
          </PopText>
        </svg>
      </Camera>
      <Note x={1280} y={790} w={560} size={21} o={prog(f, B1, B1 + 15)}>
        典型近似值（Ashby, 2003）；误差按“时钟偏差 × 光速”示意估算
      </Note>
      <DocumentaryYear year="GPS" sub="全球定位系统 · 相对论校正" start={0} end={440} />
      <Beats
        beats={[
          { from: 4, to: 66, text: "天上的每颗卫星，都带着【原子钟】" },
          { from: 70, to: 160, text: "如果【不做】相对论校正……" },
          { from: 164, to: 286, text: "每过一小时，定位就【偏得更远】" },
          { from: B0, to: 350, text: "校正之后：【回到原点】" },
          { from: 354, to: 440, text: "精确定位，离不开【精确时间】", note: "卫星钟发射前就被调慢，抵消相对论效应", final: true },
        ]}
      />
    </SceneShell>
  );
};
