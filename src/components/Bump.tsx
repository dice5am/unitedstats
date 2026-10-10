"use client";
// Bump chart (#3): rank over time, 1 = highest. One 2px line per country in its colour, a dot per year, name + rank at the
// right end (spread, never colliding). Ranked only in years all seven publish (1970 on). Tap/hover a year for the stats box.
import { useMemo, useRef, useState } from "react";
import { COUNTRIES } from "@/lib/series.mjs";
import { league, ORDER } from "@/lib/waves.mjs";
import { chartTitle, srcTag } from "@/src/charts/meta";
import { DIFFERENCE_NOTES } from "@/lib/differenceNotes.mjs";
import { CardFrame, Seg, StatBox, useParams, useWidth, type Init } from "./kit";
import { HeadFigs } from "./HeadFigs";

const NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.short]));
const CODE: Record<string, string> = { CAN: "CA", USA: "US", JPN: "JP", FRA: "FR", GBR: "UK", DEU: "DE", ITA: "IT" };
const FROM = ["1970", "1990", "2005"] as const;
const usd = (v: number) => `$${Math.round(v).toLocaleString("en-GB")}`;

export default function Bump({ file, initial }: { file: unknown } & Init) {
  const [st, set] = useParams(initial, { lg_from: ["1970", FROM] } as any) as unknown as [Record<string, string>, (k: string, v: string) => void];
  const L = useMemo(() => league(file), [file]);
  const i0 = L.years.indexOf(st.lg_from), years = L.years.slice(i0), n = years.length;
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const narrow = w > 0 && w < 560, H = narrow ? 300 : 380, padL = 10, padR = narrow ? 44 : 132, padT = 16, padB = 28;
  const iw = Math.max(10, w - padL - padR), x = (j: number) => padL + (n === 1 ? 0 : (j / (n - 1)) * iw), y = (r: number) => padT + ((r - 1) / 6) * (H - padT - padB);
  const last = L.years.length - 1, end = L.years[last];
  const byRank = ORDER.map((c) => ({ c, r: L.rank[c][last]! })).sort((a, b) => a.r - b.r);
  const hi = hover === null ? null : i0 + hover;
  const ticks = years.filter((yr, j) => j === 0 || j === n - 1 || (+yr % (n > 30 ? 10 : 5) === 0 && j > 2 && j < n - 3));
  const pick = (cx: number) => { const r = svg.current!.getBoundingClientRect(); setHover(Math.max(0, Math.min(n - 1, Math.round(((cx - r.left - padL) / iw) * (n - 1))))); };
  return (
    <CardFrame id="chart-3" eyebrow="Economy" title={chartTitle("3")} sub={<>GDP per person at current purchasing power parities, US dollars · rank 1 = highest each year · {st.lg_from}–{end}</>}
      tag={srcTag("3", end)}
      controls={<div className="bar solo"><Seg label="From" value={st.lg_from} options={FROM.map((v) => [v, v])} onChange={(v) => { setHover(null); set("lg_from", v); }} /></div>}
      headline={<HeadFigs tag={srcTag("3", end)} figs={[byRank[0], byRank[6]].map((b, k) => ({ code: b.c, label: k ? "Rank 7 (lowest)" : "Rank 1 (highest)", value: usd(L.value[b.c][last]!), date: `${end} · per person, PPP` }))} />}
      legend={<><li>Rank 1 = highest GDP per person that year</li><li>Ranked only in years all seven publish</li></>}
      source="Source: OECD · GDP per head, US dollars, current prices and current PPPs"
      calc={<>
        <div className="grp"><h3>Measures</h3><dl><dt>GDP per person</dt><dd>GDP per head at current prices and current purchasing power parities (PPPs adjust for price differences between countries), US dollars. Already per person, so no per-capita toggle.</dd></dl></div>
        <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">OECD DF_TABLE1_EXPENDITURE_HCPC · B1GQ_POP · USD_PPP_PS</dd><dt>Years</dt><dd>1970–{end}. The UK and France start in 1960, everyone else in 1970, so ranking starts in 1970.</dd></dl></div>
        <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Rank</span><code>order of GDP per person that year, 1 = highest</code></div>
          <p className="ex">{end}: <b>{byRank.map((b) => `${b.r}. ${NAME[b.c]} ${usd(L.value[b.c][last]!)}`).join(" · ")}</b></p></div></div>
        <div className="grp"><h3>Source differences</h3><p className="diffnote">{DIFFERENCE_NOTES["3"]}</p></div>
        <div className="grp"><h3>Rules</h3><ul className="rules"><li><span className="ic">n/a</span>Gaps are never filled</li><li><span className="ic">E</span>Latest years may be OECD estimates or provisional; the stats box tags them</li></ul></div>
      </>}>
      <div className="bump" ref={ref} onPointerDown={() => setHover(null)}>
        {hi !== null && <StatBox title={`${L.years[hi]} · rank (GDP per person)`} onClose={() => setHover(null)} rows={ORDER.map((c) => ({ c, r: L.rank[c][hi] })).sort((a, b) => (a.r ?? 9) - (b.r ?? 9)).map(({ c, r }) => {
          const f = L.status(c, L.years[hi]); return { code: c, name: NAME[c], value: r === null ? "n/a" : `${r} · ${usd(L.value[c][hi]!)}`, note: f === "E" ? "OECD estimate" : f === "P" ? "provisional" : undefined }; })} />}
        {w > 0 && <svg ref={svg} width={w} height={H} role="img" style={{ touchAction: "pan-y" }}
          aria-label={`GDP per person rank, ${st.lg_from} to ${end}: ${byRank.map((b) => `${b.r} ${NAME[b.c]}`).join(", ")}`}
          onPointerDown={(e) => { e.stopPropagation(); pick(e.clientX); }} onPointerMove={(e) => (e.pointerType === "mouse" || e.buttons) && pick(e.clientX)} onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}>
          {[1, 2, 3, 4, 5, 6, 7].map((r) => <g key={r}><line x1={padL} x2={padL + iw} y1={y(r)} y2={y(r)} className="bgl" /></g>)}
          {ticks.map((yr) => <text key={yr} x={x(years.indexOf(yr))} y={H - 8} className="ax" textAnchor={yr === years[0] ? "start" : yr === years[n - 1] ? "end" : "middle"}>{yr}</text>)}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={padT - 8} y2={H - padB + 6} className="bxh" />}
          {ORDER.map((c) => { const rs = L.rank[c].slice(i0); let d = ""; rs.forEach((r, j) => { if (r === null) return; d += `${d && rs[j - 1] !== null ? "L" : "M"}${x(j).toFixed(1)},${y(r).toFixed(1)}`; });
            return <g key={c} style={{ color: `var(--${c})` }}>
              <path d={d} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
              {n <= 25 && rs.map((r, j) => r !== null && <circle key={j} cx={x(j)} cy={y(r)} r={2.5} fill="currentColor" />)}
              <circle cx={x(n - 1)} cy={y(rs[n - 1]!)} r={4} fill="currentColor" />
              <text x={x(n - 1) + 10} y={y(rs[n - 1]!) + 4} className="bl">{narrow ? CODE[c] : `${rs[n - 1]} ${NAME[c]}`}</text>
            </g>; })}
        </svg>}
      </div>
    </CardFrame>
  );
}
