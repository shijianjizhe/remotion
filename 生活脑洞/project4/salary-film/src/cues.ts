import {expenses,SALARY} from './data.ts';
export const FPS=30;
export const cues={arrival:6,silence:[525,540],station:600,hold:720};
export const narration=[
 {start:0,end:60,text:'工资到账，八千！'},
 ...expenses.map(e=>({start:e.start,end:e.end,text:['房租先拿走两千。','吃饭，两千。','上个月的信用卡，再还一千一。','交通，四百。','水电网话，四百。','买点生活用品，九百。','会员订阅，两百。'][e.i]})),
 {start:525,end:600,text:'等等……就剩一千？'},
 {start:600,end:720,text:'原来，我只是工资的中转站。'}];
export const audioEvents=[{frame:cues.arrival,kind:'arrival'},...expenses.map(e=>({frame:e.hit,kind:['stamp','bite','magnet','train','snip','grab','pop'][e.i]})),{frame:600,kind:'station'}];

