# 素材来源与授权记录

本片所有画面元素均为程序生成或在代码中手绘（SVG）。片中**没有使用**参考片画面、外部照片、AI 生成图片、录音样本或音乐。

## 1. 字体（随工程打包，均为 SIL Open Font License 1.1）

| 文件 | 字体 | 来源 | 授权 | 用途 |
|---|---|---|---|---|
| `public/fonts/NotoSerifSC-VF.ttf` | Noto Serif SC（思源宋体），可变字重 | 本机已安装的 Google Noto 字体（C:\Windows\Fonts），上游为 https://github.com/notofonts/noto-cjk | SIL OFL 1.1 | 片名、中文字幕、标签 |
| `public/fonts/EBGaramond.ttf`、`EBGaramond-Italic.ttf` | EB Garamond，可变字重 | https://github.com/google/fonts/tree/main/ofl/ebgaramond | SIL OFL 1.1（许可原文见 `public/fonts/OFL-EBGaramond.txt`） | 年份、拉丁/法文文献注记 |

没有打包任何专有字体（例如 Georgia、宋体 SimSun 等系统商业字体）。

## 2. 纹理（原创，程序生成）

由 `scripts/gen_textures.py` 用 numpy、scipy、PIL 按固定种子生成：

- `public/textures/parchment_wide.png`、`parchment_page.png`、`parchment_ticket.png`：多层分形噪声 + 纤维线 + 污渍 + 不规则毛边透明通道 + 灼边。
- `public/textures/grain_0..3.png`：高斯噪声胶片颗粒（1920×1080）。

## 3. 音效（原创，程序合成）

由 `scripts/gen_sfx.py` 合成，全部基于滤波噪声、非谐金属泛音（正弦叠加）、粘滑脉冲和卷积混响，固定随机种子，48 kHz 立体声，共 41 个文件，见 `public/sfx/`：

- 玻璃：`glass_impact`、`glass_tail`、`glass_restore`
- 金属/金币：`coin_tap`、`coin_tap_b`、`coin_chime`、`coin_low`、`coin_bright`、`scale_clink`、`chain_gear`、`dial_wheel`、`clock_ticks`、`lock_on`、`lock_drop`、`focus_ping`、`focus_short`、`echo_far`、`engrave`
- 纸张：`paper_rustle`、`page_turn`、`ticket_fold`、`paper_close`、`ledger_drop`、`ink_dot`、`book_close`、`stamp`、`ticket_tear`、`pencil_draw`
- 空间/空气：`room_air`、`wind_soft`、`theater_room`（低通噪声与随机包络，**没有任何人声或可辨识语言**）、`ash_disperse`、`sand_flow`、`sand_fall`、`fade_whoosh`、`breath_low`、`door_creak`、`scale_hum`、`line_light`、`low_thump`、`title_swell`

**无背景音乐、无旁白、无人声**。参考片的音频只用于测量响度（见 `reference-analysis.md`），没有进入任何素材。

## 4. 文本

- 羊皮纸底纹上的法文段落取自 Frédéric Bastiat《Ce qu'on voit et ce qu'on ne voit pas》（1850）第一章 *La vitre cassée* 的开头。作品已进入公有领域。
- 其余中文说明均为本片原创。

## 5. 参考视频

`../infomation/参考视频/运气的形状.mp4` 只用于内部美术分析：抽帧保存在 `docs/ref-frames/`，作为分析附件，不进入渲染时间线。请勿把 `docs/ref-frames/` 作为成片素材分发。
