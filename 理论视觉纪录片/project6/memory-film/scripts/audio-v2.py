from pathlib import Path
import json,numpy as np
from scipy.io import wavfile
r=Path(__file__).resolve().parents[1]; sr=48000
edit=json.loads((r/'src/edit-v2.json').read_text());duration=edit[-1]['new'];archive=next(x['new'] for x in edit if x['old']==102.567);ending=next(x['new'] for x in edit if x['old']==119.589)
def mapped(t):
 return float(np.interp(t,[x['old'] for x in edit],[x['new'] for x in edit]))
_,music=wavfile.read(r/'qa/music-decoded.wav');_,oldfx=wavfile.read(r/'out/记忆会撒谎_SFX.wav');oldfx=oldfx.astype(float)/32768
mix=np.zeros((round(duration*sr),2));sfx=np.zeros_like(mix)
def lay(start,end,source,cross=.018):
 a=round(start*sr);b=round(end*sr);q=round(source*sr);segment=music[q:q+b-a].copy();n=min(round(cross*sr),len(segment));segment[:n]*=np.linspace(0,1,n)[:,None];segment[-n:]*=np.linspace(1,0,n)[:,None];mix[a:b]=segment
lay(0,archive,0);lay(archive,ending,102.567);lay(ending,duration,164.803)
mix*=.69
mix[-round(2*sr):]*=np.linspace(1,0,round(2*sr))[:,None]
events=json.loads((r/'docs/sfx-events.json').read_text());new_events=[]
for e in events:
 sec=e['timeSec'];target=round(mapped(sec)*30)/30
 n=round({'tick':.07,'hit':.65,'glass':.8,'paper':.26,'reel':.04}[e['kind']]*sr);a=round(round(sec*30)/30*sr);b=round(target*sr);n=min(n,len(sfx)-b)
 if n>0:sfx[b:b+n]+=oldfx[a:a+n]
 new_events.append({**e,'oldTimeSec':sec,'timeSec':target,'frame':round(target*30)})
mix+=sfx;mix*=min(1,.85/max(abs(mix).max(),1e-9))
wavfile.write(r/'public/audio/mix-v2.wav',sr,(mix*32767).astype(np.int16));wavfile.write(r/'out/记忆会撒谎-v2-SFX.wav',sr,(sfx*32767).astype(np.int16))
(r/'docs/sfx-events-v2.json').write_text(json.dumps(new_events,ensure_ascii=False,indent=2),encoding='utf-8')
(r/'docs/music-edit-v2.json').write_text(json.dumps({'duration':duration,'segments':[{'video':[0,archive],'musicStart':0},{'video':[archive,ending],'musicStart':102.567},{'video':[ending,duration],'musicStart':164.803}],'joinEnvelopeMs':18,'finalFadeSeconds':2,'narration':False,'subjectiveListeningVerified':False},indent=2))
print('V2 mix',duration,'seconds')
