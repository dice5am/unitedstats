// Environment wave specs (#5 connected scatter). #14 (TileMap) and #9 (MixArea) are their own components.
import { trails } from "@/lib/waves.mjs";
import { rules } from "./finance";
import type { ScatterSpec } from "@/src/components/Scatter";

const pc = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(Math.round(v * 10) / 10).toFixed(1)}%`;
export const richerSpec = (gdp: unknown, co2: unknown): ScatterSpec => {
  const T = trails(gdp, co2);
  return {
    id: "5", eyebrow: "Environment", xLabel: "GDP per person, 2021 $ PPP", yLabel: "CO2 per person, t", tagEnd: () => T[0].to!,
    xFmt: (v) => `$${Math.round(v).toLocaleString("en-GB")}`, yFmt: (v) => `${v.toFixed(1)} t`, xTick: (v) => `$${v / 1000}k`,
    points: () => T.map((t) => { const b = t.pts[t.pts.length - 1]; return { code: t.code, x: b.x, y: b.y, trail: t.pts, date: t.to!, note: `since ${t.from}: GDP per person ${pc(t.dx!)}, CO2 per person ${pc(t.dy!)}` }; }),
    headline: () => { const s = [...T].sort((a, b) => a.dy! - b.dy!); return [s[0], s[s.length - 1]].map((t, k) => ({ code: t.code, label: k ? (t.dy! < 0 ? "Smallest CO2 cut per person" : "CO2 per person up") : "Biggest CO2 cut per person", value: pc(t.dy!), date: `${t.from} → ${t.to} · GDP per person ${pc(t.dx!)}` })); },
    sub: () => <>GDP per person (across, constant 2021 dollars at PPP) vs CO2 per person (up, tonnes, excluding land use) · one dot per year, {T[0].from}–{T[0].to}</>,
    source: "Source: World Bank WDI · GDP per capita, PPP, constant 2021 international $ (NY.GDP.PCAP.PP.KD); CO2 per capita excl. LULUCF, EDGAR (EN.GHG.CO2.PC.CE.AR5)",
    legend: <><li>Thin line: the path since {T[0].from} (hollow dot = {T[0].from}); solid dot = {T[0].to}</li><li>Down and to the right = richer and emitting less</li></>,
    calc: () => { const c = T.find((t) => t.code === "CAN")!; return <>
      <div className="grp"><h3>Measures</h3><dl><dt>Across</dt><dd>GDP per person, constant 2021 international dollars at PPP.</dd><dt>Up</dt><dd>CO2 emissions per person excluding land use and forestry (LULUCF), tonnes. Both already per person, so no per-capita toggle.</dd></dl></div>
      <div className="grp"><h3>Inputs</h3><dl><dt>Datasets</dt><dd className="mono">World Bank WDI · NY.GDP.PCAP.PP.KD; EN.GHG.CO2.PC.CE.AR5 (EDGAR, modelled by the EU Joint Research Centre)</dd><dt>Years</dt><dd>{T[0].from}–{T[0].to}, the overlap of both series.</dd></dl></div>
      <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Change</span><code>value({T[0].to}) ÷ value({T[0].from}) − 1, each axis</code></div>
        <p className="ex">Canada: <b>GDP per person {pc(c.dx!)}, CO2 per person {pc(c.dy!)}</b></p></div></div>
      {rules([["n/a", "Gaps are never filled"]])}
    </>; },
  };
};
