# 记忆会撒谎

完整 Remotion 科学视觉纪录片，1920×1080，30 fps，V2 为 82.367 秒，2471 帧，无旁白。

- 成片：`out/记忆会撒谎-v2.mp4`（旧版保留为 `out/记忆会撒谎.mp4`）
- 项目入口：`src/index.tsx`，唯一正式 Composition：`MemoryLies`
- 镜头系统：`src/MemoryFilm.tsx`
- 科学数据与音乐 cue：`src/data.ts`
- 配乐混音：`public/audio/mix-v2.wav`
- 独立音效轨：`out/记忆会撒谎-v2-SFX.wav`
- 音画提示表：`docs/cue-sheet.csv`
- 制作报告：`docs/V2修改报告.md`（初版报告仍保留）

## 离线制作命令

在本目录执行 `npm install`。`node scripts/validate.mjs` 检查科学数据和时间轴；`node scripts/render.mjs stills` 输出关键帧；`npm run render` 输出完整 MP4。这些命令不启动 Remotion Studio。

渲染脚本默认复用相邻 project3 已安装的无头 Chromium；迁移电脑时用 `CHROME_PATH` 指定浏览器可执行文件。源代码、音乐、字体与音效均保存于本项目。字体来自本机宋体与微软雅黑。Python 制作脚本使用 numpy、scipy、Pillow、librosa、pymupdf、imageio-ffmpeg。

`scripts/audio.py` 重建混音；`scripts/analyze.py` 核查输入音频并抽取参考片；`scripts/qa.py` 检查最终 MP4。`scripts/contact.py` 生成源渲染关键帧总览。

按用户指示未启动开发服务，未执行 SVN/Git 检查，未运行 vue-tsc。

V2 使用 `src/edit-v2.json` 将原始动作时间映射至新节拍时间。运行 `python scripts/audio-v2.py` 重建新版配乐、`python scripts/validate-v2.py` 验证字幕停留时间、`python scripts/qa-v2.py` 检查新版最终输出。底部字幕的实际起止时间见 `docs/captions-v2.csv`。

最新 V3：out/记忆会撒谎-v3.mp4。仅将片头右侧中文、分隔线和英文整体下移 44 px，使文字组视觉中心与放映机镜头中心对齐。时长与 V2 一致。
