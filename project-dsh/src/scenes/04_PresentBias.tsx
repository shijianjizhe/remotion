import React from "react";
import { AbsoluteFill } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { BrassScale, panPositions } from "../components/BrassScale";
import { Camera } from "../components/Camera";
import { CoinAt } from "../components/CoinAt";
import { Glow } from "../components/Glow";
import { TheaterTicket } from "../components/TheaterTicket";
import { C, FONT } from "../config/film";
import { clamp, easeInOut, easeOut, lerp, seg } from "../lib/motion";

const PIVOT = { x: 960, y: 452 };
const S = 1.0;

const PanLabel: React.FC<{
  x: number;
  y: number;
  lines: readonly [string, string];
  opacity?: number;
  highlight?: number;
  roll?: number;
}> = ({ x, y, lines, opacity = 1, highlight = 0, roll = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: x - 150,
      top: y,
      width: 300,
      height: 96,
      overflow: "hidden",
      opacity,
      textAlign: "center",
      fontFamily: FONT.cjk,
    }}
  >
    <div style={{ transform: `translateY(${-roll * 48}px)` }}>
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            height: 48,
            lineHeight: "48px",
            fontSize: 34,
            letterSpacing: "4px",
            color: highlight > 0.4 && i === 0 ? C.goldHi : C.parchment,
            opacity: i === 0 ? 1 : 0,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  </div>
);

const ObjectLabel: React.FC<{ x: number; y: number; text: string; opacity: number }> = ({ x, y, text, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: x - 130,
      top: y,
      width: 260,
      textAlign: "center",
      fontFamily: FONT.cjk,
      fontSize: 21,
      letterSpacing: "4px",
      color: C.grayGold,
      opacity,
    }}
  >
    {text}
  </div>
);

