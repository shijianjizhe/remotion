import {bundle} from '@remotion/bundler';
import {renderMedia,renderStill,selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const browserExecutable=process.env.CHROME_PATH || path.resolve('../../project3/node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe');
const serveUrl=await bundle({entryPoint:path.resolve('src/index.tsx')});
const composition=await selectComposition({serveUrl,id:'MemoryLies',browserExecutable});
const mode=process.argv[2]||'full';
fs.mkdirSync('out',{recursive:true}); fs.mkdirSync('qa/v2-stills',{recursive:true});
if(mode==='stills'){
 for(const sec of [2.35, 5.77, 8.95, 12.13, 14.27, 16.4, 19.07, 22.25, 24.9, 27.03, 29.7, 32.88, 36.07, 40.33, 44.07, 46.18, 48.3, 51.5, 55.23, 58.42, 60.8, 62.13, 63.73, 66.67, 69.6, 71.72, 73.83, 75.97, 79.7]){
 await renderStill({serveUrl,composition,frame:Math.round(sec*30),output:`qa/v2-stills/${String(sec).padStart(5,'0')}.png`,browserExecutable,scale:0.666667});console.log(`Still ${sec}s`);
 }
}else{
 let last=-1; await renderMedia({serveUrl,composition,outputLocation:'out/记忆会撒谎-v4.mp4',browserExecutable,codec:'h264',crf:17,pixelFormat:'yuv420p',audioBitrate:'320k',x264Preset:'medium',concurrency:8,onProgress:p=>{const n=Math.floor(p.progress*100);if(n>=last+5){last=n; console.log(`Render ${n}%`);}}});
}


