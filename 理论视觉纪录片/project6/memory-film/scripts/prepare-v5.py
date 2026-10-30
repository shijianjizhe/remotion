from pathlib import Path
import json, subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter,sosfilt
import imageio_ffmpeg

root=Path(__file__).resolve().parents[1]
src=root.parent.parent/'infomation/音乐/music-beat-pack/music.m4a'
ff=imageio_ffmpeg.get_ffmpeg_exe();sr=48000
raw=subprocess.check_output([ff,'-v','error','-i',str(src),'-ar',str(sr),'-ac','2','-f','f32le','-'])
music=np.frombuffer(raw,dtype=np.float32).reshape(-1,2)
cut=68.524; resume=85.546
frames=4161;duration=frames/30
second_end=resume+duration-cut
mix=np.zeros((round(duration*sr),2),np.float32)
n=round(cut*sr);mix[:n]=music[:n]
second=music[round(resume*sr):round(second_end*sr)].copy()
blend=round(.025*sr)
mix[n-blend:n]*=np.linspace(1,0,blend)[:,None]
mix[n-blend:n]+=music[round(resume*sr)-blend:round(resume*sr)]*np.linspace(0,1,blend)[:,None]
mix[n:n+len(second)]=second
mix*=.78;mix[-round(.8*sr):]*=np.linspace(1,0,round(.8*sr))[:,None]
mix*=min(1,.89/np.max(abs(mix)))
wavfile.write(root/'public/audio/mix-v5.wav',sr,(mix*32767).astype(np.int16))
shots=[
('A01',0,'词卡启动','看过的词，你能认出来吗？'),('A02',3.63,'中文词表','你记住了哪些词？'),('A03',8.95,'关闭词表','有一个词，从未出现'),('A04',12.14,'空位补出睡眠','睡眠：未呈现'),('A05',17.459,'两个独立实验','联想，也可能制造回忆'),('A06',22.779,'实际与回忆错位','我们可能记起不存在的信息'),
('B01',25.97,'事故胶片','原片里，没有碎玻璃'),('B02',30.224,'三组点阵','150名学生，三组各50人'),('B03',33.416,'问句条件','差别，在先前的提问'),('B04',38.735,'一周后','一周后，不再播放影片'),('B05',42.991,'玻璃问题','你看到碎玻璃了吗？'),('B06',46.182,'三组回答比例','回答“看见了”的比例'),('B07',50.437,'原片与报告','原始记录，不等于后来报告'),
('C01',54.693,'童年照片档案','如果错记的，是一段童年？'),('C02',59.48,'照片加工','这张照片，经过加工'),('C03',64.269,'第一次访谈','第一次访谈：尝试回忆'),('C04',69.589,'第二次访谈','第二次访谈：继续回忆'),('C04b',74.908,'第三次访谈','第三次访谈：再次报告'),('C05',80.227,'核对事实','这次热气球之旅，从未发生'),('C06',85.545,'20人研究结果','完整或部分的虚假记忆报告'),('C07',90.865,'条件归档','照片、引导想象、三次访谈'),
('D01',95.12,'八项研究','单项实验之外，如何归类？'),('D02',99.375,'统一编码','用同一套标准，重新判断'),('D03',103.63,'423案例分类','30.4% 被归类为虚假记忆'),('D04',107.886,'另一类接受','接受暗示，不等于同一种分类'),
('E01',112.14,'来源分流','这段记忆，来自哪里？'),('E02',115.33,'来源标签错配','来源判断，也可能出错'),('E03',119.589,'54学生两类记录','记住的，是自己如何得知消息'),('E04',123.844,'分组复测','1、6或32周后，再次记录'),('E05',128.1,'一致性与确信分离','确信感，不能独立证明准确'),
('F01',132.35,'证据归档','原始记录与主观回忆，可以不同'),('F02',135.01,'最终结论','清晰，不等于真实')]
rows=[]
def source_time(t):return t if t<cut else t+resume-cut
for i,(id,t,action,caption) in enumerate(shots):
 f=round(t*30);end=round(shots[i+1][1]*30) if i+1<len(shots) else frames
 mode=['type','rise','lock'][i%3]
 reveal=len(caption)*2+3 if mode=='type' else 10
 cap=max(f+12,end-reveal-42)
 if id in ['A01','A02','C03','C04','C04b']:cap=f+12
 if id=='B06':cap=f+85
 if id=='F02':cap=f
 rows.append(dict(id=id,fromFrame=f,toFrame=end,action=action,caption=caption,captionFrame=cap,captionMode=mode,sourceTime=source_time(f/30)))
