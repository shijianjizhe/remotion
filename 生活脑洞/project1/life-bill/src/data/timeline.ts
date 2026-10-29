import timeline from "./timeline.json";

export type SceneId =
  | "hook" | "total" | "sleep" | "work" | "commute" | "phone"
  | "meals" | "chores" | "family" | "summary" | "interact";

export const FPS = timeline.fps;
export const WIDTH = timeline.width;
export const HEIGHT = timeline.height;
/** 每个分类场景内，"扣款"（数字锁定 + 余额扣减）发生的场景内帧 */
export const CHARGE_FRAME = timeline.chargeFrame;

export const SCENES = timeline.scenes as {
  id: SceneId;
  duration: number;
  transitionAfter: number;
}[];

/** 每个场景在总时间轴上的起始帧（已扣除转场重叠） */
export const SCENE_START: Record<SceneId, number> = (() => {
  const out = {} as Record<SceneId, number>;
  let t = 0;
  for (const s of SCENES) {
    out[s.id] = t;
    t += s.duration - s.transitionAfter;
  }
  return out;
})();

export const sceneDuration = (id: SceneId) =>
  SCENES.find((s) => s.id === id)!.duration;

export const TOTAL_FRAMES = SCENES.reduce(
  (acc, s) => acc + s.duration - s.transitionAfter,
  0,
);
