import React from 'react';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame} from 'remotion';
import cues from './cues.json';

const C={paper:'#E9DFC8',blue:'#283847',red:'#B45C46',gold:'#C5A269',ink:'#252322',skin:'#d7ae85'};
const clamp=(x:number,a=0,b=1)=>Math.min(b,Math.max(a,x));
const ease=(x:number)=>{x=clamp(x);return x*x*(3-2*x)};
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const r=(n:number)=>{const x=Math.sin(n*127.1+61.7)*43758.5453;return x-Math.floor(x)};
const handPath='M-49 132 L-52 54 Q-66 35 -91 9 Q-104 -11 -91 -19 Q-80 -26 -65 -9 L-34 19 L-31 -111 Q-30 -134 -17 -134 Q-3 -133 -4 -111 L-2 -39 L4 -84 Q8 -104 20 -100 Q31 -98 28 -77 L23 -26 L34 -66 Q40 -84 51 -77 Q61 -73 55 -54 L43 -6 L54 -33 Q64 -48 75 -39 Q83 -33 76 -17 L52 46 Q40 69 37 132 Z';
const HAND=<path d={handPath}/>;

function Defs(){return <defs>
 {['paper','blue','red','gold','skin','ink','news'].map(n=><pattern id={n} key={n} width="310" height="310" patternUnits="userSpaceOnUse"><image href={staticFile(n+'.png')} width="310" height="310"/></pattern>)}
 <pattern id="dots" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill={C.ink} opacity=".32"/></pattern>
 <pattern id="stripes" width="38" height="38" patternUnits="userSpaceOnUse" patternTransform="rotate(-7)"><path d="M0 0V38" stroke={C.paper} strokeWidth="2" opacity=".08"/></pattern>
 <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="5" dy="9" stdDeviation="5" floodColor="#161a20" floodOpacity=".35"/></filter>
 <filter id="smallshadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="3" dy="5" stdDeviation="2" floodColor="#151b23" floodOpacity=".4"/></filter>
 <clipPath id="phoneClip"><rect x="-48" y="-90" width="96" height="173" rx="5"/></clipPath>
 <radialGradient id="light"><stop stopColor="#eed899" stopOpacity=".28"/><stop offset="1" stopColor="#eed899" stopOpacity="0"/></radialGradient>
 </defs>}

function Label({x,y,children,size=34,rot=-2,w=310}:{x:number,y:number,children:React.ReactNode,size?:number,rot?:number,w?:number}){return <g transform={`translate(${x} ${y}) rotate(${rot})`} filter="url(#smallshadow)"><path d={`M-8 -${size+8} L${w+9} -${size+13} L${w+3} 16 L${w*.64} 13 L${w*.42} 17 L-10 9 Z`} fill="url(#paper)"/><text x="5" y="0" fontSize={size} fontWeight="700" fill={C.ink}>{children}</text></g>}

