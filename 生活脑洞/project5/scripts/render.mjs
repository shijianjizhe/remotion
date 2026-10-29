import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';
import path from 'node:path';
const serveUrl=await bundle({entryPoint:path.resolve('src/index.tsx'),webpackOverride:c=>c});
const browserExecutable='C:/Program Files/Google/Chrome/Application/chrome.exe';
const composition=await selectComposition({serveUrl,id:'TimeThief',browserExecutable});
if(process.argv[2]==='stills'){
 for(const t of (process.argv.length>3?process.argv.slice(3).map(Number):[1.5,5.6,7,10,14.4,17.4,20.8,24,25.3,27.2,30,35.2,39.8,42,45.5,50.8,52.2,57.3])){
  await renderStill({serveUrl,composition,browserExecutable,output:`output/qa/frame-${String(t).replace('.','_')}.png`,frame:Math.round(t*30),imageFormat:'png'});
  console.log('Still',t);
 }
}else{
 let last=-1;
 await renderMedia({serveUrl,composition,browserExecutable,outputLocation:'output/time-thief-raw.mp4',codec:'h264',crf:18,pixelFormat:'yuv420p',concurrency:4,onProgress:p=>{const n=Math.floor(p.progress*20);if(n!==last){last=n;console.log(`Render ${n*5}%`);}}});
}
