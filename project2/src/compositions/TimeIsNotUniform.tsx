import React from "react";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { SCENES, SCENE_START, TOTAL_FRAMES } from "../config/scenes";
import { Backdrop, GoldParticles, clamp } from "../components/ui";
import { Opening } from "../scenes/Opening";
import { Newton } from "../scenes/Newton";
import { SpecialRelativity } from "../scenes/SpecialRelativity";
import { GeneralRelativity } from "../scenes/GeneralRelativity";
import { AtomicClocks } from "../scenes/AtomicClocks";
import { GPSScene } from "../scenes/GPS";
import { EyeTransition } from "../scenes/EyeTransition";
import { Chronostasis } from "../scenes/Chronostasis";
import { FreeFall } from "../scenes/FreeFall";
import { Memory } from "../scenes/Memory";
import { Ending } from "../scenes/Ending";

const COMPONENTS: Record<string, React.FC> = {
  opening: Opening,
  newton: Newton,
  special: SpecialRelativity,
  general: GeneralRelativity,
  atomic: AtomicClocks,
  gps: GPSScene,
  eye: EyeTransition,
  chronostasis: Chronostasis,
  freefall: FreeFall,
  memory: Memory,
  ending: Ending,
};

export const TimeIsNotUniform: React.FC<{ sfx: boolean }> = ({ sfx }) => {
  const f = useCurrentFrame();
  // 片头的黑场由 Opening 自己控制；之后全片共享一层背景
  const bgO = interpolate(f, [240, 270, TOTAL_FRAMES - 30, TOTAL_FRAMES], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "#09090A" }}>
      <AbsoluteFill style={{ opacity: bgO }}>
        <Backdrop />
        <GoldParticles count={40} seed="global" opacity={0.9} />
      </AbsoluteFill>
      {SCENES.map((s) => {
        const Comp = COMPONENTS[s.id];
        return (
          <Sequence key={s.id} from={SCENE_START[s.id]} durationInFrames={s.duration} name={s.id}>
            <Comp />
          </Sequence>
        );
      })}
      {/* 全部音效已按 src/config/sfxCues.json 合成为一条 stem（scripts/gen_audio.py） */}
      {sfx ? <Audio src={staticFile("sfx/sfx_stem.wav")} /> : null}
    </AbsoluteFill>
  );
};