function Hand({x,y,scale=1,rot=0,dark=true,gesture=0}:{x:number,y:number,scale?:number,rot?:number,dark?:boolean,gesture?:number}){return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`} filter="url(#smallshadow)">
 <g transform={`rotate(${gesture} 0 90)`} fill={dark?'url(#ink)':'url(#skin)'} stroke={dark?'#c3bca8':'#f1e3c8'} strokeWidth="5" strokeLinejoin="round">{HAND}</g>
 {!dark&&<g fill="none" stroke="#8e654e" strokeWidth="2" opacity=".75" transform={`rotate(${gesture} 0 90)`}><path d="M-23 -78l14 1M-23 -48l14 1M-29 43q36 -22 59 -5M-27 57q25 11 42 0M-42 105h61"/><path d="M-26 -111q10 -12 18 0v16h-18z" fill="#e9c4a5"/></g>}
 <path d="M-54 111L41 111L53 168L-59 168Z" fill={dark?'url(#ink)':'url(#red)'} stroke={C.paper} strokeWidth="5"/>
 <path d="M-50 122h90" stroke={dark?'#46443e':C.gold} strokeWidth="5"/>
 </g>}

function Content({variant=0,t=0}:{variant?:number,t?:number}){return <g>
 <rect x="-48" y="-90" width="96" height="173" fill={variant%3===0?'url(#gold)':variant%3===1?'url(#red)':'url(#paper)'}/>
 <g transform={`translate(0 ${Math.sin(t*5)*4}) rotate(${Math.sin(t*3)*5})`}>
 {variant%3===0?<g transform="translate(0 -7)"><path d="M-31 18L-30 -33L-12 -19L14 -28L32 -41L31 17Z" fill="url(#paper)" stroke={C.ink} strokeWidth="2"/><ellipse cy="10" rx="31" ry="27" fill="url(#paper)"/><circle cx="-12" cy="0" r="4"/><circle cx="13" cy="0" r="4"/><path d="M-4 10L4 10L0 15ZM-27 13l-18 -4M24 13l18 -4" stroke={C.ink} strokeWidth="2"/><path d="M-36 38Q-19 22 0 38Q20 23 36 38L31 52H-31Z" fill="url(#red)"/><path d="M-16 -44l12 -17 13 17" stroke={C.red} strokeWidth="5" fill="none"/></g>:variant%3===1?<g><path d="M-29 28L-24 -14Q0 -28 24 -14L29 28Z" fill="url(#paper)" stroke={C.ink} strokeWidth="2"/><ellipse cy="-16" rx="26" ry="10" fill="url(#gold)"/><path d="M25 -12Q50 -13 40 8Q35 20 27 17" stroke={C.paper} strokeWidth="8" fill="none"/><path d="M-13 -37q-10 -15 0 -24M4 -38q-10 -15 0 -24M18 -38q-10 -15 0 -24" stroke={C.paper} strokeWidth="3" fill="none"/></g>:<g transform="rotate(-15)"><ellipse rx="35" ry="12" fill="none" stroke={C.red} strokeWidth="6"/><circle r="23" fill="url(#blue)"/><path d="M-36 8Q0 28 36 -8" stroke={C.gold} strokeWidth="5" fill="none"/><path d="M-35 -55l3 8 9 2 -9 4 -3 8 -3 -8 -9 -4 9 -2Z" fill={C.red}/></g>}
 </g><rect x="-34" y="58" width="44" height="4" fill={C.ink} opacity=".55"/><rect x="-34" y="67" width="63" height="3" fill={C.ink} opacity=".3"/>
 </g>}
function Phone({t,large=false}:{t:number,large?:boolean}){
 const events=cues.swipes.filter(s=>s<=t);const last=events.at(-1)??-10;const p=clamp((t-last)/.35);const v=events.length;const off=p<1?-ease(p)*182:0;
 return <g filter="url(#smallshadow)"><path d="M-60 -111L58 -108L64 101L-60 106Z" fill="url(#ink)" stroke={C.paper} strokeWidth="5"/>
 <g clipPath="url(#phoneClip)"><g transform={`translate(0 ${off})`}><Content t={t} variant={p<1?v-1:v}/></g>{p<1&&<g transform={`translate(0 ${off+182})`}><Content t={t} variant={v}/></g>}</g><path d="M-12 -99H12" stroke="#aaa28b" strokeWidth="3"/>
 <circle cy="94" r="3" fill={C.paper}/></g>
}

function sector(i:number,outer=177,inner=70){const a=(-90+i*30)*Math.PI/180,b=a+Math.PI/6;const point=(rad:number,ang:number)=>`${Math.cos(ang)*rad},${Math.sin(ang)*rad}`;return `M${point(inner,a)} L${point(113,a+.025)} L${point(128,a-.015)} L${point(144,a+.018)} L${point(outer,a)} A${outer} ${outer} 0 0 1 ${point(outer,b)} L${point(142,b-.02)} L${point(126,b+.025)} L${point(110,b-.02)} L${point(inner,b)} Z`}
const removeTimes=[5.2,9.7,11.8,13.9,16.7,19.6,22.7,24.9,28.8,32.2,36.4,39.7];
function Clock({t}:{t:number}){const time=cues.times.filter(a=>Number(a[0])<=t).at(-1)?.[1];const turn=t>42.6?0:Math.floor(t*2)*1.4;return <g transform="translate(727 520) rotate(4)" filter="url(#shadow)">
 <path d="M-197 -168L-160 -206L171 -196L201 -143L194 174L140 198L-169 194L-203 153Z" fill="url(#news)" stroke={C.paper} strokeWidth="5"/>
 <circle r="184" fill="#867f6b" opacity=".55"/>
  {removeTimes.map((at,i)=>t<at&&<g key={i} transform={`rotate(${-ease((t-at+.2)/.2)*8} 0 0)`}><path d={sector(i)} fill="url(#paper)" stroke="#f7eedb" strokeWidth="2"/><g transform={`rotate(${i*30})`}><path d="M0 -155V-166" stroke={C.ink} strokeWidth="4"/><text y="-126" textAnchor="middle" fontSize="27" fontFamily="Georgia" fill={C.ink}>{i===0?12:i}</text></g></g>)}
 <circle r="72" fill="url(#gold)" stroke={C.paper} strokeWidth="3"/>
 <g opacity={t<42.6?.65:.25} transform={`rotate(${turn})`}><path d="M0 0L-33 -37M0 0L15 -55" fill="none" stroke={C.ink} strokeWidth="5"/><circle r="6" fill={C.red}/></g>
 <g transform={`translate(0 28) rotate(-4)`}><path d="M-113 -25L112 -30L117 37L-109 43Z" fill="url(#paper)" stroke={C.ink} strokeWidth="2"/><text y="24" fontSize="54" letterSpacing="1" textAnchor="middle" fontFamily="Georgia" fontWeight="bold" fill={t>42.6?C.red:C.ink}>{time}</text></g>
 <path d="M-125 -200l52 -12 3 30 -53 11M89 181l55 1 1 28 -53 1" fill={C.gold} opacity=".6"/>
 </g>}

function Character({t}:{t:number}){
 const tired=ease((t-18)/22);const awake=ease((t-43)/3);const breath=Math.sin(t*2)*2;const lift=ease(t/.8);const drop=ease((t-46)/2.4)*60;
 const last=cues.swipes.filter(s=>s<=t).at(-1)??-10;const phase=t-last;const swipe=phase<.6?Math.sin(clamp(phase/.6)*Math.PI):0;
 const nod=tired*16-awake*24+Math.sin(t*1.4)*2;const blink=(Math.floor(t*12)%49)>46;const eye=t>43?mix(3,9,awake):mix(9,3,tired);
 return <g>
 <g transform={`translate(423 ${1103+breath}) rotate(${tired*6})`} filter="url(#shadow)">
  <path d="M-92 -84Q-46 -120 18 -85L112 -29L111 184L-126 202L-143 6Z" fill="url(#red)" stroke={C.paper} strokeWidth="7"/>
  <path d="M-125 -25L-82 -62L-78 128L-119 164Z" fill="url(#dots)" opacity=".6"/>
 <path d="M-49 -101L-26 -40L10 -88M-26 -40L-12 125M-91 31l64 6v56h-61Z" fill="none" stroke={C.gold} strokeWidth="5"/>
 {[0,1,2].map(i=><circle key={i} cx="0" cy={i*39} r="4" fill={C.paper}/>)}
 <g transform={`rotate(${-3+Math.sin(t*1.3)*1.5-awake*8} -83 -4)`}>
 <path d="M-104 -36Q-137 -30 -143 9L-151 91Q-155 123 -129 140Q-112 153 -89 146L-69 114L-82 76L-65 3Q-62 -26 -104 -36Z" fill="url(#red)" stroke={C.paper} strokeWidth="5"/>
 <path d="M-134 109Q-119 93 -98 108L-36 130L-40 170L-115 153Q-143 144 -134 109Z" fill="url(#red)" stroke={C.paper} strokeWidth="5"/>
 <path d="M-51 125L-31 130L-35 173L-55 168Z" fill="url(#gold)" stroke={C.paper} strokeWidth="4"/>
 <path d="M-31 137Q-15 124 1 132L23 141Q33 144 38 153L49 167Q52 175 44 178L29 166L12 159L37 177Q42 187 32 189L6 172L28 191Q30 199 21 200L-7 181L10 198Q11 206 3 206L-27 185Q-38 178 -35 163Z" fill="url(#skin)" stroke={C.paper} strokeWidth="4" strokeLinejoin="round"/>
 <path d="M-21 151Q-9 146 1 151M-124 112q12 0 18 11" fill="none" stroke="#976a51" strokeWidth="2.5"/>
 </g>
 </g>
 <g transform={`translate(${421+tired*13} ${943+tired*30-awake*23+breath}) rotate(${nod})`} filter="url(#shadow)">
 <path d="M-29 73L-30 118L24 113L31 68Z" fill="url(#skin)" stroke={C.paper} strokeWidth="5"/>
 <path d="M-84 -29Q-93 -102 -24 -113Q58 -127 83 -56L73 44Q44 104 -20 87Q-66 76 -80 35Q-111 35 -108 4Q-104 -14 -84 -5Z" fill="url(#skin)" stroke={C.paper} strokeWidth="7"/>
 <path d="M-86 0Q-113 -70 -65 -111L-37 -126L-12 -118L18 -135L40 -112L68 -108L77 -83L93 -63L70 -34L47 -59L20 -42L-2 -57L-40 -43L-66 -55L-69 12Z" fill="url(#ink)"/>
 <path d="M-56 -7l29 -6M18 -17l27 5" stroke={C.ink} strokeWidth="5" fill="none"/>
 <ellipse cx="-38" cy="8" rx="5" ry={blink?1:eye} fill={C.ink}/><ellipse cx="32" cy="5" rx="5" ry={blink?1:eye} fill={C.ink}/>
 <path d="M-50 24l26 1M18 22l28 1" stroke={C.red} strokeWidth={2+tired*3} opacity={.2+tired*.55}/>
 <path d="M1 4L-5 34L9 35" stroke="#976a51" strokeWidth="3" fill="none"/>
 {t>43?<ellipse cx="8" cy="57" rx={7+awake*4} ry="6" fill={C.ink}/>:<path d={`M-12 57Q5 ${66-tired*14} 24 52`} fill="none" stroke={C.ink} strokeWidth="3"/>}
 <path d="M-69 38Q-61 63 -34 70" fill="none" stroke={C.red} strokeWidth="7" opacity=".22"/>
 <path d="M-90 -1q-17 3 -8 20" stroke="#976a51" strokeWidth="3" fill="none"/>
 </g>
 <g transform={`translate(583 ${1060+(1-lift)*115+drop+breath}) rotate(${-9+tired*8})`}>
 <path d={`M-88 31Q-109 53 -99 91L-79 139Q-69 156 -47 158L36 ${184-swipe*53}L77 ${158-swipe*53}L-38 111L-32 52Z`} fill="url(#red)" stroke={C.paper} strokeWidth="5" strokeLinejoin="round"/>
 <path d="M-81 129q13 -13 29 -5" fill="none" stroke={C.gold} strokeWidth="3"/>
 <Phone t={t}/>
 <Hand x={40} y={88-swipe*53} scale={.48} dark={false} rot={-14-swipe*9} gesture={-swipe*8}/>
 </g>
 </g>}

function Fragment({i,t,at,huge=false}:{i:number,t:number,at:number,huge?:boolean}){
 const age=t-at;if(age<0)return null;const dur=1.8+r(i)*.7;const p=clamp(age/dur);const fall=ease(p);const finalX=100+r(i+42)*850,finalY=1530-r(i+7)*90-Math.max(0,i-8)*7;
 const angle=(-75+i*30)*Math.PI/180;const x=mix(i<12?727+Math.cos(angle)*126:740+Math.cos(i)*80,finalX,fall)+Math.sin(p*Math.PI)*110*Math.sin(i);const y=mix(i<12?520+Math.sin(angle)*126:460,finalY,p*p);const rot=mix(i*29,140+r(i)*260,p);
 return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${huge?1.6:i<12?1:.6+r(i)*.55})`} filter="url(#smallshadow)">{i<12?<g transform="translate(-35 120)"><path d={sector(0)} fill="url(#paper)" stroke="#f8efdb" strokeWidth="3"/><text x="24" y="-120" fontSize="30" fontFamily="Georgia" fill={C.ink}>{i===0?12:i}</text></g>:<><path d="M-53 -42L9 -53L40 -29L56 -13L35 42L-10 34L-32 47L-44 8L-58 -3Z" fill={i%4===0?'url(#gold)':i%4===1?'url(#news)':'url(#paper)'} stroke="#f8efdb" strokeWidth="3"/><path d="M-42 -8L-9 -17L32 -8M-36 1l36 -9M-29 19l48 -7" stroke={C.ink} opacity=".15" strokeWidth="2"/><text textAnchor="middle" y="18" fontSize="45" fill={C.ink} fontFamily="Georgia">{(i*7)%60<10?'0':''}{(i*7)%60}</text></>}</g>
}

