from PIL import Image,ImageDraw
from pathlib import Path
fs=sorted(Path('qa/v2-stills').glob('*.png'),key=lambda p:float(p.stem))
for k in range(0,len(fs),16):
 s=Image.new('RGB',(1600,1008),'#121615');d=ImageDraw.Draw(s)
 for j,f in enumerate(fs[k:k+16]):
  x=j%4*400;y=j//4*252;im=Image.open(f);im.thumbnail((400,225));s.paste(im,(x,y));d.text((x+8,y+230),f.stem+'s',fill='white')
 s.save(f'qa/v2-board-{k//16}.jpg')