data={'fps':30,'durationInFrames':frames,'duration':duration,'shots':rows,'musicEdits':[{'videoStart':0,'sourceStart':0,'sourceEnd':cut},{'videoStart':cut,'sourceStart':resume,'sourceEnd':second_end,'finalFadeSeconds':.8}]}
(root/'src/v5-timeline.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
mono=music.mean(1);low=sosfilt(butter(3,160,fs=sr,output='sos'),mono)
cue=['# V5 音画对点表','',f'30 fps；{frames} 帧；{duration:.3f} 秒。基于原 music.m4a（192.842 秒），未使用 V4 混音。', '', '原曲 0–68.524 秒接 85.546–155.722 秒，省去主段 A 的重复乐句；接点前 25 ms 平滑。取消原静音尾段，持续配乐至最后0.8秒淡出。原曲长度足够，不变速、不循环。','', '核对等级：已有配乐分析 + 原音源低频/全频波形复核 + 绝对帧换算。当前工具不支持主观听音，未把自动网格的每个小节首拍宣称为人工确认重音。尾声继续原曲有效主段，不强称每次字幕均有重拍。','', '|镜号|视频秒 / 帧|原音源秒|音乐依据|画面动作 / 信息|字幕入场帧|','|---|---|---|---|---|---|']
for r in rows:
 st=r['sourceTime'];a=max(0,round((st-.1)*sr));b=min(len(mono),round((st+.1)*sr))
 rms=float(np.sqrt(np.mean(low[a:b]**2)))
 event='拟合拍点 / 乐句内接力'
 if r['id']=='A05':event='17.459 主段 A 进入'
 if r['id']=='C06':event='102.567 主段 B 进入（误差 < 1 帧）'
 if r['id']=='C04':event='收敛段：减少动效，展开访谈'
 if r['id']=='E03':event='136.611 音色结构切换'
 if r['fromFrame']/30>=128.1:event='原曲主段延续 / 结尾最后0.8秒淡出'
 cue.append(f"|{r['id']}|{r['fromFrame']/30:.3f} / {r['fromFrame']}|{st:.3f}|{event}；低频 RMS {rms:.4f}|{r['action']}：{r['caption']}|{r['captionFrame']}|")
cue+=['','关键内部读数：A05 两个实验分别在入场 +16 / +80 帧锁定；B06 每组点阵先显分母50，再在 +24 / +48 / +72 帧显示 32% / 14% / 12%，字幕在+85帧接入；C06 在主段 B 命中帧突出金色结果区，+16帧锁定 10/20；D03 与 D04 分镜呈现不同分类，D04保留30.4%区域并另开23%区域，不做百分比累计。','字幕：逐字淡入、短升起、轻缩放三种；逐字固定字位，没有横向擦除。结果后以短解释接棒，普通镜头字幕全显后约1.4秒推进。词卡与访谈的字幕先出现，上方新信息继续推进。']
(root/'docs/v5_cue_sheet.md').write_text('\n'.join(cue),encoding='utf-8')
(root/'docs/v5-audio-analysis.json').write_text(json.dumps({'sampleRate':sr,'sourceDuration':len(music)/sr,'duration':duration,'peakDbFS':float(20*np.log10(np.max(abs(mix)))),'subjectiveListeningVerified':False,'edits':data['musicEdits']},indent=2),encoding='utf-8')
print(json.dumps({'frames':frames,'duration':duration,'shots':len(rows),'peak':float(np.max(abs(mix)))},ensure_ascii=False))
