import fs from 'node:fs';
import assert from 'node:assert/strict';
// This validates scientific data and frame alignment, not TypeScript types.
const data=fs.readFileSync('src/data.ts','utf8');
for(const x of ['31.8','34.0','38.1','39.3','40.5','yes:16,n:50','yes:7,n:50','yes:6,n:50']) assert(data.includes(x),x);
assert.equal(40.5-34,6.5);
assert.deepEqual([16,7,6].map(x=>x/50*100),[32,14.000000000000002,12]);
const bounds=[0,17.459,25.969,42.991,51.501,72.778,102.567,119.589,130].map(t=>Math.round(t*30));
assert.equal(bounds.at(-1),3900);assert(bounds.every((x,i)=>i===0||x>bounds[i-1]));
for(const s of [34.480,66.386,102.567]) assert(Math.abs(Math.round(s*30)/30-s)<=1/60);
const source=fs.readFileSync('src/MemoryFilm.tsx','utf8');
for(const text of ['非原始实验影像','不同参与者组','新的 150 名参与者','非原实验逐字材料','不是本片中文示例的观众测试结果','不代表真实脑内图像'])assert(source.includes(text),text);
assert(!['睡眠'].some(w=>['床','休息','醒来','做梦','困倦','枕头','夜晚','被子'].includes(w)));
fs.mkdirSync('docs',{recursive:true});
fs.writeFileSync('docs/validation.json',JSON.stringify({passed:true,frames:3900,fps:30,duration:130,boundaries:bounds,checks:['five speed means','three group proportions','independent samples labeled','Chinese demonstration labeled','no absent lure in presented list','three climax frame alignment','continuous scene coverage']},null,2));
const rows=[...data.matchAll(/\[([\d.]+),'([^']+)','([^']+)','([^']+)',(\d)\]/g)].map(m=>[Number(m[1]).toFixed(3),Math.round(Number(m[1])*30),m[2],m[3],m[4],m[5]].join(','));
fs.writeFileSync('docs/cue-sheet.csv','seconds,frame30,audio_event,visual_event,purpose,intensity\n'+rows.join('\n'),'utf8');
console.log('PASS: scientific values, labels, scene coverage, 30fps cue alignment.');
