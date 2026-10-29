import assert from 'node:assert/strict';
import {expenses,after,amountAt} from './data.ts';
assert.deepEqual(after,[6000,4000,2900,2500,2100,1200,1000]);
assert.equal(expenses.reduce((s,e)=>s+e.amount,0),7000);
expenses.forEach((e,i)=>{assert.equal(amountAt(e.hit),after[i]);assert.ok(e.hit>=0&&e.hit<780);if(i)assert.ok(e.hit>expenses[i-1].hit)});
for(let f=0;f<780;f++){assert.ok(Number.isFinite(amountAt(f)));if(f)assert.ok(amountAt(f)<=amountAt(f-1));}
assert.equal(amountAt(779),1000);console.log('PASS: 780 frames; settlements',after,'; total 7000; final 1000');