function RoomDetails({t,front=false}:{t:number,front?:boolean}){
 const sway=Math.sin(t*1.1)*2;const dim=ease((t-22)/21);
 if(front)return <g>
  <g transform={`translate(964 1430) rotate(${sway})`} filter="url(#shadow)">
   <path d="M-7 -4Q-14 -98 12 -190M-6 -48Q-57 -102 -73 -143M-3 -77Q49 -117 55 -173" fill="none" stroke={C.gold} strokeWidth="6"/>
   {[[-62,-130,-50],[22,-175,25],[48,-137,55],[-26,-82,-55],[7,-116,18]].map(([x,y,a],i)=><g key={i} transform={`translate(${x} ${y}) rotate(${a+sway})`}><path d="M0 24Q-52 -5 -5 -57Q27 -18 0 24Z" fill={i%2?'url(#gold)':'url(#blue)'} stroke={C.paper} strokeWidth="3"/><path d="M-4 -44L0 20" stroke={C.paper} opacity=".45" strokeWidth="2"/></g>)}
   <path d="M-55 -6L49 -9L32 80L-38 82Z" fill="url(#red)" stroke={C.paper} strokeWidth="5"/><path d="M-45 13H40M-40 25H36" stroke={C.gold} strokeWidth="4"/>
  </g>
  <g transform="translate(105 1538) rotate(-12)" filter="url(#smallshadow)"><path d="M-46 0Q-61 -60 -15 -66Q8 -60 6 -25L12 27L-39 36Z" fill="url(#red)" stroke={C.paper} strokeWidth="4"/><path d="M26 -14Q9 -73 53 -78Q79 -72 78 -34L86 13L34 23Z" fill="url(#red)" stroke={C.paper} strokeWidth="4"/><path d="M-44 -13l43 -8M28 -27l48 -9" stroke={C.gold} strokeWidth="8"/></g>
 </g>;
 return <g>
  {/* Torn wall panels, a screen-printed lunar diagram, and changing lamplight. */}
  <path d="M49 754L168 732L156 763L224 748L214 787L295 773L289 818L198 837L153 816L48 853Z" fill="url(#news)" opacity=".12"/>
  <path d="M980 277L1032 263L1046 1281L1009 1249L1017 1154L990 1091Z" fill="url(#ink)" opacity=".3"/>
  <g transform="translate(804 849) rotate(-6)" filter="url(#smallshadow)"><path d="M-88 -99L86 -94L91 100L-92 104Z" fill="url(#news)" stroke={C.gold} strokeWidth="6"/><path d="M-72 -83L73 -78L75 80L-75 85Z" fill="url(#blue)"/><circle cy="-8" r="46" fill="url(#gold)"/><path d="M-46 -8A46 46 0 0 1 46 -8Z" fill="url(#dots)"/><ellipse cy="-8" rx="65" ry="20" fill="none" stroke={C.paper} strokeWidth="2" transform="rotate(-35)"/><path d="M-43 59h85M-25 69h49" stroke={C.paper} strokeWidth="2" opacity=".6"/><path d="M-24 -107h48v21h-48Z" fill={C.gold} opacity=".65"/></g>
  <path d={`M106 1130L232 1126L${365+Math.sin(t*.7)*12} 1426L16 1435Z`} fill={C.gold} opacity={.11*(1-dim*.7)}/>
  <g transform="translate(145 1350) rotate(-3)" filter="url(#shadow)">
   <path d="M-101 -16L89 -19L106 15L-107 19Z" fill="url(#gold)" stroke={C.paper} strokeWidth="4"/><path d="M-82 18L-87 102M73 16L82 103" stroke={C.ink} strokeWidth="12"/>
   <path d="M-77 -33L20 -36L24 -18L-75 -14Z" fill="url(#red)" stroke={C.paper} strokeWidth="3"/><path d="M-69 -50L18 -47L14 -32L-73 -33Z" fill="url(#blue)" stroke={C.paper} strokeWidth="3"/><path d="M-61 -42l63 3" stroke={C.gold} strokeWidth="2"/>
   <path d="M36 -68L71 -69L69 -25Q52 -18 38 -26Z" fill="url(#paper)" stroke={C.ink} strokeWidth="2"/><path d="M72 -61Q98 -63 88 -42L71 -39" fill="none" stroke={C.paper} strokeWidth="7"/>
   <g opacity={Math.max(0,1-t/29)*.5} transform={`translate(0 ${-3-Math.sin(t*2)*5})`}><path d="M45 -80q-9 -13 1 -23M61 -80q-9 -13 1 -23" stroke={C.paper} strokeWidth="3" fill="none"/></g>
  </g>
 </g>;
}

