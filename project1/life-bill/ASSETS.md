# 素材清单与授权

本片**没有使用任何第三方音乐、音效、图片或视频素材**。

| 素材 | 路径 | 来源 | 授权 |
| --- | --- | --- | --- |
| 背景音乐 | `public/audio/bgm.wav` | `scripts/gen_audio.py` 程序合成（原创，不含任何采样） | 项目自有 |
| 14 个音效：tick / click / whoosh / swipe / fill / page / printer / stamp / notify / boom / charge / riser / tear / shimmer | `public/audio/sfx/*.wav` | 同上，程序合成 | 项目自有 |
| 六张分类场景插画（睡觉/上班/通勤/刷手机/吃饭/琐事），同一男性人物、同一画风；上一版女性人物备份在 `public/images/scenes/_female/` | `public/images/scenes/*.png` | codex-image skill（GPT Image）AI 生成；后五张以睡觉图为人物与风格参考 | 按 OpenAI 使用条款，生成内容归用户所有 |
| 深夜地铁照片（当前版本未使用，保留备用） | `public/images/metro-night.png` | codex-image skill（GPT Image，经用户 ChatGPT Plus 账号）AI 生成 | 按 OpenAI 使用条款，生成内容归用户所有 |
| 老家灯窗照片 | `public/images/home-window.png` | 同上 | 同上 |
| 黎明城市照片（原结尾提问页用，该页已删除，当前未使用） | `public/images/dawn-city.png` | 同上 | 同上 |
| 生成参数记录 | `public/images/*.png.json` | codex-image 自动生成的 sidecar（含 prompt） | — |
| 其余图标 / 线条插画 | `src/components/Illustrations.tsx` | 手写 SVG 代码 | 项目自有 |
| 字体 Noto Sans SC（思源黑体同源） | `public/fonts/NotoSansSC-VF.ttf` | Google / Adobe | SIL Open Font License 1.1，可商用、可嵌入 |

## 缺失项（需要说明）

- **旁白配音：没有。** 本环境没有接入任何 TTS 或配音服务。旁白脚本已经写在 `src/data/captions.ts`，按场景标好了时间点；音轨位置也已在 `LifeBill.tsx` 中预留。
- **BGM 是程序合成的。** 风格按 PRD 做了分段（前段轻电子节拍、中段钢琴 pad 下沉、结尾 ambient 留白），版权干净，但质感比不上专业制作的配乐。如需更好的效果，可以换成有授权的曲目（例如 Artlist、Epidemic Sound 等平台，搜索关键词 "minimal electronic / emotional corporate / reflective ambient"），直接覆盖 `public/audio/bgm.wav` 即可。注意新曲目的段落不会自动对齐画面。
- AI 生成的图片在部分平台可能需要标注"AI 生成内容"，请按发布平台的规则处理。
