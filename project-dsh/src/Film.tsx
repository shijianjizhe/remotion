import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { C } from "./config/film";
import { SHOTS, shotAt } from "./config/shots";
import { Caption } from "./components/Caption";
import { CornerNotes } from "./components/CornerNotes";
import { Dust } from "./components/Dust";
import { GrainAndVignette } from "./components/GrainAndVignette";
import { easeInOut, seg } from "./lib/motion";
import { Opening } from "./scenes/01_Opening";
import { BrokenWindow } from "./scenes/02_BrokenWindow";
import { OpportunityCost } from "./scenes/03_OpportunityCost";
import { PresentBias } from "./scenes/04_PresentBias";
import { SunkCost } from "./scenes/05_SunkCost";
import { Ending } from "./scenes/06_Ending";

const FONT_URL = staticFile("fonts/NotoSerifSC-VF.ttf");

/** 本地打包的思源宋体（SIL OFL）；不经网络。 */
const useFilmFont = () => {
  const [handle] = useState(() => delayRender("loading Noto Serif SC"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `@font-face {
      font-family: 'Noto Serif SC';
      src: url('${FONT_URL}') format('truetype');
      font-weight: 100 900;
      font-style: normal;
      font-display: block;
    }`;
    document.head.appendChild(style);
    const done = () => {
      setReady(true);
      continueRender(handle);
    };
    document.fonts
      .load('700 44px "Noto Serif SC"')
      .then(() => document.fonts.load('400 44px "Noto Serif SC"'))
      .then(() => document.fonts.ready)
      .then(done)
      .catch(done);
  }, [handle]);
  return ready;
};

const Fade: React.FC<{ frame: number }> = ({ frame }) => {
  const fromBlack = 1 - easeInOut(seg(frame, 0, 16));
  const toBlack = easeInOut(seg(frame, 4170, 4199));
  const o = Math.max(fromBlack, toBlack);
  if (o <= 0.001) return null;
  return <AbsoluteFill style={{ backgroundColor: C.black, opacity: o, pointerEvents: "none" }} />;
};

/** 画面内说明文字的出现与退出（每段读完即退，不平挂） */
const Captions: React.FC<{ frame: number }> = ({ frame }) => {
  const shot = shotAt(frame);
  const local = frame - shot.start;
  const len = shot.end - shot.start;
  const inAt = shot.capIn ?? Math.round(len * 0.16);
  const outAt = shot.capOut ?? len - 8;
  const appear = easeInOut(seg(local, inAt, inAt + 16));
  const exit = easeInOut(seg(local, outAt - 10, outAt));
  const o = Math.min(appear, 1 - exit);
  if (!shot.caption) return null;
  return (
    <>
      {/* 说明文字下方的极轻压暗，保证在羊皮纸上也清晰（不做投影描边） */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 260,
          opacity: o * 0.95,
          background:
            "linear-gradient(to top, rgba(9,9,8,0.78) 0%, rgba(9,9,8,0.5) 32%, rgba(9,9,8,0.12) 64%, rgba(9,9,8,0) 100%)",
          pointerEvents: "none",
        }}
      />
      <Caption text={shot.caption} hi={shot.hi} appear={appear} exit={exit} />
    </>
  );
};

export const FilmInner: React.FC<{ frame: number }> = ({ frame }) => {
  const shot = shotAt(frame);
  const scene = useMemo(() => {
    switch (shot.scene) {
      case "opening":
        return <Opening frame={frame} />;
      case "brokenWindow":
        return <BrokenWindow frame={frame} />;
      case "opportunityCost":
        return <OpportunityCost frame={frame} />;
      case "presentBias":
        return <PresentBias frame={frame} />;
      case "sunkCost":
        return <SunkCost frame={frame} />;
      case "ending":
        return <Ending frame={frame} />;
      default:
        return null;
    }
  }, [shot.scene, frame]);

  const dust =
    shot.scene === "opening" || shot.scene === "brokenWindow" || shot.scene === "ending" ? 34 : 26;

  return (
    <AbsoluteFill style={{ backgroundColor: C.black }}>
      {scene}
      <Dust frame={frame} count={dust} seed={11} opacity={0.9} />
      <CornerNotes frame={frame} />
      <Captions frame={frame} />
      <GrainAndVignette phaseKey={shot.start} frame={frame} />
      <Fade frame={frame} />
    </AbsoluteFill>
  );
};

export const InvisibleCostFilm: React.FC = () => {
  const frame = useCurrentFrame();
  useFilmFont();
  return <FilmInner frame={frame} />;
};

/** 12 秒样片：从成片第 4.0 秒（S02）起，重新计时。 */
export const StyleProof: React.FC = () => {
  const frame = useCurrentFrame();
  useFilmFont();
  return <FilmInner frame={frame + 120} />;
};

export const SHOT_COUNT = SHOTS.length;
