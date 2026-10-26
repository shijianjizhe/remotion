import React from "react";
import { C, FONT, SAFE, TYPE } from "../config/film";
import { CHAPTERS } from "../config/shots";
import { easeInOut, seg } from "../lib/motion";

/**
 * 左上：年份与人物；右上：文献注记。
 * 位置为本片原创版式（非参考片像素复刻），始终让位于中央主视觉。
 */
export const CornerNotes: React.FC<{ frame: number }> = ({ frame }) => {
  const ch = CHAPTERS.find((c) => frame >= c.start && frame < c.end);
  if (!ch) return null;
  const fadeIn = easeInOut(seg(frame, ch.start + 2, ch.start + 26));
  const fadeOut = easeInOut(seg(frame, ch.end - 26, ch.end - 2));
  const o = Math.min(fadeIn, 1 - fadeOut);
  if (o <= 0.004) return null;
  const dy = 8 * (1 - fadeIn);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: o, transform: `translateY(${dy}px)` }}>
      <div style={{ position: "absolute", left: SAFE.left, top: 74 }}>
        <div
          style={{
            fontFamily: FONT.latin,
            fontSize: 38,
            fontWeight: 500,
            letterSpacing: "7px",
            color: C.gold,
            lineHeight: 1,
          }}
        >
          {ch.year}
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: FONT.cjk,
            fontSize: TYPE.note,
            fontWeight: 400,
            letterSpacing: "3px",
            color: C.grayGold,
          }}
        >
          {ch.who}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 1920 - SAFE.right,
          top: 78,
          textAlign: "right",
          maxWidth: 470,
        }}
      >
        {ch.note?.map((line, i) => (
          <div
            key={i}
            style={{
              fontFamily: FONT.latin,
              fontSize: i === 0 ? 20 : 18,
              fontWeight: 400,
              letterSpacing: "2.6px",
              lineHeight: 1.62,
              color: i === 0 ? C.grayGold : C.copper,
              opacity: i === 0 ? 1 : 0.9,
              fontStyle: i > 0 ? "normal" : "normal",
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {ch.badge && (
        <div
          style={{
            position: "absolute",
            right: 1920 - SAFE.right,
            top: 214,
            padding: "7px 14px 6px",
            border: `1px solid rgba(155,138,112,0.5)`,
            transform: "rotate(-0.7deg)",
            fontFamily: FONT.cjk,
            fontSize: TYPE.tiny,
            letterSpacing: "5px",
            color: C.grayGold,
          }}
        >
          {ch.badge}
        </div>
      )}
    </div>
  );
};
