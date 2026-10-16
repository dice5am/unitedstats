// Finance wave card specs (#13, #10, #6, #20, #19). Components are the generic ones (HeatStrip, Dumbbell, Multiples);
// only wording, inputs and formats live here. Source lines name the actual international source.
import { qLabel } from "@/lib/series.mjs";
import { CPI_LABELS, cpiStep } from "@/lib/finance.mjs";
import { monLabel } from "@/lib/charts.mjs";
import { DIFFERENCE_NOTES } from "@/lib/differenceNotes.mjs";
import type { DumbbellSpec } from "@/src/components/Dumbbell";
import type { MultiplesSpec } from "@/src/components/Multiples";
import type { HeatCfg } from "@/src/components/HeatStrip";

export const rules = (items: [string, string][]) => <div className="grp"><h3>Rules</h3><ul className="rules">{items.map(([ic, t]) => <li key={t}><span className="ic">{ic}</span>{t}</li>)}</ul></div>;
const pct1 = (v: number) => `${v.toFixed(1)}%`;

export const cpiCfg = (headline: unknown, core: unknown): HeatCfg => ({
  id: "13", eyebrow: "Finance", winParam: "in_win", defWin: "5", viewParam: "in_view",
  views: [["headline", "Headline", headline], ["core", "Core", core]], step: cpiStep, aria: "Inflation",
  valueName: (v) => (v === "core" ? "Core inflation" : "Inflation"),
  sub: (h, v) => <>{v === "core" ? "Core CPI (excluding food and energy)" : "Consumer prices (CPI)"}, % change on a year earlier · {h.unit === "month" ? "monthly" : h.unit === "year" ? "yearly averages of months" : "quarterly averages of months"} · colour shows distance from 2%</>,
  legend: () => <>{CPI_LABELS.map((l, i) => <li key={l} className="cpik"><i className={`hd${i}`} />{l}</li>)}</>,
  source: (v) => `Source: OECD · consumer price index, ${v === "core" ? "all items less food and energy" : "all items"}, % change on a year earlier, national CPI`,
  calc: (h, v) => <>
    <div className="grp"><h3>Measures</h3><dl><dt>Inflation</dt><dd>{v === "core" ? "CPI excluding food and energy" : "CPI, all items"}, % change on the same month a year earlier. Already a rate, so no per-capita view.</dd>
      <dt>Colour</dt><dd>Fixed bands around the 2% target, the same in every window: {CPI_LABELS.join(" · ")}. Below 1.5%: grey; 1.5–2.5%: plain; above 2.5%: warm.</dd></dl></div>
    <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">OECD DF_PRICES_ALL (US, UK, Germany) · DF_PRICES_C2018_ALL (Canada, Japan, France, Italy)</dd><dt>Method</dt><dd>National CPI (not HICP); each country wholly from one dataset.</dd></dl></div>
    <div className="grp"><h3>Window</h3><dl><dt>Columns</dt><dd className="strong">{h.cols[0].label} – {h.cols[h.cols.length - 1].label}</dd><dt>Ends</dt><dd>{monLabel(h.end)}, the latest month any country has.</dd></dl></div>
    <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Quarter / year cell</span><code>mean of its monthly rates published so far; n/a if any is missing</code></div></div></div>
    {rules([["n/a", "Gaps (n/a) are never filled"], ["*", "Latest period uses months published so far"]])}
  </>,
});

const Y = (p: string) => p;
export const debtSpec: DumbbellSpec = {
  id: "10", eyebrow: "Finance", start: "2007", change: "pts", per: Y, unitLabel: "gross debt, % of GDP", valueFmt: pct1, tickFmt: (v) => `${v}%`,
  labels: { up: "Biggest rise", down: "Biggest fall", upSmall: "Smallest rise", downSmall: "Smallest fall" },
  sub: () => <>General government gross debt, % of GDP · 2007 vs latest actual year · actuals to 2024 or 2025, no projections</>,
  source: "Source: IMF World Economic Outlook (Apr 2026) · general government gross debt (GGXWDG_NGDP), % of GDP, actuals only",
  calc: (d) => <>
    <div className="grp"><h3>Measures</h3><dl><dt>Debt</dt><dd>General government gross debt as % of GDP. Already a share of GDP, so no per-capita view.</dd></dl></div>
    <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">IMF WEO · GGXWDG_NGDP</dd><dt>Actuals</dt><dd>Cut at each country’s last actual year: {d.rows.map((r) => `${r.code} ${r.end}`).join(", ")}. IMF projections are not shown.</dd></dl></div>
    <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Change</span><code>debt(latest actual) − debt(2007), in points</code></div>
      {(() => { const c = d.rows.find((r) => r.code === "CAN"); return c && c.change !== null && <p className="ex">Canada: <b>{c.endValue!.toFixed(1)} − {c.startValue!.toFixed(1)} = {c.change >= 0 ? "+" : "−"}{Math.abs(c.change).toFixed(1)} pts</b> ({c.end})</p>; })()}</div></div>
    <div className="grp"><h3>Source differences</h3><p className="diffnote">{DIFFERENCE_NOTES["10"]}</p></div>
    {rules([["n/a", "Gaps are never filled"], ["→", "Each country ends at its own last actual year"]])}
  </>,
};

