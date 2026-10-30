import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Environment, Projector, Film, Shard } from "./MemoryFilm";
import timeline from "./v5-timeline.json";

const G = "#c9ac72",
  W = "#eee6d4",
  C = "#92aab5",
  D = "#a39a84",
  BG = "#101614";
const song = "FilmSong, SimSun, serif",
  sans = "FilmSans, Microsoft YaHei, sans-serif";
const cl = (v: number) => Math.max(0, Math.min(1, v));
const p = (f: number, a = 0, b = 18) => cl((f - a) / (b - a));
const e = (v: number) => 1 - (1 - cl(v)) ** 3;
const T = ({
  x = 960,
  y = 540,
  size = 44,
  fill = W,
  children,
  anchor = "middle",
  font = song,
  opacity = 1,
  ...rest
}: any) => (
  <text
    x={x}
    y={y}
    fontSize={size}
    fill={fill}
    textAnchor={anchor}
    fontFamily={font}
    opacity={opacity}
    {...rest}
  >
    {children}
  </text>
);
const L = ({ x1, y1, x2, y2, color = G, opacity = 0.35, ...rest }: any) => (
  <line
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2}
    stroke={color}
    opacity={opacity}
    {...rest}
  />
);
const Card = ({
  x,
  y,
  w = 280,
  h = 140,
  children,
  color = G,
  opacity = 1,
}: any) => (
  <g opacity={opacity}>
    <rect
      x={x - w / 2 + 7}
      y={y - h / 2 + 9}
      width={w}
      height={h}
      rx="3"
      fill="#000"
      opacity=".45"
    />
    <rect
      x={x - w / 2}
      y={y - h / 2}
      width={w}
      height={h}
      rx="3"
      fill="url(#paper)"
      stroke={color}
      strokeOpacity=".45"
    />
    <path
      d={`M${x - w / 2 + 12} ${y - h / 2 + 34} V${y - h / 2 + 12} H${x - w / 2 + 34} M${x + w / 2 - 34} ${y + h / 2 - 12} H${x + w / 2 - 12} V${y + h / 2 - 34}`}
      stroke={color}
      opacity=".5"
      fill="none"
    />
    {children}
  </g>
);
const Reveal = ({ f, at = 0, children }: any) => (
  <g
    opacity={p(f, at, at + 10)}
    transform={`translate(0 ${(1 - e(p(f, at, at + 18))) * 18})`}
  >
    {children}
  </g>
);
const Small = ({ children, y = 805, ...rest }: any) => (
  <T y={y} size={28} fill={D} font={sans} {...rest}>
    {children}
  </T>
);
type Shot = (typeof timeline.shots)[number];
const chapters: any = {
  A: ["1995", "ROEDIGER & McDERMOTT", "未呈现的词 / 英文词表研究"],
  B: ["1974", "LOFTUS & PALMER", "实验二 / 事后问句与报告"],
  C: ["2002", "WADE et al.", "加工照片 / 自传式记忆"],
  D: ["2017", "SCOBORIA et al.", "八项已发表研究 / 综合分析"],
  E: ["1993", "JOHNSON et al.", "SOURCE MONITORING / 理论框架"],
  F: ["记忆", "THE EVIDENCE", "原始记录 / 主观回忆"],
};
function Header({ id }: { id: string }) {
  const c =
    id === "E03" || id === "E04" || id === "E05"
      ? ["2003", "TALARICO & RUBIN", "一致性与确信 / 两种指标"]
      : chapters[id[0]];
  return (
    <>
      <T
        x={110}
        y={108}
        size={54}
        fill={G}
        anchor="start"
        font={id[0] === "F" ? song : "Georgia"}
      >
        {c[0]}
      </T>
      <T x={110} y={154} size={27} fill={D} anchor="start" font={sans}>
        {c[1]}
      </T>
      <T x={1810} y={112} size={27} fill={D} anchor="end" font={sans}>
        {c[2]}
      </T>
      <L x1={110} y1={184} x2={1810} y2={184} opacity={0.16} />
    </>
  );
}
function Caption({ shot, f }: { shot: Shot; f: number }) {
  const local = f - (shot.captionFrame - shot.fromFrame),
    chars = Array.from(shot.caption),
    q = p(local, 0, 10);
  if (local < 0 || shot.id === "F02") return null;
  return (
    <g
      opacity={p(shot.toFrame - shot.fromFrame - f, 0, 5)}
      transform={
        shot.captionMode === "rise"
          ? `translate(0 ${(1 - e(q)) * 20})`
          : shot.captionMode === "lock"
            ? `translate(960 922) scale(${1.035 - 0.035 * e(q)}) translate(-960 -922)`
            : undefined
      }
    >
      <T y={925} size={48} opacity={shot.captionMode === "type" ? 1 : q}>
        {shot.captionMode === "type"
          ? chars.map((c, i) => (
              <tspan
                key={i}
                x={960 + (i - (chars.length - 1) / 2) * 48}
                opacity={p(local, i * 2, i * 2 + 3)}
              >
                {c}
              </tspan>
            ))
          : shot.caption}
      </T>
    </g>
  );
}
const wordList = ["床", "休息", "醒来", "做梦", "枕头", "困倦", "夜晚", "打盹"];
const ring = (i: number) => ({
  x: 960 + Math.cos(((i * 45 - 90) * Math.PI) / 180) * 535,
  y: 500 + Math.sin(((i * 45 - 90) * Math.PI) / 180) * 235,
});
function Words({ id, f, t }: { id: string; f: number; t: number }) {
  if (id === "A05")
    return (
      <>
        <T y={270} size={35} fill={D}>
          未呈现关键关联词的虚假自由回忆率
        </T>
        {[40, 55].map((n, i) => (
          <Reveal key={i} f={f} at={i * 32}>
            <Card x={615 + i * 690} y={510} w={560} h={345}>
              <T x={615 + i * 690} y={403} size={34}>
                实验{i === 0 ? "一" : "二"}
              </T>
              <T x={615 + i * 690} y={560} size={122} fill={G} font="Georgia" opacity={1 - e(p(f, 4 + i * 64, 16 + i * 64))}>
                —
              </T>
              <T x={615 + i * 690} y={560} size={122} fill={G} font="Georgia" opacity={e(p(f, 4 + i * 64, 16 + i * 64))}>
                {n}%
              </T>
              <T x={615 + i * 690} y={625} size={29} fill={D}>
                不同词表与实验条件
              </T>
            </Card>
          </Reveal>
        ))}
        <Small>两个实验，都有人回忆起未出现的关联词</Small>
      </>
    );
  if (id === "A06")
    return (
      <>
        {[0, 1].map((i) => (
          <g key={i}>
            <Card x={570 + i * 780} y={505} w={610} h={350} color={i ? G : W}>
              <T x={570 + i * 780} y={395} size={34} fill={i ? G : W}>
                {i ? "回忆报告" : "实际呈现"}
              </T>
              <T x={570 + i * 780} y={492} size={38}>
                床　休息　醒来
              </T>
              <T x={570 + i * 780} y={555} size={38}>
                枕头　困倦　夜晚
              </T>
              {i === 1 && (
                <Reveal f={f} at={18}>
                  <T x={1350} y={637} size={48} fill={G}>
                    ＋ 睡眠
                  </T>
                </Reveal>
              )}
            </Card>
          </g>
        ))}
        <L x1={895} y1={500} x2={1010} y2={500} />
        <Small>语义联想可能带来未呈现信息的回忆</Small>
      </>
    );
  const isReveal = id === "A04",
    closed = id === "A03";
  const global = t * 30;
  const presenting = id === "A01" || id === "A02";
  const shrink = isReveal ? e(p(f, 30, 65)) : 0;
  return (
    <>
      <g
        transform={`translate(${-340 * shrink} ${30 * shrink}) translate(960 500) scale(${1 - 0.33 * shrink}) translate(-960 -500)`}
      >
        {wordList.map((word, i) => {
          const r = ring(i),
            onset = Math.round((0.4376 + i * 0.531926 * 2) * 30),
            progress = presenting ? p(global, onset, onset + 12) : 1,
            appear = progress * progress * (3 - 2 * progress);
          const dim = closed ? 1 - 0.87 * e(p(f, 8 + i * 2, 30 + i * 2)) : 1;
          return (
            <g key={word} opacity={appear * dim}>
              <L
                x1={r.x}
                y1={r.y}
                x2={960}
                y2={500}
                color={C}
                opacity={id === "A01" || id === "A02" ? 0 : 0.22}
              />
              <Card x={r.x} y={r.y} w={204} h={98} color={W}>
                <T x={r.x} y={r.y + 15} size={43}>
                  {word}
                </T>
              </Card>
            </g>
          );
        })}
        <rect
          x="825"
          y="442"
          width="270"
          height="116"
          fill="#060a09"
          stroke={G}
          strokeDasharray={isReveal ? "0" : "5 10"}
          strokeOpacity={0.5}
        />
        {isReveal ? (
          <Reveal f={f} at={8}>
            <T y={525} size={65} fill={G}>
              睡眠
            </T>
          </Reveal>
        ) : (
          <T y={520} size={42} fill={G} opacity={closed ? 1 : 0.25}>
            {closed ? "？" : "· · ·"}
          </T>
        )}
      </g>
      {isReveal && (
        <Reveal f={f} at={45}>
          <Card x={1445} y={505} w={560} h={435} color={W}>
            <T x={1445} y={352} size={34}>
              回放实际词表
            </T>
            {[0, 1, 2, 3].map((i) => (
              <Reveal key={i} f={f} at={45 + i * 12}>
                <T x={1445} y={423 + i * 56} size={34} fill={W}>
                  {wordList[i * 2]}　 /　{wordList[i * 2 + 1]}
                </T>
              </Reveal>
            ))}
            <T x={1445} y={680} size={35} fill={G}>
              没有「睡眠」
            </T>
          </Card>
        </Reveal>
      )}
      {isReveal && <Small y={835}>核对原始词表：关键词确实缺席</Small>}
    </>
  );
}
function Dots({
  x,
  y,
  count = 50,
  lit = 0,
  f = 999,
  at = 0,
  cols = 10,
  gap = 26,
}: any) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <circle
          key={i}
          cx={x + (i % cols) * gap}
          cy={y + Math.floor(i / cols) * gap}
          r={7}
          fill={i < lit && f >= at + i * 1.2 ? G : C}
          opacity={
            p(f, at + i * 0.24, at + i * 0.24 + 6) * (i < lit ? 1 : 0.27)
          }
        />
      ))}
    </g>
  );
}
function Glass({ id, f, t }: { id: string; f: number; t: number }) {
  if (id === "B01")
    return (
      <>
        <g transform={`translate(-40 68) scale(.66)`}>
          <Projector t={t} />
        </g>
        <g opacity={p(f, 8, 24)}>
          <Film
            x={1190}
            y={480}
            w={990}
            h={400}
            progress={p(f, 5, 82)}
            t={t}
            label={false}
          />
        </g>
        <Small y={755}>影片不足1分钟，其中事故片段约4秒</Small>
      </>
    );
  if (id === "B04")
    return (
      <>
        <T y={330} size={34} fill={D}>
          实验当天
        </T>
        <L x1={330} y1={530} x2={1590} y2={530} opacity={0.5} />
        {Array.from({ length: 8 }, (_, i) => (
          <g key={i} opacity={p(f, i * 8, i * 8 + 8)}>
            <circle
              cx={330 + i * 180}
              cy={530}
              r={i === 7 ? 17 : 7}
              fill={i === 7 ? G : C}
            />
            <T x={330 + i * 180} y={595} size={32} fill={i === 7 ? G : D}>
              {i}
            </T>
          </g>
        ))}
        <Reveal f={f} at={60}>
          <T y={420} size={80} fill={G}>
            7 DAYS LATER
          </T>
          <Small y={730}>同一批参与者 · 无重播 · 回答后续问题表</Small>
        </Reveal>
      </>
    );
  if (id === "B05")
    return (
      <>
        <g
          transform={`translate(960 505) scale(${0.96 + 0.04 * e(p(f, 0, 30))}) translate(-960 -505)`}
        >
          <Card x={960} y={500} w={1260} h={410}>
            <Small y={360}>后续问卷 / 10道问题中的一道</Small>
            <T y={505} size={65}>
              你是否看见碎玻璃？
            </T>
            <Reveal f={f} at={28}>
              <T x={750} y={620} size={43}>
                □ 是
              </T>
              <T x={1170} y={620} size={43}>
                □ 否
              </T>
            </Reveal>
          </Card>
        </g>
        <Small>参与者需要回想影片，再选择“是”或“否”</Small>
      </>
    );
  if (id === "B07")
    return (
      <>
        {[0, 1].map((i) => (
          <g key={i} opacity={p(f, i * 15, i * 15 + 12)}>
            <T x={520 + i * 880} y={295} size={36} fill={i ? G : W}>
              {i ? "问卷报告：有人回答“看见了”" : "原片：没有碎玻璃"}
            </T>
            <g transform={`translate(${i ? 920 : 40} 305) scale(.65)`}>
              <Film
                x={740}
                y={320}
                w={1120}
                h={450}
                t={t}
                progress={1}
                label={false}
              />
              {i === 1 && (
                <g transform="translate(780 430)">
                  <Shard t={t} scale={0.7} />
                </g>
              )}
            </g>
            <Small x={520 + i * 880} y={735}>
              {i ? "一周后的问卷回答" : "当时影片呈现的内容"}
            </Small>
          </g>
        ))}
        <L x1={960} y1={260} x2={960} y2={770} color={C} />
      </>
    );
  const result = id === "B06",
    questions = id === "B03";
  return (
    <>
      <T y={275} size={36}>
        {result
          ? "一周后，回答“是”的人数"
          : questions
            ? "相同影片，三种先前提问条件"
            : "150名学生观看同一段事故影片"}
      </T>
      {["SMASHED", "HIT", "CONTROL"].map((label, i) => {
        const x = 440 + i * 520;
        const n = [16, 7, 6][i];
        return (
          <g key={label}>
            <Reveal f={f} at={i * 8}>
              <Card x={x} y={515} w={455} h={400}>
                <T x={x} y={365} size={36} fill={G} font="Georgia">
                  {label}
                </T>
                <T x={x} y={412} size={28} fill={D}>
                  {questions
                    ? [
                        "猛烈相撞时，速度如何？",
                        "相撞时，速度如何？",
                        "没有被问车速问题",
                      ][i]
                    : "每组 50 人"}
                </T>
                <Dots
                  x={x - 117}
                  y={455}
                  f={f}
                  at={result ? i * 24 : 10 + i * 8}
                  lit={result ? n : 0}
                />
                {result ? (
                  <Reveal f={f} at={24 + i * 24}>
                    <T x={x} y={635} size={70} fill={G} font="Georgia">
                      {[32, 14, 12][i]}%
                    </T>
                    <T x={x} y={684} size={30}>
                      {n} / 50
                    </T>
                  </Reveal>
                ) : (
                  <T x={x} y={660} size={36}>
                    {questions ? "问句条件" : "N = 50"}
                  </T>
                )}
              </Card>
            </Reveal>
          </g>
        );
      })}
      <Small>
        {result
          ? "先前问句不同，一周后的回答比例也不同"
          : questions
            ? "分组变量：先前提问措辞；控制组没有被问车速"
            : "所有人先看同一段影片，再接受不同提问"}
      </Small>
    </>
  );
}
function Photo({ x = 960, y = 490, w = 730, variant = 0, opacity = 1 }: any) {
  const h = w * 0.75;
  return (
    <g opacity={opacity} transform={`translate(${x - w / 2} ${y - h / 2})`}>
      <rect x="-14" y="-14" width={w + 28} height={h + 60} fill="#b4aa8e" />
      <svg
        width={w}
        height={h}
        viewBox={`${variant * 1024} 0 1024 768`}
        overflow="hidden"
      >
        <image
          href={staticFile("images/childhood-pair-v5.png")}
          width="2048"
          height="768"
        />
      </svg>
      <rect width={w} height={h} fill="#201c12" opacity=".25" />
      <T x={w / 2} y={h + 31} size={22} fill="#292b26" font={sans}>
        {variant ? "虚构的童年热气球经历" : "童年照片"}
      </T>
    </g>
  );
}
function Childhood({ id, f, t }: { id: string; f: number; t: number }) {
  if (id === "C01")
    return (
      <>
        <g
          transform={`translate(960 480) rotate(${-3 + 2 * e(p(f, 0, 45))}) scale(${0.94 + 0.06 * e(p(f, 0, 50))}) translate(-960 -480)`}
        >
          <Photo />
        </g>
        <Reveal f={f} at={30}>
          <T x={1550} y={395} size={72} fill={G} font="Georgia">
            20
          </T>
          <T x={1550} y={446} size={31}>
            名参与者
          </T>
          <L x1={1420} y1={485} x2={1680} y2={485} />
          <T x={1550} y={545} size={30}>
            童年照片
          </T>
        </Reveal>
      </>
    );
  if (id === "C02")
    return (
      <>
        <Photo x={560} y={500} w={620} />
        <Photo x={1370} y={500} w={620} variant={1} opacity={p(f, 12, 55)} />
        <L x1={900} y1={500} x2={1020} y2={500} />
        <T x={560} y={230} size={34} fill={W}>
          普通童年合照
        </T>
        <T x={1370} y={230} size={34} fill={G}>
          合成进热气球篮
        </T>
        <g opacity={p(f, 45, 55)}>
          <rect
            x="1090"
            y="575"
            width="555"
            height="90"
            fill="#111713"
            opacity=".85"
          />
          <T x={1370} y={635} size={40} fill={G}>
            修改后的照片
          </T>
        </g>
        <Small y={835}>照片中的热气球经历，是研究者设置的虚构事件</Small>
      </>
    );
  if (["C03", "C04", "C04b"].includes(id)) {
    const phase = id === "C03" ? 0 : id === "C04" ? 1 : 2;
    return (
      <>
        <Photo x={490} y={500} w={530} variant={1} />
        <L x1={850} y1={310} x2={1740} y2={310} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <circle
              cx={920 + i * 340}
              cy={310}
              r={i === phase ? 13 : 7}
              fill={i <= phase ? G : C}
            />
            <T x={920 + i * 340} y={270} size={30} fill={i === phase ? G : D}>
              访谈 {i + 1}
            </T>
          </g>
        ))}
        <Card x={1315} y={555} w={860} h={395}>
          <T x={1315} y={435} size={40} fill={G}>
            {
              [
                "尝试回忆照片中的事件",
                "隔一段时间，再次访谈",
                "第三次，记录回忆报告",
              ][phase]
            }
          </T>
          {[0, 1, 2].map((i) => (
            <Reveal key={i} f={f} at={18 + i * 28}>
              <L
                x1={970}
                y1={490 + i * 75}
                x2={1660}
                y2={490 + i * 75}
                color={C}
                opacity={0.15}
              />
              <T x={1315} y={535 + i * 75} size={34}>
                {
                  [
                    [
                      "刚看到照片时，没有立即报告记忆",
                      "配合引导想象练习",
                      "尝试补充场景与感受",
                    ],
                    [
                      "继续尝试回忆",
                      "部分报告开始增加叙述与意象",
                      "这些过程并不等于事件发生过",
                    ],
                    [
                      "一些人报告完整或部分回忆",
                      "另一些人仍未形成此类报告",
                      "随后按研究标准分类",
                    ],
                  ][phase][i]
                }
              </T>
            </Reveal>
          ))}
        </Card>
        <Small>三次访谈跨度约1—2周</Small>
      </>
    );
  }
  if (id === "C05")
    return (
      <>
        <Photo x={615} y={490} w={650} />
        <g opacity={p(f, 15, 28)}>
          <T x={1430} y={390} size={35} fill={D}>
            核对真实经历
          </T>
          <L x1={1150} y1={430} x2={1710} y2={430} />
          <T x={1430} y={520} size={52} fill={G}>
            童年热气球之旅
          </T>
          <T x={1430} y={615} size={64}>
            从未发生
          </T>
        </g>
        <Small y={835}>研究者构造的热气球情境，并非真实童年经历</Small>
      </>
    );
  if (id === "C06")
    return (
      <>
        <Photo x={400} y={480} w={430} variant={1} />
        <Dots
          x={800}
          y={390}
          count={20}
          cols={5}
          gap={65}
          lit={10}
          f={f + 20}
        />
        <L x1={1180} y1={300} x2={1180} y2={700} />
        <g opacity={p(f, 0, 5)}>
          <T x={1465} y={435} size={36} fill={G}>
            三次访谈后
          </T>
          <T x={1465} y={560} size={104} fill={G} font="Georgia">
            {f < 16 ? "20" : "10 / 20"}
          </T>
          <Reveal f={f} at={24}>
            <T x={1465} y={650} size={74} fill={G} font="Georgia">
              50%
            </T>
          </Reveal>
        </g>
        <Small>小样本、特定引导条件 · 不是“一张照片骗过一半的人”</Small>
      </>
    );
  return (
    <>
      <T y={267} size={38}>
        完整或部分虚假记忆报告：10份 / 共20人
      </T>
      {Array.from({ length: 20 }, (_, i) => {
        const target = i < 10 ? 550 : 1390;
        const dx = target + ((i % 5) - 2) * 105;
        const dy = 420 + Math.floor((i % 10) / 5) * 180;
        const q = e(p(f, i * 1.2, 35 + i * 1.2));
        return (
          <g
            key={i}
            transform={`translate(${960 + (dx - 960) * q} ${500 + (dy - 500) * q}) rotate(${((i % 3) - 1) * 2})`}
          >
            <rect
              x="-43"
              y="-60"
              width="86"
              height="120"
              fill={BG}
              stroke={i < 10 ? G : C}
              strokeOpacity=".7"
            />
            {[0, 1, 2].map((j) => (
              <L
                key={j}
                x1={-28}
                y1={-25 + j * 25}
                x2={28}
                y2={-25 + j * 25}
                color={i < 10 ? G : C}
              />
            ))}
          </g>
        );
      })}
      <Reveal f={f} at={35}>
        <T x={550} y={735} size={31} fill={G}>
          完整或部分
        </T>
        <T x={1390} y={735} size={31} fill={C}>
          其余报告
        </T>
      </Reveal>
      <Small y={815}>完整与部分报告合并统计，确信程度并不相同</Small>
    </>
  );
}
const criteria = [
  "接受暗示",
  "补充细节",
  "意象",
  "一致性",
  "情绪",
  "记忆陈述",
  "未否认",
];
function Synthesis({ id, f }: { id: string; f: number }) {
  if (id === "D01")
    return (
      <>
        {Array.from({ length: 8 }, (_, i) => {
          const x = 405 + (i % 4) * 370,
            y = 400 + Math.floor(i / 4) * 250;
          const q = e(p(f, i * 5, 25 + i * 5));
          return (
            <g
              key={i}
              opacity={q}
              transform={`translate(${(960 - x) * (1 - q)} ${(500 - y) * (1 - q)})`}
            >
              <Card x={x} y={y} w={285} h={192}>
                <T x={x} y={y - 30} size={29} fill={D}>
                  已发表研究
                </T>
                <T x={x} y={y + 42} size={63} fill={G} font="Georgia">
                  0{i + 1}
                </T>
              </Card>
            </g>
          );
        })}
        <Small>汇集既有研究报告；不把样本与前章20人直接相加</Small>
      </>
    );
  if (id === "D02")
    return (
      <>
        <T y={270} size={40}>
          七类要素，统一编码
        </T>
        {criteria.map((c, i) => (
          <g key={c} opacity={p(f, i * 7, i * 7 + 12)}>
            <T x={350 + i * 202} y={350} size={29} fill={G}>
              {c}
            </T>
            {Array.from({ length: 6 }, (_, j) => (
              <rect
                key={j}
                x={300 + i * 202}
                y={395 + j * 48}
                width={100}
                height={29}
                fill={(i + j) % 3 === 0 ? G : C}
                opacity={0.18 + ((i + j) % 3 === 0 ? 0.27 : 0)}
              />
            ))}
          </g>
        ))}
        <Small>先统一判定规则，再比较不同研究的报告</Small>
      </>
    );
  if (id === "D04")
    return (
      <>
        <T x={380} y={365} size={34} fill={D}>
          统一分析样本
        </T>
        <T x={380} y={510} size={100} font="Georgia">
          423
        </T>
        <T x={380} y={575} size={30}>
          份参与者报告
        </T>
        <L x1={650} y1={300} x2={650} y2={720} />
        <Card x={970} y={500} w={480} h={350} color={C}>
          <T x={970} y={405} size={33} fill={C}>
            虚假记忆
          </T>
          <T x={970} y={535} size={85} fill={C} font="Georgia">
            30.4%
          </T>
          <T x={970} y={615} size={29} fill={D}>
            上一镜的分类
          </T>
        </Card>
        <Reveal f={f} at={15}>
          <Card x={1510} y={500} w={480} h={350}>
            <T x={1510} y={405} size={33} fill={G}>
              另一类：接受暗示
            </T>
            <T x={1510} y={535} size={94} fill={G} font="Georgia">
              23%
            </T>
            <T x={1510} y={615} size={28}>
              某种程度接受该事件
            </T>
          </Card>
        </Reveal>
        <Small>两类分别呈现，不合并为“完整虚假记忆率”</Small>
      </>
    );
  return (
    <>
      <T x={420} y={365} size={34} fill={D}>
        统一分析样本
      </T>
      <T x={420} y={510} size={110} fill={W} font="Georgia">
        423
      </T>
      <T x={420} y={575} size={32}>
        份参与者报告
      </T>
      <L x1={690} y1={300} x2={690} y2={720} />
      <Card x={1130} y={485} w={640} h={350}>
        <T x={1130} y={395} size={34} fill={G}>
          {id === "D03" ? "归类为虚假记忆" : "另一个分类"}
        </T>
        <T x={1130} y={540} size={115} fill={G} font="Georgia">
          {id === "D03" ? "30.4%" : "23%"}
        </T>
        <T x={1130} y={610} size={32}>
          {id === "D03" ? "按统一编码标准判定" : "某种程度接受事件暗示"}
        </T>
      </Card>
      <Reveal f={f} at={35}>
        <T x={1665} y={440} size={32} fill={C}>
          {id === "D03" ? "统一标准" : "不同分类"}
        </T>
        <T x={1665} y={505} size={56} fill={C}>
          ≠
        </T>
        <T x={1665} y={565} size={29} fill={D}>
          {id === "D03" ? "普遍概率" : "完整回忆"}
        </T>
      </Reveal>
      <Small>研究任务和定义不同：不与前章50%直接比较，不作累加</Small>
    </>
  );
}
function Sources({ id, f }: { id: string; f: number }) {
  const wrong = id === "E02",
    q = e(p(f, 8, 42));
  return (
    <>
      <Card x={415} y={380} w={460} h={155} color={W}>
        <T x={415} y={390} size={43}>
          实际经历
        </T>
      </Card>
      <Card x={1505} y={380} w={500} h={155} color={G}>
        <T x={1505} y={365} size={36} fill={G}>
          后来听闻 / 阅读
        </T>
        <T x={1505} y={420} size={36} fill={G}>
          暗示 / 想象 / 推测
        </T>
      </Card>
      <path
        d="M415 470 V590 H805 M1505 470 V590 H1115"
        fill="none"
        stroke={C}
        strokeWidth="2"
        strokeOpacity=".6"
      />
      {[0, 1].map((i) => (
        <rect
          key={i}
          x={(i ? 1505 : 415) + (960 - (i ? 1505 : 415)) * q - 24}
          y={475 + 115 * q}
          width={48}
          height={32}
          fill={i ? G : W}
          opacity={0.75}
        />
      ))}
      <Card x={960} y={630} w={600} h={165} color={C}>
        <T y={608} size={29} fill={D}>
          回忆判断台 · 理论示意
        </T>
        <T y={672} size={43} fill={wrong ? G : W}>
          {wrong
            ? f < 55
              ? "我亲眼见过？"
              : "来源不确定"
            : "这条信息来自哪里？"}
        </T>
      </Card>
      <Small>想起一条信息，也需要判断它来自经历、听闻还是想象</Small>
    </>
  );
}
function Confidence({ id, f }: { id: string; f: number }) {
  if (id === "E03")
    return (
      <>
        <T y={270} size={42} fill={G} font="Georgia">
          2001 · 09 · 12
        </T>
        <T y={330} size={32}>
          54名杜克大学学生，分别记录两类记忆
        </T>
        {[0, 1].map((i) => (
          <Reveal key={i} f={f} at={i * 20}>
            <Card x={565 + i * 790} y={560} w={660} h={345} color={i ? C : G}>
              <T x={565 + i * 790} y={465} size={36} fill={i ? C : G}>
                {i ? "近期日常事件" : "首次获知“9·11”消息"}
              </T>
              <T x={565 + i * 790} y={548} size={33}>
                自己在哪里？
              </T>
              <T x={565 + i * 790} y={615} size={33}>
                当时正在做什么？
              </T>
              <L
                x1={355 + i * 790}
                y1={660}
                x2={775 + i * 790}
                y2={660}
                color={i ? C : G}
              />
            </Card>
          </Reveal>
        ))}
        <Small>研究自己的获知情境；不是袭击现场细节，也不是新闻真假</Small>
      </>
    );
  if (id === "E04")
    return (
      <>
        <T y={290} size={37}>
          将后来报告，与最初记录比较
        </T>
        <L x1={350} y1={460} x2={1580} y2={460} />
        {["最初记录", "1周", "6周", "32周"].map((v, i) => (
          <Reveal key={v} f={f} at={i * 17}>
            <circle cx={350 + i * 410} cy={460} r={12} fill={i ? G : W} />
            <T x={350 + i * 410} y={400} size={40} fill={i ? G : W}>
              {v}
            </T>
            <Card x={350 + i * 410} y={625} w={245} h={190} color={i ? G : W}>
              {[0, 1, 2].map((j) => (
                <L
                  key={j}
                  x1={270 + i * 410 + (i ? j * 7 : 0)}
                  y1={580 + j * 38}
                  x2={430 + i * 410 - (i ? j * 12 : 0)}
                  y2={580 + j * 38}
                  color={i ? G : W}
                />
              ))}
            </Card>
          </Reveal>
        ))}
        <Small>参与者分别在1、6或32周后复测；并非每人都测三次</Small>
      </>
    );
  return (
    <>
      <T y={270} size={35} fill={D}>
        前后报告的一致性，与主观确信是不同指标
      </T>
      <Card x={960} y={420} w={1450} h={200} color={W}>
        <T x={440} y={415} size={39}>
          前后一致性
        </T>
        <T x={440} y={468} size={28} fill={D}>
          两类报告均随时间下降
        </T>
        <Reveal f={f} at={10}>
          <T x={1220} y={450} size={65} fill={W}>
            重大新闻　↓　日常事件　↓
          </T>
        </Reveal>
      </Card>
      <Reveal f={f} at={35}>
        <Card x={960} y={660} w={1450} h={200}>
          <T x={440} y={650} size={39} fill={G}>
            鲜明感 / 确信
          </T>
          <T x={440} y={703} size={28} fill={D}>
            重大新闻记忆未同步下降
          </T>
          <T x={1230} y={690} size={52} fill={G}>
            “记得清楚”仍然存在
          </T>
        </Card>
      </Reveal>
      <Small y={815}>一致性是前后报告的比较，不等于外部证据验证的准确率</Small>
    </>
  );
}
function Ending({ id, f }: { id: string; f: number }) {
  if (id === "F01")
    return (
      <>
        {[
          "1995 · 词",
          "1974 · 玻璃",
          "2002 · 经历",
          "2017 · 分类",
          "2003 · 确信",
        ].map((s, i) => (
          <Reveal key={s} f={f} at={i * 6}>
            <Card x={360 + i * 300} y={335} w={245} h={100}>
              <T x={360 + i * 300} y={350} size={29}>
                {s}
              </T>
            </Card>
          </Reveal>
        ))}
        <g transform={`translate(${e(p(f, 16, 54)) * 35} 0)`}>
          <Card x={930} y={590} w={800} h={280} color={W}>
            <T x={930} y={555} size={42}>
              原始记录
            </T>
            <L x1={650} y1={600} x2={1210} y2={600} color={W} />
            <T x={930} y={665} size={42} fill={G}>
              主观回忆
            </T>
          </Card>
        </g>
      </>
    );
  return (
    <g opacity={1 - p(f, 92, 111)}>
      <L x1={680} y1={330} x2={1240} y2={330} />
      <T y={485} size={86} fill={G}>
        清晰，不等于真实
      </T>
      <T y={575} size={33}>
        记忆通常有用，但确信不是独立的真实性证明。
      </T>
      <T y={695} size={39} fill={G}>
        记忆会撒谎
      </T>
      <Small y={775}>
        Roediger & McDermott 1995 · Loftus & Palmer 1974 · Wade et al. 2002
      </Small>
      <Small y={822}>
        Scoboria et al. 2017 · Johnson et al. 1993 · Talarico & Rubin 2003
      </Small>
    </g>
  );
}
const transitionFrames = (shot: Shot, previous?: Shot) =>
  !previous || shot.id === "A02" ? 0 : shot.id[0] !== previous.id[0] ? 24 : 18;

