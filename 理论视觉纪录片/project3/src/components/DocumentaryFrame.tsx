import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {C, cornerLabels, FONT_CN, FONT_LATIN, illustrativeBadges, shots} from "../config/film";
import {clamp01, easeOut, prog} from "../utils/motion";
import {parseCaption, RichLine} from "../utils/typography";

const CAPTION_IN = 20;
const CAPTION_OUT = 14;

/** 底部说明：遮罩扫入 + 模糊变清 + 字距收拢；读完退出 */
const Caption: React.FC<{text: string; inAt: number; outAt: number}> = ({text, inAt, outAt}) => {
  const f = useCurrentFrame();
  if (f < inAt || f > outAt) return null;
  const pin = prog(f, inAt, inAt + CAPTION_IN, easeOut);
  const pout = prog(f, outAt - CAPTION_OUT, outAt);
  const sweep = -20 + 140 * prog(f, inAt, inAt + CAPTION_IN + 4, (x) => x);
  const lines = parseCaption(text);
  const blur = (1 - pin) * 7 + pout * 5;
  const mask = `linear-gradient(90deg, #000 ${sweep - 18}%, rgba(0,0,0,0) ${sweep + 6}%)`;
  return (
    <div
      style={{
        position: "absolute",
        left: 110,
        right: 110,
        bottom: 1080 - 952,
        textAlign: "center",
        fontFamily: FONT_CN,
        fontSize: 40,
        fontWeight: 600,
        lineHeight: 1.42,
        color: C.parchment,
        letterSpacing: `${0.06 + 0.06 * (1 - pin)}em`,
        opacity: (1 - pout) * clamp01(pin * 1.4),
        filter: `blur(${blur.toFixed(2)}px)`,
        transform: `translateY(${(1 - pin) * 8 - pout * 6}px)`,
        WebkitMaskImage: pin < 1 ? mask : undefined,
        maskImage: pin < 1 ? mask : undefined,
        textShadow: "0 2px 14px rgba(0,0,0,0.9)",
      }}
    >
      {lines.map((segs, i) => (
        <div key={i}>
          <RichLine segs={segs} />
        </div>
      ))}
    </div>
  );
};

/** 年份逐字滚入 */
const RollText: React.FC<{text: string; p: number; size: number; family: string}> = ({text, p, size, family}) => (
  <div style={{display: "flex", fontFamily: family, fontSize: size, lineHeight: 1, height: size * 1.05, overflow: "hidden"}}>
    {text.split("").map((ch, i) => {
      const q = clamp01(p * 1.6 - i * 0.15);
      const e = easeOut(q);
      return (
        <span
          key={i}
          style={{
            display: "inline-block",
            transform: `translateY(${(1 - e) * size * 0.9}px)`,
            opacity: e,
            filter: `blur(${(1 - e) * 4}px)`,
          }}
        >
          {ch}
        </span>
      );
    })}
  </div>
);

