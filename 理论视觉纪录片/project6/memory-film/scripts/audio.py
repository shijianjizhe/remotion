from pathlib import Path
import subprocess, json
import numpy as np
from scipy.io import wavfile
import imageio_ffmpeg
root=Path(__file__).resolve().parents[1]
ff=imageio_ffmpeg.get_ffmpeg_exe(); sr=48000
subprocess.run([ff,'-y','-v','error','-i',str(root/'public/audio/music.m4a'),'-ar',str(sr),'-ac','2','-c:a','pcm_f32le',str(root/'qa/music-decoded.wav')],check=True)
_,music=wavfile.read(root/'qa/music-decoded.wav')
mix=np.zeros((130*sr,2),dtype=np.float64)
# Preserve original soundtrack 0–119.589; crossfade to its natural decay.
cut=119.589; cross=.8; tailstart=181.630723356
n=round(cut*sr);mix[:n]=music[:n]
start=round((cut-cross)*sr); tail=music[round(tailstart*sr):]
end=min(len(mix),start+len(tail)); tail=tail[:end-start].copy()
crossn=round(cross*sr)
mix[start:start+crossn]*=np.linspace(1,0,crossn)[:,None]
tail[:crossn]*=np.linspace(0,1,crossn)[:,None]
mix[start:end]+=tail
mix*=.76
sfx=np.zeros_like(mix);rng=np.random.default_rng(1974)
events=[]
def add(sec,kind,level=.08):
 dur={'tick':.07,'hit':.65,'glass':.8,'paper':.26,'reel':.04}[kind]
 t=np.arange(round(dur*sr))/sr
 if kind=='hit':
  wave=np.sin(2*np.pi*(75*t-35*t*t))*np.exp(-t*8)+.11*rng.normal(0,1,len(t))*np.exp(-t*32)
 elif kind=='glass':
  wave=sum(np.sin(2*np.pi*f*t+f/300)*np.exp(-t*(8+i*3)) for i,f in enumerate([1703,2311,3187,4501]))/5
 elif kind=='paper':
  noise=rng.normal(0,1,len(t)); wave=(noise-np.roll(noise,1))*.25*np.sin(np.pi*t/dur)**2
 else:
  wave=np.sin(2*np.pi*(1400 if kind=='tick' else 420)*t)*np.exp(-t*(90 if kind=='tick' else 120))
 wave*=level; idx=round(round(sec*30)/30*sr); sfx[idx:idx+len(wave),0]+=wave; sfx[idx:idx+len(wave),1]+=wave*.88
 events.append({'timeSec':sec,'frame':round(sec*30),'kind':kind,'gain':level})
for sec in np.arange(.438,8.8,.531926):add(float(sec),'reel',.025)
for sec in [13.204,17.459,34.480,102.567]:add(sec,'hit',.12)
for sec in [30.224,55.756,57.884,60.011,89.801]:add(sec,'tick',.055)
for sec in [42.991,47.246,68.523,106.822,119.589,124.8]:add(sec,'paper',.045)
for sec in [66.386]:add(sec,'glass',.09)
for sec in [74.37+i*.532 for i in range(8)]:add(sec,'paper',.035)
mix+=sfx
mix[:int(.12*sr)]*=np.linspace(0,1,int(.12*sr))[:,None]
mix[-sr:]*=np.linspace(1,0,sr)[:,None]
peak=float(abs(mix).max()); gain=min(1,.89125/max(peak,1e-9)); mix*=gain
wavfile.write(root/'public/audio/mix.wav',sr,(mix*32767).astype(np.int16))
wavfile.write(root/'out/记忆会撒谎_SFX.wav',sr,(sfx*32767).astype(np.int16))
(root/'docs/sfx-events.json').write_text(json.dumps(events,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'docs/mix-report.json').write_text(json.dumps({'sampleRate':sr,'duration':130,'music':'music.m4a','originalUntil':cut,'crossfadeSeconds':cross,'tailSourceStart':tailstart,'peakDbFS':20*np.log10(abs(mix).max()),'limiterGain':gain,'narration':False,'subjectiveListeningVerified':False},indent=2),encoding='utf-8')
print('Mixed 130 seconds; peak dBFS',20*np.log10(abs(mix).max()))
