export type Pt = [number, number];

export const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export const polyArea = (p: Pt[]) => {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
};

export const centroid = (p: Pt[]): Pt => {
  const n = p.length;
  return [p.reduce((s, q) => s + q[0], 0) / n, p.reduce((s, q) => s + q[1], 0) / n];
};

/** Sutherland–Hodgman：把多边形裁剪到轴对齐矩形 */
export const clipToRect = (poly: Pt[], x0: number, y0: number, x1: number, y1: number): Pt[] => {
  type Edge = {inside: (p: Pt) => boolean; cut: (a: Pt, b: Pt) => Pt};
  const edges: Edge[] = [
    {inside: (p) => p[0] >= x0, cut: (a, b) => lerpPt(a, b, (x0 - a[0]) / (b[0] - a[0]))},
    {inside: (p) => p[0] <= x1, cut: (a, b) => lerpPt(a, b, (x1 - a[0]) / (b[0] - a[0]))},
    {inside: (p) => p[1] >= y0, cut: (a, b) => lerpPt(a, b, (y0 - a[1]) / (b[1] - a[1]))},
    {inside: (p) => p[1] <= y1, cut: (a, b) => lerpPt(a, b, (y1 - a[1]) / (b[1] - a[1]))},
  ];
  let out = poly;
  for (const e of edges) {
    const inp = out;
    out = [];
    for (let i = 0; i < inp.length; i++) {
      const cur = inp[i];
      const prev = inp[(i + inp.length - 1) % inp.length];
      const ci = e.inside(cur);
      const pi = e.inside(prev);
      if (ci) {
        if (!pi) out.push(e.cut(prev, cur));
        out.push(cur);
      } else if (pi) {
        out.push(e.cut(prev, cur));
      }
    }
    if (out.length === 0) return out;
  }
  return out;
};

export const ptsToPath = (p: Pt[], close = true) =>
  p.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" ") + (close ? " Z" : "");

/** 三次贝塞尔求点 */
export const bezier = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};

export const bezierPath = (p0: Pt, p1: Pt, p2: Pt, p3: Pt) =>
  `M${p0[0]} ${p0[1]} C${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]} ${p3[0]} ${p3[1]}`;

/** 折线长度与按弧长重采样（用于形态变形与粒子化） */
export const polyLength = (p: Pt[]) => p.slice(1).reduce((s, q, i) => s + dist(p[i], q), 0);

export const resampleMany = (lines: Pt[][], n: number): Pt[] => {
  const lens = lines.map(polyLength);
  const total = lens.reduce((a, b) => a + b, 0);
  const out: Pt[] = [];
  lines.forEach((line, li) => {
    const k = li === lines.length - 1 ? n - out.length : Math.max(2, Math.round((n * lens[li]) / total));
    const L = lens[li];
    for (let j = 0; j < k; j++) {
      let d = (L * j) / Math.max(1, k - 1);
      let i = 0;
      while (i < line.length - 2 && d > dist(line[i], line[i + 1])) {
        d -= dist(line[i], line[i + 1]);
        i++;
      }
      const seg = dist(line[i], line[i + 1]) || 1;
      out.push(lerpPt(line[i], line[i + 1], Math.min(1, d / seg)));
    }
  });
  return out.slice(0, n);
};

export const circlePts = (cx: number, cy: number, r: number, n = 48, a0 = 0, a1 = Math.PI * 2): Pt[] =>
  Array.from({length: n + 1}, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as Pt;
  });

export const bezierPts = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, n = 40): Pt[] =>
  Array.from({length: n + 1}, (_, i) => bezier(p0, p1, p2, p3, i / n));

/** 齿轮路径 */
export const gearPath = (r: number, teeth: number, depth: number) => {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2;
    const rr = i % 4 < 2 ? r : r - depth;
    pts.push(`${i ? "L" : "M"}${(Math.cos(a) * rr).toFixed(2)} ${(Math.sin(a) * rr).toFixed(2)}`);
  }
  return pts.join(" ") + " Z";
};
