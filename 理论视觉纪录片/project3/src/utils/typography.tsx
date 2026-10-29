import React from "react";
import {C} from "../config/film";

export type Seg = {text: string; gold: boolean};

/** 解析 `{强调}` 语法为分段 */
export const parseCaption = (s: string): Seg[][] =>
  s.split("\n").map((line) => {
    const out: Seg[] = [];
    const re = /\{([^}]*)\}/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line))) {
      if (m.index > last) out.push({text: line.slice(last, m.index), gold: false});
      out.push({text: m[1], gold: true});
      last = m.index + m[0].length;
    }
    if (last < line.length) out.push({text: line.slice(last), gold: false});
    return out;
  });

export const RichLine: React.FC<{segs: Seg[]; goldColor?: string}> = ({segs, goldColor = "#DDB873"}) => (
  <>
    {segs.map((s, i) => (
      <span key={i} style={s.gold ? {color: goldColor, textShadow: "0 0 18px rgba(196,154,87,0.35)"} : undefined}>
        {s.text}
      </span>
    ))}
  </>
);

/** 汉字计数（用于自动检查每行不超过 20 字） */
export const cjkCount = (s: string) => (s.replace(/[{}]/g, "").match(/[一-鿿]/g) || []).length;

export const textStyles = {
  caption: {
    fontSize: 40,
    fontWeight: 600,
    letterSpacing: "0.06em",
    color: C.parchment,
  },
} as const;
