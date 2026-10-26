# 看不见的代价 · The Invisible Cost

140 秒无旁白黑金历史纪录片式知识短片。Remotion + React + TypeScript + SVG + 程序化纹理/音效。
三个核心概念：**机会成本** / **当下偏好** / **沉没成本效应**。

## 快速开始

```bash
npm install
npm run assets     # 生成程序化纹理（public/tex）
npm run sfx        # 合成 26 个原创音效 + 混音母版（output/*_sfx.wav）
npm run check      # tsc + 分镜表/音效表校验
npm run dev        # Remotion Studio 预览
```

## 渲染

```bash
npm run proof      # 12 秒美术样片 → preview/style-proof.mp4 + preview/contact-sheet.png
npm run render     # 全片：无声渲染 → 合流音效 → clean 版 → 封面 → 抽帧接触表
npm run qa         # 逐镜头中帧抽样 → .analysis/shot-report.json（docs/QA.md 的数据来源）
```

输出（`output/`）：

| 文件 | 说明 |
|---|---|
| `看不见的代价.mp4` | 1920×1080 / 30fps / 4200 帧 / H.264 yuv420p + AAC 48 kHz 立体声（仅 SFX） |
| `看不见的代价_clean.mp4` | 同画质、**无音轨**的无声版，供后期配乐 |
| `看不见的代价_sfx.wav` | 48 kHz / 16-bit / 立体声、140.000 s、峰值 −9 dBFS 的音效母版 |
| `poster.png` | 1920×1080 封面（片名卡帧） |

## 工程结构

```text
src/
  config/film.ts        画幅、帧率、色板、排版尺度、安全边距
  config/shots.json     S01–S28 分镜表 + 四个章节的角注（单一时钟数据源）
  config/shots.ts       带类型的读取与 shotAt()
  config/sfx.json       81 条音效事件（startFrame/时长/音量/淡入淡出/声像）
  lib/                  rng（mulberry32 等）、motion（缓动/慢动作积分）、noise(fBm)、shatter（碎裂几何）
  components/           Backdrop、Camera、Coin、CoinAt、Parchment、BrassScale、TheaterTicket、
                        Caption、CornerNotes、Divider、Dust、Glow、GrainAndVignette
  scenes/01_Opening … 06_Ending   28 个镜头 → 6 个场景组件
scripts/                gen-textures / gen-sfx / mix-sfx / verify-sfx / validate-shots /
                        render-proof / render-all / shot-report / inspect / probe-band
docs/                   reference-analysis / science-fact-check / assets-and-licenses / QA
```

## 渲染确定性

- 所有随机数来自 `src/lib/rng.ts` 的 `mulberry32` / `hash01`（固定种子），**没有无种子 `Math.random()`**；
- 不使用 `Date.now()`、`setTimeout`、CSS 无限动画或外部网络请求；
- 一切动画是 `f(frame)` 的纯函数：`docs/QA.md` 记录了同帧重复渲染的一致性与两次独立渲染的画面比对；
- 玻璃碎片位移用 `slowIntegral()` 解析积分实现“撞击后减速悬停”，不是逐帧累加状态。

## 音轨的做法

画面由 Remotion 渲染为**无音轨**的 MP4；音效由 `src/config/sfx.json` 驱动，
在 `scripts/mix-sfx.mjs` 里按帧精确落位混成 48 kHz 立体声母版，再用 ffmpeg 与画面合流（`-c:v copy`）。
好处：① 音画对齐以帧为单位且可复算；② clean 版天然是同一份画面；③ 后期换音乐时只需重新合流，不必重渲画面。

## 音乐与配音

**本片没有旁白、没有人声、没有背景音乐。** 只有 26 种原创拟音/环境音效，按 `src/config/sfx.json` 铺在时间线上，
峰值控制在 −9 dBFS，为后期叠加已授权音乐留出余量。
