// Population back-extension (Cavin 2026-10-10), NOT YET ENABLED: waiting for the Data Lead's gated joined file.
// OECD annual population is used ONLY for quarters before each country's quarterly population starts; every quarter
// from the first quarterly reading on is left unchanged. Annual figures are pinned to their middle month (July) and
// interpolated in a straight line (never held flat). GDP per capita for the extended quarters = GDP ÷ that population.
const qMid = (y, q) => y * 12 + (q - 1) * 3 + 1;
export function joinPopulation(econ, annual) {
  const out = structuredClone(econ), joins = {};
  for (const c of Object.keys(econ.population)) {
    const P = out.population[c], A = annual.series[c]; if (!A) continue;
    // lay the population (and per-capita) series on the GDP quarters so earlier quarters exist to fill
    const G = econ.gdp[c].periods, firstQ = P.periods[P.values.findIndex((v) => v !== null)];
    const pv = Object.fromEntries(P.periods.map((p, i) => [p, P.values[i]])), cv = Object.fromEntries(out.gdp_per_capita[c].periods.map((p, i) => [p, out.gdp_per_capita[c].values[i]]));
    const per = [...new Set([...G, ...P.periods])].sort((a, b) => (a < b ? -1 : 1));
    P.periods = per; P.values = per.map((p) => pv[p] ?? null);
    out.gdp_per_capita[c].periods = per; out.gdp_per_capita[c].values = per.map((p) => cv[p] ?? null);
    const fi = per.indexOf(firstQ);
    const pts = A.periods.map((y, i) => ({ t: +y * 12 + 6, v: A.values[i] })).filter((p) => p.v !== null);
    const at = (t) => { for (let i = 0; i < pts.length - 1; i++) if (pts[i].t <= t && t <= pts[i + 1].t) return pts[i].v + ((pts[i + 1].v - pts[i].v) * (t - pts[i].t)) / (pts[i + 1].t - pts[i].t); return null; };
    let n = 0;
    P.periods.forEach((p, i) => { if (i >= fi) return; const [y, q] = p.split("-Q").map(Number); const v = at(qMid(y, q)); if (v === null) return;
      P.values[i] = v; n++; const g = econ.gdp[c].values[econ.gdp[c].periods.indexOf(p)];
      const k = out.gdp_per_capita[c].periods.indexOf(p); if (k >= 0) out.gdp_per_capita[c].values[k] = g == null ? null : g / v; });
    const [fy, fq] = firstQ.split("-Q").map(Number), ann = at(qMid(fy, fq));
    joins[c] = { firstQuarterly: firstQ, extended: n, gapPct: ann === null ? null : ((P.values[fi] - ann) / ann) * 100 };
  }
  return { econ: out, joins };
}
