from pathlib import Path
import subprocess,json,numpy as np
from PIL import Image,ImageDraw
import imageio_ffmpeg,urllib.request
root=Path(__file__).resolve().parents[1]; info=root.parents[1]/'infomation'; ff=imageio_ffmpeg.get_ffmpeg_exe()
qa=root/'qa'
ref=info/'参考视频'/'运气的形状.mp4'
subprocess.run([ff,'-y','-v','error','-i',str(ref),'-vf','fps=1/2,scale=384:216',str(qa/'ref-%03d.jpg')],check=True)
frames=list(qa.glob('ref-*.jpg'))
for k in range(0,len(frames),24):
 sheet=Image.new('RGB',(1536,6*244),'#181817');d=ImageDraw.Draw(sheet)
 for j,p in enumerate(frames[k:k+24]):
  x=(j%4)*384;y=(j//4)*244;sheet.paste(Image.open(p),(x,y));d.text((x+8,y+218),f'{(k+j)*2:03d}s',fill='white')
 sheet.save(qa/f'reference-{k//24}.jpg')
subprocess.run([ff,'-y','-v','error','-i',str(root/'public/audio/music.m4a'),'-ar','22050','-ac','1',str(qa/'analysis.wav')],check=True)
for url,name in [('https://thegricean.github.io/xprag-ling247/readings/loftus1974.pdf','loftus1974.pdf')]:
 try: urllib.request.urlretrieve(url,root/'docs'/name)
 except Exception as e: print(e)
import fitz
pdf=fitz.open(root/'docs/loftus1974.pdf');pdf[1].get_pixmap(matrix=fitz.Matrix(2,2)).save(qa/'paper-table.png')
import librosa
wave,sr=librosa.load(qa/'analysis.wav',sr=22050)
onset=librosa.onset.onset_strength(y=wave,sr=sr,hop_length=256)
tempo,beats=librosa.beat.beat_track(onset_envelope=onset,sr=sr,hop_length=256)
peakidx=librosa.onset.onset_detect(onset_envelope=onset,sr=sr,hop_length=256,backtrack=False)
peaks=librosa.frames_to_time(peakidx,sr=sr,hop_length=256)
beatmap=json.loads((root/'src/music-beatmap.json').read_text(encoding='utf-8'))
checks=[]
for cue in beatmap['featuredAccents']:
 t=cue['timeSec']; nearest=float(peaks[np.argmin(abs(peaks-t))]); checks.append({'cue':cue['id'],'documentSec':t,'detectedOnsetSec':nearest,'deltaMs':round((nearest-t)*1000)})
report={'durationSec':len(wave)/sr,'independentBpm':float(np.asarray(tempo).ravel()[0]),'documentBpm':beatmap['bpmEstimate'],'onsetChecks':checks,'note':'Onset detection verifies transients, not subjective listening or musical meter.'}
(root/'docs/audio-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False))
