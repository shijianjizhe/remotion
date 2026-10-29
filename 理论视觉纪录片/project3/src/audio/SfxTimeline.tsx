import React from "react";
import {Sequence, staticFile} from "remotion";
import {Audio} from "@remotion/media";
import {sfxEvents} from "../config/sfx";

/** 时间线上的全部音效（Studio 预览用；最终成片音轨由同一事件表离线混音，保证与 WAV 一致） */
export const SfxTimeline: React.FC = () => (
  <>
    {sfxEvents.map((e, i) => (
      <Sequence key={i} from={e.startFrame} durationInFrames={e.durationFrames} layout="none" name={`sfx ${e.file}`}>
        <Audio
          src={staticFile(`sfx/${e.file}`)}
          volume={(f) => {
            const fi = e.fadeInFrames > 0 ? Math.min(1, f / e.fadeInFrames) : 1;
            const fo = e.fadeOutFrames > 0 ? Math.min(1, (e.durationFrames - f) / e.fadeOutFrames) : 1;
            return Math.max(0, e.volume * fi * fo);
          }}
        />
      </Sequence>
    ))}
  </>
);
