"use client";
// Tile map (#14): G7 as equal rounded tiles in a fixed geographic-ish layout (North America left, Europe centre, Japan right);
// fill = sequential neutral scale by the size of the change; values printed in the tiles. Tap a tile to expand its line.
// Toggle: total emissions / per person. Early enders (US to 2022) are drawn and dated but not ranked.
import { useMemo, useState } from "react";
import { COUNTRIES } from "@/lib/series.mjs";
import { emissions } from "@/lib/waves.mjs";
import { chartTitle, srcTag } from "@/src/charts/meta";
import { DIFFERENCE_NOTES } from "@/lib/differenceNotes.mjs";
import { CardFrame, Seg, useParams, useWidth, type Init } from "./kit";
import { HeadFigs, sgn } from "./HeadFigs";

const NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.short]));
const POS: Record<string, [number, number]> = { CAN: [0, 0], USA: [0, 1], GBR: [1, 0], FRA: [1, 1], DEU: [2, 0], ITA: [2, 1], JPN: [3, 0] };
const VIEWS = [["total", "Total"], ["pp", "Per person"]] as const;
export default function TileMap({ ghg, pop, initial }: { ghg: any; pop: any } & Init) {
  const [st, set] = useParams(initial, { gh_view: ["total", ["total", "pp"]] } as any) as unknown as [Record<string, string>, (k: string, v: string) => void];
  const view = st.gh_view as "total" | "pp";
  const rows = useMemo(() => emissions(ghg, pop, view), [ghg, pop, view]);
  const [sel, setSel] = useState<string | null>(null);
  const [ref, w] = useWidth<HTMLDivElement>();
  const ends = rows.map((r) => r.end!).sort(), common = ends[Math.floor(ends.length / 2)];
  const ranked = rows.filter((r) => r.end === common && r.change !== null).sort((a, b) => a.change! - b.change!), early = rows.filter((r) => r.end !== common);
  const max = Math.max(...rows.map((r) => Math.abs(r.change ?? 0)));
  const shade = (v: number) => `color-mix(in oklab, var(--heat-hi) ${Math.round(15 + 70 * (Math.abs(v) / max))}%, var(--heat-lo))`;
  const fmt = (v: number) => sgn(Math.round(v * 10) / 10, 1, "%");
  const unit = view === "pp" ? "t CO2e per person" : "Mt CO2e";
  const val = (v: number | null) => (v === null ? "n/a" : view === "pp" ? `${v.toFixed(2)} t` : `${(v / 1000).toFixed(0)} Mt`);
  const r0 = sel ? rows.find((r) => r.code === sel)! : null;
  const cols = 4, gap = 8, tw = w ? (w - gap * (cols - 1)) / cols : 0, th = Math.min(120, Math.max(84, tw * 0.75));
  const top = ranked[ranked.length - 1], bot = ranked[0];
  return (
    <CardFrame id="chart-14" eyebrow="Environment" title={chartTitle("14", view)}
      sub={<>Greenhouse gas emissions {view === "pp" ? "per person" : "in total"}, excluding land use and forestry · change since 1990, % · to {common} (US to 2022)</>}
      tag={srcTag("14", common)}
      controls={<div className="bar solo"><Seg label="Measure" value={view} options={VIEWS.map(([v, l]) => [v, l])} onChange={(v) => { setSel(null); set("gh_view", v); }} /></div>}
      headline={top && bot && <HeadFigs tag={srcTag("14", common)} figs={[bot, top].map((z, k) => { const r = Math.round(z.change! * 10) / 10; return { code: z.code, label: r === 0 ? "No change" : k === 0 ? (r < 0 ? "Biggest cut" : "Smallest rise") : (r > 0 ? "Biggest rise" : "Smallest cut"), value: fmt(z.change!), date: `1990 → ${z.end}` }; })} />}
      legend={<><li>Darker tile = bigger change</li>{early.map((r) => <li key={r.code}>{NAME[r.code]}: to {r.end}, not ranked</li>)}{view === "pp" && rows.some((r) => r.pts.some((q) => q.est)) && <li><i className="dashk" />Dashed: population estimated from yearly figures</li>}</>}
      source={`Source: OECD · greenhouse gas emissions excluding LULUCF (UN inventories)${view === "pp" ? "; population: OECD quarterly, earlier years from OECD annual" : ""}`}
      calc={<>
        <div className="grp"><h3>Measures</h3><dl><dt>Emissions</dt><dd>All greenhouse gases in CO2 equivalent, excluding land use, land-use change and forestry (LULUCF).</dd>
          <dt>Per person</dt><dd>Total ÷ yearly population, tonnes CO2e per person. Yearly population = mean of the four quarters of OECD population; quarters estimated from OECD annual figures count as present.</dd></dl></div>
        <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">OECD AIR_GHG · total excl. LULUCF · thousand t CO2e</dd><dt>Years</dt><dd>1990 to {common}; the US to 2022 (two years behind), shown but not ranked.</dd></dl></div>
        <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Change</span><code>value(latest) ÷ value(1990) − 1</code></div>
          {(() => { const c = rows.find((r) => r.code === "CAN")!; const a = c.pts[0], b = c.pts[c.pts.length - 1]; return a.value !== null && b.value !== null && <p className="ex">Canada: <b>{val(b.value)} ÷ {val(a.value)} − 1 = {fmt(c.change!)}</b></p>; })()}</div></div>
        <div className="grp"><h3>Source differences</h3><p className="diffnote">{DIFFERENCE_NOTES["14"]}</p></div>
        <div className="grp"><h3>Rules</h3><ul className="rules"><li><span className="ic">n/a</span>Gaps are never filled</li><li><span className="ic">→</span>Early enders are drawn and dated, not ranked</li></ul></div>
      </>}>
      <div className="tmap" ref={ref} onPointerDown={() => setSel(null)} style={{ height: tw ? th * 2 + gap : undefined }}>
        {tw > 0 && rows.map((r) => { const [cx, cy] = POS[r.code]; return (
          <button key={r.code} type="button" className={`tile${sel === r.code ? " on" : ""}`} onPointerDown={(e) => e.stopPropagation()} onClick={() => setSel(sel === r.code ? null : r.code)}
            style={{ left: cx * (tw + gap), top: cy * (th + gap), width: tw, height: th, background: r.change === null ? undefined : shade(r.change) }}
            aria-label={`${NAME[r.code]}: ${r.change === null ? "n/a" : fmt(r.change)} since 1990, to ${r.end}`}>
            <span className="tn"><i style={{ background: `var(--${r.code})` }} />{NAME[r.code]}</span>
            <b className="tv">{r.change === null ? "n/a" : fmt(r.change)}</b>
            <span className="te">1990 → {r.end}{r.end !== common ? " · not ranked" : ""}</span>
          </button>); })}
      </div>
      {r0 && <Expand r={r0} view={view} unit={unit} val={val} onClose={() => setSel(null)} />}
    </CardFrame>
  );
}
function Expand({ r, view, unit, val, onClose }: { r: ReturnType<typeof emissions>[number]; view: string; unit: string; val: (v: number | null) => string; onClose: () => void }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const vs = r.pts.map((q) => q.value).filter((v): v is number => v !== null), lo = Math.min(...vs), hi = Math.max(...vs), H = 120, p = 10;
  const x = (i: number) => p + (i / (r.pts.length - 1)) * (w - 2 * p), y = (v: number) => p + ((hi - v) / (hi - lo || 1)) * (H - 2 * p - 14);
  const seg = (est: boolean) => { let d = ""; r.pts.forEach((q, i) => { const nxt = r.pts[i + 1]; if (q.value === null || !nxt || nxt.value === null || (q.est && nxt.est) !== est) return; /* dashed only between two estimated years (Germany: single 1990 point, no dash) */ d += `M${x(i).toFixed(1)},${y(q.value).toFixed(1)}L${x(i + 1).toFixed(1)},${y(nxt.value).toFixed(1)}`; }); return d; };
  const est = r.pts.filter((q) => q.est).map((q) => q.year);
  return (
    <div className="tex" role="region" aria-label={`${NAME[r.code]} emissions line`} ref={ref}>
      <div className="tiph"><span className="mo">{NAME[r.code]} · {unit} · 1990–{r.end}</span><button type="button" className="tipx" aria-label="Close" onClick={onClose}>✕</button></div>
      {w > 0 && <svg width={w} height={H} aria-hidden style={{ color: `var(--${r.code})` }}>
        <path d={seg(false)} stroke="currentColor" strokeWidth={2} fill="none" /><path d={seg(true)} stroke="currentColor" strokeWidth={2} strokeDasharray="5 4" fill="none" />
        <text x={p} y={H - 2} className="ax">1990 · {val(r.pts[0].value)}</text><text x={w - p} y={H - 2} className="ax" textAnchor="end">{r.end} · {val(r.pts[r.pts.length - 1].value)}</text>
      </svg>}
      {view === "pp" && est.length > 0 && <p className="tipn">Estimated population: {est.length === 1 ? est[0] : `${est[0]}–${est[est.length - 1]}`} (dashed)</p>}
      {r.end !== "2024" && <p className="tipn">to {r.end}</p>}
    </div>
  );
}
