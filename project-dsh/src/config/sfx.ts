import raw from "./sfx.json";

export type SfxEvent = {
  id: string;
  /** public/sfx 下的文件名 */
  file: string;
  /** 全局起始帧 */
  startFrame: number;
  /** 事件时长（帧） */
  durationFrames: number;
  /** 线性增益 0..1 */
  volume: number;
  fadeInFrames: number;
  fadeOutFrames: number;
  /** 立体声位置 -1..1 */
  pan?: number;
};

export const SFX = raw as {
  sampleRate: number;
  channels: number;
  totalFrames: number;
  fps: number;
  targetPeakDb: number;
  events: SfxEvent[];
};

export const SFX_EVENTS: readonly SfxEvent[] = SFX.events;

/** 供 scripts/mix-sfx.mjs 与 QA 校验共用 */
export const sfxFilesUsed = (): string[] => [...new Set(SFX_EVENTS.map((e) => e.file))].sort();
