import json,subprocess,imageio_ffmpeg
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1];out=root/'out/salary-8000';video=out/'salary-8000-final.mp4';ff=imageio_ffmpeg.get_ffmpeg_exe()
probe=root/'node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe'
p=subprocess.run([str(probe),'-v','error','-show_streams','-show_format','-of','json',str(video)],capture_output=True,text=True,check=True);(out/'ffprobe.json').write_text(p.stdout)
info=json.loads(p.stdout);vs=next(x for x in info['streams'] if x['codec_type']=='video');au=next(x for x in info['streams'] if x['codec_type']=='audio')
assert (vs['width'],vs['height'],vs['r_frame_rate'],int(vs['nb_frames']))==(1080,1920,'30/1',780)
assert float(info['format']['duration'])==26 and au['codec_name']=='aac'
frames=json.loads((root/'public/audio/cues.json').read_text(encoding='utf-8'))['screenshots']; sheet=Image.new('RGB',(810,2000),'#FFF6E9');d=ImageDraw.Draw(sheet)
for j,f in enumerate(frames):
 path=out/f'frames/{f}.png';subprocess.run([ff,'-v','error','-y','-ss',str(f/30),'-i',str(video),'-frames:v','1',str(path)],check=True)
 im=Image.open(path);sheet.paste(im.resize((270,480)),((j%3)*270,(j//3)*500));d.text(((j%3)*270+10,(j//3)*500+480),f'FRAME {f:03} / {f/30:.2f}s',fill='#151433')
sheet.save(out/'contact-sheet.png')
for frame in [105,450,750]:
 im=Image.open(out/f'frames/{frame}.png').convert('RGBA');dr=ImageDraw.Draw(im);dr.rectangle((90,160,990,1620),outline='#2EE6A8',width=5);im.save(out/f'safe-area-{frame}.png')
p=subprocess.run([ff,'-hide_banner','-i',str(video),'-af','loudnorm=I=-14:TP=-1:LRA=7:print_format=json','-vf','blackdetect=d=0.03:pix_th=0.05','-f','null','-'],capture_output=True,text=True);(out/'av-analysis.txt').write_text(p.stderr)
m=json.JSONDecoder().raw_decode(p.stderr[p.stderr.rfind('{'):])[0];(out/'audio-final.json').write_text(json.dumps(m,indent=2));print('FORMAT PASS',vs['nb_frames'],au['sample_rate'], 'LUFS',m['input_i'],'dBTP',m['input_tp']);assert float(m['input_tp'])<=-1;assert abs(float(m['input_i'])+14)<1;assert 'black_start' not in p.stderr