function Room({t}:{t:number}){
 const st=Math.floor(t*12)/12;const active=removeTimes.findIndex(a=>st>=a-.8&&st<a+1);const last=active>=0?removeTimes[active]:0;const ap=st-last;
 const handIn=active>=0?ease((ap+.8)/.5)*(1-ease((ap-.45)/.55)):0;
 const night=ease((t-39)/2.6);const nightRot=-night*55;const pieces=Math.floor(clamp((t-10)/30)*46);
 return <g>
 <path d="M37 251L1033 233L1055 1523L26 1551Z" fill="url(#blue)" stroke={C.paper} strokeWidth="12"/>
 <path d="M48 263H1031V1510H48Z" fill="url(#stripes)"/>
 <path d="M48 263H1031V1510H48Z" fill={C.ink} opacity={ease((t-24)/19)*.18}/>
 <ellipse cx="291" cy="1138" rx="400" ry="512" fill="url(#light)" opacity={1-clamp(t/70)}/>
 <path d="M40 1443L1050 1413L1098 1789L-30 1808Z" fill="url(#news)" stroke={C.paper} strokeWidth="6"/>
 {[0,1,2,3,4,5].map(i=><path key={i} d={`M${-130+i*260} 1790L${100+i*160} 1425`} stroke={C.ink} strokeWidth="2" opacity=".2"/>)}
 <path d="M40 1420L1050 1394L1052 1420L40 1450Z" fill="url(#gold)"/>
 {/* The night is an actual removable sheet, with a lighter backing exposed underneath. */}
 <path d="M107 334L439 320L455 723L113 737Z" fill="url(#news)" stroke={C.paper} strokeWidth="8"/>
 <g opacity={1-ease((night-.86)/.14)} transform={`translate(${night*450} ${-night*640}) rotate(${nightRot} 260 520)`} filter="url(#shadow)">
 <path d="M121 344L424 334L440 708L126 719Z" fill="url(#ink)"/>
 <path d="M138 363L407 349L419 690L140 704Z" fill="url(#blue)"/>
 <g opacity=".7"><path d="M142 685V596L165 591V616L186 612V571L212 566V600L242 596V557L264 553V598L291 594V575L315 573V614L342 608V560L375 554V585L411 580L418 691Z" fill="url(#ink)"/>{Array.from({length:14},(_,i)=><rect key={i} x={151+i*18} y={624+(i%3)*15} width="5" height="9" fill={C.gold} opacity={t<22+i? .8:.08}/>)}</g>
 <g transform={`translate(${Math.sin(t*.16)*23} 0)`} opacity=".18"><path d="M152 462Q171 433 191 452Q214 429 235 459L271 462L269 471L150 475Z" fill="url(#paper)"/><path d="M302 496Q322 473 345 490Q365 470 388 494L407 501L302 508Z" fill="url(#paper)"/></g>
 <path d="M317 386Q274 425 328 448Q268 460 262 414Q263 379 317 386" fill="url(#paper)"/>
 {Array.from({length:20},(_,i)=><circle key={i} cx={153+r(i)*240} cy={360+r(i+90)*300} r={1+r(i+4)*2} fill={C.paper} opacity={.3+r(i)*.6}/>)}
 <path d="M274 340L284 707M128 528L430 516" stroke="#b8a98c" strokeWidth="12"/>
 <path d="M116 714L449 703L459 729L115 743Z" fill="url(#gold)"/>
 </g>
 <path d="M92 318L151 316L165 659L123 702L87 688Z" fill="url(#red)" stroke={C.paper} strokeWidth="5"/>
 <path d="M101 333L114 666M126 333L141 643" stroke={C.gold} strokeWidth="5" opacity=".5"/>
 <g transform="translate(164 1104) rotate(-5)" filter="url(#shadow)"><path d="M-70 175L50 174L72 196L-73 204Z" fill="url(#gold)"/><path d="M-6 5L-10 174" stroke={C.paper} strokeWidth="11"/><path d="M-67 -51L47 -55L83 22L-94 29Z" fill="url(#gold)" stroke={C.paper} strokeWidth="5"/><path d="M-50 -43L-67 12M-25 -44L-32 13M4 -43L7 13M28 -43L46 12" stroke={C.ink} opacity=".2" strokeWidth="3"/></g>
 <Clock t={t}/>
 <RoomDetails t={t}/>
 {/* Bed, pillow, articulated occupant, then foreground quilt. */}
 <g filter="url(#shadow)"><path d="M204 1091L864 1074L901 1506L164 1535Z" fill="url(#gold)" stroke={C.paper} strokeWidth="8"/><path d="M213 1120L829 1101L865 1453L179 1482Z" fill="url(#paper)"/><path d="M242 1089Q325 1052 441 1098L426 1211L238 1224L219 1167Z" fill="url(#news)" stroke={C.paper} strokeWidth="8"/></g>
 <Character t={t}/>
 <g filter="url(#shadow)"><path d="M192 1290Q380 1238 552 1294Q711 1235 872 1263L902 1486L166 1534Z" fill="url(#blue)" stroke={C.paper} strokeWidth="8"/>
 <path d="M182 1360Q450 1311 882 1335M173 1443Q489 1393 893 1418" fill="none" stroke={C.gold} strokeWidth="7"/>
 {[0,1,2,3,4,5,6].map(i=><path key={i} d={`M${243+i*90} 1290L${210+i*102} 1502`} stroke={C.red} strokeWidth="18" opacity=".8"/>)}
 <path d="M170 1514L903 1470L916 1504L173 1550Z" fill="url(#red)" stroke={C.paper} strokeWidth="5"/><path d="M209 1544v66M861 1512v70" stroke={C.ink} strokeWidth="25"/>
 </g>
 <RoomDetails t={t} front/>
 {/* Accumulation is monotone: settled scraps never disappear. */}
 {night>.9&&<g transform="translate(230 1490) rotate(-13)" opacity={ease((night-.9)/.1)}><path d="M-160 -120L-30 -153L43 -58L122 -142L200 24L-120 89Z" fill="url(#blue)" stroke={C.paper} strokeWidth="7"/><path d="M-111 -80L-30 -111L43 -58L78 14M-30 -111L-29 32" stroke={C.gold} strokeWidth="8"/><path d="M117 -61q-40 36 9 47q-54 12 -50 -24q4 -26 41 -23" fill="url(#paper)"/></g>}
 {Array.from({length:pieces},(_,i)=><g key={i} transform={`translate(${75+r(i+50)*925} ${1590-r(i+51)*170-Math.max(0,i-22)*10}) rotate(${r(i+60)*160-80})`} filter="url(#smallshadow)"><path d="M-60 -25L-23 -47L25 -36L63 -9L45 32L0 25L-34 40Z" fill={i%3===0?'url(#news)':i%3===1?'url(#paper)':'url(#gold)'} stroke={C.paper} strokeWidth="3"/><text textAnchor="middle" y="13" fontSize="33" fontFamily="Georgia" fill={C.ink}>{i%2===0?'60':i%3===0?'23':'00'}</text></g>)}
 {removeTimes.map((at,i)=><Fragment key={i} i={i} at={at+.14} t={st}/>)}
 {t>39&&Array.from({length:27},(_,i)=><Fragment key={'c'+i} i={i+13} at={39.4+i*.095} t={st} huge={i%5===0}/>)}
 {t>41&&<g transform={`translate(${270+Math.sin(st*1.8)*70} ${Math.min(1490,500+(st-41)*61)}) rotate(${Math.sin(st*2)*40})`}><path d="M-22 -11L19 -18L30 6L-15 18Z" fill="url(#paper)" stroke={C.gold} strokeWidth="2"/></g>}
 {active>=0&&t<38.6&&<Hand x={1120-handIn*235+Math.max(0,ap)*65} y={434-Math.max(0,ap)*170} scale={1.25} rot={-65} gesture={ap>0?-12:8}/>}
 {t>37.8&&t<42.6&&<Hand x={1010-ease((st-37.8)/1.1)*345+night*570} y={400-night*610} scale={2.8} rot={-58-night*24} gesture={-night*22}/>}
 {night>0&&night<1&&<path d={`M${117+night*60} ${715-night*120}l42 -12 20 8 34 -15 26 8 30 -12 22 8 35 -16 24 5`} fill="none" stroke={C.paper} strokeWidth="8"/>}
 </g>}

