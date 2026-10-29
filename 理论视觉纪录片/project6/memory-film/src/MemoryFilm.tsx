import React from 'react';
import {AbsoluteFill,Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {boundaries,glassData,speedData,words} from './data';
import edit from './edit-v2.json';
const remap=(t:number,from:'old'|'new',to:'old'|'new')=>{const i=Math.max(0,edit.findIndex((v,j)=>j<edit.length-1&&t<edit[j+1][from]));const a=edit[i],b=edit[i+1];if(t>=edit[edit.length-1][from])return edit[edit.length-1][to];return a[to]+(b[to]-a[to])*(t-a[from])/(b[from]-a[from]);};

const G='#c9ac72', W='#eee6d4', C='#92aab5', DIM='#807968';
const serif='"FilmSong", "SimSun", serif', sans='"FilmSans", "Microsoft YaHei", sans-serif';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const p=(t:number,a:number,b:number)=>clamp((t-Math.round(a*30)/30)/(Math.round(b*30)/30-Math.round(a*30)/30));
const ease=(v:number)=>1-Math.pow(1-clamp(v),3);
const lerp=(a:number,b:number,v:number)=>a+(b-a)*v;
const fade=(t:number,a:number,b:number)=>p(t,a,a+.45)*(1-p(t,b-.4,b));
const beat=(t:number)=>Math.exp(-(((t-.4376)%.531926+.531926)%.531926)*10);
const Text=({x=960,y,size=36,fill=W,children,anchor='middle',font=serif,spacing=0,opacity=1}:any)=><text x={x} y={y} fill={fill} fontSize={size} textAnchor={anchor} fontFamily={font} letterSpacing={spacing} opacity={opacity}>{children}</text>;
const Line=({x1,y1,x2,y2,color=G,opacity=.45,width=1,...rest}:any)=><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeOpacity={opacity} strokeWidth={width} {...rest}/>;
const Caption=({t,start,end,children,note}:any)=>{
 const now=remap(t,'old','new'),a=remap(start,'old','new'),b=remap(end,'old','new');
 const text=String(children);const hold=note?2.05:text.length>14?1.85:text.length<4?.82:1.55;
 const mode=['然后，被人记住','只换了一个词','它从未出现','睡眠'].includes(text)?'lock':text.includes('语言')||text.includes('问题')||text.includes('联想')?'type':text.includes('重')||text.includes('记起')?'rise':'track';
 // Begin typing while the upper scene is running; reserve each glyph's position.
 const candidate=mode==='type'?Math.max(a,Math.min(a+.18,b-hold)):Math.max(a,b-hold);const onset=Math.max(a,Math.round((candidate-.4376)/.531926)*.531926+.4376);
 const q=clamp((now-onset)/.20),leave=clamp((b-now)/.12);if(now<onset||now>=b)return null;
 const id='cap'+String(start).replace('.','_');const e=ease(q);
 return <g opacity={leave}>
 <defs><clipPath id={id}><rect x={100} y="840" width={1720} height="140"/></clipPath></defs>
 <g clipPath={`url(#${id})`} transform={mode==='rise'?`translate(0 ${(1-e)*30})`:mode==='lock'?`translate(960 900) scale(${1.07-.07*e}) translate(-960 -900)`:undefined} opacity={mode==='type'?1:e}>
 <Text y={902} size={46} spacing={mode==='track'?(1-e)*8:0}>{mode==='type'?Array.from(text).map((char,i)=><tspan key={i} x={960+(i-(Array.from(text).length-1)/2)*46} opacity={clamp(((now-onset)*30-i*2)/2)}>{char}</tspan>):children}</Text>
 {note&&<Text y={952} size={23} fill={DIM} font={sans} opacity={mode==='type'?e:1}>{note}</Text>}
 </g>{mode==='lock'&&<Line x1={875} y1={923} x2={1045} y2={923} opacity={(1-q)*.6}/>}
 </g>;
};
const Header=({year,label,source}:any)=><g><Text x={108} y={112} size={52} fill={G} anchor="start" font="Georgia">{year}</Text><Text x={110} y={153} size={22} anchor="start" fill={DIM} font={sans}>{label}</Text><Text x={1810} y={110} size={21} anchor="end" fill={DIM} font="Georgia">{source}</Text><Line x1={110} y1={181} x2={1810} y2={181} opacity={.14}/></g>;

function Environment({t}:{t:number}){
 return <><defs>
  <radialGradient id="room"><stop stopColor="#28251e"/><stop offset=".5" stopColor="#111313"/><stop offset="1" stopColor="#050708"/></radialGradient>
  <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e3d4ac"/><stop offset=".17" stopColor="#696257"/><stop offset=".5" stopColor="#171b1c"/><stop offset=".78" stopColor="#57554c"/><stop offset="1" stopColor="#101314"/></linearGradient>
  <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#262923"/><stop offset="1" stopColor="#0b1112"/></linearGradient>
  <linearGradient id="beam"><stop stopColor={G} stopOpacity=".22"/><stop offset="1" stopColor={G} stopOpacity="0"/></linearGradient>
  <linearGradient id="gold"><stop stopColor="#725a35"/><stop offset=".4" stopColor="#efdbac"/><stop offset="1" stopColor="#b0935e"/></linearGradient>
 </defs><rect width="1920" height="1080" fill="url(#room)"/>
 <ellipse cx={960+Math.sin(t*.08)*260} cy={515} rx="760" ry="350" fill="#5a513b" opacity={.025+beat(t)*.009}/>
 {Array.from({length:62},(_,i)=><circle key={i} cx={(i*313.31+Math.sin(t*.12+i)*13)%1920} cy={(i*173.77-t*(1+i%4)+10800)%1080} r={i%6===0?1.8:.8} fill={i%3?G:C} opacity={.07+(i%7)*.014}/>)}
 {Array.from({length:50},(_,i)=><Line key={i} x1={0} y1={i*23+(t*1.7)%23} x2={1920} y2={i*23+(t*1.7)%23} opacity={.012} color={W}/>)}
 </>;
}

function Reel({x,y,r=112,t}:{x:number,y:number,r?:number,t:number}){
 return <g transform={`translate(${x} ${y}) rotate(${t*34})`}><circle r={r+4} fill="#0b0e0f" stroke="#555448" strokeWidth="3"/><circle r={r} fill="url(#metal)" stroke={G} strokeOpacity=".16"/>
 {Array.from({length:6},(_,i)=><g key={i} transform={`rotate(${i*60})`}><ellipse cx={0} cy={-r*.59} rx={r*.23} ry={r*.3} fill="#070a0b" stroke="#45483d" strokeWidth="1"/><Line x1={0} y1={-r*.91} x2={0} y2={-r*.97} opacity={.8}/></g>)}
 <circle r={r*.18} fill="url(#metal)" stroke={G}/><circle r={5} fill="#0b0f10"/></g>;
}
function Projector({t}:{t:number}){
 return <g transform="translate(470 510)"><defs>
 <linearGradient id="housing" x1="0" y1="0" x2=".85" y2="1"><stop stopColor="#666355"/><stop offset=".14" stopColor="#363a35"/><stop offset=".55" stopColor="#1b211f"/><stop offset="1" stopColor="#0b100f"/></linearGradient>
 <linearGradient id="lens" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8b8572"/><stop offset=".18" stopColor="#454c46"/><stop offset=".5" stopColor="#171e1b"/><stop offset=".85" stopColor="#303a32"/><stop offset="1" stopColor="#0c1210"/></linearGradient>
 <radialGradient id="optic"><stop stopColor="#f3e3ae"/><stop offset=".45" stopColor="#aea078"/><stop offset=".75" stopColor="#303c35"/><stop offset="1" stopColor="#111b17"/></radialGradient>
 <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="12"/></filter>
 </defs>
 <ellipse cx="-30" cy="224" rx="230" ry="28" fill="#000" opacity=".65" filter="url(#softShadow)"/>
 <path d="M150 10 L1210 -240 L1210 310 Z" fill="url(#beam)" opacity={.57+Math.sin(t*19)*.025}/>
 <path d="M-110 -230 L-70 30 L-26 37 L45 -220" fill="none" stroke="#3d443a" strokeWidth="12"/>
 <Reel x={-155} y={-205} t={t}/><Reel x={112} y={-220} r={102} t={t+2}/>
 <path d="M-179 -82 Q-203 -81 -203 -52 L-203 110 Q-203 139 -177 145 L65 145 Q100 139 104 108 L104 -18 Q99 -42 69 -71 Z" fill="#0a100e"/>
 <path d="M-195 -79 Q-220 -78 -220 -49 L-220 104 Q-220 133 -192 135 L42 135 Q74 132 78 103 L78 -17 Q74 -39 45 -61 L25 -79 Z" fill="url(#housing)"/>
 <path d="M-200 -76 Q-214 -74 -215 -54 M-190 -78 L18 -78 Q31 -78 42 -66" fill="none" stroke="#aca48b" strokeOpacity=".28" strokeWidth="2"/>
 <rect x="-194" y="-50" width="185" height="146" rx="21" fill="#101713"/>
 <rect x="-189" y="-45" width="176" height="135" rx="18" fill="#202822"/>
 {Array.from({length:9},(_,i)=><g key={i}><rect x="-174" y={-29+i*11} width="137" height="4" rx="2" fill="#090f0b"/><Line x1={-169} y1={-24+i*11} x2={-43} y2={-24+i*11} color="#7c8270" opacity={.13}/></g>)}
 <path d="M-145 132 L-158 203 Q-157 210 -143 211 L43 211 Q57 210 54 201 L28 132" fill="url(#housing)"/>
 <rect x="-174" y="207" width="246" height="16" rx="8" fill="#252d26"/>
 <rect x="50" y="-28" width="124" height="83" rx="20" fill="url(#lens)"/>
 {[80,91,145,155].map(x=><path key={x} d={`M${x} -23 L${x} 49`} stroke="#090f0d" strokeWidth="3" opacity=".55"/>)}
 <ellipse cx="173" cy="14" rx="20" ry="39" fill="#18211a"/><ellipse cx="176" cy="14" rx="15" ry="31" fill="url(#optic)"/><ellipse cx="179" cy="9" rx="4" ry="20" fill="#f1e0ac" opacity=".3"/>
 <circle cx="37" cy="83" r="18" fill="url(#lens)"/><circle cx="37" cy="83" r="11" fill="#0e1712"/><Line x1={37} y1={76} x2={37} y2={81} opacity={.5}/>
 {[[-202,-58],[-201,113],[55,115]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="3" fill="#6e7565" opacity=".4"/><Line x1={x-2} y1={y} x2={x+2} y2={y} color="#111"/></g>)}
 <Text x={-103} y={116} size={11} fill="#777d69" font="Georgia">ARCHIVE / 16 mm</Text></g>;
}
function Car({x,y,rotation=0,color=C,scale=1}:{x:number,y:number,rotation?:number,color?:string,scale?:number}){
 return <g transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}>
 <ellipse cx="0" cy="8" rx="102" ry="48" fill="#000" opacity=".4"/>
 <rect x="-90" y="-37" width="180" height="74" rx="19" fill="#151d20" stroke={color} strokeWidth="2"/>
 <path d="M-45 -30 L27 -30 L47 -20 L47 20 L27 30 L-45 30 L-55 20 L-55 -20 Z" fill="#263238" stroke={color} strokeOpacity=".7"/>
 <path d="M-35 -27 L20 -27 M-35 27 L20 27 M36 -25 L36 25 M-45 -25 L-45 25" fill="none" stroke={color}/>
 <path d="M-60 -40 L-35 -40 M45 -40 L65 -40 M-60 40 L-35 40 M45 40 L65 40" stroke="#080b0b" strokeWidth="8"/>
 <path d="M83 -24 L88 -24 M83 24 L88 24" stroke={W} strokeWidth="5"/><Line x1={-78} y1={-27} x2={-78} y2={27} color={color}/></g>;
}
function Film({x=960,y=510,w=1120,h=450,t=0,progress=1,glass=false,label=true}:any){
 return <g transform={`translate(${x-w/2} ${y-h/2})`}><rect x="-8" y="-9" width={w+16} height={h+18} fill="#050909" stroke="#5a584b"/><rect width={w} height={h} fill="url(#paper)" stroke={G} strokeOpacity=".4"/>
 {Array.from({length:Math.floor(w/38)},(_,i)=><g key={i}><rect x={13+i*38} y={10} width="18" height="14" rx="2" fill="#0a0e10" stroke="#6c634f" strokeOpacity=".45"/><rect x={13+i*38} y={h-24} width="18" height="14" rx="2" fill="#0a0e10" stroke="#6c634f" strokeOpacity=".45"/></g>)}
 <g transform={`translate(${w/2} ${h/2})`}>
 <Line x1={-w*.44} y1={58} x2={w*.44} y2={58} color={C} opacity={.17}/><Line x1={-w*.44} y1={-58} x2={w*.44} y2={-58} color={C} opacity={.17}/>
 <Line x1={-w*.44} y1={0} x2={w*.44} y2={0} color={C} opacity={.12} strokeDasharray="30 25"/>
 <path d={`M${-w*.43} 0 L-152 0 M${w*.39} -120 L152 -54`} fill="none" stroke={G} strokeOpacity=".25" strokeDasharray="4 8"/>
 <Car x={lerp(-w*.32,-164,ease(progress))} y={0} color={C} scale={1.6}/><Car x={lerp(w*.31,148,ease(progress))} y={lerp(-105,-54,ease(progress))} rotation={158} color={G} scale={1.6}/>
 {progress>=1&&<circle cx="0" cy="-9" r={26+(t%2)*15} fill="none" stroke={G} opacity={.2*(1-(t%2)/2)}/>}
 {glass&&<g transform="translate(130 80)"><Shard t={t} scale={.65}/></g>}
 </g>
 {label&&<Text x={w-22} y={h-42} size={17} anchor="end" fill={DIM} font={sans}>情境重现 · 非原始实验影像</Text>}
 <rect x={w*p(t%6,0,6)} y="32" width="1" height={h-64} fill={W} opacity=".06"/>
 </g>;
}
function Shard({t,scale=1}:{t:number,scale?:number}){
 return <g transform={`rotate(${Math.sin(t*.6)*7}) scale(${scale})`}><polygon points="-73,-104 100,-52 39,116 -51,54" fill="#a58a51" fillOpacity=".14" stroke="#e3c68a" strokeWidth="2"/><path d="M-73 -104 L8 8 L100 -52 M8 8 L39 116 M8 8 L-51 54" stroke={G} fill="none"/><polygon points="-73,-104 100,-52 8,8" fill={W} fillOpacity={.04+beat(t)*.05}/></g>;
}

