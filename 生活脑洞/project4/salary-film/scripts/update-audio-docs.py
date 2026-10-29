from pathlib import Path
p=Path('scripts/audio.py');s=p.read_text(encoding='utf-8-sig');a=s.index('af=f"');b=s.index('\np=subprocess.run',a);s=s[:a]+"af='acompressor=threshold=0.03:ratio=10:attack=0.1:release=100:makeup=3,loudnorm=I=-14:TP=-2:LRA=7:linear=false'"+s[b:];p.write_text(s,encoding='utf-8')
p=Path('out/salary-8000/qa-report.md');s=p.read_text(encoding='utf-8-sig');p.write_text('# 当前版本：已移除中文配音\n\n保留原创配乐与音效，取消人声压低配乐的处理。主混音只包含 music + sfx；历史 voice 文件未使用。视频编码流复制，画面不变。\n最新验证：26.000秒、780帧、H.264+AAC 48kHz；-14.89 LUFS、-1.36 dBTP。scripts/qa.py通过。\n以下为之前有配音版本的制作记录，配音相关条目不适用于当前输出。\n\n'+s,encoding='utf-8')
p=Path('out/salary-8000/credits.md');s=p.read_text(encoding='utf-8-sig');p.write_text('当前正式版不含配音；仅使用下述原创配乐、音效、图形与字体。Kokoro相关记录仅适用于保留的历史配音资产。\n\n'+s,encoding='utf-8')
