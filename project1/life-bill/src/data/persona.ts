/**
 * 虚构人物设定 + 时间账单数据。
 * 所有小时数都由下方公式计算得出，分类之间互不重叠：
 *  - 通勤路上刷手机 → 计入「通勤」
 *  - 吃饭时看视频   → 计入「吃饭」
 *  - 「刷手机」只统计专门躺着/坐着刷手机的时间
 * 修改数字时只改公式参数即可，底部会校验总和必须等于 8760。
 */
export const PERSONA = {
  name: "林夏",
  age: 28,
  city: "上海",
  job: "互联网产品经理",
  year: 2025,
  days: 365,
  workDays: 250,
};

export const YEAR_HOURS = PERSONA.days * 24; // 8760

export type Category = {
  id: string;
  index: string;
  label: string;
  en: string;
  hours: number;
  formula: string;
  note: string;
  punch: string;
  color: string;
};

const sleep = 8 * PERSONA.days; // 2920
const work = 9 * PERSONA.workDays; // 2250
const commute = 1.5 * PERSONA.workDays; // 375
const phone = 3 * PERSONA.days; // 1095
const meals = 1.5 * (PERSONA.days - 1) + 2; // 546 + 2 = 548
const chores = 6 * 50; // 300
const family = 5 * 8 + 1 * 8; // 48

export const CATEGORIES: Category[] = [
  {
    id: "sleep", index: "01", label: "睡觉", en: "SLEEP", hours: sleep,
    formula: "8 小时 × 365 天",
    note: "每晚 00:30 睡，08:30 起",
    punch: "全年三分之一，在梦里结算",
    color: "#4DA3FF",
  },
  {
    id: "work", index: "02", label: "上班", en: "WORK", hours: work,
    formula: "9 小时 × 250 个工作日",
    note: "含加班，不含通勤与午饭",
    punch: "相当于不眠不休工作 94 天",
    color: "#B8C4D6",
  },
  {
    id: "commute", index: "03", label: "通勤", en: "COMMUTE", hours: commute,
    formula: "1.5 小时 × 250 天",
    note: "地铁 2 号线，往返 22 站",
    punch: "有 15.6 天，在车厢里度过",
    color: "#7FB5FF",
  },
  {
    id: "phone", index: "04", label: "刷手机", en: "SCREEN", hours: phone,
    formula: "3 小时 × 365 天",
    note: "不含通勤和吃饭时刷的",
    punch: "是陪家人时间的 22.8 倍",
    color: "#9B8CFF",
  },
  {
    id: "meals", index: "05", label: "吃饭", en: "MEALS", hours: meals,
    formula: "1.5 小时 × 364 天 + 年夜饭 2 小时",
    note: "外卖 + 公司楼下",
    punch: "大多数时候，一个人配着视频吃完",
    color: "#FF9F6B",
  },
  {
    id: "chores", index: "06", label: "琐事", en: "CHORES", hours: chores,
    formula: "6 小时 × 50 周",
    note: "家务、采购、排队、办事",
    punch: "生活本身，也要按时缴费",
    color: "#8A93A3",
  },
  {
    id: "family", index: "07", label: "陪家人", en: "FAMILY", hours: family,
    formula: "春节 5 天 × 8 小时 + 中秋 1 天 × 8 小时",
    note: "老家在 1100 公里外",
    punch: "一年，只有 2 天",
    color: "#FFB84D",
  },
];

export const SPENT_HOURS = CATEGORIES.reduce((a, c) => a + c.hours, 0); // 7536
export const SELF_HOURS = YEAR_HOURS - SPENT_HOURS; // 1224
export const SELF_COLOR = "#7CFFB2";

export const catById = (id: string) => CATEGORIES.find((c) => c.id === id)!;

// —— 数据校验：分类 + 留给自己 必须严格等于全年 8760 小时 ——
if (YEAR_HOURS !== 8760 || SPENT_HOURS + SELF_HOURS !== YEAR_HOURS || SELF_HOURS < 0) {
  throw new Error(`时间账单不平衡: spent=${SPENT_HOURS} self=${SELF_HOURS}`);
}
CATEGORIES.forEach((c) => {
  if (!Number.isInteger(c.hours)) throw new Error(`${c.label} 小时数不是整数: ${c.hours}`);
});