export const houseSpec: DumbbellSpec = {
  id: "6", eyebrow: "Finance", start: "2010-Q1", change: "pct", per: qLabel, unitLabel: "price-to-income index", valueFmt: (v) => v.toFixed(1), tickFmt: (v) => String(v),
  labels: { up: "Biggest rise", down: "Biggest fall", upSmall: "Smallest rise", downSmall: "Smallest fall" },
  sub: (latest) => <>House prices ÷ disposable income per person · index · Q1 2010 vs latest quarter (to {qLabel(latest)}) · compares change within each country, not levels between countries</>,
  source: "Source: OECD Analytical house prices · price-to-income ratio (HPI_YDH), index, seasonally adjusted",
  calc: (d) => <>
    <div className="grp"><h3>Measures</h3><dl><dt>Ratio</dt><dd>Nominal house prices ÷ nominal disposable income per person, as an index. Already a ratio, so no per-capita view. Levels are not comparable between countries; the change within each country is.</dd></dl></div>
    <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">OECD DF_HOUSE_PRICES · HPI_YDH · IX</dd><dt>Latest</dt><dd>Each country’s own latest quarter: {d.rows.map((r) => `${r.code} ${r.end ? qLabel(r.end) : "n/a"}`).join(", ")}.</dd></dl></div>
    <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Change</span><code>(index(latest) ÷ index(Q1 2010) − 1) × 100</code></div>
      {(() => { const c = d.rows.find((r) => r.code === "CAN"); return c && c.change !== null && <p className="ex">Canada: <b>{c.endValue!.toFixed(1)} ÷ {c.startValue!.toFixed(1)} − 1 = {c.change >= 0 ? "+" : "−"}{Math.abs(c.change).toFixed(1)}%</b></p>; })()}</div></div>
    {rules([["n/a", "Gaps are never filled"], ["→", "Each country ends at its own latest quarter (Japan Q4 2025)"]])}
  </>,
};

const winRow = (m: { from: string; to: string }) => <div className="grp"><h3>Window</h3><dl><dt>Quarters</dt><dd className="strong">{qLabel(m.from)} – {qLabel(m.to)}</dd><dt>Start</dt><dd>The same quarter N years before the latest quarter; a country with no data then starts at its own first reading (“from YYYY”).</dd></dl></div>;
export const creditSpec: MultiplesSpec = {
  id: "20", eyebrow: "Finance", kind: "area", param: "hd_win", defWin: "20", ref: "2007-Q4", unitLabel: "Household credit, % of GDP", fmt: pct1,
  sub: (f, t) => <>Credit to households, % of GDP · quarterly · {qLabel(f)} – {qLabel(t)} · same scale in all panels · dashed line = level in Q4 2007</>,
  source: "Source: BIS total credit statistics · credit to households and NPISHs from all sectors, % of GDP (WS_TC), adjusted for breaks",
  calc: (m) => <>
    <div className="grp"><h3>Measures</h3><dl><dt>Credit</dt><dd>Credit to households and non-profits serving households, from all lenders, market value, as % of GDP (BIS unit 770, “Percentage of GDP”). Already a share of GDP, so no per-capita view.</dd></dl></div>
    <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">BIS WS_TC · Q.xx.H.A.M.770.A</dd><dt>Reference</dt><dd>Q4 2007, just before the financial crisis: {m.panels.map((p) => `${p.code} ${p.ref?.value?.toFixed(1) ?? "n/a"}`).join(", ")}.</dd></dl></div>
    {winRow(m)}
    {rules([["n/a", "Gaps are never filled"], ["- -", "Dashed: Q4 2007 level, drawn when Q4 2007 is in the window"]])}
  </>,
};
export const bopSpec: MultiplesSpec = {
  id: "19", eyebrow: "Finance", kind: "bars", param: "ca_win", defWin: "10", unitLabel: "Current account, % of GDP", fmt: (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}%`,
  statusNote: { E: "OECD estimate", P: "provisional", B: "series break" },
  sub: (f, t) => <>Current account balance, % of GDP · quarterly, seasonally adjusted · {qLabel(f)} – {qLabel(t)} · above zero = surplus · same scale in all panels</>,
  source: "Source: OECD balance of payments · current account balance, % of GDP (DF_BOP), seasonally adjusted",
  calc: (m) => <>
    <div className="grp"><h3>Measures</h3><dl><dt>Balance</dt><dd>Current account balance (exports and income earned from abroad minus imports and income paid abroad), as % of GDP. Already a share of GDP, so no per-capita view.</dd></dl></div>
    <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">OECD DF_BOP · CA, B, PT_B1GQ</dd><dt>Coverage</dt><dd>All seven together from Q1 1999. Recent quarters are revised often; flags (OECD estimate, provisional) show in the stats box.</dd></dl></div>
    {winRow(m)}
    {rules([["n/a", "Gaps are never filled"], ["±", "Bars above zero: surplus; below: deficit (drawn lighter)"]])}
  </>,
};
