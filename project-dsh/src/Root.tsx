import React from "react";
import { Composition } from "remotion";
import { InvisibleCostFilm, StyleProof } from "./Film";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./config/film";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="InvisibleCost"
      component={InvisibleCostFilm}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    <Composition
      id="StyleProof"
      component={StyleProof}
      durationInFrames={360}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  </>
);
