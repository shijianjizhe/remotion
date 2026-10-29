from pathlib import Path
import subprocess,json,re
import numpy as np
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]
bin=root/'node_modules/@remotion/compositor-win32-x64-msvc'
import imageio_ffmpeg
ff=imageio_ffmpeg.get_ffmpeg_exe();probe=str(bin/'ffprobe.exe');video=root/'out/记忆会撒谎-v2.mp4'
meta=json.loads(subprocess.check_output([probe,'-v','error','-show_streams','-show_format','-of','json',str(video)]))
v=next(x for x in meta['streams'] if x['codec_type']=='video');a=next(x for x in meta['streams'] if x['codec_type']=='audio')
assert (v['width'],v['height'],v['r_frame_rate'],int(v['nb_frames']))==(1920,1080,'30/1',2471)
assert a['channels']==2 and abs(float(meta['format']['duration'])-82.36666666666666)<.1
decode=subprocess.run([ff,'-hide_banner','-v','error','-i',str(video),'-f','null','-'],capture_output=True,text=True,encoding="utf-8",errors="replace")
assert decode.returncode==0 and not decode.stderr,decode.stderr
folder=root/'qa/v2-seconds';folder.mkdir(exist_ok=True)
subprocess.run([ff,'-y','-v','error','-i',str(video),'-vf','fps=1,scale=480:270',str(folder/'%03d.jpg')],check=True)
frames=sorted(folder.glob('*.jpg'));diff=[];prev=None
for k in range(0,len(frames),24):
 sheet=Image.new('RGB',(1920,6*298),'#151717');d=ImageDraw.Draw(sheet)
 for j,f in enumerate(frames[k:k+24]):
  img=Image.open(f);x=j%4*480;y=j//4*298;sheet.paste(img,(x,y));d.text((x+9,y+275),f'{k+j+0.5:05.1f} s',fill='white')
 sheet.save(root/f'qa/v2-contact-{k//24+1}.jpg')
for i,f in enumerate(frames):
 arr=np.array(Image.open(f),dtype=float)[50:220,25:455]
 if prev is not None: diff.append({'second':i+.5,'meanAbsolutePixelDifference':float(np.abs(arr-prev).mean())})
 prev=arr
audio=np.frombuffer(subprocess.check_output([ff,'-v','error','-i',str(video),'-vn','-ac','2','-ar','48000','-f','f32le','-']),dtype=np.float32)
peak=float(np.max(np.abs(audio)))
loudness=subprocess.run([ff,'-hide_banner','-i',str(video),'-vn','-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True,encoding="utf-8",errors="replace")
(root/'docs/loudness-v2.txt').write_text(loudness.stderr[-1700:],encoding='utf-8')
report={'video':v,'audio':a,'duration':meta['format']['duration'],'sizeBytes':video.stat().st_size,'fullDecodePassed':True,'aacDecodedSamplePeakDbFS':float(20*np.log10(peak)),'clippedSamples':int(np.sum(abs(audio)>=1)),'sampledFrames':len(frames),'motionPerSecond':diff,'subjectivePlaybackVerified':False}
(root/'docs/final-media-v2.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:report[k] for k in ['duration','sizeBytes','fullDecodePassed','aacDecodedSamplePeakDbFS','clippedSamples','sampledFrames']},ensure_ascii=False))


