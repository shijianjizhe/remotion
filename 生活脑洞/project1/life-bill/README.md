# 《如果你的人生有一张年度账单》— Remotion 短视频

9:16 竖屏 · 1080×1920 · 30fps · 61.5 秒 · H.264 MP4

成片：`out/life-bill.mp4`

## 运行

```bash
npm i
npm run dev                      # Remotion Studio 预览（可拖时间轴、改 props）
npx remotion render LifeBill out/life-bill.mp4 --codec h264 --crf 18   # 渲染成片
```

> 如果渲染报 `Target closed` / `icudtl.dat not found`（Remotion 自带的 chrome-headless-shell 在本机启动失败），改用本机 Chrome：
> `npx remotion render LifeBill out/life-bill.mp4 --codec h264 --crf 18 --browser-executable="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`

修改场景时长或转场后，需要重新生成 BGM（让音乐段落继续对齐画面）：

```bash
python scripts/gen_audio.py      # 需要 numpy、scipy；输出 public/audio/
```

## 虚构人物与时间核算

人物：**林夏**，28 岁，北京，互联网产品经理，2025 年（365 天，250 个工作日）。

| 分类         | 计算方式                                    |      小时 |
| ------------ | ------------------------------------------- | --------: |
| 睡觉         | 8h × 365 天                                 |     2,920 |
| 上班         | 9h × 250 个工作日（含加班，不含通勤、午饭） |     2,250 |
| 通勤         | 1.5h × 250 天                               |       375 |
| 刷手机       | 3h × 365 天（只算专门刷手机的时间）         |     1,095 |
| 吃饭         | 1.5h × 364 天 + 年夜饭 2h                   |       548 |
| 琐事         | 6h × 50 周                                  |       300 |
| 陪家人       | (春节 6 天 + 端午 1 天 + 中秋 1 天) × 8h    |        64 |
| **支出合计** |                                             | **7,552** |
| **留给自己** | 8,760 − 7,552                               | **1,208** |
| **全年**     | 365 × 24                                    | **8,760** |

为了避免重复计时，约定如下：通勤路上刷手机算「通勤」，吃饭时看视频算「吃饭」，「刷手机」只统计专门刷手机的时间。陪家人：春节 8 天假扣掉来回路上 2 天，在家 6 天，加端午、中秋各 1 天。洗漱、运动、社交、发呆等全部归入「留给自己」。
`src/data/persona.ts` 在加载时会校验总和是否等于 8,760，以及每项是否为整数，不满足就直接报错，渲染不会继续。

## 项目结构

```
src/
  Root.tsx                 Composition 注册（时长由 timeline.json 自动计算）
  LifeBill.tsx             主时间轴：TransitionSeries + BGM + 字幕 + 胶片颗粒
  theme.ts                 配色 / 字体 / 字号 token —— 换色、换字体改这里
  fonts.ts                 本地加载 Noto Sans SC
  data/
    persona.ts             人物设定 + 七项分类数据（改数字、文案、颜色改这里）
    timeline.json          场景时长与转场帧数（TS 与音频脚本共用）
    timeline.ts            计算各场景起点、总帧数
    captions.ts            旁白/字幕脚本（预留，默认关闭）
  components/
    UI.tsx                 统一组件：Tag/Title/Body/BigNumber/CountUp/ProgressBar/Card/LedgerReadout/Sfx
    BalanceHUD.tsx         贯穿分类场景的"余额扣款"抬头
    Motion.tsx             Reveal / CharReveal / Camera(镜头推拉)
    Background.tsx         背景光晕、网格、粒子、胶片颗粒 + 暗角
    Illustrations.tsx      手绘 SVG 线条插画（打印机/房子/勾选框等）
    SceneImage.tsx         分类场景的人物生活插画（羽化融入背景 + 模糊入场 + 缓推）
    PhotoLayer.tsx         全幅照片层（Ken Burns + 压暗）
    Captions.tsx           底部字幕条
  scenes/                  11 个独立场景组件
  transitions/presentations.tsx   自定义转场：镜头穿越 / 扫描光带 / 上滑甩屏 / 沉入黑场
scripts/gen_audio.py       原创 BGM 与音效合成
public/                    字体、图片、音频
```

## 场景与视觉设计

| #   | 场景     | 视觉手法                                                   | 转出     |
| --- | -------- | ---------------------------------------------------------- | -------- |
| 01  | 开场钩子 | 黑暗中亮起"人生打印机"，逐字标题，小票展开                 | 镜头穿越 |
| 02  | 全年总额 | 人物卡；365 格日历逐日点亮，数字滚到 8,760h，闪光锁定      | 扫描光带 |
| 03  | 睡觉     | 场景插画：夜里熟睡在床上；飘动的 z，24h 表盘填满 1/3       | 上滑甩屏 |
| 04  | 上班     | 场景插画：深夜工位托腮盯屏；打卡记录逐条弹出，最后一条标红 | 镜头穿越 |
| 05  | 通勤     | 场景插画：拥挤车厢里拉着吊环；线路图横向飞驰，速度线       | 上滑甩屏 |
| 06  | 刷手机   | 场景插画：窝在沙发刷手机，屏幕光闪烁；通知不断弹出         | 镜头穿越 |
| 07  | 吃饭     | 场景插画：一个人对着平板吃外卖；外卖小票叠上来             | 上滑甩屏 |
| 08  | 琐事     | 场景插画：拖地、脏衣篮、买菜袋；待办清单逐条勾掉、划线     | 沉入黑场 |
| 09  | 陪家人   | 365 格里只亮 8 格，随后老家灯窗浮现："一年，不到 3 天"     | 沉入黑场 |
| 10  | 汇总     | 账单明细 + 环形图，结余揭晓 1,208h，"余额不足"盖章，之后直接进入互动页 | 柔和淡化 |
| 11  | 互动     | 七项变成按钮，手指点中「刷手机」，引导评论（改 `TAP_ID` 可换）| 淡出     |

分类场景顶部有一个贯穿全段的**余额抬头**：每一项出现时余额被扣减，同时有红色扣款数字、震动和扣款音效，7 段进度格依次点亮。

## 替换指南

- **数字 / 文案 / 分类颜色**：`src/data/persona.ts`
- **全局配色、字体、字号**：`src/theme.ts`；字体文件放进 `public/fonts/` 后修改 `src/fonts.ts`
- **场景时长 / 转场长度**：`src/data/timeline.json`，改完运行 `python scripts/gen_audio.py`
- **场景插画**：直接替换 `public/images/scenes/{sleep,work,commute,phone,meals,chores}.png`（建议 3:2 横图、深色背景）
- **字幕**：在 Studio 右侧 props 里把 `showCaptions` 设为 `true`，文案在 `src/data/captions.ts`
- **配音**：录好的音频放到 `public/audio/voiceover.wav`，取消 `LifeBill.tsx` 中 Voiceover 那一行的注释
- **BGM 音量**：props 中的 `musicVolume`（默认 0.55，从"陪家人"开始自动提高约 3dB）

素材来源与授权见 [ASSETS.md](ASSETS.md)。
