from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
import json, wave

ROOT=Path(__file__).resolve().parents[1]
rng=np.random.default_rng(521)
colors={'paper':(233,223,200),'blue':(40,56,71),'red':(180,92,70),'gold':(197,162,105),'skin':(215,174,133),'ink':(37,35,34),'news':(204,195,173)}
for name,c in colors.items():
 n=rng.normal(0,5,(512,512,1)); a=np.clip(np.array(c)[None,None,:]+n,0,255).astype('uint8')
 im=Image.fromarray(a);d=ImageDraw.Draw(im,'RGBA')
 for i in range(2200):
  x,y=rng.integers(0,512,2); l=int(rng.integers(1,10));d.line((int(x),int(y),int(x+l),int(y+1)),fill=(255,246,216,int(rng.integers(8,35))))
 if name=='news':
  for y in range(8,512,13):
   for x in range(5,512,9):
    d.line((x,y,x+int(rng.integers(3,7)),y),fill=(37,35,34,90),width=2)
 im.save(ROOT/'public'/f'{name}.png')

cues=json.loads((ROOT/'src/cues.json').read_text())
SR=48000;D=cues['duration'];out=np.zeros((D*SR,2),dtype=np.float64)
def add(sig,t,vol=1,pan=0):
 i=int(t*SR);e=min(len(out),i+len(sig));n=e-i
 if n<=0:return
 out[i:e,0]+=sig[:n]*vol*np.sqrt((1-pan)/2);out[i:e,1]+=sig[:n]*vol*np.sqrt((1+pan)/2)
def tone(freq,d,kind='wood'):
 t=np.arange(int(d*SR))/SR
 if kind=='bass':return (np.sin(2*np.pi*freq*t)+.22*np.sin(4*np.pi*freq*t))*np.exp(-t*5)*np.minimum(t*150,1)
 return (np.sin(2*np.pi*freq*t)*np.exp(-t*10)+.33*np.sin(2*np.pi*freq*2.76*t)*np.exp(-t*25))*np.minimum(t*350,1)
def paper(d,heavy=False):
 t=np.arange(int(d*SR))/SR;n=rng.normal(0,1,len(t));n=n-np.roll(n,1)*.72
 grain=(.15+.85*np.sin(2*np.pi*(36 if heavy else 65)*t)**8)
 env=np.sin(np.pi*np.minimum(t/d,1))**.7
 return n*grain*env*.23+(np.sin(2*np.pi*76*t)*np.exp(-t*9)*.12 if heavy else 0)
# Original pizzicato / wooden miniature waltz, grows in density without borrowed samples.
notes=[293.665,349.228,440,523.251,440,349.228,329.628,261.626]
t=0.15;beat=0
while t<42.6:
 step=.43 if t<22 else (.35 if t<34 else .26)
 gain=.11 if t<16 else .14
 add(tone(notes[(beat*3+beat//8)%8],.5),t,gain,(-.3 if beat%2 else .3))
 if beat%3==0:add(tone([73.416,87.307,65.406,82.407][(beat//12)%4],.65,'bass'),t,.15)
 if beat%2==0:add(paper(.055),t+.02,.10,-.45)
 if t>26 and beat%4==2:add(tone(587.33,.3),t+.16,.07,.4)
 t+=step;beat+=1
for k,t in enumerate(cues['swipes']):
 # Contact, swipe and the tear use the same event timestamps as the image.
 add(tone(890,.055),t,.13,-.2)
 add(paper(.13),t+.05,.25,-.25)
 add(paper(.48 if t<34 else .65,t>34),t+.4,.8 if t<34 else 1.1,.45)
 if t<42:add(paper(.25),t+1.35,.30,-.1)
add(paper(2.6,True),39.1,1.8,.2)
for i in range(20):add(paper(.15+(i%3)*.08),40.1+i*.12,.38, float(rng.uniform(-.7,.7)))
# Cut the musical tail at awareness, keep quiet room tone and sparse landing scraps.
cut=int(42.6*SR);out[cut:]*=.17
for t in [43.3,44.4,46.8,48.2,54.8,56.8]:add(paper(.22),t,.13,.3)
room=rng.normal(0,1,D*SR);room=np.convolve(room,np.ones(20)/20,mode='same');add(room,0,.003)
add(tone(146.83,1.8,'bass'),54.2,.08)
out*=np.minimum(np.arange(len(out))/480,1)[:,None]
out[-2400:]*=np.linspace(1,0,2400)[:,None]
peak=np.max(np.abs(out));out=out/max(peak,1)*.85
with wave.open(str(ROOT/'public'/'soundtrack.wav'),'wb') as w:
 w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((out*32767).astype('<i2').tobytes())
print('Original textures and stereo soundtrack generated', peak)
