from PIL import Image,ImageDraw
from pathlib import Path
root=Path('qa'); files=sorted((root/'stills').glob('*.png'),key=lambda x:float(x.stem))
for k in range(0,len(files),16):
 s=Image.new('RGB',(1600,4*252),'#151717');d=ImageDraw.Draw(s)
 for j,f in enumerate(files[k:k+16]):
  x=j%4*400;y=j//4*252;im=Image.open(f);im.thumbnail((400,225));s.paste(im,(x,y));d.text((x+8,y+230),f.stem+' sec',fill='white')
 s.save(root/f'storyboard-{k//16}.jpg')