function Opening({t}:{t:number}){
 const zoom=1+p(t,4.6,8.9)*.09;
 return <><Header year="1974" label="LOFTUS & PALMER · 记忆研究" source="ARCHIVE 01 / RECONSTRUCTION"/>
 <g opacity={1-p(t,7.9,9)} transform={`translate(${960*(1-zoom)} ${540*(1-zoom)}) scale(${zoom})`}><Projector t={t}/>
 <g opacity={p(t,1.5,3)} transform="translate(0 44)"><Text x={1280} y={443} size={37} fill={DIM} spacing={10}>记忆，会原样保存吗</Text><Line x1={1120} y1={489} x2={1440} y2={489} opacity={.3}/><Text x={1280} y={550} size={28} fill={G} font="Georgia" spacing={6}>THE RECORD</Text></g></g>
 <g opacity={p(t,8,9)} transform={`translate(960 510) scale(${.92+p(t,9,17.459)*.12}) translate(-960 -510)`}><Film t={t} progress={p(t,8.948,13.204)}/></g>
 <Caption t={t} start={.8} end={5}>一段事件，被记录下来</Caption>
 <Caption t={t} start={5} end={9}>然后，被人记住</Caption>
 <Caption t={t} start={9} end={13.5}>同一场事故</Caption>
 <Caption t={t} start={13.5} end={17.459}>问题，出现在影像之后</Caption>
 </>;
}
function Questions({t}:{t:number}){
 return <><Header year="1974" label="实验一 · 提问措辞" source="LOFTUS & PALMER / EXPERIMENT I"/>
 <g opacity={.20} transform={`translate(0 ${-100-p(t,17.459,25.969)*10}) scale(1 .65)`}><Film t={t} w={820} h={320} progress={1}/></g>
 <Text y={325} size={39} fill={W}>当两辆车彼此……时，车速大约是多少？</Text>
 {[['HIT','碰撞',C],['SMASHED','猛烈撞击',G]].map(([word,cn,color],i)=>{const a=ease(p(t,17.459+i*.23,18.3+i*.23));return <g key={word} transform={`translate(${590+i*740} ${550+(1-a)*100})`} opacity={a}>
 <path d="M-275 -115 L242 -115 L275 -82 L275 115 L-275 115 Z" fill="url(#paper)" stroke={color} strokeOpacity=".6"/>
 <Line x1={-250} y1={-90} x2={-210} y2={-90} color={color} opacity={.8}/><Text x={0} y={-4} size={69} fill={color} font="Georgia" spacing={5}>{word}</Text><Text x={0} y={65} size={27} fill={DIM}>{cn}</Text>
 <Line x1={-150} y1={134} x2={-150+300*p(t,19.5,21.714)} y2={134} color={color} opacity={.7}/>
 </g>;})}
 <Line x1={960} y1={430} x2={960} y2={688} opacity={.2}/>
 <Caption t={t} start={17.7} end={21.714}>改变的，只有一个词</Caption>
 <Caption t={t} start={21.714} end={25.969} note="不同参与者组 · 观看相同事故影片">同样的影像，不同的问题</Caption>
 </>;
}
function Speed({t}:{t:number}){
 const showAll=p(t,38.735,39.5); const v1=34*ease(p(t,26.4,30.224));const v2=40.5*ease(p(t,30.224,34.480));
 return <><Header year="1974" label="实验一 · 平均速度估计 / mph" source="45 PARTICIPANTS · 5 WORD CONDITIONS"/>
 <g transform={`translate(0 ${-showAll*90})`}>
 {Array.from({length:46},(_,i)=>{const x=345+i*28;return <g key={i} opacity={p(t,25.969+i*.012,26.5+i*.012)}><Line x1={x} y1={658} x2={x} y2={658+(i%5===0?25:11)} opacity={i%5===0?.55:.23}/>{i%5===0&&<Text x={x} y={721} size={24} fill={DIM} font="Georgia">{i}</Text>}</g>})}
 {[{word:'HIT',v:v1,c:C,y:385},{word:'SMASHED',v:v2,c:G,y:560}].map(({word,v,c,y},i)=><g key={word}><Text x={310} y={y+6} size={32} fill={c} anchor="end" font="Georgia">{word}</Text><Line x1={345} y1={y} x2={1605} y2={y} opacity={.13}/><rect x="345" y={y-5} width={v*28} height="10" fill={c} opacity=".65"/><circle cx={345+v*28} cy={y} r="9" fill={c}/><Line x1={345+v*28} y1={y-30} x2={345+v*28} y2={658} color={c} opacity={.24}/><Text x={Math.max(440,345+v*28)} y={y-49} size={82} fill={c} font="Georgia">{v.toFixed(1)}</Text></g>)}
 <g opacity={p(t,34.480,35.05)*(1-showAll)}><Line x1={1297} y1={760} x2={1479} y2={760} opacity={.75}/><Line x1={1297} y1={749} x2={1297} y2={771}/><Line x1={1479} y1={749} x2={1479} y2={771}/><Text x={1388} y={813} size={33} fill={G} font="Georgia">Δ 6.5 mph</Text></g>
 </g>
 <g opacity={showAll}>{speedData.map((d,i)=><g key={d.word} transform={`translate(${440+i*260} 740)`}><Text x={0} y={0} size={21} fill={DIM} font="Georgia">{d.word}</Text><Text x={0} y={52} size={40} fill={d.word==='HIT'?C:G} font="Georgia">{d.value.toFixed(1)}</Text></g>)}</g>
 <Caption t={t} start={26} end={30.3}>人们估计得有多快？</Caption>
 <Caption t={t} start={30.3} end={34.48} note="平均速度估计 / mph">措辞变重，读数也变了</Caption>
 <Caption t={t} start={34.48} end={38.735} note="不同组均值之差，非真实车速差，也非个人前后变化">只换了一个词</Caption>
 <Caption t={t} start={38.735} end={42.991} note="这些数值均为实验一的组均值">语言，可能影响估计</Caption>
 </>;
}
function NewExperiment({t}:{t:number}){
 const clock=p(t,47.246,50.3), split=ease(p(t,43.5,46.6));
 return <><Header year="1974" label="实验二 · 新的 150 名参与者" source="EXPERIMENT II / A SEPARATE SAMPLE"/>
 <g opacity={1-p(t,48,49.366)}>{glassData.map((d,g)=><g key={d.word} transform={`translate(${lerp(810,430+g*530,split)} 340)`}>
 <Text x={0} y={-55} size={32} fill={g===0?G:C} font="Georgia">{d.word}</Text>
 {Array.from({length:50},(_,i)=><circle key={i} cx={(i%10-4.5)*27} cy={Math.floor(i/10)*39} r={5.5} fill={g===0?G:C} opacity={p(t,43+i*.018,44+i*.018)*.65}/>)}
 <Text x={0} y={245} size={48} fill={W} font="Georgia">50</Text><Text x={0} y={282} size={22} fill={DIM}>人</Text></g>)}</g>
 <g opacity={p(t,48,49.366)}><Text y={430} size={110} fill={G} font="Georgia">{Math.min(7,Math.floor(clock*7))}</Text><Text y={494} size={29} fill={DIM} spacing={8} font="Georgia">DAYS LATER</Text>
 {Array.from({length:8},(_,i)=><g key={i}><circle cx={470+i*140} cy={610} r={i<=clock*7?7:3} fill={i<=clock*7?G:DIM}/><Text x={470+i*140} y={661} size={23} fill={DIM} font="Georgia">{i}</Text></g>)}<Line x1={470} y1={610} x2={470+980*clock} y2={610} opacity={.8}/></g>
 <Caption t={t} start={43.1} end={47.246} note="独立实验 · 三组各 50 人；控制组未被问及车速">另一次实验，另一批人</Caption>
 <Caption t={t} start={47.246} end={51.501} note="不再播放事故影片，再次提问">一周之后</Caption>
 </>;
}
function Glass({t}:{t:number}){
 const conclusion=ease(p(t,61.7,62.6)),shard=t>=Math.round(66.386*30)/30?1:0,separate=ease(p(t,68.523,70));
 return <><Header year="1974" label="实验二 · 一周后的碎玻璃提问" source="YES RESPONSES / EACH GROUP n = 50"/>
 <g opacity={1-conclusion} transform={`translate(0 ${-conclusion*140})`}><Text y={275} size={43}>“你看到碎玻璃了吗？”</Text>
 {glassData.map((d,g)=>{const lock=[55.756,57.884,60.011][g];const a=p(t,lock-2.1,lock);const count=Math.floor(d.yes*a);return <g key={d.word} transform={`translate(${440+g*520} 400)`}>
 <Text x={0} y={-51} size={30} fill={g===0?G:C} font="Georgia">{d.word}</Text>
 {Array.from({length:50},(_,i)=><circle key={i} cx={(i%10-4.5)*28} cy={Math.floor(i/10)*35} r={i<count?7:4} fill={i<count?G:'#384044'} opacity={.85}/>)}
 <Text x={0} y={283} size={86} fill={g===0?G:W} font="Georgia">{Math.round(count/50*100)}<tspan fontSize={37}>%</tspan></Text><Text x={0} y={332} size={27} fill={DIM} font="Georgia">{count} / 50</Text></g>;})}</g>
 <g opacity={conclusion}>
 <g opacity={1-separate}><Film t={t} y={500} w={1020} h={400}/><g opacity={shard} transform={`translate(1090 505) scale(${.6+ease(shard)*.6})`}><Shard t={t}/></g>
 <Text y={772} size={24} fill={shard>0?G:C} font={sans}>{shard>0?'回忆版本 · 视觉隐喻，不代表真实脑内图像':'原始事件 · 示意画面没有碎玻璃'}</Text></g>
 <g opacity={separate}>{glassData.map((d,i)=><g key={d.word} transform={`translate(${960+(i-1)*550*separate} ${495+Math.sin(t*.5+i)*7}) scale(.44)`}><Film x={0} y={0} t={t} w={1080} h={510} label={false} glass={true}/><Text x={0} y={-320} size={58} fill={i===0?G:C} font="Georgia">{d.word}</Text><Text x={0} y={370} size={88} fill={G} font="Georgia">{Math.round(d.yes/50*100)}%</Text></g>)}</g>
 </g>
 <Caption t={t} start={51.7} end={55.756} note="点阵亮起＝回答「看到了」">有多少人，回答“看到了”？</Caption>
 <Caption t={t} start={55.756} end={62.139} note="SMASHED 16/50 · HIT 7/50 · CONTROL 6/50">不同提问，留下不同答案</Caption>
 <Caption t={t} start={62.139} end={66.386}>影片里，没有碎玻璃</Caption>
 <Caption t={t} start={66.386} end={68.523}>不存在的细节，被补了进去</Caption>
 <Caption t={t} start={68.523} end={72.778} note="回忆档案与碎片为视觉隐喻；实验测量的是回答">一部分人，记起了未发生的细节</Caption>
 </>;
}
function Semantic({t}:{t:number}){
 const network=ease(p(t,81.288,85.546)), center=p(t,89.801,90.35), evidence=p(t,97.9,98.6);
 return <><Header year="1995" label="ROEDIGER & McDERMOTT · DRM 词表范式" source="中文视觉示例 / 非原实验逐字材料"/>
 <g opacity={fade(t,72.778,75.3)}><Text y={535} size={146} fill={G} font="Georgia">1995</Text></g><g opacity={1-evidence} transform={`translate(960 510) scale(${1+p(t,85.546,89.801)*.07})`}>
 {words.map((word,i)=>{const a=i*Math.PI/4-.2;const x=Math.cos(a)*590,y=Math.sin(a)*240;const entry=ease(p(t,74.37+i*.532,75.08+i*.532));const xx=lerp((i-3.5)*190,x,network),yy=lerp(0,y,network);return <g key={word} opacity={entry}>
 <Line x1={xx} y1={yy} x2={xx*(1-network)} y2={yy*(1-network)} opacity={network*.24}/>
 {network>.5&&<circle cx={xx*(1-((t*.23+i*.17)%1))} cy={yy*(1-((t*.23+i*.17)%1))} r={2.5} fill={G} opacity={.6}/>}
 <g transform={`translate(${xx} ${yy+(1-entry)*90}) rotate(${Math.sin(t*.25+i)*.65})`}><path d="M-81 -47 L64 -47 L81 -30 L81 47 L-81 47 Z" fill="url(#paper)" stroke={G} strokeOpacity=".42"/><Text x={0} y={13} size={40}>{word}</Text><Line x1={-64} y1={-35} x2={-36} y2={-35} opacity={.45}/></g></g>;})}
 <g opacity={network}><circle r={102} fill="#0a0e0f" stroke={G} strokeOpacity={.4} strokeDasharray={center>0?'0':'3 12'}/><circle r={117+beat(t)*2} fill="none" stroke={G} strokeOpacity=".12"/>
 <Text x={0} y={17} size={center>0?59:48} fill={G} opacity={center>0?center:.3}>{center>0?'睡眠':'?'}</Text>
 <Text x={0} y={171} size={22} fill={DIM}>{center>0?'从未呈现的中心词':'缺席的中心'}</Text></g></g>
 <g opacity={evidence} transform={`translate(0 ${(1-evidence)*35})`}><Text y={326} size={32} fill={DIM}>原研究 · 英文词表</Text>
 {[['实验一','40'],['实验二','55']].map(([label,value],i)=><g key={label} transform={`translate(${650+i*620} 520)`}><Text x={0} y={-85} size={28} fill={DIM}>{label}</Text><Text x={0} y={45} size={132} fill={G} font="Georgia">{value}<tspan fontSize="54">%</tspan></Text></g>)}
 <Text y={693} size={31}>未呈现关键诱饵词的虚假自由回忆率</Text><Text y={749} size={23} fill={DIM} font={sans}>不是本片中文示例的观众测试结果</Text></g>
 <Caption t={t} start={72.9} end={77.033}>即使，没有误导性提问</Caption>
 <Caption t={t} start={77.033} end={81.288}>读过的词，彼此相连</Caption>
 <Caption t={t} start={81.288} end={85.546}>联想，围出一个空位</Caption>
 <Caption t={t} start={85.546} end={89.801}>空白，也会被补齐</Caption>
 <Caption t={t} start={89.801} end={94.056}>睡眠</Caption>
 <Caption t={t} start={94.056} end={98.312} note="上方已展示的词表中，没有「睡眠」">它从未出现</Caption>
 <Caption t={t} start={98.312} end={102.567} note="Roediger & McDermott, 1995 · 原研究结果">联想，也可能制造回忆</Caption>
 </>;
}

