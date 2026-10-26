import React from "react";
import {AbsoluteFill} from "remotion";
import {Background, DustParticles, FilmGrain, Vignette} from "./components/Atmosphere";
import {DocumentaryFrame} from "./components/DocumentaryFrame";
import {GlobalDefs} from "./components/GlobalDefs";
import {TexturePreloader} from "./components/ParchmentPage";
import {SfxTimeline} from "./audio/SfxTimeline";
import {OpeningScene} from "./scenes/01_Opening";
import {BrokenWindowScene} from "./scenes/02_BrokenWindow";
import {OpportunityCostScene} from "./scenes/03_OpportunityCost";
import {PresentBiasScene} from "./scenes/04_PresentBias";
import {SunkCostScene} from "./scenes/05_SunkCost";
import {EndingScene} from "./scenes/06_Ending";
import {useCurrentFrame} from "remotion";
import {prog} from "./utils/motion";

const FadeToBlack: React.FC = () => {
  const f = useCurrentFrame();
  const o = Math.max(1 - prog(f, 0, 14), prog(f, 4172, 4199));
  return <AbsoluteFill style={{background: "#000", opacity: o}} />;
};

export const InvisibleCostFilm: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => (
  <AbsoluteFill style={{background: "#090908", overflow: "hidden"}}>
    <GlobalDefs />
    <TexturePreloader />
    <Background />
    <DustParticles />
    <OpeningScene />
    <BrokenWindowScene />
    <OpportunityCostScene />
    <PresentBiasScene />
    <SunkCostScene />
    <EndingScene />
    <Vignette />
    <DocumentaryFrame />
    <FilmGrain />
    <FadeToBlack />
    {withAudio && <SfxTimeline />}
  </AbsoluteFill>
);
