// 《看不见的代价》全片统一参数：帧率、时长、色板、文字。
// 所有时间以帧为唯一权威（30 fps）。

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_SECONDS = 140;
export const TOTAL_FRAMES = DURATION_SECONDS * FPS; // 4200

export const TITLE = "看不见的代价";
export const TITLE_LATIN = "CE QU'ON NE VOIT PAS";

export const C = {
  black: "#090908",
  graphite: "#13110F",
  gold: "#C49A57",
  goldHi: "#E8CA88",
  parchment: "#E8D6B1",
  copper: "#826142",
  greyGold: "#9B8A70",
  rust: "#763E32",
  ink: "#3A2A1C",
  inkSoft: "#6B5236",
} as const;

export const FONT_CN = "Noto Serif SC";
export const FONT_LATIN = "EB Garamond";

/** 时间工具：mm:ss → frame */
export const t = (sec: number) => Math.round(sec * FPS);

export type ChapterId = "prologue" | "window" | "paths" | "weight" | "ticket" | "ending";

/**
 * 字幕文本语法：`{...}` 内为暗金强调词，`\n` 换行。
 * inAt / outAt 为全局帧；缺省时由镜头起止推导。
 */
export type Shot = {
  id: string;
  start: number;
  end: number;
  chapter: ChapterId;
  caption: string | null;
  inAt?: number;
  outAt?: number;
};

export const shots: Shot[] = [
  {id: "S01", start: 0, end: 120, chapter: "prologue", caption: null},
  {id: "S02", start: 120, end: 240, chapter: "prologue", caption: "一声脆响。", inAt: 146, outAt: 232},
  {id: "S03", start: 240, end: 360, chapter: "prologue", caption: "代价，只有{看得见的}吗？", inAt: 262, outAt: 352},
  {id: "S04", start: 360, end: 450, chapter: "prologue", caption: null /* 片名卡本身即文字：看不见的代价 */},
  {id: "S05", start: 450, end: 570, chapter: "window", caption: "{1850} · 巴斯夏", inAt: 478},
  {id: "S06", start: 570, end: 720, chapter: "window", caption: "修一块玻璃，需要 {6 法郎}。"},
  {id: "S07", start: 720, end: 870, chapter: "window", caption: "花出去的钱，人人{看得见}。"},
  {id: "S08", start: 870, end: 1020, chapter: "window", caption: "没买成的鞋，却{不会出现}。"},
  {id: "S09", start: 1020, end: 1170, chapter: "window", caption: "破坏，不等于{创造财富}。"},
  {id: "S10", start: 1170, end: 1290, chapter: "window", caption: "看见一种结果，也会{忽略另一种}。"},
  {id: "S11", start: 1290, end: 1440, chapter: "paths", caption: "经济学称之为：{机会成本}。", inAt: 1320},
  {id: "S12", start: 1440, end: 1590, chapter: "paths", caption: "{一小时}，只能使用一次。"},
  {id: "S13", start: 1590, end: 1770, chapter: "paths", caption: "选中一条路，其他路便{被放弃}。", inAt: 1620},
  {id: "S14", start: 1770, end: 1950, chapter: "paths", caption: "代价，是{最好的那条}未选之路。", inAt: 1800},
  {id: "S15", start: 1950, end: 2160, chapter: "paths", caption: "有些代价，{不会出现在收据上}。", inAt: 1972, outAt: 2066},
  {id: "S16", start: 2160, end: 2310, chapter: "weight", caption: "同样的选择，{时间}会改变重量。", inAt: 2190},
  {id: "S17", start: 2310, end: 2490, chapter: "weight", caption: "{眼前}的收获，可能格外诱人。", inAt: 2350},
  {id: "S18", start: 2490, end: 2700, chapter: "weight", caption: "距离拉远，偏好{也可能}改变。", inAt: 2560},
  {id: "S19", start: 2700, end: 2850, chapter: "weight", caption: "这被称为「{当下偏好}」。", inAt: 2735},
  {id: "S20", start: 2850, end: 2970, chapter: "weight", caption: "当钱{已经}花出去呢？", inAt: 2872},
  {id: "S21", start: 2970, end: 3120, chapter: "ticket", caption: "{1985} · 沉没成本研究", inAt: 3005},
  {id: "S22", start: 3120, end: 3300, chapter: "ticket", caption: "票价已付，却可能{左右出席}。", inAt: 3150},
  {id: "S23", start: 3300, end: 3480, chapter: "ticket", caption: "付过的钱，已经{无法收回}。", inAt: 3335},
  {id: "S24", start: 3480, end: 3630, chapter: "ticket", caption: "下一步，仍然可以{重新选择}。", inAt: 3505},
  {id: "S25", start: 3630, end: 3750, chapter: "ticket", caption: "决定未来的，应是{未来的得失}。", inAt: 3645, outAt: 3745},
  {id: "S26", start: 3750, end: 3900, chapter: "ending", caption: null},
  {id: "S27", start: 3900, end: 4050, chapter: "ending", caption: "每个选择，都有{代价}。", inAt: 3940},
  {id: "S28", start: 4050, end: 4200, chapter: "ending", caption: "但不是每个代价，\n都写在{收据}上。", inAt: 4072, outAt: 4176},
];

