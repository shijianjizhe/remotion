import json, numpy as np, soundfile as sf, sherpa_onnx, subprocess, imageio_ffmpeg
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'tools/kokoro-int8-multi-lang-v1_1'
c=json.loads((root/'public/audio/cues.json').read_text(encoding='utf-8'))
config=sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=str(p/'model.int8.onnx'),voices=str(p/'voices.bin'),tokens=str(p/'tokens.txt'),lexicon=str(p/'lexicon-zh.txt'),data_dir=str(p/'espeak-ng-data'),dict_dir=str(p/'dict'),lang='zh'),num_threads=4),max_num_sentences=1)
tts=sherpa_onnx.OfflineTts(config)
report=[]
for i,line in enumerate(c['narration']):
 out=root/f'public/audio/voice-{i:02}.wav'
 if not out.exists():
  audio=tts.generate(line['text'],sid=58,speed=1.05 if i<8 else .95)
  a=np.asarray(audio.samples); active=np.where(np.abs(a)>.006)[0]
  if len(active): a=a[max(0,active[0]-1200):min(len(a),active[-1]+2400)]
  sf.write(out,a,audio.sample_rate)
 a,sr=sf.read(out); duration=len(a)/sr
 limit=(line['end']-line['start'])/30-.15
 if duration>limit:
  temp=out.with_suffix('.temp.wav')
  subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-y','-i',str(out),'-af',f'atempo={duration/limit}',str(temp)],check=True)
  temp.replace(out)
 a,sr=sf.read(out)
 report.append(dict(**line,duration=len(a)/sr,speaker=58))
 print(i,round(len(a)/sr,3),flush=True)
(root/'out/salary-8000/voice-timing.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')

