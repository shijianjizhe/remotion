from pathlib import Path
p=Path('scripts/cover.mjs');s=p.read_text(encoding='utf-8-sig');s='\n'.join(line for line in s.splitlines() if not line.startswith('const pkg='));s+='''
const art=svg.slice(svg.indexOf('<circle cx="540" cy="1000"'),svg.lastIndexOf('<text x="540" y="1590"'));
const style=svg.slice(svg.indexOf('<style>'),svg.indexOf('</style>')+8);
const landscape=`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">${style}<rect width="1920" height="1080" fill="#FFF6E9"/><text x="110" y="140" text-anchor="start" style="text-anchor:start" font-size="32">如果放映局</text><g style="text-anchor:start"><text x="110" y="295" style="text-anchor:start" font-size="78">工资到账</text><text x="100" y="475" style="text-anchor:start;fill:#2B2BFF" font-size="188">8000</text><text x="110" y="625" style="text-anchor:start" font-size="78">最后只剩</text><text x="100" y="810" style="text-anchor:start;fill:#FF5A4E" font-size="188">1000？</text></g><g transform="translate(990 -430) scale(.85)">${art}</g><text x="960" y="990" font-size="40">原来，我只是工资的中转站。</text></svg>`;
for(const [name,content] of [['cover-portrait-9x16',svg],['cover-landscape-16x9',landscape]]) {
 writeFileSync(`out/salary-8000/${name}.svg`,content);
 writeFileSync(`out/salary-8000/${name}.html`,`<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;overflow:hidden">${content}</body></html>`);
}
''';p.write_text(s,encoding='utf-8')
