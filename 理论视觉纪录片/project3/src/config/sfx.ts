import events from "./sfx-events.json";

/** 音效事件（由 scripts/make_sfx_events.mjs 生成；Remotion 预览与 Python 离线混音共用同一份数据） */
export type SfxEvent = {
  file: string;
  startFrame: number;
  durationFrames: number;
  volume: number;
  fadeInFrames: number;
  fadeOutFrames: number;
  pan: number;
  note: string;
};

export const sfxEvents: SfxEvent[] = events as SfxEvent[];
