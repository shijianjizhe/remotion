import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import ffmpeg from 'ffmpeg-static';
import probe from 'ffprobe-static';
const run=(exe,args)=>{const r=spawnSync(exe,args,{encoding:'utf8',maxBuffer:30*1024*1024});if(r.status!==0)throw Error(r.stderr);return r.stdout+r.stderr};
const raw='output/time-thief-raw.mp4', final='output/05-time-thief-final.mp4';
const scan=run(ffmpeg,['-hide_banner','-i',raw,'-af','loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json','-f','null','-']);
const stats=JSON.parse(scan.slice(scan.lastIndexOf('{'),scan.lastIndexOf('}')+1));
fs.writeFileSync('output/qa/loudness-before.json',JSON.stringify(stats,null,2));
const filter=`loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true:print_format=json`;
console.log('Mastering original stereo mix');
const master=run(ffmpeg,['-y','-hide_banner','-i',raw,'-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p','-c:v','libx264','-crf','18','-preset','medium','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-af',filter,'-ar','48000','-c:a','aac','-b:a','256k','-t','58','-movflags','+faststart',final]);
fs.writeFileSync('output/qa/mastering.log',master);
const meta=run(probe.path,['-v','quiet','-show_format','-show_streams','-of','json',final]);
fs.writeFileSync('output/qa/ffprobe.json',meta);
console.log('Scanning entire video and audio');
const quality=run(ffmpeg,['-hide_banner','-i',final,'-vf','blackdetect=d=0.15:pix_th=0.10,freezedetect=n=-50dB:d=0.6','-af','ebur128=peak=true','-f','null','-']);
fs.writeFileSync('output/qa/full-scan.log',quality);
fs.mkdirSync('output/qa/sequence',{recursive:true});
run(ffmpeg,['-y','-hide_banner','-i',final,'-vf','fps=2,scale=270:480','-q:v','3','output/qa/sequence/%03d.jpg']);
for(const [name,t] of [['first-theft',5.65],['climax',39.85],['awareness',43.4],['hand-reveal',52.0],['last-pullback',57.5]]){
 run(ffmpeg,['-y','-hide_banner','-ss',String(t),'-i',final,'-frames:v','1',`output/${name}.png`]);
}
console.log('Master and QA frames ready');
