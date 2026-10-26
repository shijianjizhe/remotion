import React from "react";
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from "remotion";
import {C, chapters, HEIGHT, WIDTH} from "../config/film";
import {rnd, rndRange} from "../utils/seededRandom";
import {lerp, prog} from "../utils/motion";

/** 每章主光位置/强度（缓慢移动的暖金径向光） */
const lightKeys: {f: number; x: number; y: number; a: number}[] = [
  {f: 0, x: 50, y: 42, a: 0.0},
  {f: 60, x: 50, y: 42, a: 0.14},
  {f: 240, x: 50, y: 46, a: 0.2},
  {f: 450, x: 50, y: 44, a: 0.16},
  {f: 1290, x: 40, y: 50, a: 0.16},
  {f: 2160, x: 50, y: 40, a: 0.17},
  {f: 2970, x: 52, y: 44, a: 0.16},
  {f: 3750, x: 50, y: 46, a: 0.15},
  {f: 4100, x: 50, y: 46, a: 0.18},
  {f: 4200, x: 50, y: 46, a: 0.1},
];

const lightAt = (f: number) => {
  let i = 0;
  while (i < lightKeys.length - 2 && f > lightKeys[i + 1].f) i++;
  const a = lightKeys[i];
  const b = lightKeys[i + 1];
  const t = prog(f, a.f, b.f);
  return {x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), a: lerp(a.a, b.a, t)};
};

export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const L = lightAt(f);
  const breathe = 1 + 0.06 * Math.sin(f / 70);
  // 第三章偏冷一点点（参考片的冷暖交替），仍为暖黑
  const cool = prog(f, chapters.weight.start - 30, chapters.weight.start + 30) * (1 - prog(f, chapters.ticket.start - 30, chapters.ticket.start + 30));
  return (
    <AbsoluteFill
      style={{
        background: [
          `radial-gradient(ellipse 58% 52% at ${L.x}% ${L.y}%, rgba(196,154,87,${(L.a * breathe).toFixed(3)}) 0%, rgba(110,78,40,${(L.a * 0.45).toFixed(3)}) 38%, rgba(9,9,8,0) 72%)`,
          `radial-gradient(ellipse 90% 80% at 50% 45%, rgba(${Math.round(lerp(26, 18, cool))},${Math.round(lerp(20, 19, cool))},${Math.round(lerp(14, 22, cool))},1) 0%, ${C.black} 70%)`,
        ].join(", "),
      }}
    />
  );
};

const N_DUST = 46;
const dust = Array.from({length: N_DUST}, (_, i) => {
  const z = rndRange(`dz${i}`, 0.25, 1);
  return {
    x: rnd(`dx${i}`) * (WIDTH + 200) - 100,
    y: rnd(`dy${i}`) * (HEIGHT + 200) - 100,
    z,
    vx: rndRange(`dvx${i}`, -0.12, 0.18) * z,
    vy: rndRange(`dvy${i}`, -0.22, -0.04) * z,
    size: lerp(1.6, 7, z * z) * (rnd(`ds${i}`) > 0.9 ? 2.2 : 1),
    tw: rndRange(`dt${i}`, 0.02, 0.06),
    ph: rnd(`dp${i}`) * 6.28,
    gold: rnd(`dg${i}`) > 0.4,
  };
});

/** 低密度浮尘：固定种子，按帧解析计算位置（可重复） */
export const DustParticles: React.FC<{intensity?: number}> = ({intensity = 1}) => {
  const f = useCurrentFrame();
  const ramp = prog(f, 10, 80) * (1 - prog(f, 4170, 4200) * 0.6);
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {dust.map((d, i) => {
          const W = WIDTH + 200;
          const H = HEIGHT + 200;
          const x = ((((d.x + d.vx * f + 100) % W) + W) % W) - 100 + Math.sin(f * 0.01 + d.ph) * 12 * d.z;
          const y = ((((d.y + d.vy * f + 100) % H) + H) % H) - 100;
          const tw = 0.55 + 0.45 * Math.sin(f * d.tw + d.ph);
          const op = (0.12 + 0.5 * d.z) * tw * ramp * intensity;
          return <circle key={i} cx={x} cy={y} r={d.size} fill="url(#dust)" opacity={op} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** 胶片颗粒：4 张预生成噪声图逐帧轮换 + 随机偏移，低幅度 overlay */
export const FilmGrain: React.FC = () => {
  const f = useCurrentFrame();
  const idx = f % 4;
  const ox = Math.floor(rnd(`gx${f}`) * 40) - 20;
  const oy = Math.floor(rnd(`gy${f}`) * 40) - 20;
  return (
    <AbsoluteFill style={{mixBlendMode: "overlay", opacity: 0.16, pointerEvents: "none"}}>
      <Img
        src={staticFile(`textures/grain_${idx}.png`)}
        style={{position: "absolute", left: ox - 20, top: oy - 20, width: WIDTH + 40, height: HEIGHT + 40}}
      />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "radial-gradient(ellipse 75% 70% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)",
      pointerEvents: "none",
    }}
  />
);

/** 镜头：缓慢 dolly / 轻 orbit（2.5D 透视） */
export const Camera: React.FC<{
  scale?: number;
  x?: number;
  y?: number;
  rotX?: number;
  rotY?: number;
  rot?: number;
  originX?: number;
  originY?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({scale = 1, x = 0, y = 0, rotX = 0, rotY = 0, rot = 0, originX = 960, originY = 540, children, style}) => (
  <AbsoluteFill style={{perspective: 2200, perspectiveOrigin: `${originX}px ${originY}px`, ...style}}>
    <AbsoluteFill
      style={{
        transformOrigin: `${originX}px ${originY}px`,
        transform: `translate(${x}px, ${y}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotate(${rot}deg) scale(${scale})`,
      }}
    >
      {children}
    </AbsoluteFill>
  </AbsoluteFill>
);

/** 全屏 SVG 画布（1920×1080 坐标） */
export const Stage: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{position: "absolute", inset: 0, overflow: "visible", ...style}}>
    {children}
  </svg>
);
