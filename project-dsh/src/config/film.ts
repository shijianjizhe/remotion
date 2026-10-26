/**
 * 单一时钟与美术令牌。所有数值以 1920x1080 / 30fps 为基准。
 */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TOTAL_FRAMES = 4200; // 140.00 s

/** 4.1 设计令牌 */
export const C = {
  black: "#090908",
  graphite: "#13110F",
  gold: "#C49A57",
  goldHi: "#E8CA88",
  parchment: "#E8D6B1",
  copper: "#826142",
  grayGold: "#9B8A70",
  rust: "#763E32",
  ink: "#2A241D",
} as const;

export const FONT = {
  /** 思源宋体（SIL OFL，随工程打包） */
  cjk: "'Noto Serif SC', 'Noto Serif', 'Songti SC', serif",
  latin: "'Noto Serif SC', 'Noto Serif', Georgia, serif",
  /** 数字：等宽数字，金额不跳动 */
  num: "'Noto Serif SC', 'Noto Serif', Georgia, serif",
} as const;

/** 4.3 排版尺度 */
export const TYPE = {
  title: 104,
  chapter: 56,
  caption: 44,
  note: 22,
  tiny: 17,
} as const;

export const SAFE = {
  left: 110,
  right: WIDTH - 110,
  /** 字幕基线 */
  baseline: 936,
  /** 字幕行高中心 */
  captionCenter: 908,
  top: 76,
} as const;

/** 4.2 浮尘密度（同时可见数量） */
export const DUST = {
  calm: 26,
  mild: 38,
  dense: 54,
} as const;

export const TITLE = "看不见的代价";
export const SUBTITLE_EN = "THE INVISIBLE COST";
