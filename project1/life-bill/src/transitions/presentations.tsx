import React from "react";
import { AbsoluteFill } from "remotion";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";

type Empty = Record<string, never>;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** 镜头穿越：旧画面放大 + 模糊冲出，新画面从远处推近 */
const BlurZoom: React.FC<TransitionPresentationComponentProps<Empty>> = ({ children, presentationDirection, presentationProgress }) => {
  const p = ease(presentationProgress);
  if (presentationDirection === "exiting") {
    return (
      <AbsoluteFill style={{ scale: String(1 + p * 0.35), filter: `blur(${p * 24}px)`, opacity: 1 - p }}>{children}</AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ scale: String(0.82 + p * 0.18), filter: `blur(${(1 - p) * 24}px)`, opacity: p }}>{children}</AbsoluteFill>
  );
};
export const blurZoom = (): TransitionPresentation<Empty> => ({ component: BlurZoom, props: {} });

/** 扫描光带：一条亮线从上往下扫过，像打印/扫码，扫过处露出新场景 */
const LightSweep: React.FC<TransitionPresentationComponentProps<{ color: string }>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const p = ease(presentationProgress);
  if (presentationDirection === "exiting") {
    return <AbsoluteFill style={{ filter: `brightness(${1 - p * 0.5})` }}>{children}</AbsoluteFill>;
  }
  const y = p * 100;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(0 0 ${100 - y}% 0)` }}>{children}</AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: `calc(${y}% - 3px)`,
          height: 6,
          background: passedProps.color,
          boxShadow: `0 0 40px 12px ${passedProps.color}`,
          opacity: presentationProgress < 0.98 ? 1 : 0,
        }}
      />
    </AbsoluteFill>
  );
};
export const lightSweep = (color: string): TransitionPresentation<{ color: string }> => ({
  component: LightSweep,
  props: { color },
});

/** 向上甩动：像在手机上划走一屏，带运动模糊 */
const SwipeUp: React.FC<TransitionPresentationComponentProps<Empty>> = ({ children, presentationDirection, presentationProgress }) => {
  const p = ease(presentationProgress);
  const speedBlur = Math.sin(presentationProgress * Math.PI) * 14;
  if (presentationDirection === "exiting") {
    return (
      <AbsoluteFill style={{ translate: `0px ${-p * 100}%`, filter: `blur(${speedBlur}px)`, scale: String(1 - p * 0.08) }}>{children}</AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ translate: `0px ${(1 - p) * 100}%`, filter: `blur(${speedBlur}px)` }}>{children}</AbsoluteFill>
  );
};
export const swipeUp = (): TransitionPresentation<Empty> => ({ component: SwipeUp, props: {} });

/** 沉入黑场：旧画面压暗 + 下沉，新画面从黑里慢慢浮现（情绪段落用） */
const DipToBlack: React.FC<TransitionPresentationComponentProps<Empty>> = ({ children, presentationDirection, presentationProgress }) => {
  const p = presentationProgress;
  if (presentationDirection === "exiting") {
    const o = Math.max(0, 1 - p * 2);
    return <AbsoluteFill style={{ opacity: o, translate: `0px ${p * 40}px` }}>{children}</AbsoluteFill>;
  }
  const o = Math.max(0, p * 2 - 1);
  return <AbsoluteFill style={{ opacity: o, filter: `blur(${(1 - o) * 10}px)` }}>{children}</AbsoluteFill>;
};
export const dipToBlack = (): TransitionPresentation<Empty> => ({ component: DipToBlack, props: {} });
