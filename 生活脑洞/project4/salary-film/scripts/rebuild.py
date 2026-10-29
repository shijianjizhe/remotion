from pathlib import Path
p=Path('src/index.tsx')
s=p.read_text(encoding='utf-8-sig').replace('spring,staticFile','spring,staticFile,Audio')
s=s[:s.index('function Film()')]
s=s.replace('const bite=Math.sin(Math.min(1,Math.max(0,(t+12)/12))*Math.PI)', 'const bite=1-Math.min(1,Math.max(0,(t+5)/6))')
s=s.replace('<circle cx="-35" cy="15" r="11" fill={C.cream}/><circle cx="35" cy="15" r="11" fill={C.cream}/>','{i!==6&&<><circle cx="-35" cy="15" r="11" fill={C.cream}/><circle cx="35" cy="15" r="11" fill={C.cream}/></>}')
p.write_text(s,encoding='utf-8')
