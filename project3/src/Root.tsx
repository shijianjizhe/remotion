import React from "react";
import {Composition, Sequence, Still} from "remotion";
import {FPS, HEIGHT, TOTAL_FRAMES, WIDTH} from "./config/film";
import {InvisibleCostFilm} from "./InvisibleCostFilm";
import {Poster} from "./Poster";
import "./fonts";

/** 12 秒风格样片：原片 00:04–00:16（玻璃碎裂 → 六枚法郎 → 片名 → 1850 羊皮纸） */
export const PROOF_FROM = 120;
export const PROOF_FRAMES = 12 * FPS;

const StyleProof: React.FC = () => (
  <Sequence from={-PROOF_FROM}>
    <InvisibleCostFilm />
  </Sequence>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="InvisibleCost" component={InvisibleCostFilm} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="StyleProof" component={StyleProof} durationInFrames={PROOF_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Still id="Poster" component={Poster} width={WIDTH} height={HEIGHT} />
  </>
);
