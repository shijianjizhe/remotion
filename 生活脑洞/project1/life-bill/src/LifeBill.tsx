import React from "react";
import { Audio } from "@remotion/media";
import { linearTiming, springTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FilmFinish } from "./components/Background";
import { Captions } from "./components/Captions";
import { SCENE_START, sceneDuration as d, SCENES } from "./data/timeline";
import { ChoresScene } from "./scenes/ChoresScene";
import { CommuteScene } from "./scenes/CommuteScene";
import { FamilyScene } from "./scenes/FamilyScene";
import { HookScene } from "./scenes/HookScene";
import { InteractScene } from "./scenes/InteractScene";
import { MealsScene } from "./scenes/MealsScene";
import { PhoneScene } from "./scenes/PhoneScene";
import { SleepScene } from "./scenes/SleepScene";
import { SummaryScene } from "./scenes/SummaryScene";
import { TotalScene } from "./scenes/TotalScene";
import { WorkScene } from "./scenes/WorkScene";
import { COLORS } from "./theme";
import { blurZoom, dipToBlack, lightSweep, swipeUp } from "./transitions/presentations";

export type LifeBillProps = {
  showCaptions: boolean;
  musicVolume: number;
};

/** 转场时长统一从 timeline.json 读取，保证与 BGM 生成脚本一致 */
const t = (id: string) => SCENES.find((s) => s.id === id)!.transitionAfter;

const Music: React.FC<{ volume: number }> = ({ volume }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <Audio
      name="BGM"
      src={staticFile("audio/bgm.wav")}
      volume={volume * interpolate(frame, [0, 10, SCENE_START.family - 20, SCENE_START.family + 20, durationInFrames - 30, durationInFrames], [0, 1, 1, 1.45, 1.45, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
    />
  );
};

export const LifeBill: React.FC<LifeBillProps> = ({ showCaptions, musicVolume }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="01 开场钩子" durationInFrames={d("hook")}>
          <HookScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={blurZoom()} timing={linearTiming({ durationInFrames: t("hook") })} />

        <TransitionSeries.Sequence name="02 全年总额" durationInFrames={d("total")}>
          <TotalScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={lightSweep(COLORS.blue)} timing={linearTiming({ durationInFrames: t("total") })} />

        <TransitionSeries.Sequence name="03 睡觉" durationInFrames={d("sleep")}>
          <SleepScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={swipeUp()} timing={linearTiming({ durationInFrames: t("sleep") })} />

        <TransitionSeries.Sequence name="04 上班" durationInFrames={d("work")}>
          <WorkScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={blurZoom()} timing={linearTiming({ durationInFrames: t("work") })} />

        <TransitionSeries.Sequence name="05 通勤" durationInFrames={d("commute")}>
          <CommuteScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={swipeUp()} timing={linearTiming({ durationInFrames: t("commute") })} />

        <TransitionSeries.Sequence name="06 刷手机" durationInFrames={d("phone")}>
          <PhoneScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={blurZoom()} timing={linearTiming({ durationInFrames: t("phone") })} />

        <TransitionSeries.Sequence name="07 吃饭" durationInFrames={d("meals")}>
          <MealsScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={swipeUp()} timing={linearTiming({ durationInFrames: t("meals") })} />

        <TransitionSeries.Sequence name="08 琐事" durationInFrames={d("chores")}>
          <ChoresScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={dipToBlack()} timing={linearTiming({ durationInFrames: t("chores") })} />

        <TransitionSeries.Sequence name="09 陪家人" durationInFrames={d("family")}>
          <FamilyScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={dipToBlack()} timing={linearTiming({ durationInFrames: t("family") })} />

        <TransitionSeries.Sequence name="10 汇总结余" durationInFrames={d("summary")}>
          <SummaryScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: t("summary") })} />

        <TransitionSeries.Sequence name="11 互动" durationInFrames={d("interact")}>
          <InteractScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* 预留：旁白轨。录好配音后放到 public/audio/voiceover.wav 再取消注释 */}
      {/* <Audio name="Voiceover" src={staticFile("audio/voiceover.wav")} /> */}
      <Music volume={musicVolume} />
      {showCaptions ? <Captions /> : null}
      <FilmFinish />
    </AbsoluteFill>
  );
};
