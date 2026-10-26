import React from "react";
import {AbsoluteFill, Freeze} from "remotion";
import {Background, DustParticles, FilmGrain, Stage, Vignette} from "./components/Atmosphere";
import {GlobalDefs} from "./components/GlobalDefs";
import {GoldCoin} from "./components/GoldCoin";
import {TexturePreloader} from "./components/ParchmentPage";
import {C, FONT_CN, FONT_LATIN, TITLE, TITLE_LATIN} from "./config/film";

/** 封面：沿用片中美术——金币、分岔的两条路（一实一虚）、暗金片名 */
export const Poster: React.FC = () => (
  <AbsoluteFill style={{background: C.black}}>
    <GlobalDefs />
    <TexturePreloader />
    <Freeze frame={4100}>
      <Background />
      <DustParticles intensity={1.2} />
    </Freeze>
    <Stage>
      <g fill="none">
        <path d="M80 760 C500 760 700 700 840 640" stroke={C.gold} strokeWidth={2} opacity={0.55} />
        <path d="M1080 600 C1300 520 1500 480 1840 470" stroke={C.goldHi} strokeWidth={2.4} opacity={0.7} />
        <path d="M1080 680 C1300 740 1500 800 1840 830" stroke={C.greyGold} strokeWidth={2.2} strokeDasharray="9 9" opacity={0.75} />
        <circle cx={1840} cy={830} r={16} fill="url(#glowHot)" opacity={0.35} />
        {/* 精密刻度 */}
        {Array.from({length: 61}, (_, i) => (
          <line key={i} x1={660 + i * 10} x2={660 + i * 10} y1={860} y2={860 - (i % 10 === 0 ? 14 : i % 5 === 0 ? 9 : 5)} stroke={C.gold} strokeWidth={i % 10 === 0 ? 1.2 : 0.8} opacity={0.6} />
        ))}
        <line x1={660} x2={1260} y1={860} y2={860} stroke={C.gold} strokeWidth={1} opacity={0.6} />
      </g>
      <GoldCoin x={960} y={640} r={150} spin={0.18} glow={0.9} />
    </Stage>
    <div style={{position: "absolute", top: 118, width: "100%", textAlign: "center", fontFamily: FONT_LATIN, fontSize: 24, letterSpacing: "0.6em", color: C.greyGold}}>
      {TITLE_LATIN}
    </div>
    <div
      style={{
        position: "absolute",
        top: 168,
        width: "100%",
        textAlign: "center",
        fontFamily: FONT_CN,
        fontWeight: 700,
        fontSize: 132,
        letterSpacing: "0.18em",
        paddingLeft: "0.18em",
        backgroundImage: "linear-gradient(180deg, #F6E2AA 0%, #D9B46C 45%, #A87C3E 78%, #7A5528 100%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        filter: "drop-shadow(0 0 26px rgba(196,154,87,0.35))",
      }}
    >
      {TITLE}
    </div>
    <div style={{position: "absolute", top: 905, width: "100%", textAlign: "center", fontFamily: FONT_CN, fontSize: 30, letterSpacing: "0.32em", color: C.parchment, opacity: 0.85}}>
      机会成本 · 当下偏好 · 沉没成本效应
    </div>
    <div style={{position: "absolute", top: 958, width: "100%", textAlign: "center", fontFamily: FONT_LATIN, fontSize: 21, letterSpacing: "0.3em", color: C.copper}}>
      1850 · BASTIAT &nbsp;—&nbsp; THE COST THAT LEAVES NO RECEIPT
    </div>
    <Vignette />
    <Freeze frame={4100}>
      <FilmGrain />
    </Freeze>
  </AbsoluteFill>
);
