# 05《时间小偷》

独立 Remotion 工程。1080 × 1920 / 30 fps / 58 秒 / 无旁白。

## 成片

`output/05-time-thief-final.mp4` 是含原创音乐、纸张声音设计的发布文件。

## 复现

1. `npm ci`
2. Python 环境安装 numpy、Pillow，执行 `python scripts/assets.py`。
3. `npm run render`（离线渲染，不启动 Studio）。
4. `node scripts/finalize.mjs`
5. `python scripts/qa.py`

`scripts/render.mjs` 默认使用本机 Chrome，可修改 browserExecutable 为目标机器的浏览器路径。中文使用 Windows 微软雅黑，数字使用 Georgia；迁移环境时需确保字体存在。源工程不读取任何其他视频工程。

## 结构

- `src/Film.tsx`：原创纸片场景、关节人物、剪纸手、破损时钟、镜头、反转。
- `src/cues.json`：画面与声音共享的上滑时刻、时钟节点、收声点。
- `scripts/assets.py`：确定性纸张纹理及原创合成配乐、音效。
- `scripts/finalize.mjs`：响度母带、MP4 封装、全片检测及关键帧。
- `scripts/qa.py`：参数验证、全时段抽帧联络表与运动差异统计。

## 素材与权利

画面图形、纹理、人物、手机内的猫/咖啡/行星内容、音乐旋律、音效均为本工程从零制作。没有第三方平台标志、视频截屏、采样音乐或 TTS。音乐由正弦分音、衰减包络、噪声与原创音序合成；纸声为原创噪声包络合成。系统字体仅用于栅格化输出，未分发字体文件。

风格灵感来自用户提供的 [mg-styles-15 / Collage](https://github.com/Vincentwei1021/mg-styles-15/blob/main/prompts/06-collage.md)，未复制其源码或媒体。Remotion 及其依赖沿用各自许可证，商业使用需遵守 Remotion 的适用授权条款。

## 剪辑结构

| 时间 | 事件 |
| --- | --- |
| 0–4 秒 | 拿起手机，最后刷一个，23:00 |
| 4–9 秒 | 第一次滑动，纸手触钟，扇形撕离落地 |
| 9–16 秒 | 原创内容卡、人物与纸钟交叉剪辑 |
| 16–22 秒 | 23:40，镜头沿碎片下行 |
| 22–28 秒 | 00:30，碎片增加 |
| 28–34 秒 | 01:20，眼皮下垂、姿势疲惫 |
| 34–42.6 秒 | 巨手掀起窗外夜幕，纸屑塌落 |
| 42.6–49 秒 | 02:00，音乐抽空，抬头、放低手机 |
| 49–54 秒 | 两只同形纸手同步上滑并重合 |
| 54–58 秒 | 持续拉远中落版，最后轻纸落下 |
