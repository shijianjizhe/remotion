import data from "./scenes.json";

export type SceneId = (typeof data.scenes)[number]["id"];

export const SCENES = data.scenes;

export const SCENE_START: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let t = 0;
  for (const s of data.scenes) {
    out[s.id] = t;
    t += s.duration;
  }
  return out;
})();

export const TOTAL_FRAMES = data.scenes.reduce((a, s) => a + s.duration, 0);
