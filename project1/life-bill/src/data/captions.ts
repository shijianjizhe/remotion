import type { SceneId } from "./timeline";

/**
 * 旁白 / 字幕脚本（预留）。
 * - at / end 为「场景内」帧（30fps），由 Captions 组件自动换算到总时间轴。
 * - 默认不显示（画面本身已有大量文字）。在 Root.tsx 把 showCaptions 设为 true 即可开启。
 * - 本项目没有接入任何配音服务，旁白音频尚未录制；录好后放到 public/audio/voiceover.wav
 *   并在 LifeBill.tsx 中取消注释 Voiceover 那一行即可。
 */
export type CaptionLine = { scene: SceneId; at: number; end: number; text: string };

export const CAPTIONS: CaptionLine[] = [
  { scene: "hook", at: 10, end: 70, text: "如果你的人生，也有一张年度账单" },
  { scene: "hook", at: 74, end: 140, text: "它会怎么写？" },
  { scene: "total", at: 10, end: 90, text: "一年 365 天，每天 24 小时" },
  { scene: "total", at: 96, end: 170, text: "你一共有 8760 个小时" },
  { scene: "sleep", at: 30, end: 125, text: "睡觉，2920 小时，全年的三分之一" },
  { scene: "work", at: 30, end: 115, text: "上班，2250 小时" },
  { scene: "commute", at: 30, end: 105, text: "通勤，375 小时，十五天在车厢里" },
  { scene: "phone", at: 30, end: 125, text: "刷手机，1095 小时" },
  { scene: "meals", at: 30, end: 95, text: "吃饭，548 小时" },
  { scene: "chores", at: 30, end: 95, text: "琐事，300 小时" },
  { scene: "family", at: 40, end: 105, text: "陪家人……48 小时" },
  { scene: "family", at: 112, end: 175, text: "一年，只有两天" },
  { scene: "summary", at: 20, end: 110, text: "全部加起来，已经花掉 7536 小时" },
  { scene: "summary", at: 130, end: 260, text: "真正留给自己的，只剩 1224 小时" },
  { scene: "question", at: 8, end: 60, text: "如果人生真的有一张账单" },
  { scene: "question", at: 66, end: 155, text: "你会满意这一年吗？" },
  { scene: "interact", at: 10, end: 150, text: "你最想拿回哪一项时间？评论区告诉我" },
];
