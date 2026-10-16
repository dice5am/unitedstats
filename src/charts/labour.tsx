// Labour wave card specs (#17, #12, #18, #24) on the generic RankBar / Slope components. Wording, inputs and formats only.
import { COUNTRIES } from "@/lib/series.mjs";
import { perLabel } from "@/lib/charts.mjs";
import { youthRatio, changeSince } from "@/lib/finance.mjs";
import { monLabel } from "@/lib/charts.mjs";
import { rules } from "./finance";
import type { RankBarSpec } from "@/src/components/RankBar";
import type { SlopeSpec } from "@/src/components/Slope";

const NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.short]));
const CODES = ["CAN", "USA", "JPN", "FRA", "GBR", "DEU", "ITA"];

export const youthSpec = (youth: any): RankBarSpec => ({
  id: "17", eyebrow: "Labour", kind: "ratio", dp: 2, per: perLabel, unitLabel: "youth ÷ overall rate",
  labels: { top: "Highest ratio", bottom: "Lowest ratio" },
  rows: (all) => { const d = youthRatio(youth, all); return { latest: d.latest, rows: d.rows.map((r) => ({ code: r.code, value: r.ratio, end: r.end, spark: r.spark,
    stat: [{ name: `Ages 15–24 · ${r.end ? perLabel(r.end) : "n/a"}${r.freq !== "monthly" ? ` · ${r.freq}` : ""}`, value: r.youth === null ? "n/a" : `${r.youth.toFixed(2)}%` }, { name: "Ages 15+", value: r.all === null ? "n/a" : `${r.all.toFixed(2)}%` }, { name: "Ratio", value: r.ratio === null ? "n/a" : `${r.ratio.toFixed(2)}×` }] })) }; },
  sub: () => <>Youth unemployment rate (age 15–24) ÷ overall rate</>,
  source: "Source: OECD · monthly unemployment rates, ages 15–24 and 15+, seasonally adjusted",
  legend: <><li><i className="rbk" />Dashed line: ratio of 1 (same rate as everyone)</li><li>Sparkline: the ratio over the last 5 years</li></>,
  calc: (d) => { const c = d.rows.find((r: any) => r.code === "CAN"); return <>
    <div className="grp"><h3>Measures</h3><dl><dt>Ratio</dt><dd>Youth unemployment rate (ages 15–24) ÷ overall unemployment rate (ages 15+), same month. Strips out the general state of the economy. Already a ratio, so no per-capita view.</dd></dl></div>
    <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">OECD DF_IALFS_UNE_M · 15–24 and 15+ · seasonally adjusted</dd><dt>Latest</dt><dd>Each country’s own latest month with both rates: {d.rows.map((r: any) => `${r.code} ${r.end ? perLabel(r.end) : "n/a"}`).join(", ")}.</dd></dl></div>
    <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Ratio</span><code>rate(15–24) ÷ rate(15+), single month</code></div>
      {c && c.value !== null && <p className="ex">Canada: <b>{c.stat[0].value} ÷ {c.stat[1].value} = {c.value.toFixed(2)}×</b> ({monLabel(c.end)})</p>}</div></div>
    {rules([["n/a", "Gaps are never filled"], ["→", "Each country at its own latest month"]])}
  </>; },
});

export const hoursSpec: RankBarSpec = {
  id: "18", eyebrow: "Labour", kind: "diverging", dp: 0, unit: "hrs", per: (p) => p, unitLabel: "hours per worker per year",
  labels: { up: "Biggest rise", down: "Biggest fall", upSmall: "Smallest rise", downSmall: "Smallest fall" },
  rows: (f) => { const d = changeSince(f, 2000); return { start: "2000", latest: d.ends[d.ends.length - 1], rows: d.rows.map((r) => ({ code: r.code, value: r.change, end: r.end,
    stat: [{ name: "2000", value: r.startValue === null ? "n/a" : `${Math.round(r.startValue).toLocaleString("en-GB")} hrs` }, { name: r.end ?? "Latest", value: r.endValue === null ? "n/a" : `${Math.round(r.endValue).toLocaleString("en-GB")} hrs` },
      { name: "Change", value: r.change === null ? "n/a" : `${r.change > 0 ? "+" : r.change < 0 ? "−" : ""}${Math.abs(Math.round(r.change))} hrs (${r.pct! > 0 ? "+" : "−"}${Math.abs(r.pct!).toFixed(1)}%)` }] })) }; },
  sub: (latest) => <>Change in average annual hours worked per worker, 2000 to {latest} · levels differ in how they’re measured, so only the change is ranked</>,
  source: "Source: OECD · average annual hours actually worked per worker",
  calc: (d) => { const c = d.rows.find((r: any) => r.code === "CAN"); return <>
    <div className="grp"><h3>Measures</h3><dl><dt>Hours</dt><dd>Average annual hours actually worked per worker. Already per worker, so no per-capita view. OECD warns levels are not fully comparable between countries; changes over time are, so the chart ranks the change.</dd></dl></div>
    <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">OECD DF_HW · average annual hours per worker</dd><dt>Years</dt><dd>2000 to {d.latest} for every country.</dd></dl></div>
    <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Change</span><code>hours(latest) − hours(2000)</code></div>
      {c && <p className="ex">Canada: <b>{c.stat[1].value} − {c.stat[0].value} = {c.stat[2].value}</b></p>}</div></div>
    {rules([["n/a", "Gaps are never filled"]])}
  </>; },
};

