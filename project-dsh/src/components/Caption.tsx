import React from "react";
import { C, FONT, SAFE, TYPE } from "../config/film";

const splitHi = (text: string, hi?: readonly string[]) => {
  if (!hi || hi.length === 0) return [{ t: text, hot: false }];
  const ranges: { s: number; e: number }[] = [];
  for (const token of hi) {
    let idx = text.indexOf(token);
    while (idx !== -1) {
      ranges.push({ s: idx, e: idx + token.length });
      idx = text.indexOf(token, idx + 1);
    }
  }
  if (ranges.length === 0) return [{ t: text, hot: false }];
  ranges.sort((a, b) => a.s - b.s);
  const merged: { s: number; e: number }[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.s <= last.e) last.e = Math.max(last.e, r.e);
    else merged.push({ ...r });
  }
  const out: { t: string; hot: boolean }[] = [];
  let cursor = 0;
  for (const r of merged) {
    if (r.s > cursor) out.push({ t: text.slice(cursor, r.s), hot: false });
    out.push({ t: text.slice(r.s, r.e), hot: true });
    cursor = r.e;
  }
  if (cursor < text.length) out.push({ t: text.slice(cursor), hot: false });
  return out;
};

/**
 * 底部说明文字：羊皮纸色，关键词局部暖金。
 * 不做描边、不做投影、不做逐字打字机。
 */
export const Caption: React.FC<{
  text: string | null;
  hi?: readonly string[];
  /** 0..1 显现 */
  appear: number;
  /** 0..1 退出（1 = 完全消失） */
  exit?: number;
}> = ({ text, hi, appear, exit = 0 }) => {
  if (!text) return null;
  const opacity = Math.max(0, Math.min(appear, 1 - exit));
  if (opacity <= 0.002) return null;
  const tracking = 3 + 8 * (1 - appear);
  const dy = 9 * (1 - appear) - 6 * exit;

  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        right: 1920 - SAFE.right,
        top: SAFE.captionCenter - TYPE.caption * 0.8,
        textAlign: "center",
        fontFamily: FONT.cjk,
        fontSize: TYPE.caption,
        fontWeight: 500,
        lineHeight: 1.34,
        color: C.parchment,
        letterSpacing: `${tracking}px`,
        opacity,
        transform: `translateY(${dy}px)`,
        textShadow: "0 2px 14px rgba(0,0,0,0.45)",
        whiteSpace: "nowrap",
      }}
    >
      {splitHi(text, hi).map((part, i) => (
        <span
          key={i}
          style={
            part.hot
              ? { color: C.goldHi, fontWeight: 600 }
              : undefined
          }
        >
          {part.t}
        </span>
      ))}
    </div>
  );
};