function camera(t:number):[number,number,number]{
 // scale, world center X, world center Y; each shot has motivated continuous motion.
 if(t<4)return [mix(.91,1.02,ease(t/4)),540,965];
 if(t<9)return [mix(1.05,1.17,(t-4)/5),590,mix(900,850,(t-4)/5)];
 if(t<11.2)return [2.95,578,mix(1080,1040,(t-9)/2.2)];
 if(t<13.2)return [1.12,555,920];
 if(t<16)return [mix(1.7,1.85,(t-13.2)/2.8),695,610];
 if(t<18.6)return [1.8,700,mix(600,660,(t-16)/2.6)];
 if(t<22)return [mix(1.7,1.18,ease((t-18.6)/3.4)),mix(700,535,ease((t-18.6)/3.4)),mix(660,1295,ease((t-18.6)/3.4))];
 if(t<24.5)return [mix(1.05,1.16,(t-22)/2.5),555,945];
 if(t<26.2)return [mix(1.65,1.85,(t-24.5)/1.7),mix(590,510,(t-24.5)/1.7),1370];
 if(t<28)return [mix(1.8,1.9,(t-26.2)/1.8),475,1050];
 if(t<31.2)return [mix(1.3,1.38,(t-28)/3.2),570,850];
 if(t<34)return [1.75,480,mix(1110,1080,(t-31.2)/2.8)];
 if(t<36)return [mix(1.8,1.94,(t-34)/2),700,650];
 if(t<38)return [mix(1.14,1.02,(t-36)/2),565,940];
 if(t<42.6)return [mix(1.02,.95,ease((t-38)/4.6)),540,970];
 if(t<45.2)return [mix(1.1,1.25,(t-42.6)/2.6),565,925];
 if(t<49)return [mix(1.6,1.8,(t-45.2)/3.8),465,1020];
 return [mix(1,.75,ease((t-54)/4)),540,960];
}

