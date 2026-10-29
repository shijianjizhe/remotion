import React from "react";
import {C} from "../config/film";

/** 全片共享的 SVG 渐变/裁剪定义（始终挂载，id 唯一）。 */
export const GlobalDefs: React.FC = () => (
  <svg width={0} height={0} style={{position: "absolute"}} aria-hidden>
    <defs>
      {/* 金币正面：主光来自左上 35° */}
      <radialGradient id="coinFace" cx="34%" cy="28%" r="80%">
        <stop offset="0" stopColor="#F7E6B0" />
        <stop offset="0.28" stopColor="#DDB86F" />
        <stop offset="0.62" stopColor="#B08443" />
        <stop offset="1" stopColor="#5E4220" />
      </radialGradient>
      <radialGradient id="coinInner" cx="38%" cy="32%" r="75%">
        <stop offset="0" stopColor="#EED39A" />
        <stop offset="0.5" stopColor="#C49A57" />
        <stop offset="1" stopColor="#7A5A2E" />
      </radialGradient>
      <linearGradient id="coinEdge" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#B58C4E" />
        <stop offset="0.5" stopColor="#6E4F27" />
        <stop offset="1" stopColor="#3A2914" />
      </linearGradient>
      <linearGradient id="coinMotif" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F3DCA0" />
        <stop offset="1" stopColor="#A47A3C" />
      </linearGradient>
      <radialGradient id="glowGold">
        <stop offset="0" stopColor="#E8CA88" stopOpacity="0.55" />
        <stop offset="0.35" stopColor="#C49A57" stopOpacity="0.18" />
        <stop offset="1" stopColor="#C49A57" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="glowHot">
        <stop offset="0" stopColor="#FFF4D6" stopOpacity="0.95" />
        <stop offset="0.2" stopColor="#E8CA88" stopOpacity="0.5" />
        <stop offset="1" stopColor="#C49A57" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="glowSoft">
        <stop offset="0" stopColor="#C49A57" stopOpacity="0.22" />
        <stop offset="1" stopColor="#C49A57" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="dust">
        <stop offset="0" stopColor="#F0DDB0" stopOpacity="1" />
        <stop offset="0.4" stopColor="#E8CA88" stopOpacity="0.35" />
        <stop offset="1" stopColor="#E8CA88" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="interiorLight" cx="50%" cy="58%" r="70%">
        <stop offset="0" stopColor="#E9C27C" stopOpacity="0.5" />
        <stop offset="0.45" stopColor="#8E6532" stopOpacity="0.25" />
        <stop offset="1" stopColor="#2A1C0E" stopOpacity="0.12" />
      </radialGradient>
      <linearGradient id="glassSheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFF3D6" stopOpacity="0" />
        <stop offset="0.42" stopColor="#FFF3D6" stopOpacity="0" />
        <stop offset="0.5" stopColor="#FFF3D6" stopOpacity="0.2" />
        <stop offset="0.58" stopColor="#FFF3D6" stopOpacity="0" />
        <stop offset="1" stopColor="#FFF3D6" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="floorLight" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#C49A57" stopOpacity="0.2" />
        <stop offset="1" stopColor="#C49A57" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="metalBall" cx="35%" cy="30%" r="75%">
        <stop offset="0" stopColor="#F4EBD8" />
        <stop offset="0.3" stopColor="#A89A82" />
        <stop offset="0.8" stopColor="#3C342A" />
        <stop offset="1" stopColor="#15120E" />
      </radialGradient>
      <linearGradient id="brass" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#5E4220" />
        <stop offset="0.35" stopColor="#E3C27E" />
        <stop offset="0.6" stopColor="#B08443" />
        <stop offset="1" stopColor="#4A3418" />
      </linearGradient>
      <linearGradient id="brassV" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#E8CA88" />
        <stop offset="0.5" stopColor="#B08443" />
        <stop offset="1" stopColor="#4A3418" />
      </linearGradient>
      <linearGradient id="panGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#D9B470" />
        <stop offset="1" stopColor="#4A3418" />
      </linearGradient>
      <radialGradient id="stageLight" cx="50%" cy="40%" r="70%">
        <stop offset="0" stopColor="#F2D59A" stopOpacity="0.75" />
        <stop offset="0.5" stopColor="#B07F3E" stopOpacity="0.3" />
        <stop offset="1" stopColor="#3A2612" stopOpacity="0.05" />
      </radialGradient>
      <radialGradient id="waxSeal" cx="38%" cy="32%" r="75%">
        <stop offset="0" stopColor="#A85A48" />
        <stop offset="0.6" stopColor={C.rust} />
        <stop offset="1" stopColor="#41201A" />
      </radialGradient>
      <clipPath id="coinClip">
        <circle cx={0} cy={0} r={100} />
      </clipPath>
    </defs>
  </svg>
);
