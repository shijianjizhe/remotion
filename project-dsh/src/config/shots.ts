import data from "./shots.json";

export type SceneId = "opening" | "brokenWindow" | "opportunityCost" | "presentBias" | "sunkCost" | "ending";

export type Shot = {
  id: string;
  /** 全局起始帧（含） */
  start: number;
  /** 全局结束帧（不含） */
  end: number;
  scene: SceneId;
  /** 画面说明文字，null 表示无字幕 */
  caption: string | null;
  /** 需要以暖金显示的关键词（caption 的子串） */
  hi: readonly string[];
  /** 字幕显现/退出的局部帧偏移（相对镜头起点） */
  capIn: number | null;
  capOut: number | null;
};

export type Chapter = {
  id: string;
  start: number;
  end: number;
  year?: string;
  who?: string;
  note?: readonly string[];
  badge?: string;
};

/** 7. 逐镜头分镜表（时间左闭右开，数据源 src/config/shots.json） */
export const SHOTS: readonly Shot[] = data.shots as Shot[];
export const CHAPTERS: readonly Chapter[] = data.chapters as Chapter[];

export const shotAt = (frame: number): Shot => {
  const found = SHOTS.find((s) => frame >= s.start && frame < s.end);
  return found ?? SHOTS[SHOTS.length - 1];
};
