import React from 'react';
import {Composition,registerRoot,AbsoluteFill,useCurrentFrame,interpolate,spring,staticFile,Audio} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {expenses,amountAt,money} from './data';
loadFont({family:'Noto',url:staticFile('font.otf'),weight:'700'});
const C={cream:'#FFF6E9',blue:'#2B2BFF',red:'#FF5A4E',yellow:'#FFC62B',mint:'#2EE6A8',ink:'#151433'};
const lerp=(f:number,a:number,b:number,x:number,y:number)=>interpolate(f,[a,b],[x,y],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const Txt=({x=540,y,size=50,fill=C.ink,children,anchor='middle'}:any)=><text x={x} y={y} textAnchor={anchor} fontFamily="Noto" fontWeight="700" fontSize={size} fill={fill}>{children}</text>;
function Actor({i,t}:{i:number,t:number}){const bite=1-Math.min(1,Math.max(0,(t+5)/6));return <g>
{i===0&&<><path d="M-220 0 L0 -180 L220 0V180H-220Z" fill={C.red}/><rect x="-55" y="45" width="110" height="135" fill={C.ink}/><rect x="90" y="20" width="65" height="65" fill={C.yellow}/></>}
{i===1&&<><path d={`M-210 ${-80-bite*70} Q0 ${-190-bite*70} 210 ${-80-bite*70}`} stroke={C.ink} strokeWidth="24" fill="none"/><path d="M-230 0H230Q200 210 0 210Q-200 210 -230 0" fill={C.red}/><ellipse cy="0" rx="230" ry={30+60*bite} fill={C.ink}/></>}
{i===2&&<g transform={`rotate(${t<0?-12:12})`}><rect x="-225" y="-135" width="450" height="270" rx="35" fill={C.red}/><rect x="-225" y="-70" width="450" height="50" fill={C.ink}/><path d="M-80 40v60q80 80 160 0V40" stroke={C.yellow} strokeWidth="45" fill="none"/></g>}
{i===3&&<><rect x="-250" y="-100" width="500" height="230" rx="65" fill={C.red}/>{[-150,-30,90].map(x=><rect key={x} x={x} y="-60" width="80" height="75" rx="12" fill={C.cream}/>)}{[-150,150].map(x=><g key={x} transform={`translate(${x} 140) rotate(${t*15})`}><circle r="45" fill={C.ink}/><path d="M-25 0H25" stroke={C.mint} strokeWidth="12"/></g>)}</>}
{i===4&&<><path d="M-150 -170H150V150L100 180L50 150L0 180L-50 150L-100 180L-150 150Z" fill={C.mint}/><path d="M20 -130L-60 0H10L-20 100L80 -30H10Z" fill={C.ink}/><g transform={`rotate(${bite*25})`}><path d="M-240 150L240 40M-240 40L240 150" stroke={C.red} strokeWidth="24"/></g></>}
{i===5&&<><path d="M-180 -50H180L220 200H-220Z" fill={C.red}/><path d="M-80 -40V-90Q0 -210 80 -90V-40" fill="none" stroke={C.ink} strokeWidth="28"/><path d={`M-170 70Q-420 0 ${-300-bite*200} -200`} stroke={C.red} strokeWidth="45" fill="none" strokeLinecap="round"/></>}
{i===6&&<g transform={`scale(.58) rotate(${t*3})`}><path d="M-110 70A130 130 0 1 1 130 30" fill="none" stroke={C.red} strokeWidth="55"/><path d="M50 10L180 10L130 120Z" fill={C.red}/></g>}
{i!==6&&<><circle cx="-35" cy="15" r="11" fill={C.cream}/><circle cx="35" cy="15" r="11" fill={C.cream}/></>}
</g>}
const ease=(f:number,a:number,b:number)=>{const p=lerp(f,a,b,0,1);return p*p*(3-2*p)};
const Coin=({x,y,r=23,angle=0}:any)=><g transform={`translate(${x} ${y}) rotate(${angle})`}><circle r={r} fill={C.yellow}/><path d={`M0 ${-r*.48}V${r*.48}`} stroke={C.ink} strokeWidth={5}/></g>;
function Hero({x,y,scale=1,sx=1,sy=1,angle=0,mood=0,f=0}:any){return <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale*sx} ${scale*sy})`}>
<path d={`M-120 25Q-220 ${mood?-60:-120} -210 -40M120 25Q220 ${mood?-20:-120} 210 -40M-75 100L-100 180M75 100L100 180`} stroke={C.blue} strokeWidth="32" strokeLinecap="round" fill="none"/>
<rect x="-165" y="-125" width="330" height="250" rx="72" fill={C.blue}/><ellipse cx="-56" cy="-30" rx="13" ry={f%110>106?3:16} fill={C.cream}/><ellipse cx="56" cy="-30" rx="13" ry={f%110>106?3:16} fill={C.cream}/>
{mood===1?<ellipse cy="43" rx="23" ry="30" fill={C.cream}/>:<path d={mood===2?'M-42 60Q0 10 42 60':'M-45 25Q0 92 45 25'} stroke={C.cream} strokeWidth="12" fill="none"/>}
</g>}
function Film(){const f=useCurrentFrame();const e=expenses.find(e=>f>=e.start&&f<e.end),v=amountAt(f),cold=f>=525&&f<600,end=f>=600,t=e?f-e.hit:0;
const impact=e&&t>=0?Math.exp(-t/7)*Math.cos(t*.55):0;
const ent=e?spring({frame:f-e.start,fps:30,config:{damping:15,stiffness:160}}):0;
const leave=e?ease(f,e.end-14,e.end-1):0;
const reach=e?ease(f,e.hit-19,e.hit-3):0;
let hx=540,hy=1130,hs=.55+.45*v/8000,ha=0,ax=540,ay=1160,as=1,ar=0;
if(e){
 switch(e.i){
 case 0: hx=610;hy=1240;ax=420;ay=lerp(f,e.hit-14,e.hit-1,930,1190)-(1-ent)*900;as=1.1;ay-=leave*1100;break;
 case 1: hx=360;hy=1100;ax=780-(reach*90);ay=1160;ax+=(1-ent)*700+leave*750;as=1.03;ha=-impact*12;break;
 case 2: hx=340+reach*110-impact*50;hy=1110;ax=780+(1-ent)*800+leave*850;ay=1110;as=.9;ar=-22*(1-reach)+impact*12;ha=reach*15;break;
 case 3: hx=540;hy=1050-100*Math.sin(reach*Math.PI);ax=lerp(f,e.start,e.hit-1,-400,540)+leave*1050;ay=1260;as=.95;break;
 case 4: hx=360;hy=1130;ax=780+(1-ent)*700+leave*750;ay=1130;as=.9;break;
 case 5: hx=350+reach*190-leave*180;hy=1100-reach*80;ax=800+(1-ent)*700+leave*800;ay=1160-reach*80;as=1.05;ha=reach*22*(1-leave);break;
 case 6: hx=480;hy=1130;ax=700+(1-ent)*300+leave*500;ay=1140;as=.65;break;
 }
}
if(cold){hs=.44;hy=1170;}
const intro=spring({frame:f+4,fps:30,config:{damping:11,stiffness:180}});
const morph=ease(f,600,625);
const ink=end?C.cream:C.ink;
return <AbsoluteFill style={{background:C.cream}}><Audio src={staticFile('audio/master.wav')}/><svg viewBox="0 0 1080 1920" width="1080" height="1920">
<rect width="1080" height="1920" fill={C.cream}/>
{!end&&!cold&&<><circle cx={e?.i===1?850:210} cy="1180" r="490" fill={e?.i===4?C.mint:C.yellow} opacity=".18"/><path d="M0 1510Q540 1430 1080 1510V1920H0Z" fill={C.yellow}/></>}
{end&&<circle cx="540" cy="1140" r={morph*1600} fill={C.blue}/>}
<Txt x={100} y={195} size={27} fill={end?C.cream:C.ink} anchor="start">如果放映局</Txt><Txt x={960} y={195} size={25} fill={end?C.cream:C.ink} anchor="end">{e?`账单 0${e.i+1} / 07`:end?'发薪日 · 终点':'发薪日'}</Txt>
{!end&&<g transform={`translate(0 ${e?(1-ent)*-45:0})`}><Txt y={345} size={f<60?90:cold?80:76}>{f<60?'工资到账！':cold?'等等……':e?.label}</Txt><Txt y={420} size={31}>{f<60?'这一刻，我膨胀了。':cold?'钱怎么就路过了一下？':e?.i===2?'上月消费 · 本月还款':e?.i===5?'本月生活用品 · 预留预算':e?.i===6?'自动续费，悄悄补刀。':'已付 / 月度预算预留'}</Txt></g>}
<Txt y={565} size={32} fill={end?C.mint:C.blue}>还没安排的钱</Txt>
<g transform={`translate(540 ${720+(f<60?(1-intro)*-200:0)}) scale(${f<60?intro:1+impact*.035})`}><Txt x={0} y={0} size={152} fill={ink}>{money(v)}</Txt></g>
{!end&&<><rect x="140" y="790" width="800" height="24" rx="12" fill={C.ink}/><rect x="140" y="790" width={800*v/8000} height="24" rx="12" fill={C.yellow}/></>}
{f<60&&<><Hero x={540} y={1120+Math.sin(f/7)*18} scale={1.1*intro} f={f}/>{Array.from({length:7},(_,j)=>{const p=spring({frame:f-j*3,fps:30,config:{damping:12}});const a=j/7*Math.PI*2;return <Coin key={j} x={540+Math.cos(a)*365*p} y={1130+Math.sin(a)*260*p} angle={f*2+j*20}/>})}<Txt y={1530} size={64}>八千块，闪亮登场。</Txt></>}
{e&&<>
<Hero x={hx} y={hy} scale={hs} sx={1+impact*.18} sy={1-impact*.2} angle={ha} mood={t>-22?1:0} f={f}/>
{/* A visible money ribbon connects the actor to the shrinking budget. */}
{t>-24&&t<13&&<path d={`M${hx} ${hy-110}Q540 ${930+e.i*15} ${ax} ${ay-30}`} stroke={C.yellow} strokeWidth={Math.max(0,32*(1-ease(t,0,13)))} fill="none"/>}
{Array.from({length:e.i===6?2:6},(_,j)=>{const p=ease(f,e.hit-13+j*2,e.hit+8+j*2);const tx=e.i===0?ax:ax-50,ty=ay;return p>0&&p<1?<Coin key={j} x={hx+(tx-hx)*p} y={hy-120+(ty-hy+120)*p-Math.sin(p*Math.PI)*(e.i===3?30:130)} r={e.i===6?18:25} angle={p*180}/>:null})}
<g transform={`translate(${ax} ${ay}) rotate(${ar}) scale(${as*(1+impact*.08)} ${as*(1-impact*.08)})`}><Actor i={e.i} t={t}/></g>
{e.i===2&&t>-20&&t<8&&[0,1,2].map(j=><path key={j} d={`M${ax-270-j*45} ${ay-100}q-60 100 0 200`} fill="none" stroke={C.red} strokeWidth="9" opacity={.7-j*.16}/>)}
{e.i===3&&<path d="M90 1420H990" stroke={C.ink} strokeWidth="12" strokeDasharray="60 22"/>}
{t>=0&&t<12&&Array.from({length:6},(_,j)=>{const a=j*Math.PI/3;return <path key={j} d={`M${ax+Math.cos(a)*210} ${ay+Math.sin(a)*210}l${Math.cos(a)*50} ${Math.sin(a)*50}`} stroke={C.red} strokeWidth="10" opacity={1-t/12}/>})}
<Txt y={1550} size={82} fill={C.ink}>−{money(e.amount)}</Txt><Txt y={1610} size={27}>{t<0?'账单已经盯上了这笔钱':'已安排 ✓'}</Txt>
</>}
{cold&&<><Hero x={hx} y={hy} scale={hs} mood={2} f={f}/><Txt y={1450} size={82}>就剩一千？</Txt><path d="M450 1320H630" stroke={C.ink} strokeWidth="5"/></>}
{end&&<>
<g transform={`translate(540 1110) scale(${.44+.56*morph})`}><rect x={-190-40*morph} y="-150" width={380+80*morph} height={280+30*morph} rx={70-45*morph} fill={C.cream}/><path d={`M-260 -150L0 ${-150-140*morph}L260 -150Z`} fill={C.cream}/><Txt x={0} y={-65} size={44} fill={C.blue}>工资中转站</Txt><rect x="-80" y="0" width="160" height="160" rx="14" fill={C.blue}/><Coin x={0} y={95+Math.sin(f/10)*5} r={30} angle={Math.sin(f/12)*12}/></g>
{expenses.map((it,j)=>{const yy=900+j*62;const reveal=ease(f,620+j*3,630+j*3);const p=((f-630-j*3)%30+30)%30/30;return <g key={j} opacity={reveal}><path d={`M770 1120Q805 ${yy} 850 ${yy}H970`} fill="none" stroke={C.red} strokeWidth="13"/><Coin x={810+p*145} y={1120+(yy-1120)*Math.min(1,p*3)} r={11}/><Txt x={965} y={yy-16} size={24} fill={C.cream} anchor="end">{it.label}</Txt></g>})}
<g opacity={ease(f,615,627)}><path d="M100 1110H290" stroke={C.mint} strokeWidth="30"/><path d="M270 1070L325 1110L270 1150Z" fill={C.mint}/><Txt x={200} y={1020} size={27} fill={C.cream}>工资 {money(8000)}</Txt>{[0,1,2].map(j=><Coin key={j} x={110+((f*6+j*65)%190)} y={1110} r={18}/>)}</g>
<Txt y={1425} size={62} fill={C.cream}>原来，我只是</Txt><Txt y={1510} size={76} fill={C.yellow}>工资的中转站。</Txt><Txt y={1600} size={24} fill={C.cream}>虚构月度预算演绎，非当天真实扣款记录</Txt>
</>}
{f<60&&<g transform={`translate(${-ease(f,50,60)*1200} 0)`}>
<rect width="1080" height="1920" fill={C.blue}/>
<Txt x={100} y={195} size={27} fill={C.cream} anchor="start">如果放映局</Txt>
<Txt y={390} size={88} fill={C.cream}>你的工资，</Txt>
<Txt y={510} size={78} fill={C.cream}>怎么在到账当天</Txt>
<Txt y={650} size={110} fill={C.yellow}>就消失了？</Txt>
<g transform={`translate(540 895) rotate(${-3+Math.sin(f/10)*2})`}>
<Txt x={0} y={0} size={148} fill={C.cream}>{money(8000)}</Txt>

</g>
<circle cx="540" cy="1225" r="240" fill={C.cream}/>
<Hero x={540} y={1200} scale={.85} mood={1} f={f}/>
{[0,1,2,3].map(j=>{const p=ease(f,8+j*4,38+j*4);return <Coin key={j} x={660+p*420} y={1110-j*40-p*150} r={27} angle={p*180}/>})}
<Txt y={1560} size={40} fill={C.cream}>八千块的工资，究竟去了哪儿？</Txt>
</g>}
</svg></AbsoluteFill>}
registerRoot(()=> <Composition id="Salary8000FlatVector" component={Film} durationInFrames={780} fps={30} width={1080} height={1920}/>);
