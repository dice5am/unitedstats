// Economy wave specs (#25 Gini dot plot, #15 R&D stacked bar). #3 is its own component (Bump).
import { AllText } from "@/src/components/Sel";
import { ownLatest, rdStack, RD_YEARS, RD_DEFAULT } from "@/lib/waves.mjs";
import { DIFFERENCE_NOTES } from "@/lib/differenceNotes.mjs";
import { rules } from "./finance";
import type { RankBarSpec } from "@/src/components/RankBar";
import type { StackSpec } from "@/src/components/StackRank";

export const giniSpec: RankBarSpec = {
  id: "25", eyebrow: "Economy", kind: "dot", dp: 1, per: (p) => p, unitLabel: "Gini, disposable income (×100)",
  labels: { top: "Most unequal", bottom: "Least unequal" },
  rows: (f) => { const d = ownLatest(f, 100); return { latest: d.map((r) => r.end!).filter(Boolean).sort().pop()!, rows: d.map((r) => ({ code: r.code, value: r.value, end: r.end,
    stat: [{ name: `Gini · ${r.end ?? "n/a"}`, value: r.value === null ? "n/a" : r.value.toFixed(1), note: "Years differ by country" }, { name: "As published (0–1)", value: r.value === null ? "n/a" : (r.value / 100).toFixed(3) }] })) }; },
  sub: () => <>Gini coefficient of disposable household income, 0 = everyone equal, 100 = one household has everything · each country’s latest year, dated</>,
  source: "Source: OECD Income Distribution Database · Gini coefficient, disposable income, post taxes and transfers (2012 method)",
  legend: <li>Year printed by each dot: the latest year that country published</li>,
  calc: (d) => <>
    <div className="grp"><h3>Measures</h3><dl><dt>Gini</dt><dd>Inequality of disposable income (after taxes and transfers), shown ×100. Already a ratio, so no per-capita toggle. Years differ: surveys are not yearly everywhere.</dd></dl></div>
    <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">OECD IDD · INC_DISP_GINI · METH2012</dd><dt>Latest</dt><dd>{d.rows.map((r: any) => `${r.code} ${r.end}`).join(", ")}.</dd></dl></div>
    <div className="grp"><h3>Source differences</h3><p className="diffnote">{DIFFERENCE_NOTES["25"]}</p></div>
    {rules([["n/a", "Gaps are never filled"], ["→", "Each country at its own latest year; no time view (too uneven)"]])}
  </>,
};

const f1 = (v: number) => `${v.toFixed(1)}%`;
export const rdSpec = (gerd: unknown, berd: unknown): StackSpec => ({
  id: "15", eyebrow: "Economy", param: "rd_year", years: RD_YEARS, def: RD_DEFAULT, parts: ["Business", "Government, universities and other"], fmt: f1,
  rows: (year) => rdStack(gerd, berd, year).rows.map((r) => ({ code: r.code, parts: [r.business, r.rest], total: r.rest === null ? null : r.total, latestYear: r.latestYear, note: r.flag && /D/.test(r.flag) ? "definition differs (OECD flag D)" : undefined })),
  labels: ["Highest", "Lowest"],
  sub: (y) => <>Gross domestic spending on R&D, % of GDP, split into business and everything else · {y} · ranked by total</>,
  source: "Source: OECD Main Science and Technology Indicators · GERD and BERD, % of GDP",
  calc: (y, rows) => { const c = rows.find((r) => r.code === "CAN"); return <>
    <div className="grp"><h3>Measures</h3><dl><dt>R&D</dt><dd>Total R&D spending in the country (GERD), with the part spent by businesses (BERD). The rest is government, universities and non-profits. Already a share of GDP, so no per-capita toggle.</dd></dl></div>
    <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">OECD MSTI · G_XGDP and B_XGDP</dd><dt>Default</dt><dd>2023, the latest year <AllText codes={rows.map((r) => r.code)} /> have, so the default never mixes years. The UK has no 2024 total; Canada alone has 2025.</dd></dl></div>
    <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Rest</span><code>GERD − BERD</code></div>
      {c && c.total !== null && <p className="ex">Canada, {y}: <b>{c.total.toFixed(2)} − {c.parts[0]!.toFixed(2)} = {c.parts[1]!.toFixed(2)}% of GDP</b></p>}</div></div>
    {rules([["n/a", "A year a country hasn’t published is n/a, tagged with its latest year; never filled"], ["D", "US totals carry OECD’s ‘definition differs’ flag; the stats box tags it"]])}
  </>; },
});
