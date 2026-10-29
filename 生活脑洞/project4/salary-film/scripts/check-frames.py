from pathlib import Path
import subprocess,imageio_ffmpeg,numpy as np,json
root=Path(__file__).resolve().parents[1];out=root/'out/salary-8000'
p=subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-i',str(out/'salary-8000-final.mp4'),'-vf','scale=54:96,format=gray','-f','rawvideo','-'],capture_output=True,check=True)
a=np.frombuffer(p.stdout,dtype=np.uint8).reshape(-1,96,54);means=a.mean(axis=(1,2));assert len(a)==780;assert means.min()>10;assert means.max()<250
voices=json.loads((out/'voice-timing.json').read_text(encoding='utf-8'))
assert all(v['start']/30+.06+v['duration']<=v['end']/30 for v in voices)
(out/'all-frame-check.json').write_text(json.dumps({'frames':len(a),'min_mean_luma':float(means.min()),'max_mean_luma':float(means.max()),'no_full_black_or_white_frame':True,'all_voice_clips_fit':True},indent=2))
print('PASS: all 780 frame luminance + 10 voice windows')
