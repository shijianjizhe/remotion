from pathlib import Path
import json,csv
root=Path(__file__).resolve().parents[1]
t=json.loads((root/'src/v5-timeline.json').read_text(encoding='utf-8'));shots=t['shots']
text=['# V5 改动与精确镜头时间轴','','输出：`out/记忆会撒谎-v5.mp4`；1920×1080、30 fps、4161帧、约138.7秒。低清审看片：`out/记忆会撒谎-v5-preview.mp4`。','','## V4 → V5','', '|V4旧位置|处理|V5新位置|','|---|---|---|','|0–6秒 放映机概念开场|改为词卡问题开场；放映机后移并复用圆润外壳|A01–A04 0–17.467秒；B01 25.967–30.233秒|','|6–12秒 事故胶片|压缩为实验材料，保留大车模型|B01 25.967–30.233秒|','|13–27秒 车速估计|V5完全删除速度条、五动词速度表与所有mph值|无；只在B03保留实验二真实问句条件|','|28–42秒 150人／一周／回答比例|重做为三组各50、问句条件、一周无重播、16/7/6人先于比例|B02–B06 30.233–50.433秒|','|43–48秒 碎玻璃与三份图|重做双层对照；原片侧永无碎玻璃，报告侧明确是示意；进一步放大车|B07 50.433–54.700秒|','|49–68秒 词卡与40/55|移到开篇，中文演示与英文实验统计分离；空位后回放词表核对|A01–A06 0–25.967秒|','|69–76秒 双档案|删除汽车重复构图，重建加工照片、引导想象、三次访谈和20人结果|C01–C07 54.700–95.133秒|','|新增 八项研究|8个档案、统一七类要素、N423、30.4%与另23%分镜呈现|D01–D04 95.133–112.133秒|','|新增 理论与确信研究|来源归属错配，54学生两类记录、分组复测、一致性与确信分离|E01–E05 112.133–132.333秒|','|77–82秒 结尾|证据归档后出现谨慎结论与六篇简短书目|F01–F02 132.333–138.700秒|','','## 节奏与保留版本','','- 普通镜头字幕完全出现后约1.4秒切镜；词卡提问与三次访谈的字幕提前，与上方有效内容同时推进。字幕不再横向擦除。','- 32个分镜用绝对帧定位；关键读数与上方过程错开，音乐结构和原音源时间见 `v5_cue_sheet.md`。','- 访谈三步完整保留，处于原曲收敛段；10/20结果落在原曲102.567秒主段进入附近。','- V4的 `MemoryLies` Composition、`MemoryFilm.tsx` 视觉逻辑、`mix-v2.wav`、V4 MP4全部保留。旧组件仅增加资产导出，V5通过独立 `MemoryLiesV5` 注册。','- 本次不启动Studio、不执行vue-tsc、不做Git/SVN检查。','','## 精确镜头时间轴','','|镜号|开始—结束秒|开始—结束帧（末帧不含）|动作|字幕|字幕入场秒|','|---|---|---|---|---|---|']
for s in shots:text.append(f"|{s['id']}|{s['fromFrame']/30:.3f}—{s['toFrame']/30:.3f}|{s['fromFrame']}—{s['toFrame']}|{s['action']}|{s['caption']}|{s['captionFrame']/30:.3f}|")
(root/'docs/v5_change_log.md').write_text('\n'.join(text),encoding='utf-8')
with (root/'docs/v5_timeline.csv').open('w',newline='',encoding='utf-8-sig') as f:
 w=csv.DictWriter(f,fieldnames=shots[0].keys());w.writeheader();w.writerows(shots)
captions=[{'text':s['caption'],'startMs':round(s['captionFrame']/30*1000),'endMs':round(s['toFrame']/30*1000),'timestampMs':None,'confidence':None} for s in shots if s['id']!='F02']
(root/'docs/v5_captions.json').write_text(json.dumps(captions,ensure_ascii=False,indent=2),encoding='utf-8')
print('Wrote change log, frame timeline and caption JSON')