function ShotScene({ shot, incoming }: { shot: Shot; incoming: number }) {
  const localFrame = useCurrentFrame(),
    f = Math.min(localFrame, shot.toFrame - shot.fromFrame - 1),
    t = (shot.fromFrame + localFrame) / 30,
    id = shot.id;
  const blend = incoming ? p(localFrame, 0, incoming) : 1;
  const body =
    id[0] === "A" ? (
      <Words id={id} f={f} t={t} />
    ) : id[0] === "B" ? (
      <Glass id={id} f={f} t={t} />
    ) : id[0] === "C" ? (
      <Childhood id={id} f={f} t={t} />
    ) : id[0] === "D" ? (
      <Synthesis id={id} f={f} />
    ) : ["E01", "E02"].includes(id) ? (
      <Sources id={id} f={f} />
    ) : id[0] === "E" ? (
      <Confidence id={id} f={f} />
    ) : (
      <Ending id={id} f={f} />
    );
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{opacity: blend * blend * (3 - 2 * blend)}}>
      <Environment t={t} />
      <Header id={id} />
      <g>{body}</g>
      <Caption shot={shot} f={localFrame} />
      <L x1={110} y1={1025} x2={1810} y2={1025} opacity={0.12} />
      <L
        x1={110}
        y1={1025}
        x2={110 + (1700 * (shot.fromFrame + localFrame)) / timeline.durationInFrames}
        y2={1025}
        opacity={0.35}
      />
      <T x={1810} y={995} size={22} fill={D} anchor="end" font="Georgia">
        {id} / MEMORY STUDIES
      </T>
    </svg>
  );
}
export const MemoryFilmV5 = () => (
  <AbsoluteFill style={{ background: "#050708" }}>
    <style>{`@font-face{font-family:FilmSong;src:url('${staticFile("fonts/song.ttc")}')}@font-face{font-family:FilmSans;src:url('${staticFile("fonts/sans.ttc")}')}`}</style>
    {timeline.shots.map((shot, index) => (
      <Sequence
        key={shot.id}
        name={`${shot.id} ${shot.action}`}
        from={shot.fromFrame}
        durationInFrames={shot.toFrame - shot.fromFrame + (timeline.shots[index + 1] ? transitionFrames(timeline.shots[index + 1], shot) : 0)}
      >
        <ShotScene shot={shot} incoming={transitionFrames(shot, timeline.shots[index - 1])} />
      </Sequence>
    ))}
    <Audio src={staticFile("audio/mix-v5.wav")} />
  </AbsoluteFill>
);