export const PresentBias: React.FC<{ frame: number }> = ({ frame }) => {
  const s16 = frame < 2310;
  const s17 = frame >= 2310 && frame < 2490;
  const s18 = frame >= 2490 && frame < 2700;
  const s19 = frame >= 2700 && frame < 2850;
  const s20 = frame >= 2850;

  const l16 = frame - 2160;
  const l17 = frame - 2310;
  const l18 = frame - 2490;
  const l19 = frame - 2700;
  const l20 = frame - 2850;

  // 进入（承接 S15 右侧的天平）
  const enter = s16 ? easeInOut(seg(l16, 0, 34)) : 1;
  const cx = lerp(1408, PIVOT.x, enter);
  const cy = lerp(664, PIVOT.y, enter);
  const sc = lerp(0.8, S, enter);

  // 倾角：客观 → 偏向现在 → 平移后反弹 → 归零
  let angle: number;
  if (s16) {
    const settle = easeOut(seg(l16, 20, 70));
    angle = 6 * settle + Math.sin(l16 * 0.22) * 2.2 * (1 - settle) * (l16 > 20 ? 1 : 0);
  } else if (s17) {
    angle = lerp(6, -5, easeInOut(seg(l17, 8, 74)));
  } else if (s18) {
    angle = lerp(-5, 4, easeInOut(seg(l18, 34, 96)));
  } else if (s19) {
    angle = lerp(4, 0, easeInOut(seg(l19, 20, 74)));
  } else {
    angle = 0;
  }

  const pans = panPositions(cx, cy, sc, angle);

  // 金币出现
  const coinInL = s16 ? easeOut(seg(l16, 26, 46)) : 1;
  const coinInR = s16 ? easeOut(seg(l16, 32, 52)) : 1;

  // 强调与透视
  const leftHighlight = s17 ? easeInOut(seg(l17, 16, 54)) : s18 ? 1 - easeInOut(seg(l18, 20, 60)) : 0;
  const rightHighlight = s18 ? easeInOut(seg(l18, 56, 100)) : s19 ? 1 - easeInOut(seg(l19, 10, 50)) : 0;
  const rightPerspective = s19 ? 1 - 0.2 * Math.sin(Math.PI * seg(l19, 14, 62)) : 1;
  const flashRing = s19 ? 1 - clamp((l19 - 8) / 26) : 0;

  // 标签：示意选择
  const labelIn = s17 ? easeInOut(seg(l17, 4, 26)) : 1;
  const rollT = s18 ? easeInOut(seg(l18, 20, 58)) : 0;
  const question = s18 ? easeInOut(seg(l18, 70, 106)) : s19 ? 1 - easeInOut(seg(l19, 30, 70)) : 0;

  // S20：两臂合拢 → 扉页烫金边框 → 票券凹印
  const fold = s20 ? easeInOut(seg(l20, 0, 26)) : 0;
  const frameGrow = s20 ? easeOut(seg(l20, 4, 40)) : 0;
  const ticketIn = s20 ? easeOut(seg(l20, 32, 78)) : 0;
  const ticketRotate = s20 ? lerp(-6, -1.2, ticketIn) : 0;

  const camPush = s16 ? lerp(1.02, 1.0, enter) : s17 ? lerp(1.0, 1.05, easeInOut(seg(l17, 0, 180))) : s18 ? lerp(1.05, 1.01, easeInOut(seg(l18, 0, 210))) : s19 ? lerp(1.01, 1.04, easeInOut(seg(l19, 0, 150))) : lerp(1.04, 1.0, easeInOut(seg(l20, 0, 120)));

  return (
    <AbsoluteFill style={{ backgroundColor: C.black }}>
      <Backdrop warm={0.6} wall={0.13} gx={0.5} gy={0.34} spread={1.04} />
      <Glow x={PIVOT.x} y={PIVOT.y + 120} size={1100} opacity={0.1} />

      <Camera scale={camPush}>
        {/* 时间刻度：中轴后的低亮度弧尺 */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - fold * 0.8 }}>
          <g opacity={0.5 * enter}>
            {new Array(25).fill(0).map((_, i) => {
              const a = (-58 + i * 4.8) * (Math.PI / 180);
              const r1 = 176;
              const r2 = i % 6 === 0 ? 208 : 192;
              const g = enter;
              return (
                <line
                  key={i}
                  x1={cx + Math.sin(a) * r1}
                  y1={cy + Math.cos(a) * r1 * 0.9 + 150}
                  x2={cx + Math.sin(a) * r2}
                  y2={cy + Math.cos(a) * r2 * 0.9 + 150}
                  stroke={i % 6 === 0 ? C.gold : C.copper}
                  strokeWidth={i % 6 === 0 ? 1.4 : 0.8}
                  opacity={0.38 * g}
                />
              );
            })}
          </g>
        </svg>

        {/* 天平 */}
        {fold < 1 && (
          <BrassScale
            cx={cx}
            cy={cy}
            s={sc}
            angle={angle}
            progress={1}
            opacity={(1 - fold) * enter}
            tickGlow={leftHighlight + rightHighlight}
            sway={frame * 0.03}
          />
        )}

        {/* 盘上的金币 */}
        {coinInL > 0 && fold < 1 && (
          <>
            <CoinAt
              x={pans.left.x}
              y={pans.left.y - 24 - (1 - coinInL) * 44}
              size={92}
              tilt={0.93 + 0.07 * Math.cos(l16 * 0.06)}
              opacity={coinInL}
              glow={leftHighlight * 0.9}
              shadow={false}
            />
          </>
        )}
        {coinInR > 0 && fold < 1 && (
          <>
            <CoinAt
              x={pans.right.x - 46 * sc * rightPerspective}
              y={pans.right.y - 24}
              size={76 * rightPerspective}
              tilt={0.9 + 0.08 * Math.cos(l16 * 0.055 + 1)}
              opacity={coinInR}
              glow={rightHighlight * 0.85}
              shadow={false}
            />
            <CoinAt
              x={pans.right.x + 46 * sc * rightPerspective}
              y={pans.right.y - 24 - (1 - rightPerspective) * 14}
              size={76 * rightPerspective}
              tilt={0.92 + 0.07 * Math.cos(l16 * 0.05 + 2)}
              opacity={coinInR}
              glow={rightHighlight * 0.85}
              shadow={false}
            />
          </>
        )}

        {/* 左盘暖光加强 / 闪光圆环 */}
        {leftHighlight > 0.01 && fold < 1 && (
          <Glow x={pans.left.x} y={pans.left.y - 10} size={330} opacity={0.3 * leftHighlight} variant="ember" />
        )}
        {flashRing > 0.01 && (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <circle
              cx={pans.left.x}
              cy={pans.left.y - 26}
              r={46 + 60 * (1 - flashRing)}
              fill="none"
              stroke={C.goldHi}
              strokeWidth={2.4}
              opacity={0.75 * flashRing}
            />
          </svg>
        )}
        {rightHighlight > 0.01 && fold < 1 && (
          <Glow x={pans.right.x} y={pans.right.y - 10} size={330} opacity={0.26 * rightHighlight} variant="ember" />
        )}

        {/* 盘下标签 */}
        {labelIn > 0 && fold < 0.6 && (
          <>
            <PanLabel x={pans.left.x} y={pans.left.y + 34} lines={["现在 1 枚", "30 天后 1 枚"]} opacity={labelIn * (1 - fold)} highlight={leftHighlight} roll={rollT} />
            <PanLabel x={pans.right.x} y={pans.right.y + 34} lines={["7 天后 2 枚", "37 天后 2 枚"]} opacity={labelIn * (1 - fold)} highlight={rightHighlight} roll={rollT} />
          </>
        )}

        {/* 问号：不宣称必然翻转 */}
        {question > 0.01 && (
          <div
            style={{
              position: "absolute",
              left: pans.right.x - 40,
              top: pans.right.y - 190,
              width: 80,
              textAlign: "center",
              fontFamily: FONT.latin,
              fontSize: 54,
              color: C.goldHi,
              opacity: question * 0.8,
            }}
          >
            ?
          </div>
        )}

        {/* 时间平移注记 */}
        {s18 && (
          <ObjectLabel x={960} y={210} text="时间整体后移 30 天" opacity={easeInOut(seg(l18, 30, 70)) * 0.8} />
        )}
        {s19 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 232,
              textAlign: "center",
              fontFamily: FONT.cjk,
              fontSize: 26,
              letterSpacing: "6px",
              color: C.grayGold,
              opacity: easeInOut(seg(l19, 46, 84)) * 0.85,
            }}
          >
            同样的间隔 · 同样的奖励
          </div>
        )}

        {/* S20：合拢为烫金边框 → 票券凹印 */}
        {frameGrow > 0 && (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <g opacity={1 - ticketIn * 0.55}>
              <rect
                x={960 - 300 * frameGrow * 1.4}
                y={540 - 130 * frameGrow}
                width={600 * frameGrow * 1.4}
                height={260 * frameGrow}
                fill="none"
                stroke={C.gold}
                strokeWidth={2.6}
                opacity={0.9}
              />
              <rect
                x={960 - 288 * frameGrow * 1.4}
                y={540 - 122 * frameGrow}
                width={576 * frameGrow * 1.4}
                height={244 * frameGrow}
                fill="none"
                stroke={C.copper}
                strokeWidth={1}
                opacity={0.7}
              />
            </g>
          </svg>
        )}
        {ticketIn > 0 && (
          <TheaterTicket
            x={960}
            y={520}
            w={lerp(300, 470, ticketIn)}
            rotate={ticketRotate}
            opacity={ticketIn}
            borderWeight={1.3}
            used={0}
            dim={0.24}
          />
        )}
        {ticketIn > 0.5 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 680,
              textAlign: "center",
              fontFamily: FONT.cjk,
              fontSize: 22,
              letterSpacing: "5px",
              color: C.grayGold,
              opacity: easeInOut(seg(l20, 60, 96)) * 0.9,
            }}
          >
            一张季票 · 六场演出
          </div>
        )}
      </Camera>
    </AbsoluteFill>
  );
};
