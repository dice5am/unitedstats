"use client";
// Bump chart (#3): rank over time, 1 = highest. One 2px line per country in its colour, a dot per year, name + rank at the
// both ends (DS: name at both ends; ranks are 1 row apart so labels never collide). Ranked only in years all selected publish (1970 on). Tap/hover a year for the stats box.
import { useEffect, useMemo, useRef, useState } from "react";
import { PEERS, SHORT_CODE } from "@/lib/series.mjs";
import { league, DEU_FROM } from "@/lib/waves.mjs";
import { NO_DATA_BAND_LABEL } from "@/lib/series.mjs";
import { chartTitle, srcTag } from "@/src/charts/meta";
import { DIFFERENCE_NOTES } from "@/lib/differenceNotes.mjs";
import { CardFrame, Seg, StatBox, useParams, useWidth, writeParams, type Init } from "./kit";
import { HeadFigs } from "./HeadFigs";
import { useAllText } from "./Sel";

const NAME = Object.fromEntries(PEERS.map((c) => [c.code, c.short]));
const CODE: Record<string, string> = SHORT_CODE;
const WINS = ["10", "20", "50"] as const;
// Old links used lg_from=1970|1990|2005; map them to the window they meant.
const LEGACY: Record<string, string> = { "1970": "50", "1990": "20", "2005": "10" };
function legacyQuery(initial: Init["initial"]) {
  const raw = initial.current ?? (typeof location === "undefined" ? null : location.search);
  if (raw === null) return raw;
  const q = new URLSearchParams(raw), f = q.get("lg_from");
  if (f !== null) { if (!q.has("lg_win") && LEGACY[f]) q.set("lg_win", LEGACY[f]); q.delete("lg_from"); }
  return "?" + q.toString();
}
const usd = (v: number) => `$${Math.round(v).toLocaleString("en-GB")}`;