export const wageSpec: SlopeSpec = {
  id: "12", eyebrow: "Labour", start: 1990, change: "pct", dp: 1, unitLabel: "average annual wage", valueFmt: (v) => `$${Math.round(v / 1000)}k`,
  labels: { up: "Fastest growth", down: "Biggest fall", upSmall: "Slowest growth", downSmall: "Smallest fall" },
  sub: (ends) => <>Average annual wage, after inflation, in US dollars at purchasing power parity · 1990 vs {ends[ends.length - 1]}</>,
  source: "Source: OECD · average annual wages, constant prices, USD PPP",
  calc: (d) => { const c = d.rows.find((r) => r.code === "CAN"); return <>
    <div className="grp"><h3>Measures</h3><dl><dt>Wages</dt><dd>Average annual wage per full-time-equivalent employee, constant prices, converted at purchasing power parity. Already per employee, so no per-capita view.</dd></dl></div>
    <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">OECD DF_AV_AN_WAGE · constant prices · USD PPP</dd><dt>Years</dt><dd>1990 and {d.ends.join(", ")}.</dd></dl></div>
    <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Growth</span><code>wage(latest) ÷ wage(1990) − 1</code></div>
      {c && c.change !== null && <p className="ex">Canada: <b>{Math.round(c.endValue!).toLocaleString("en-GB")} ÷ {Math.round(c.startValue!).toLocaleString("en-GB")} − 1 = {c.change >= 0 ? "+" : "−"}{Math.abs(c.change).toFixed(1)}%</b></p>}</div></div>
    {rules([["n/a", "Gaps are never filled"]])}
  </>; },
};

export const shareSpec: SlopeSpec = {
  id: "24", eyebrow: "Labour", start: 2004, change: "pts", dp: 1, unitLabel: "labour income, % of GDP", valueFmt: (v) => `${v.toFixed(1)}%`,
  labels: { up: "Biggest rise", down: "Biggest fall", upSmall: "Smallest rise", downSmall: "Smallest fall" }, flagNote: { I: "ILO imputed (every year)" },
  sub: (ends) => <>Labour income as % of GDP · 2004 vs each country’s latest actual year ({ends.join(" or ")}) · ILO modelled estimates, no projections</>,
  source: "Source: ILO modelled estimates · labour income share, % of GDP",
  calc: (d) => { const c = d.rows.find((r) => r.code === "CAN"); return <>
    <div className="grp"><h3>Measures</h3><dl><dt>Labour share</dt><dd>Wages plus the labour part of self-employment income, as % of GDP. Already a share, so no per-capita view.</dd></dl></div>
    <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">ILOSTAT · labour income share (ILO modelled estimates)</dd><dt>Actuals</dt><dd>Cut at each country’s last year ILO does not mark as a model-based projection: {d.rows.map((r) => `${r.code} ${r.end}`).join(", ")}.</dd><dt>US</dt><dd>Every US year is flagged “imputed” by ILO; the line stays solid and the stats box tags it.</dd></dl></div>
    <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Change</span><code>share(latest actual) − share(2004), in points</code></div>
      {c && c.change !== null && <p className="ex">Canada: <b>{c.endValue!.toFixed(1)} − {c.startValue!.toFixed(1)} = {c.change >= 0 ? "+" : "−"}{Math.abs(c.change).toFixed(1)} pts</b> ({c.end})</p>}</div></div>
    {rules([["n/a", "Gaps are never filled"], ["→", "Each country ends at its own last actual year"]])}
  </>; },
};
void NAME; void CODES;
