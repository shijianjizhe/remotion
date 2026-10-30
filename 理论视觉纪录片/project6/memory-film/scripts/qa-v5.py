from pathlib import Path
import subprocess,json,io,sys
import numpy as np
from PIL import Image,ImageDraw
import imageio_ffmpeg

root=Path(__file__).resolve().parents[1];ff=imageio_ffmpeg.get_ffmpeg_exe()
mode=sys.argv[1] if len(sys.argv)>1 else 'preview'
video=root/f'out/记忆会撒谎-v5{"-preview" if mode=="preview" else ""}.mp4'
timeline=json.loads((root/'src/v5-timeline.json').read_text(encoding='utf-8'))
probe=root/'node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe'
meta=json.loads(subprocess.check_output([str(probe),'-v','error','-show_streams','-show_format','-of','json',str(video)]))
v=next(s for s in meta['streams'] if s['codec_type']=='video');a=next(s for s in meta['streams'] if s['codec_type']=='audio')
assert int(v['nb_frames'])==timeline['durationInFrames']
assert (v['width'],v['height'])==((960,540) if mode=='preview' else (1920,1080))
assert a['sample_rate']=='48000' and a['channels']==2
decode=subprocess.run([ff,'-v','error','-i',str(video),'-f','null','-'],capture_output=True,text=True)
assert decode.returncode==0 and not decode.stderr,decode.stderr
out=root/f'qa/v5-{mode}';out.mkdir(exist_ok=True)
shots=timeline['shots'];captions=[]
for i,s in enumerate(shots):
 assert s['fromFrame']==(shots[i-1]['toFrame'] if i else 0)
 reveal=(len(s['caption'])*2+3 if s['captionMode']=='type' else 10)
 hold=(s['toFrame']-s['captionFrame']-reveal)/30
 assert hold>=1.0,(s['id'],hold)
 captions.append({'id':s['id'],'fullyReadableSeconds':round(hold,3)})
 frame=min(s['toFrame']-15,s['fromFrame']+max(70,round((s['toFrame']-s['fromFrame'])*.72)))
 data=subprocess.check_output([ff,'-v','error','-ss',str(frame/30),'-i',str(video),'-frames:v','1','-vf','scale=960:540','-f','image2pipe','-vcodec','png','-'])
 image=Image.open(io.BytesIO(data));image.save(out/f"{s['id']}.png")
for k in range(0,len(shots),8):
 sheet=Image.new('RGB',(1920,4*575),'#101412');draw=ImageDraw.Draw(sheet)
 for j,s in enumerate(shots[k:k+8]):
  x=j%2*960;y=j//2*575;sheet.paste(Image.open(out/f"{s['id']}.png"),(x,y));draw.text((x+12,y+545),f"{s['id']} | {s['fromFrame']/30:.3f} - {s['toFrame']/30:.3f}s",fill='white')
 sheet.save(out/f'contact-{k//8+1}.jpg')
sound=np.frombuffer(subprocess.check_output([ff,'-v','error','-i',str(video),'-vn','-f','f32le','-']),dtype=np.float32)
report={'video':str(video),'duration':meta['format']['duration'],'frames':v['nb_frames'],'resolution':[v['width'],v['height']],'fullDecodePassed':True,'audioPeakDbFS':float(20*np.log10(np.max(abs(sound)))),'clippedSamples':int(np.sum(abs(sound)>=1)),'captions':captions,'shotSamples':len(shots),'subjectiveListeningVerified':False}
(root/f'docs/v5-{mode}-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='captions'},ensure_ascii=False))