function Archive({t}:{t:number}){
 const gather=.75+.25*ease(p(t,102.567,104.9)),split=ease(p(t,105.2,106.822)),close=p(t,117.461,119.589);
 return <><Header year="记忆档案" label="原始事件 × 后来信息 × 语义联想" source="VISUAL METAPHOR / NOT A MODEL OF THE BRAIN"/>
 <g transform={`translate(960 510) scale(${1-close*.22})`}>
 {['HIT','34.0','SMASHED','40.5','32%','床','休息','睡眠'].map((s,i)=>{const a=i*Math.PI/4+t*.055;const r=lerp(700,360,gather);return <g key={s} opacity={(1-split)*.8}><Line x1={Math.cos(a)*r} y1={Math.sin(a)*r*.48} x2={0} y2={0} opacity={.13}/><Text x={Math.cos(a)*r} y={Math.sin(a)*r*.48} size={29} fill={i>4?G:C}>{s}</Text></g>})}
 {[0,1].map(i=><g key={i} transform={`translate(${(i?1:-1)*430*split} ${Math.sin(t*.45+i)*5}) rotate(${(i?1:-1)*2*split})`} opacity={gather}>
 {[2,1,0].map(k=><rect key={k} x={-328+k*7} y={-225-k*7} width="656" height="450" fill="#0c1113" stroke={i?G:C} strokeOpacity={.15+.13*(2-k)}/>)}
 <g transform="scale(.55)"><Film x={0} y={-10} w={1080} h={490} label={false} progress={1} t={t} glass={i===1}/></g>
 <Text x={0} y={-170} size={25} fill={i?G:C}>{i?'回忆版本':'原始事件'}</Text><Text x={0} y={190} size={25} fill={i?G:C}>{i?'相似的结构 · 多出的细节':'事件留下的记录'}</Text>
 {i===1&&<g opacity={split}><circle cx={77} cy={40} r={62+Math.sin(t)*3} fill="none" stroke={G} strokeDasharray="3 9"/><Line x1={135} y1={55} x2={235} y2={114} opacity={.6}/><Text x={230} y={147} size={22} fill={G}>虚构玻璃</Text></g>}
 </g>)}
 <g opacity={split*.5}><path d="M-65 -60 L65 -60 M-65 60 L65 60" stroke={G}/><Text x={0} y={17} size={28} fill={G}>≠</Text></g>
 </g>
 <Caption t={t} start={102.6} end={106.822}>过去，与后来信息重新汇合</Caption>
 <Caption t={t} start={106.822} end={111.078}>相似，不代表完全相同</Caption>
 <Caption t={t} start={111.078} end={115.333}>回忆，不是重播</Caption>
 <Caption t={t} start={115.333} end={119.589}>它也是一次重建</Caption>
 </>;
}
function Ending({t}:{t:number}){
 const closing=ease(p(t,119.589,124.7)),last=p(t,124.5,125.2),out=1-p(t,128.5,130);
 return <g opacity={out}><g transform={`translate(960 ${375-closing*60}) scale(${.75-closing*.32})`}>
 <g transform={`scale(1 ${1-closing*.88})`}><rect x="-310" y="-160" width="620" height="320" fill="url(#paper)" stroke={G}/><path d="M-275 -125 L-12 -125 L-12 125 L-275 125 M12 -125 L275 -125 L275 125 L12 125" fill="none" stroke={C} strokeOpacity=".6"/></g>
 <Line x1={-320} y1={0} x2={320} y2={0} opacity={.7}/></g>
 <g opacity={p(t,120.3,120.65)} transform={`translate(0 ${(1-ease(p(t,120.3,120.9)))*18})`}><Text y={551} size={76} fill="url(#gold)" spacing={8}>清晰，不等于真实</Text></g>
 <g opacity={p(t,120.5,121.3)}><Text y={635} size={29} fill={DIM}>记忆通常有用，但确信不是独立的真实性证明。</Text></g>
 <g opacity={last}><Line x1={810} y1={722} x2={1110} y2={722} opacity={.4}/><Text y={790} size={42} fill={G} spacing={12}>记忆会撒谎</Text><Text y={841} size={18} fill={DIM} font="Georgia" spacing={5}>THE MEMORY LIES</Text>
 <Text y={933} size={20} fill={DIM} font="Georgia">Loftus & Palmer (1974) · Roediger & McDermott (1995)</Text><Text y={973} size={19} fill={DIM} font={sans}>实验场景与记忆结构均为示意 / 无旁白科学视觉纪录片</Text></g></g>;
}

