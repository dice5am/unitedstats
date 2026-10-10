// Society wave specs (#4 greying slope, #11 fertility multiples, #23 migrants waffle, #8 health spending scatter, #16 degree gap dumbbell).
import { pairs, twoAges } from "@/lib/waves.mjs";
import { rules } from "./finance";
import type { SlopeSpec } from "@/src/components/Slope";
import type { YMSpec } from "@/src/components/YearMultiples";
import type { WaffleSpec } from "@/src/components/Waffle";
import type { ScatterSpec } from "@/src/components/Scatter";
import type { DumbbellSpec } from "@/src/components/Dumbbell";

const pct1 = (v: number) => `${v.toFixed(1)}%`;
export const greySpec: SlopeSpec = {
  id: "4", eyebrow: "Society", start: 1990, starts: ["1960", "1990", "2005"], param: "gr_start", change: "pts", dp: 1, unitLabel: "share aged 65+", valueFmt: pct1,
  labels: { up: "Biggest rise", down: "Biggest fall", upSmall: "Smallest rise", downSmall: "Smallest fall" },
  sub: (ends, start) => <>People aged 65 and over, % of the population · {start} vs {ends[ends.length - 1]}</>,
  source: "Source: World Bank WDI · population ages 65 and above, % of total population (SP.POP.65UP.TO.ZS)",
  calc: (d) => { const c = d.rows.find((r) => r.code === "CAN")!; return <>
    <div className="grp"><h3>Measures</h3><dl><dt>Share 65+</dt><dd>People aged 65 and over as % of everyone. Already a share of the population, so no per-capita toggle.</dd></dl></div>
    <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">World Bank WDI · SP.POP.65UP.TO.ZS</dd><dt>Years</dt><dd>{d.start} and {d.ends.join(", ")}; start year switchable (1960, 1990, 2005).</dd></dl></div>
    <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Change</span><code>share(latest) − share(start), in points</code></div>
      {c.change !== null && <p className="ex">Canada: <b>{c.endValue!.toFixed(1)} − {c.startValue!.toFixed(1)} = +{c.change.toFixed(1)} pts</b></p>}</div></div>
    {rules([["n/a", "Gaps are never filled"]])}
  </>; },
};
export const fertSpec: YMSpec = {
  id: "11", eyebrow: "Society", param: "fe_from", froms: ["1960", "1990", "2005"], def: "1960", ref: { value: 2.1, label: "Dashed: 2.1 births per woman, a common rule of thumb for a stable population (not from the dataset)" }, dp: 2, unitLabel: "births per woman",
  labels: ["Highest", "Lowest"],
  sub: (f, t) => <>Total fertility rate, births per woman · {f}–{t} · same scale in every panel</>,
  source: "Source: World Bank WDI · fertility rate, total, births per woman (SP.DYN.TFRT.IN)",
  calc: (rows) => <>
    <div className="grp"><h3>Measures</h3><dl><dt>Fertility</dt><dd>Average births per woman over a lifetime at this year’s rates. Already per woman, so no per-capita toggle.</dd></dl></div>
    <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">World Bank WDI · SP.DYN.TFRT.IN</dd><dt>Latest</dt><dd>{rows.map((r) => `${r.code} ${r.value.toFixed(2)} (${r.end})`).join(", ")}.</dd></dl></div>
    <div className="grp"><h3>Reference line</h3><p>2.1 is a standard demographic rule of thumb, not a figure from the dataset.</p></div>
    {rules([["n/a", "Gaps are never filled"]])}
  </>,
};
export const migSpec: WaffleSpec = {
  id: "23", eyebrow: "Society", param: "mg_year", years: ["1990", "1995", "2000", "2005", "2010", "2015", "2020", "2024"], def: "2024", base: "1990",
  sub: (y) => <>People born in another country, % of the population · {y} · one square = 1%</>,
  source: "Source: World Bank WDI (UN DESA) · international migrant stock, % of population (SM.POP.TOTL.ZS)",
  calc: (y, v) => <>
    <div className="grp"><h3>Measures</h3><dl><dt>Migrant stock</dt><dd>People living in the country who were born elsewhere, as % of the population. Already a share, so no per-capita toggle.</dd></dl></div>
    <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">World Bank WDI · SM.POP.TOTL.ZS</dd><dt>Years</dt><dd>Published for 1990, 1995 … 2020 and 2024 only. In-between years are not interpolated.</dd></dl></div>
    <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Squares</span><code>round(share) of 100</code></div>
      {v("CAN", y) !== null && <p className="ex">Canada, {y}: <b>{v("CAN", y)!.toFixed(1)}% → {Math.round(v("CAN", y)!)} squares</b></p>}</div></div>
    {rules([["n/a", "Gaps are never filled"], ["■", "Exact value in each label; squares are rounded"]])}
  </>,
};
const YRS = Array.from({ length: 25 }, (_, i) => String(2000 + i));
export const healthSpec = (hx: any, le: any): ScatterSpec => ({
  id: "8", eyebrow: "Society", param: "hl_year", years: YRS, def: "2023", xLabel: "Health spending, % of GDP", yLabel: "Life expectancy, years",
  xFmt: (v) => `${v.toFixed(1)}%`, yFmt: (v) => `${v.toFixed(1)} yrs`, xTick: (v) => `${v}%`, tagEnd: (y) => y,
  points: (y) => pairs(hx, le, y).map((p) => ({ code: p.code, x: p.x, y: p.y, note: p.yFlag === "E" ? "OECD estimate" : undefined })),
  sub: (y) => <>Current health spending, % of GDP (across) vs life expectancy at birth, years (up) · {y}</>,
  source: "Sources: World Bank WDI · current health expenditure, % of GDP (SH.XPD.CHEX.GD.ZS); OECD · life expectancy at birth, total",
  legend: <li>2023 is the default: the US and Japan have no 2024 health spending yet</li>,
  calc: (pts, y) => <>
    <div className="grp"><h3>Measures</h3><dl><dt>Across</dt><dd>Current health spending, public and private, % of GDP.</dd><dt>Up</dt><dd>Life expectancy at birth, both sexes. Both are already shares or per-person figures, so no per-capita toggle.</dd></dl></div>
    <div className="grp"><h3>Inputs</h3><dl><dt>Datasets</dt><dd className="mono">World Bank WDI · SH.XPD.CHEX.GD.ZS; OECD Health Status · life expectancy at birth</dd><dt>{y}</dt><dd>{pts.map((p) => `${p.code} ${p.x === null ? "n/a" : p.x.toFixed(1) + "%"}, ${p.y === null ? "n/a" : p.y.toFixed(1)}`).join(" · ")}</dd></dl></div>
    {rules([["n/a", "A year a country hasn’t published is n/a; never filled"], ["E", "UK and Japan life expectancy: OECD estimates, tagged in the stats box"]])}
  </>,
});
export const degreeSpec: DumbbellSpec = {
  id: "16", eyebrow: "Society", start: "25–64", change: "pts", per: (p) => p, unitLabel: "tertiary degree, % of age group", valueFmt: pct1, tickFmt: (v) => `${v}%`,
  labels: { up: "Biggest gap", down: "Older group ahead most", upSmall: "Smallest gap", downSmall: "Older group ahead least" },
  build: (f: any) => { const r = twoAges(f.older, f.younger); const ends = [...new Set(r.map((x) => x.end).filter(Boolean) as string[])].sort();
    return { rows: r.map((x) => ({ code: x.code, start: "25–64", startValue: x.a, end: x.end, endValue: x.b, change: x.gap })), start: "25–64", latest: ends[ends.length - 1], ends } as any; },
  legendStart: "Ages 25–64", legendEnd: "Ages 25–34", endName: (e) => `Ages 25–34 · ${e}`, dateOf: (e) => `${e} · ages 25–34 vs 25–64`,
  sub: (latest) => <>People with a degree or equivalent (tertiary, ISCED 5–8), % of each age group · ages 25–34 vs 25–64 · {latest}</>,
  source: "Source: OECD Education at a Glance · tertiary attainment, ages 25–34 and 25–64",
  calc: (d) => { const c = d.rows.find((r) => r.code === "CAN")!; return <>
    <div className="grp"><h3>Measures</h3><dl><dt>Degree</dt><dd>Share of each age group with tertiary education (ISCED 5–8). Already a share, so no per-capita toggle.</dd><dt>Gap</dt><dd>Ages 25–34 minus ages 25–64, in points: how far the young are ahead of the working-age average.</dd></dl></div>
    <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">OECD EAG · educational attainment, ISCED 5–8</dd><dt>Year</dt><dd>Latest year both age groups are published: {d.rows.map((r) => `${r.code} ${r.end}`).join(", ")}. Japan’s latest carries OECD flag W.</dd></dl></div>
    <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Gap</span><code>share(25–34) − share(25–64), in points</code></div>
      {c.change !== null && <p className="ex">Canada: <b>{c.endValue!.toFixed(1)} − {c.startValue!.toFixed(1)} = +{c.change.toFixed(1)} pts</b></p>}</div></div>
    {rules([["n/a", "Gaps are never filled"]])}
  </>; },
};
