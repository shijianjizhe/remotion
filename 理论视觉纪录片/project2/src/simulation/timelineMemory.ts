import { random } from "remotion";

export type Segment = { start: number; end: number };

/**
 * 生成一年 365 天的事件分段（固定 seed）。
 * A：少量边界（日子相似，被记忆合并）；B：较多边界（新事件切分出清晰片段）。
 */
export const buildYear = (kind: "A" | "B"): Segment[] => {
  const n = kind === "A" ? 6 : 22;
  const cuts = new Set<number>();
  let k = 0;
  while (cuts.size < n - 1) {
    const d = 8 + Math.floor(random(`${kind}-cut-${k++}`) * 349);
    cuts.add(d);
  }
  const sorted = [0, ...[...cuts].sort((a, b) => a - b), 365];
  return sorted.slice(0, -1).map((s, i) => ({ start: s, end: sorted[i + 1] }));
};