export const shotById = (id: string) => {
  const s = shots.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown shot ${id}`);
  return s;
};

/** 章节范围（全局帧） */
export const chapters: Record<ChapterId, {start: number; end: number}> = {
  prologue: {start: 0, end: 450},
  window: {start: 450, end: 1290},
  paths: {start: 1290, end: 2160},
  weight: {start: 2160, end: 2970},
  ticket: {start: 2970, end: 3750},
  ending: {start: 3750, end: 4200},
};

/** 角落档案标签（左上：年份/章节；右上：文献注记）。 */
export type CornerLabel = {
  from: number;
  to: number;
  big: string; // 左上大字
  small: string; // 左上小字
  ref?: {latin: string; cn?: string; meta?: string; seal?: string};
};

export const cornerLabels: CornerLabel[] = [
  {
    from: 470,
    to: 1290,
    big: "1850",
    small: "巴黎 · 弗雷德里克·巴斯夏",
    ref: {
      latin: "Ce qu'on voit et ce qu'on ne voit pas",
      cn: "《看得见的与看不见的》",
      meta: "Frédéric Bastiat · 1850",
      seal: "文献",
    },
  },
  {
    from: 1305,
    to: 2160,
    big: "贰",
    small: "没走的那条路",
    ref: {latin: "OPPORTUNITY COST", meta: "CHOICE & ALTERNATIVES", seal: "概念"},
  },
  {
    from: 2175,
    to: 2965,
    big: "叁",
    small: "未来的重量",
    ref: {latin: "PRESENT BIAS", meta: "INTERTEMPORAL CHOICE  ·  cf. D. Laibson · 1997", seal: "概念"},
  },
  {
    from: 2985,
    to: 3750,
    big: "1985",
    small: "剧院季票 · 现场研究",
    ref: {
      latin: "The Psychology of Sunk Cost",
      cn: "H. R. Arkes & C. Blumer",
      meta: "Organizational Behavior and Human Decision Processes · 1985",
      seal: "文献",
    },
  },
];

/** 常驻“示意”角标 */
export const illustrativeBadges: {from: number; to: number; text: string}[] = [
  {from: 2190, to: 2850, text: "示意选择"},
  {from: 3130, to: 3300, text: "示意 · 非论文原数据"},
];

// 剧情数据模型（与 PRD 8.2 / 8.4 一致）
export const brokenWindow = {
  repairCostFrancs: 6,
  actual: {window: "repaired", shoes: false},
  alternative: {window: "intact", shoes: true},
} as const;

export const intertemporalPairs = [
  {left: {coins: 1, days: 0}, right: {coins: 2, days: 7}},
  {left: {coins: 1, days: 30}, right: {coins: 2, days: 37}},
] as const;

/** 一小时三条路（示意）；chosen 为被选中，bestForgone 为假设中的最佳未选。 */
export const hourPaths = {
  options: ["工作", "学习", "休息"] as const,
  chosen: 0,
  bestForgone: 2,
};

export const BASTIAT_FR =
  "Avez-vous jamais été témoin de la fureur du bon bourgeois Jacques Bonhomme, quand son fils terrible est parvenu à casser un carreau de vitre ? Si vous avez assisté à ce spectacle, à coup sûr vous aurez aussi constaté que tous les assistants, fussent-ils trente, semblent s'être donné le mot pour offrir au propriétaire infortuné cette consolation uniforme : « À quelque chose malheur est bon. De tels accidents font aller l'industrie. Il faut que tout le monde vive. Que deviendraient les vitriers, si l'on ne cassait jamais de vitres ? »";