const Corner: React.FC<{i: number}> = ({i}) => {
  const f = useCurrentFrame();
  const L = cornerLabels[i];
  if (f < L.from || f > L.to) return null;
  const pin = prog(f, L.from, L.from + 36, (x) => x);
  const out = 1 - prog(f, L.to - 18, L.to);
  const isNumeral = /^\d+$/.test(L.big);
  const line = easeOut(clamp01((pin - 0.25) / 0.6));
  const small = easeOut(clamp01((pin - 0.45) / 0.55));
  const refP = easeOut(prog(f, L.from + 12, L.from + 50, (x) => x));
  return (
    <>
      <div style={{position: "absolute", left: 112, top: 66, opacity: out}}>
        <div
          style={{
            color: "#D7B26C",
            textShadow: "0 0 24px rgba(196,154,87,0.35)",
            letterSpacing: isNumeral ? "0.06em" : "0.1em",
            fontWeight: isNumeral ? 500 : 600,
          }}
        >
          <RollText text={L.big} p={pin} size={isNumeral ? 64 : 54} family={isNumeral ? FONT_LATIN : FONT_CN} />
        </div>
        <div
          style={{
            marginTop: 10,
            width: 300,
            height: 1,
            background: "linear-gradient(90deg, rgba(196,154,87,0.85), rgba(196,154,87,0))",
            transform: `scaleX(${line})`,
            transformOrigin: "left",
          }}
        />
        <div
          style={{
            marginTop: 12,
            fontFamily: FONT_CN,
            fontSize: 22,
            letterSpacing: "0.12em",
            color: C.parchment,
            opacity: 0.78 * small,
            transform: `translateX(${(1 - small) * -10}px)`,
          }}
        >
          {L.small}
        </div>
      </div>
      {L.ref && (
        <div
          style={{
            position: "absolute",
            right: 112,
            top: 70,
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
            opacity: out * refP,
            transform: `translateY(${(1 - refP) * -6}px)`,
          }}
        >
          <div style={{textAlign: "right"}}>
            <div style={{fontFamily: FONT_LATIN, fontStyle: "italic", fontSize: 25, color: C.parchment, opacity: 0.85}}>{L.ref.latin}</div>
            {L.ref.cn && (
              <div style={{fontFamily: /[一-鿿]/.test(L.ref.cn) ? FONT_CN : FONT_LATIN, fontSize: 22, color: "#CFAA66", marginTop: 6, letterSpacing: "0.04em"}}>
                {L.ref.cn}
              </div>
            )}
            {L.ref.meta && (
              <div style={{fontFamily: FONT_LATIN, fontSize: 18, color: C.greyGold, marginTop: 6, letterSpacing: "0.06em"}}>{L.ref.meta}</div>
            )}
            <div style={{marginTop: 10, marginLeft: "auto", width: 220, height: 1, background: "linear-gradient(270deg, rgba(130,97,66,0.9), rgba(130,97,66,0))"}} />
          </div>
          {L.ref.seal && <Seal text={L.ref.seal} />}
        </div>
      )}
    </>
  );
};

/** 小方印（旧铜色线框，非红色印章仿制） */
const Seal: React.FC<{text: string}> = ({text}) => (
  <div
    style={{
      width: 30,
      height: 30,
      marginTop: 4,
      border: `1.5px solid ${C.copper}`,
      color: "#B08A5A",
      fontFamily: FONT_CN,
      fontSize: 12,
      lineHeight: "13px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      fontWeight: 700,
      padding: 2,
      boxSizing: "border-box",
      wordBreak: "break-all",
    }}
  >
    {text}
  </div>
);

const Badge: React.FC<{from: number; to: number; text: string}> = ({from, to, text}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const o = prog(f, from, from + 20) * (1 - prog(f, to - 15, to));
  return (
    <div
      style={{
        position: "absolute",
        right: 112,
        top: 214,
        opacity: o,
        fontFamily: FONT_CN,
        fontSize: 21,
        letterSpacing: "0.16em",
        color: C.parchment,
        padding: "6px 12px 6px 16px",
        border: `1px solid rgba(155,138,112,0.7)`,
        background: "rgba(9,9,8,0.55)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{width: 7, height: 7, borderRadius: 4, background: C.gold, display: "inline-block"}} />
      {text}
    </div>
  );
};

/** 底部文字区域的柔和压暗，保证字幕对比度 */
const CaptionBed: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 260,
      background: "radial-gradient(ellipse 55% 85% at 50% 92%, rgba(5,5,4,0.55) 0%, rgba(5,5,4,0) 70%)",
    }}
  />
);

export const DocumentaryFrame: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: "none"}}>
    <CaptionBed />
    {cornerLabels.map((_, i) => (
      <Corner key={i} i={i} />
    ))}
    {illustrativeBadges.map((b, i) => (
      <Badge key={i} {...b} />
    ))}
    {shots.map((s) =>
      s.caption ? <Caption key={s.id} text={s.caption} inAt={s.inAt ?? s.start + 10} outAt={s.outAt ?? s.end - 6} /> : null,
    )}
  </AbsoluteFill>
);
