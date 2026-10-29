// remotion-beat-sync.ts | 使用原歌曲绝对时间作为唯一可信时钟
import beatmap from '../data/music-beatmap.json';

export type MusicCue = (typeof beatmap.featuredAccents)[number];
export type MusicBeat = (typeof beatmap.beats)[number];

/** 原音轨时间 -> 当前合成中的帧号；audioStartSec 是所截取音乐片段的起点。 */
export const atFrame = (songTimeSec: number, fps: number, audioStartSec = 0) =>
  Math.round((songTimeSec - audioStartSec) * fps);

export const getCues = (fps: number, audioStartSec: number, durationFrames: number) =>
  beatmap.featuredAccents
    .map((cue) => ({...cue, frame: atFrame(cue.timeSec, fps, audioStartSec)}))
    .filter((cue) => cue.frame >= 0 && cue.frame < durationFrames);

export const getBeatFrames = (fps: number, audioStartSec: number, durationFrames: number) =>
  beatmap.beats
    .map((beat) => ({...beat, frame: atFrame(beat.timeSec, fps, audioStartSec)}))
    .filter((beat) => beat.frame >= 0 && beat.frame < durationFrames);

/** 精确命中帧立刻达到峰值，随后自然回落；不延迟 1 帧。 */
export const impactEnvelope = (frame: number, cueFrame: number, decay = 11) => {
  const delta = frame - cueFrame;
  if (delta < 0 || delta >= decay) return 0;
  const p = 1 - delta / decay;
  return p * p;
};

/** 仅在强点之前蓄力，命中时归零，让瞬间放大更有冲击。 */
export const preImpactEnvelope = (frame: number, cueFrame: number, lead = 10) => {
  const delta = cueFrame - frame;
  if (delta <= 0 || delta > lead) return 0;
  const p = 1 - delta / lead;
  return p * p;
};

export const getCueImpact = (
  frame: number,
  cues: Array<{frame: number; impact: number}>,
  {decay = 10}: {decay?: number} = {},
) => Math.min(1, cues.reduce((max, cue) => Math.max(max,
  (cue.impact / 5) * impactEnvelope(frame, cue.frame, decay)
), 0));
