# 看不见的代价 · Remotion 工程

140 秒、1920×1080、30 fps 的无旁白知识短片（黑金历史纪录片风格）。全片只有原创合成的音效，不含背景音乐。

## 交付物

| 文件 | 说明 |
|---|---|
| `output/看不见的代价.mp4` | 成片：H.264 yuv420p + AAC 320k 48 kHz 音效轨 |
| `output/看不见的代价_clean.mp4` | 无声画面版，供用户后期配乐 |
| `output/看不见的代价_sfx.wav` | 独立音效轨：48 kHz 立体声 16-bit PCM，从 0 秒起，正好 140.000 s，峰值约 −9 dBFS |
| `output/poster.png` | 1920×1080 封面 |
| `preview/style-proof.mp4` | 12 秒风格样片（原片 00:04–00:16），`preview/contact-sheet.png` 为样片关键帧接触表 |
| `docs/` | 参考分析、科学核查、素材授权、QA 记录 |

## 命令

```bash
npm install
npm run dev                         # Remotion Studio 预览（含逐事件音效）
python scripts/gen_textures.py      # 重新生成原创纹理（可选）
python scripts/gen_sfx.py           # 重新合成音效（可选）
node scripts/render-all.mjs all     # 事件表 → 校验 → 混音 → 渲染 → 封装 → 封面
#   也可只跑一部分：proof | full | poster；Windows 下可设 PYTHON=python.exe 的路径
```

运行 render-all 需要 Python 3 以及 numpy、scipy、Pillow。ffmpeg 使用 Remotion 自带的（`npx remotion ffmpeg`）。

## 结构

- `src/config/film.ts`：帧率、时长、色板、28 个镜头的起止帧与精确字幕、角标、剧情数据模型（统一维护）
- `src/config/sfx-events.json` / `sfx.ts`：音效事件（file, startFrame, durationFrames, volume, fadeIn/OutFrames, pan），由 `scripts/make_sfx_events.mjs` 生成；Studio 预览与离线混音共用这一份数据
- `src/scenes/01_Opening … 06_Ending.tsx`：六个章节
- `src/components/`：金币、天平、季票与剧院、羊皮纸、人物线描、纪录片框架（角标/字幕）、氛围层
- `scripts/validate-shots.mjs`：镜头无空隙/无重叠、0→4200、字幕窗口与字数、SFX 文件存在性校验

## 确定性

全部动画只以 `useCurrentFrame()` 为输入。随机数统一用 `remotion.random(seed)`。不使用 `Math.random`、`Date.now`、CSS 动画或定时器。碎玻璃物理用固定步长的解析式（含分段时间扭曲实现的慢动作）。
