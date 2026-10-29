from pathlib import Path
p=Path('src/index.tsx');s=p.read_text(encoding='utf-8-sig');s=s.replace('</svg></AbsoluteFill>}', '''{f<60&&<g transform={`translate(${-ease(f,50,60)*1200} 0)`}>
<rect width="1080" height="1920" fill={C.blue}/>
<Txt x={100} y={195} size={27} fill={C.cream} anchor="start">如果放映局</Txt>
<Txt y={390} size={88} fill={C.cream}>你的工资，</Txt>
<Txt y={510} size={78} fill={C.cream}>怎么在到账当天</Txt>
<Txt y={650} size={110} fill={C.yellow}>就消失了？</Txt>
<g transform={`translate(540 895) rotate(${-3+Math.sin(f/10)*2})`}>
<Txt x={0} y={0} size={148} fill={C.cream}>{money(8000)}</Txt>
<path d="M-20 -140L25 -80L-30 -30L20 15" stroke={C.blue} strokeWidth="25" fill="none"/>
</g>
<circle cx="540" cy="1225" r="240" fill={C.cream}/>
<Hero x={540} y={1200} scale={.85} mood={1} f={f}/>
{[0,1,2,3].map(j=>{const p=ease(f,8+j*4,38+j*4);return <Coin key={j} x={660+p*420} y={1110-j*40-p*150} r={27} angle={p*180}/>})}
<Txt y={1560} size={40} fill={C.cream}>八千块的工资，究竟去了哪儿？</Txt>
</g>}
</svg></AbsoluteFill>}''');p.write_text(s,encoding='utf-8')
p=Path('scripts/cover.mjs');s=p.read_text(encoding='utf-8-sig');s=s.replace('font-size="84">工资到账 8000','font-size="118" style="fill:#2B2BFF">消失的工资');s=s.replace('font-size="84">最后只剩 1000？','font-size="52">为什么到账当天，就不见了？');s=s.replace('font-size="78">工资到账','font-size="110">消失的');s=s.replace('font-size="188">8000','font-size="188">工资');s=s.replace('font-size="78">最后只剩','font-size="57">为什么到账当天');s=s.replace('font-size="188">1000？','font-size="82">就不见了？');p.write_text(s,encoding='utf-8')
