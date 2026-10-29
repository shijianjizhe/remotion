from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json
root=Path(__file__).resolve().parents[1];qa=root/'output/qa'
files=sorted((qa/'sequence').glob('*.jpg'))
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20)
for page in range((len(files)+23)//24):
 canvas=Image.new('RGB',(6*270,4*514),'#e9dfc8');d=ImageDraw.Draw(canvas)
 for n,p in enumerate(files[page*24:(page+1)*24]):
  x=n%6*270;y=n//6*514;canvas.paste(Image.open(p),(x,y));d.text((x+10,y+485),f'{(page*24+n)*.5:04.1f}s',font=font,fill='#283847')
 canvas.save(qa/f'full-review-{page+1}.jpg',quality=90)
diffs=[];prev=None
for p in files:
 a=np.array(Image.open(p)).astype(float)
 if prev is not None:diffs.append(float(np.mean(abs(a-prev))))
 prev=a
meta=json.loads((qa/'ffprobe.json').read_text());video=next(s for s in meta['streams'] if s['codec_type']=='video');audio=next(s for s in meta['streams'] if s['codec_type']=='audio')
assert video['width']==1080 and video['height']==1920
assert video['r_frame_rate']=='30/1'
assert abs(float(meta['format']['duration'])-58)<.1
assert audio['sample_rate']=='48000' and audio['channels']==2
assert video['codec_name']=='h264' and audio['codec_name']=='aac'
log=(qa/'full-scan.log').read_text()
issues=[l for l in log.splitlines() if 'black_start:' in l or 'freeze_start:' in l]
report={'resolution':'1080x1920','fps':30,'duration':meta['format']['duration'],'video_codec':video['codec_name'],'audio_codec':audio['codec_name'],'sample_rate':48000,'channels':2,'black_or_freeze_events':issues,'half_second_motion_mean_abs_difference_min':min(diffs),'half_second_motion_mean_abs_difference_median':float(np.median(diffs)),'review_samples':len(files)}
(qa/'checks.json').write_text(json.dumps(report,indent=2))
poster=Image.new('RGB',(1080,2030),'#e9dfc8');pd=ImageDraw.Draw(poster)
zh=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',25)
for i,(name,label) in enumerate([('first-theft','首次偷取'),('climax','撕掉夜晚'),('hand-reveal','同形手势'),('last-pullback','最后拉远')]):
 x=i%2*540;y=i//2*1015
 poster.paste(Image.open(root/'output'/f'{name}.png').resize((540,960)),(x,y))
 pd.text((x+25,y+975),label,font=zh,fill='#283847')
poster.save(root/'output/keyframes.jpg',quality=94)
print(json.dumps(report,indent=2))
