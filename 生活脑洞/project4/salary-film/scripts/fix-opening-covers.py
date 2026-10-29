from pathlib import Path
p=Path('src/index.tsx');s=p.read_text(encoding='utf-8-sig');s=s.replace('<path d="M-20 -140L25 -80L-30 -30L20 15" stroke={C.blue} strokeWidth="25" fill="none"/>','');p.write_text(s,encoding='utf-8')
p=Path('scripts/cover.mjs');s=p.read_text(encoding='utf-8-sig');s=s.replace('<text x="540" y="1590" font-size="51">原来，我只是工资的中转站。</text>','');s=s.replace("svg.lastIndexOf('<text x=\"540\" y=\"1590\"')","svg.lastIndexOf('</svg>')");s=s.replace('<text x="960" y="990" font-size="40">原来，我只是工资的中转站。</text>','');p.write_text(s,encoding='utf-8')