export default function Bump({ file, initial }: { file: unknown } & Init) {
  const ALL = useAllText(); // count text (PM lock)
  const q0 = useRef<string | null>(null);
  if (q0.current === null) q0.current = legacyQuery(initial);
  const [st, set] = useParams(q0, { lg_win: ["50", WINS] } as any) as unknown as [Record<string, string>, (k: string, v: string) => void];
  useEffect(() => { if (new URLSearchParams(location.search).has("lg_from")) writeParams({ lg_win: st.lg_win }, ["lg_from"]); }, [st.lg_win]);
  const L = useMemo(() => league(file), [file]);
  const CS = Object.keys(L.rank), NC = CS.length;
  // Window counted back from #3's own last year: end 2025 → 50Y = 1975–2025. Never a fixed start.
  const from = String(+L.years[L.years.length - 1] - +st.lg_win);
  const i0 = Math.max(0, L.years.indexOf(from)), years = L.years.slice(i0), n = years.length;
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const narrow = w > 0 && w < 560, H = narrow ? 300 : 380, padL = narrow ? 30 : 92, padR = narrow ? 44 : 132, padT = 16, padB = 28;
  const iw = Math.max(10, w - padL - padR), x = (j: number) => padL + (n === 1 ? 0 : (j / (n - 1)) * iw), y = (r: number) => padT + ((r - 1) / Math.max(1, NC - 1)) * (H - padT - padB);
  // G20: ranks among the selected countries; the headline uses the latest year all of them publish
  const lastAny = (() => { for (let j = L.years.length - 1; j >= 0; j--) if (CS.some((c) => L.rank[c][j] !== null)) return j; return L.years.length - 1; })();
  const last = lastAny, end = L.years[last];
  const byRank = CS.map((c) => ({ c, r: L.rank[c][last]! })).filter((b) => b.r !== null).sort((a, b) => a.r - b.r);
  const hi = hover === null ? null : i0 + hover;
  // Germany not ranked before 1991: grey no-data band, same spec as the GDP 50Y band (label inside; in the legend at 390).
  const deJ = years.indexOf(String(DEU_FROM)), deLabel = NO_DATA_BAND_LABEL.replace("{country}", "Germany").replace("{year}", String(DEU_FROM));
  // year ticks: both ends plus round years, dropping any closer than 36px to a kept neighbour (no collisions at 390)
  const ticks = (() => { const c = years.filter((yr, j) => j === 0 || j === n - 1 || +yr % (n > 30 ? 10 : 5) === 0); const out: string[] = [];
    for (const yr of c) { const j = years.indexOf(yr); if (j === n - 1) { while (out.length > 1 && x(n - 1) - x(years.indexOf(out[out.length - 1])) < 36) out.pop(); out.push(yr); } else if (!out.length || x(j) - x(years.indexOf(out[out.length - 1])) >= 36) out.push(yr); }
    return out; })();
  const pick = (cx: number) => { const r = svg.current!.getBoundingClientRect(); setHover(Math.max(0, Math.min(n - 1, Math.round(((cx - r.left - padL) / iw) * (n - 1))))); };
  return (
    <CardFrame id="chart-3" eyebrow="Economy" title={chartTitle("3")} sub={<>GDP per person at current purchasing power parities, US dollars · rank 1 = highest each year{+years[0] < DEU_FROM ? " · Germany from 1991" : ""} · {years[0]}–{end}</>}
      tag={srcTag("3", end)}
      controls={<div className="bar solo"><Seg label="Timeframe" value={st.lg_win} options={WINS.map((v) => [v, `${v}Y`])} onChange={(v) => { setHover(null); set("lg_win", v); }} /></div>}
      headline={<HeadFigs tag={srcTag("3", end)} figs={(byRank.length > 1 ? [byRank[0], byRank[byRank.length - 1]] : byRank).map((b, k) => ({ code: b.c, label: k ? `Rank ${byRank.length} (lowest)` : "Rank 1 (highest)", value: usd(L.value[b.c][last]!), date: `${end} · per person, PPP` }))} />}
      legend={<>{narrow && deJ > 0 && <li><i className="ndkey" />{deLabel}</li>}<li>Rank 1 = highest GDP per person that year</li><li>{`Ranked in years ${ALL} publish${CS.includes("DEU") ? `; Germany from 1991, the other ${NC - 1} 1–${NC - 1} before` : ""}`}</li></>}
      source="Source: OECD · GDP per head, US dollars, current prices and current PPPs"
      calc={<>
        <div className="grp"><h3>Measures</h3><dl><dt>GDP per person</dt><dd>GDP per head at current prices and current purchasing power parities (PPPs adjust for price differences between countries), US dollars. Already per person, so no per-capita toggle.</dd></dl></div>
        <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">OECD DF_TABLE1_EXPENDITURE_HCPC · B1GQ_POP · USD_PPP_PS</dd><dt>Years</dt><dd>1970–{end}. The UK and France start in 1960, everyone else in 1970, so ranking starts in 1970. Germany is ranked from 1991 (unified Germany); before that the other {CS.includes("DEU") ? NC - 1 : NC} rank 1–{CS.includes("DEU") ? NC - 1 : NC}.</dd></dl></div>
        <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Rank</span><code>order of GDP per person that year, 1 = highest</code></div>
          <p className="ex">{end}: <b>{byRank.map((b) => `${b.r}. ${NAME[b.c]} ${usd(L.value[b.c][last]!)}`).join(" · ")}</b></p></div></div>
        <div className="grp"><h3>Source differences</h3><p className="diffnote">{DIFFERENCE_NOTES["3"]}</p></div>
        <div className="grp"><h3>Rules</h3><ul className="rules"><li><span className="ic">n/a</span>Gaps are never filled</li><li><span className="ic">E</span>Latest years may be OECD estimates or provisional; the stats box tags them</li></ul></div>
      </>}>
      <div className="bump" ref={ref} onPointerDown={() => setHover(null)} onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}>
        {hi !== null && <StatBox title={`${L.years[hi]} · rank (GDP per person)`} onClose={() => setHover(null)} rows={CS.map((c) => ({ c, r: L.rank[c][hi] })).sort((a, b) => (a.r ?? 9) - (b.r ?? 9)).map(({ c, r }) => {
          const f = L.status(c, L.years[hi]); return { code: c, name: NAME[c], value: r === null ? "n/a" : `${r} · ${usd(L.value[c][hi]!)}`, note: f === "E" ? "OECD estimate" : f === "P" ? "provisional" : undefined }; })} />}
        {w > 0 && <svg ref={svg} width={w} height={H} role="img" style={{ touchAction: "pan-y" }}
          aria-label={`GDP per person rank, ${years[0]} to ${end}: ${byRank.map((b) => `${b.r} ${NAME[b.c]}`).join(", ")}`}
          onPointerDown={(e) => { e.stopPropagation(); pick(e.clientX); }} onPointerMove={(e) => (e.pointerType === "mouse" || e.buttons) && pick(e.clientX)}>
          {Array.from({ length: NC }, (_, k) => k + 1).map((r) => <g key={r}><line x1={padL} x2={padL + iw} y1={y(r)} y2={y(r)} className="bgl" /></g>)}
          {ticks.map((yr) => <text key={yr} x={x(years.indexOf(yr))} y={H - 8} className="ax" textAnchor={yr === years[0] ? "start" : yr === years[n - 1] ? "end" : "middle"}>{yr}</text>)}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={padT - 8} y2={H - padB + 6} className="bxh" />}
          {deJ > 0 && <g className="ndband" data-code="DEU" pointerEvents="none">
            <defs><linearGradient id="ndb3-DEU" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="var(--ndband)" /><stop offset={Math.max(0, 1 - 8 / Math.max(8, x(deJ) - padL))} stopColor="var(--ndband)" /><stop offset="1" stopColor="var(--ndband)" stopOpacity="0" /></linearGradient></defs>
            <rect x={padL} y={padT} width={Math.max(0, x(deJ) - padL)} height={H - padT - padB} fill="url(#ndb3-DEU)" />
            {!narrow && <text x={padL + 8} y={padT + 17} className="from ndlabel">{deLabel}</text>}
          </g>}
          {CS.map((c) => { const rs = L.rank[c].slice(i0); if (rs.every((r) => r === null)) return null; let d = ""; rs.forEach((r, j) => { if (r === null) return; d += `${d && rs[j - 1] !== null ? "L" : "M"}${x(j).toFixed(1)},${y(r).toFixed(1)}`; });
            return <g key={c} style={{ color: `var(--${c})` }}>
              <path d={d} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
              {/* splice tick (merged splice rule): on the line at the first spliced year, only inside the window */}
              {(((file as any).g20_splice?.[c] ?? []) as { froms: string[]; label: string }[]).map((sp) => { const j = years.indexOf(sp.froms[0]); if (j <= 0 || rs[j] === null) return null;
                return <g key={sp.label} className="brk spl" data-code={c} data-from={sp.froms[0]}><rect x={x(j) - 1} y={y(rs[j]!) - 6} width={2} height={12} rx={1} className="brkt" /><title>{sp.label}</title></g>; })}
              {n <= 25 && rs.map((r, j) => r !== null && <circle key={j} cx={x(j)} cy={y(r)} r={2.5} fill="currentColor" />)}
              {(() => { let k = n - 1; while (k >= 0 && rs[k] === null) k--; return k >= 0 ? <circle cx={x(k)} cy={y(rs[k]!)} r={4} fill="currentColor" /> : null; })()}
              {rs[0] !== null && <text x={x(0) - 8} y={y(rs[0]) + 4} className="bl" textAnchor="end">{narrow ? CODE[c] : `${NAME[c]} ${rs[0]}`}</text>}
              {rs[0] === null && (() => { const j = rs.findIndex((r) => r !== null); return j > 0 ? <><circle cx={x(j)} cy={y(rs[j]!)} r={4} fill="var(--card-solid)" stroke="currentColor" strokeWidth={1.5} /><text x={x(j)} y={y(rs[j]!) - 8} className="bl" textAnchor="middle">{narrow ? null : `${CODE[c]} from ${years[j]}`}</text></> : null; })()}
              {rs[n - 1] !== null && <text x={x(n - 1) + 10} y={y(rs[n - 1]!) + 4} className="bl">{narrow ? CODE[c] : `${rs[n - 1]} ${NAME[c]}`}</text>}
            </g>; })}
        </svg>}
      </div>
    </CardFrame>
  );
}