function Reveal({t}:{t:number}){const u=t-49;const last=cues.swipes.filter(s=>s>=49&&s<=t).at(-1)??50.2;const p=clamp((t-last)/.65);const stroke=Math.sin(p*Math.PI);const merge=ease((u-2.2)/2.8);const enter=110*(1-ease(u/1.2));return <g>
 <path d="M55 330L1019 300L1043 1560L37 1580Z" fill="url(#blue)" stroke={C.paper} strokeWidth="8"/>
 <g opacity=".12" fill="url(#dots)"><rect x="57" y="330" width="960" height="1240"/></g>
 <path d="M535 417L527 487L543 514L529 571L537 653L523 705L538 783L529 860L539 924L527 1002L538 1077L526 1144L536 1215L529 1298L539 1382" stroke={C.paper} strokeWidth="3" fill="none" opacity={1-merge}/>
 <g transform={`translate(${mix(330,540,merge)} 950) rotate(-7) scale(2.3)`}><Phone t={t}/></g>
 <Hand x={mix(343,551,merge)} y={1120-stroke*125+enter} scale={2.15} rot={-14-stroke*9} dark={false} gesture={-stroke*8}/>
 <g opacity={mix(1,.65,merge)}><Hand x={mix(800,551,merge)} y={1120-stroke*125+enter} scale={2.15} rot={-14-stroke*9} dark gesture={-stroke*8}/></g>
 <g transform={`translate(${mix(780,540,merge)} 643) rotate(${stroke*14})`} opacity={1-merge}><path d={sector(0,144,45)} fill="url(#paper)" stroke={C.paper} strokeWidth="4"/><text x="33" y="-83" fontFamily="Georgia" fontSize="38" fill={C.ink}>12</text></g>
 <path d="M129 1450L930 1429" stroke={C.gold} strokeWidth="3" opacity=".6"/>
 </g>}