const Scene=({kind,from}:{kind:number,from:number})=>{
 const now=(useCurrentFrame()+from)/30;const t=remap(now,'new','old');
 const components=[Opening,Questions,Speed,NewExperiment,Glass,Semantic,Archive,Ending];const Component=components[kind];
 return <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute'}}><Environment t={t}/><Component t={t}/><rect width="1920" height="1080" fill="#000" opacity={kind===0?1-p(t,0,.7):0}/></svg>;
};
export const MemoryFilm=()=> <AbsoluteFill style={{background:'#050708'}}>
 <style>{`@font-face{font-family:FilmSong;src:url('${staticFile('fonts/song.ttc')}')}@font-face{font-family:FilmSans;src:url('${staticFile('fonts/sans.ttc')}')}`}</style>
 {boundaries.slice(0,-1).map((a,i)=>{const from=Math.round(remap(a,'old','new')*30),end=Math.round(remap(boundaries[i+1],'old','new')*30);return <Sequence key={i} from={from} durationInFrames={end-from} name={['事件被记录','提问的变量','速度估计','独立实验二','不存在的玻璃','缺席的词','记忆重建','结尾'][i]}><Scene kind={i} from={from}/></Sequence>})}
 <Audio src={staticFile('audio/mix-v2.wav')}/>
 </AbsoluteFill>;

