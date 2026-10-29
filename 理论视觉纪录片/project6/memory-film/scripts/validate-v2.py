from pathlib import Path
import json,re,csv,numpy as np
r=Path('.');edit=json.loads((r/'src/edit-v2.json').read_text());duration=edit[-1]['new'];frames=round(duration*30)
def m(t):return float(np.interp(t,[x['old'] for x in edit],[x['new'] for x in edit]))
s=(r/'src/MemoryFilm.tsx').read_text(encoding='utf-8');rows=[]
for v in re.finditer(r'<Caption t=\{t\} start=\{([\d.]+)\} end=\{([\d.]+)\}(.*?)>(.*?)</Caption>',s):
 a,b=m(float(v[1])),m(float(v[2]));text=v[4];note='note=' in v[3];hold=2.05 if note else 1.85 if len(text)>14 else .82 if len(text)<4 else 1.55;candidate=max(a,b-hold);onset=max(a,round((candidate-.4376)/.531926)*.531926+.4376)
 rows.append({'caption':text,'start':round(onset,3),'nextAction':round(b,3),'secondsVisible':round(b-onset,3),'startFrame':round(onset*30)})
assert max(x['secondsVisible'] for x in rows)<2.35
assert all(x['secondsVisible']>.65 for x in rows)
assert frames==2471 and all(edit[i]['new']<edit[i+1]['new'] for i in range(len(edit)-1))
assert 'scale={1.6}' in s and all(x in s for x in ["'lock'","'wipe'","'rise'","'track'"])
with (r/'docs/captions-v2.csv').open('w',newline='',encoding='utf-8-sig') as f:
 w=csv.DictWriter(f,fieldnames=rows[0].keys());w.writeheader();w.writerows(rows)
(r/'docs/validation-v2.json').write_text(json.dumps({'passed':True,'duration':duration,'frames':frames,'captionCount':len(rows),'maxCaptionHold':max(x['secondsVisible'] for x in rows),'minCaptionHold':min(x['secondsVisible'] for x in rows),'carScaleChange':1.6/.85,'captionStyles':4},indent=2))
q=(r/'scripts/qa.py').read_text(encoding='utf-8').replace('记忆会撒谎.mp4','记忆会撒谎-v2.mp4').replace("'30/1',3900","'30/1',2471").replace("-130)<.1",f"-{duration})<.1").replace('qa/final-seconds','qa/v2-seconds').replace('qa/final-contact-','qa/v2-contact-').replace('docs/loudness.txt','docs/loudness-v2.txt').replace('docs/final-media.json','docs/final-media-v2.json')
(r/'scripts/qa-v2.py').write_text(q,encoding='utf-8')
print(json.dumps({'frames':frames,'duration':duration,'captions':len(rows),'holdRange':[min(x['secondsVisible'] for x in rows),max(x['secondsVisible'] for x in rows)]}))
