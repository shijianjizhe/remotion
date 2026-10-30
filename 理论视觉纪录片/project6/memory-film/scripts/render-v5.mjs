import {bundle} from '@remotion/bundler';
import {renderMedia,renderStill,selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const browserExecutable=process.env.CHROME_PATH||path.resolve('../../project3/node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe');
const serveUrl=await bundle({entryPoint:path.resolve('src/index.tsx')});
const composition=await selectComposition({serveUrl,id:'MemoryLiesV5',browserExecutable});
const mode=process.argv[2]||'preview';
const timeline=JSON.parse(fs.readFileSync('src/v5-timeline.json','utf8'));
fs.mkdirSync('qa/v5-stills',{recursive:true});
if(mode==='stills'){
 for(const shot of timeline.shots){const frame=Math.min(shot.toFrame-10,shot.fromFrame+100);await renderStill({serveUrl,composition,browserExecutable,frame,output:`qa/v5-stills/${shot.id}.png`,scale:.6666667});console.log(shot.id);}
}else{
 let last=-5;await renderMedia({serveUrl,composition,browserExecutable,outputLocation:`out/记忆会撒谎-v5${mode==='preview'?'-preview':''}.mp4`,codec:'h264',crf:mode==='preview'?25:17,scale:mode==='preview'?.5:1,pixelFormat:'yuv420p',audioBitrate:'320k',x264Preset:mode==='preview'?'veryfast':'medium',concurrency:8,onProgress:({progress})=>{const n=Math.floor(progress*100);if(n>=last+5){last=n;console.log(`${mode} ${n}%`);}}});
}