export const Film:React.FC=()=>{
 const frame=useCurrentFrame();const t=frame/30;const st=Math.floor(t*12)/12;const [s,cx,cy]=camera(t);const shake=t>39&&t<42.6?Math.sin(st*37)*4*(1-(t-39)/4):0;
 return <AbsoluteFill style={{background:C.paper}}><Audio src={staticFile('soundtrack.wav')}/>
 <svg viewBox="0 0 1080 1920" width="1080" height="1920" style={{fontFamily:'"Microsoft YaHei", sans-serif'}}>
 <Defs/><rect width="1080" height="1920" fill="url(#paper)"/>
 <path d="M26 76L1045 65M38 1830L1042 1842" stroke={C.ink} strokeWidth="2" opacity=".3"/>
 <text x="65" y="123" fontFamily="Georgia" letterSpacing="6" fontSize="20" fill={C.ink}>THE STOLEN HOURS</text>
 <text x="965" y="123" fontFamily="Georgia" textAnchor="end" fontSize="24" fill={C.red}>05</text>
 {t>=49&&t<54?<Reveal t={st}/>:<g transform={`translate(${540+shake} 960) scale(${s}) translate(${-cx} ${-cy})`}><Room t={st}/></g>}
 {/* The opening line is a physical slip, gone as the first theft begins. */}
 {t<3.8&&<g transform={`translate(0 ${mix(65,0,ease(t/.4))})`} opacity={1-ease((t-3.35)/.45)}><Label x={170} y={302} size={48} w={690} rot={-3}>最后刷一个，就睡。</Label></g>}
 {t>=54&&<g opacity={ease((t-54.25)/.7)} transform={`translate(0 ${mix(28,0,ease((t-54.25)/1))})`}>
 <Label x={170} y={1480} size={42} w={720} rot={-2}>你刷走的，</Label>
 <Label x={235} y={1554} size={42} w={650} rot={1}>不只是下一个视频。</Label>
 <text x="540" y="1665" textAnchor="middle" fill={C.ink} fontSize="29" letterSpacing="9">如果放映局</text>
 </g>}
 <text x="66" y="1800" fontFamily="Georgia" fontSize="17" letterSpacing="3" fill={C.ink} opacity=".5">A PAPER NIGHT / 23:00 — 02:00</text>
 </svg></AbsoluteFill>;
};
