# 时间并不均匀 · Time Is Not Uniform

1920×1080 / 30fps / 142 秒 / 无旁白 / 无 BGM（只有音效）的历史科学视觉短片，用 Remotion（React + TypeScript + SVG）制作。

## 交付文件
| 文件 | 说明 |
|---|---|
| `out/final_sfx_only.mp4` | 成片（H.264 / yuv420p / AAC，只含 SFX） |
| `public/sfx/sfx_stem.wav` | 独立的 SFX 整轨（48kHz / 立体声，峰值 −1 dBFS），可以拿去和 BGM 一起混音 |
| `out/qa/` | 验收截图 |
| `docs/` | 参考片拆解、镜头表、资料依据、SFX cue 表、QA 记录 |

## 环境
- Node ≥ 20（实测 22.22）
- Python 3.11 + numpy + scipy（只有重新生成音效时才需要）
- 不需要另外安装 ffmpeg，Remotion 自带

```bash
npm ci
```

## 预览 / 渲染
```bash
npm run dev                                   # 打开 Remotion Studio 预览
npx remotion render TimeIsNotUniform out/final_sfx_only.mp4 --codec=h264 --pixel-format=yuv420p --crf=18
npx remotion render StyleSample out/style_sample.mp4     # 12 秒风格样片（Gate B）
npx remotion still TimeIsNotUniform out/qa/x.jpg --frame=1000  # 单帧抽检
```
在 Studio 里把 `sfx` 属性设为 `false` 可以得到无声版本。

## 常见修改
- **改片长 / 某一幕的时长**：编辑 `src/config/scenes.json` 里的 `duration`（单位为帧，30 帧 = 1 秒）。总时长和各幕起点会自动重新计算。各幕内部的动画关键帧写在对应的 `src/scenes/*.tsx` 顶部或 `prog(f, a, b)` 调用中。
- **改屏幕文字**：每一幕的年份、文献注释写在场景文件末尾的 `<DocumentaryYear>`、`<HistoricalAnnotation>` 里；底部接力字幕写在 `<Beats beats={[...]}>` 里（`from`/`to` 为场景内帧号，`【】` 包起来的词显示为金色）。
- **改音效**：编辑 `src/config/sfxCues.json`（场景、场景内帧号、音效名、增益、重复次数；场景时长改了 cue 会自动跟随），然后运行
  `python scripts/gen_audio.py`，重新生成 `public/sfx/*.wav` 和 `sfx_stem.wav`。
- **改配色 / 字体**：`src/config/theme.ts`。
- **改科学参数**（速度、海拔、实验数值）：`src/simulation/physics.ts`。

## 后期加 BGM
用剪辑软件导入 `final_sfx_only.mp4`（或无声版 + `sfx_stem.wav`），在上面叠加音乐即可。片尾 02:13–02:22 的音效很稀疏，留给音乐收尾。

## 目录
```
src/
  Root.tsx                     组合注册（全片 + 12 秒样片）
  compositions/TimeIsNotUniform.tsx   用 <Sequence> 串起 11 幕 + 音轨
  scenes/                      Opening, Newton, SpecialRelativity, GeneralRelativity, AtomicClocks,
                               GPS, EyeTransition, Chronostasis, FreeFall, Memory, Ending
  components/                  ScientificClock, ui（年份/文献注释/结论字幕/金尘/羊皮纸肌理）, SceneShell
  simulation/                  physics.ts（固有时、gh/c²、HK 数值、GPS、自由落体）, timelineMemory.ts
  config/                      theme.ts, scenes.json, sfxCues.json
scripts/gen_audio.py           程序合成全部音效
public/fonts/                  Noto Serif SC / Noto Sans SC（SIL OFL 1.1）
```

## 素材许可
- 字体：Noto Serif SC、Noto Sans SC（思源宋体 / 思源黑体同源），SIL Open Font License 1.1。
- 音效：全部由程序合成，没有第三方素材，见 `public/sfx/SOURCES.md`。
- 图形：全部是 SVG 代码绘制。没有使用历史照片，所有“文献”元素都是视觉演绎。
- 参考片《运气的形状》只用于内部风格研究，没有提取它的任何画面或音频。
