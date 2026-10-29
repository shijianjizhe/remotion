import numpy as np,soundfile as sf,json,subprocess,imageio_ffmpeg
from pathlib import Path
from scipy.signal import resample_poly
root=Path(__file__).resolve().parents[1]; out=root/'public/audio'; sr=48000; n=sr*26
c=json.loads((out/'cues.json').read_text(encoding='utf-8')); rng=np.random.default_rng(8000)
voice=np.zeros(n); music=np.zeros((n,2)); fx=np.zeros((n,2))
def put(track,a,time,pan=0):
 pos=round(time*sr); a=a[:max(0,n-pos)];
 if track.ndim==1: track[pos:pos+len(a)]+=a
 else:
  track[pos:pos+len(a),0]+=a*np.sqrt((1-pan)/2);track[pos:pos+len(a),1]+=a*np.sqrt((1+pan)/2)
def tone(freq,dur,amp=.15,decay=8):
 t=np.arange(int(dur*sr))/sr;return amp*(np.sin(2*np.pi*freq*t)+.2*np.sin(4*np.pi*freq*t))*np.exp(-t*decay)*np.minimum(1,t*400)
# Original 120 BPM syncopated pluck / bass pattern, no sampled recording.
notes=[60,64,67,71,67,64,62,67,59,62,65,69,65,62,57,64]
for beat in range(52):
 sec=beat*.5
 if 17.5<=sec<18: continue
 gain=.15 if sec<17.5 else .065
 midi=notes[beat%len(notes)]
 put(music,tone(440*2**((midi-69)/12),.43,gain,10),sec,(-1 if beat%2 else 1)*.35)
 if beat%2==0: put(music,tone(440*2**((midi-24-69)/12),.45,.15 if sec<17.5 else .05,8),sec)
 if sec<17.5:
  t=np.arange(int(.18*sr))/sr
  if beat%2==0: put(music,.26*np.sin(2*np.pi*(46*t+3*(1-np.exp(-t*30))))*np.exp(-t*24),sec)
  else: put(music,rng.normal(0,.05,len(t))*np.exp(-t*36),sec)
  for off in [0,.25]:
   t=np.arange(int(.05*sr))/sr;put(music,rng.normal(0,.025,len(t))*np.exp(-t*70),sec+off,.4)
for ev in c['audioEvents']:
 sec=ev['frame']/30;kind=ev['kind']
 if kind=='arrival':
  for j,fr in enumerate([660,880,1320]):put(fx,tone(fr,.45,.3,9),sec+j*.055)
 elif kind in ['stamp','grab']:
  t=np.arange(int(.32*sr))/sr;put(fx,.65*np.sin(2*np.pi*(48*t+2*(1-np.exp(-30*t))))*np.exp(-t*15),sec)
  put(fx,tone(180,.22,.15,18),sec+.08)
 elif kind in ['bite','pop']:
  t=np.arange(int(.15*sr))/sr;put(fx,.35*np.sin(2*np.pi*(380*t-650*t*t))*np.exp(-t*27),sec)
 elif kind=='snip':
  t=np.arange(int(.08*sr))/sr;put(fx,rng.normal(0,.3,len(t))*np.exp(-t*50),sec)
 elif kind in ['magnet','train']:
  t=np.arange(int(.35*sr))/sr;put(fx,rng.normal(0,.13,len(t))*np.sin(np.pi*t/.35)**2,sec-.3,-.4)
  put(fx,tone(950,.12,.25,24),sec,.4)
 elif kind=='station':
  for j,fr in enumerate([261.63,329.63,392]):put(fx,tone(fr,.7,.2,5),sec+j*.1)
 if kind not in ['arrival','station']:
  for j in range(3):put(fx,tone(1300+j*280,.12,.09,30),sec+j*.065,(j-1)*.5)
# No narration: retain music and effects without speech ducking.
music[int(17.5*sr):int(18*sr)]=0
mix=music+fx
mix[-int(.18*sr):]*=np.linspace(1,0,int(.18*sr))[:,None]
sf.write(out/'music.wav',music,sr);sf.write(out/'sfx.wav',fx,sr);sf.write(out/'mix.wav',mix,sr,subtype='FLOAT')
ff=imageio_ffmpeg.get_ffmpeg_exe()
p=subprocess.run([ff,'-hide_banner','-i',str(out/'mix.wav'),'-af','loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json','-f','null','-'],capture_output=True,text=True)
measurement=json.JSONDecoder().raw_decode(p.stderr[p.stderr.rfind('{'):])[0];(root/'out/salary-8000/audio-first-pass.json').write_text(json.dumps(measurement,indent=2))
af='acompressor=threshold=0.03:ratio=10:attack=0.1:release=100:makeup=3,loudnorm=I=-14:TP=-2:LRA=7:linear=false'
p=subprocess.run([ff,'-y','-hide_banner','-i',str(out/'mix.wav'),'-af',af,'-ar','48000',str(out/'master.wav')],capture_output=True,text=True,check=True)
(root/'out/salary-8000/audio-mastering.txt').write_text(p.stderr)
print('Master complete',flush=True)

