"use client";
// #2 Unemployment heat strip — rows = countries (fixed G7 order), columns fit the width. Sequential 7-step scale
// built from neutral tokens + one hue (never country colours). Monthly OECD data (DF_IALFS_UNE_M), all seven.
import { useMemo, useState, type MutableRefObject } from "react";
import { COUNTRIES, SHORT_CODE } from "@/lib/series.mjs";
import { heatStrip, heatStep, HEAT_STEPS, monLabel } from "@/lib/charts.mjs";
import { chartTitle } from "@/src/charts/meta";
import { CardFrame, Seg, StatBox, useParams, useWidth } from "./kit";

const NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.short]));
const WIN = ["1", "5", "10", "20", "50"] as const;

export default function HeatStrip({ um: un, initial }: { um: unknown; initial: MutableRefObject<string | null> }) {
  const [st, set] = useParams(initial, { uh_win: ["20", WIN] });
  const years = Number(st.uh_win);
  const h = useMemo(() => heatStrip(un, years), [un, years]);
  const [wrap, w] = useWidth<HTMLDivElement>();
  const [cur, setCur] = useState<[number, number] | null>(null);
  const narrow = w > 0 && w < 520;
  const nC = h.cols.length;
  const lbl = (i: number) => { // sparse column labels that never collide
    const c = h.cols[i]; const every = h.unit === "year" ? (nC > 20 ? 10 : narrow ? (nC > 10 ? 5 : 3) : nC > 10 ? 2 : 1) : h.unit === "month" ? (narrow ? 3 : 1) : 4;
    const show = (nC - 1 - i) % every === 0; if (!show) return "";
    const star = partialCol[i] ? "*" : "";
    if (h.unit === "year") return (narrow && nC > 10 ? `’${c.label.slice(2)}` : c.label) + star;
    if (h.unit === "month") return (narrow ? c.label.slice(0, 3) : c.label) + star;
    return (narrow ? c.label.replace(/^(Q\d) \d\d(\d\d)$/, "$1 ’$2") : c.label) + star;
  };
  const hasNa = h.rows.some((r) => r.vals.some((v) => v === null));
  const partialCol = h.cols.map((_, i) => h.rows.some((r) => r.cells[i].v !== null && r.cells[i].n < r.cells[i].of));
  const hasPartial = partialCol.some(Boolean);
  const fmt = (v: number | null) => (v === null ? "n/a" : `${v.toFixed(1)}%`);
  const sel = cur ? { r: h.rows[cur[0]], c: h.cols[cur[1]], v: h.rows[cur[0]].vals[cur[1]] } : null;
  const key = (e: React.KeyboardEvent) => {
    const d: Record<string, [number, number]> = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
    if (e.key === "Escape") { setCur(null); return; }
    if (!d[e.key]) return; e.preventDefault();
    const [r, c] = cur ?? [0, nC - 1];
    setCur([Math.max(0, Math.min(6, r + d[e.key][0])), Math.max(0, Math.min(nC - 1, c + d[e.key][1]))]);
  };
  const steps = Array.from({ length: HEAT_STEPS }, (_, i) => h.min + ((h.max - h.min) * i) / HEAT_STEPS);
  return (
    <CardFrame id="chart-2" eyebrow="Labour" title={chartTitle("2")}
      sub={<>Unemployment rate, %, 15+ · seasonally adjusted · {h.unit === "month" ? "monthly" : h.unit === "year" ? "yearly averages of months" : "quarterly averages of months"} · darker = higher</>}
      controls={<div className="bar solo"><Seg label="Timeframe" value={st.uh_win} options={WIN.map((x) => [x, `${x}Y`])} onChange={(v) => { setCur(null); set("uh_win", v); }} /></div>}
      legend={<>
        <li className="hlegend" aria-label={`Scale from ${h.min.toFixed(1)}% to ${h.max.toFixed(1)}%`}><span>{h.min.toFixed(1)}%</span><span className="hbar">{steps.map((_, i) => <i key={i} className={`hs${i}`} />)}</span><span>{h.max.toFixed(1)}%</span></li>
        {hasNa && <li><i className="hna sw" />n/a: no data, never filled</li>}
        {hasPartial && <li>* Partial period: average of the months published so far</li>}
      </>}
      source="Source: OECD · unemployment rate 15+, monthly, SA"
      calc={<>
        <div className="grp"><h3>Measures</h3><dl><dt>Rate</dt><dd>OECD unemployment rate, ages 15+, as published. Already a rate, so no per-capita view.</dd><dt>Colour</dt><dd>7 equal steps from the lowest to the highest value in the window. Sequential: a rate has no meaningful zero here.</dd></dl></div>
        <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">OECD DF_IALFS_UNE_M · ages 15+</dd><dt>Frequency</dt><dd>Monthly, all seven. 1Y shows months; 5Y quarters; 10Y, 20Y and 50Y years (averages of months, so the columns fit a phone).</dd></dl></div>
        <div className="grp"><h3>Window</h3><dl><dt>Columns</dt><dd className="strong">{h.cols[0].label} – {h.cols[nC - 1].label} · {nC} {h.unit}s</dd><dt>Ends</dt><dd>{monLabel(h.end)}, the latest month any country has. Each country’s own latest: {h.rows.map((r) => `${NAME[r.code]} ${monLabel(r.last)}`).join(", ")}. Later cells are n/a.</dd></dl></div>
        <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Quarter / year cell</span><code>mean of its months published so far; n/a if any is missing</code></div><div className="code"><span>Step</span><code>⌊(v − min) ÷ (max − min) × 7⌋, capped at 6</code></div></div></div>
        <div className="grp"><h3>Rules</h3><ul className="rules"><li><span className="ic">n/a</span>Gaps (n/a) are never filled</li><li><span className="ic">*</span>Latest period uses months published so far</li><li><span className="ic">—</span>Before a country’s first monthly reading: n/a{(() => { const l = h.rows.filter((r) => r.first > h.cols[0].months[0]); return l.length ? ` (${l.map((r) => `${NAME[r.code]} from ${r.first.slice(0, 4)}`).join(", ")})` : ""; })()}</li></ul></div>
      </>}>
      <div className="heat" ref={wrap} onPointerDown={() => setCur(null)}>
        {sel && (() => { const c = h.rows[cur![0]].cells[cur![1]];
          const note = c.v === null ? (c.why === "before first reading" ? `before OECD monthly data starts (${monLabel(sel.r.first)})` : c.why === "gap" ? "no data for a month in this period" : `not yet published (latest ${monLabel(sel.r.last)})`)
            : c.of > 1 ? `mean of ${c.n === c.of ? `all ${c.of} months` : `${monLabel(c.from!)}–${monLabel(c.to!)} (${c.n} of ${c.of} months)`}` : undefined;
          return <StatBox bottom={cur![0] < 3} title={`${NAME[sel.r.code]} · ${sel.c.label}`} onClose={() => setCur(null)} rows={[{ code: sel.r.code, name: "Unemployment rate", value: fmt(sel.v), note }]} />; })()}
        <div className={nC > 20 ? "hgrid y50" : "hgrid"} role="grid" aria-label="Unemployment rate by country and period. Arrow keys move between cells." tabIndex={0} onKeyDown={key}
          style={{ gridTemplateColumns: `${narrow ? 28 : 72}px repeat(${nC}, minmax(0, 1fr))` }}>
          {h.rows.map((r, ri) => (
            <div role="row" key={r.code} className="hrow">
              <span role="rowheader" className="hrh">{narrow ? SHORT_CODE[r.code] : NAME[r.code]}</span>
              {r.vals.map((v, ci) => (
                <span role="gridcell" key={ci} aria-selected={cur?.[0] === ri && cur?.[1] === ci} aria-label={`${NAME[r.code]} ${h.cols[ci].label}: ${fmt(v)}`}
                  className={`hc ${v === null ? "hna" : `hs${heatStep(v, h.min, h.max)}`}${cur?.[0] === ri && cur?.[1] === ci ? " cur" : ""}`}
                  onPointerDown={(e) => { e.stopPropagation(); setCur([ri, ci]); }} onPointerEnter={(e) => e.pointerType === "mouse" && setCur([ri, ci])}>{v === null ? <em>n/a</em> : null}</span>
              ))}
            </div>
          ))}
          <div role="row" className="hrow hx" aria-hidden><span />{h.cols.map((_, i) => <span key={i} className="hxl">{lbl(i)}</span>)}</div>
        </div>
      </div>
    </CardFrame>
  );
}
