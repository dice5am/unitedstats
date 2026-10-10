// Economy, Society and Environment waves (#3, #25, #15, #4, #11, #23, #8, #16, #5, #14, #9): pure calculations, shared by
// the components and the golden test. Gaps are never filled; each country uses its own dated figure where a chart says so.
export const ORDER = ["CAN", "USA", "JPN", "FRA", "GBR", "DEU", "ITA"];
const at = (s, p) => { if (!s) return null; const i = s.periods.indexOf(String(p)); return i < 0 ? null : s.values[i] ?? null; };
const stAt = (s, p) => { const i = s.periods.indexOf(String(p)); if (i < 0 || !s.status) return null; return (Array.isArray(s.status) ? s.status[i] : s.status[s.periods[i]]) ?? null; };
const lastNN = (s) => { for (let i = s.values.length - 1; i >= 0; i--) if (s.values[i] !== null && s.values[i] !== undefined) return i; return -1; };
export const latestOf = (s) => { const i = lastNN(s); return i < 0 ? { period: null, value: null } : { period: s.periods[i], value: s.values[i] }; };

// #3 bump chart: rank 1 = highest each year, ranked only in years all seven have a value (from 1970).
export const DEU_FROM = 1991;
export function league(file, from = 1970) {
  const last = Math.max(...ORDER.map((c) => +latestOf(file.series[c]).period));
  const years = []; for (let y = from; y <= last; y++) years.push(String(y));
  const rank = Object.fromEntries(ORDER.map((c) => [c, []])), value = Object.fromEntries(ORDER.map((c) => [c, []]));
  for (const y of years) {
    // Germany enters GDP per person in 1991 (unified Germany); before that it is not ranked and the others rank 1–6.
    const v = ORDER.map((c) => [c, c === "DEU" && +y < DEU_FROM ? null : at(file.series[c], y)]), full = v.every(([c, x]) => x !== null || (c === "DEU" && +y < DEU_FROM));
    const sorted = [...v].filter(([, x]) => x !== null).sort((a, b) => b[1] - a[1]);
    for (const [c, x] of v) { value[c].push(x); rank[c].push(full && x !== null ? sorted.findIndex(([k]) => k === c) + 1 : null); }
  }
  return { years, rank, value, status: (c, y) => stAt(file.series[c], y) };
}
// own latest per country, sorted high to low (#25 Gini ×100, #11 fertility)
export function ownLatest(file, scale = 1) {
  return ORDER.map((c) => { const l = latestOf(file.series[c]); return { code: c, end: l.period, value: l.value === null ? null : l.value * scale }; })
    .sort((a, b) => (a.value === null ? 1 : b.value === null ? -1 : b.value - a.value));
}
// #15 R&D: total = GERD, business = BERD, rest = GERD − BERD, one year at a time
export const RD_YEARS = ["2019", "2020", "2021", "2022", "2023", "2024", "2025"], RD_DEFAULT = "2023";
export function rdStack(gerd, berd, year) {
  const rows = ORDER.map((c) => { const g = at(gerd.series[c], year), b = at(berd.series[c], year);
    return { code: c, total: g, business: g === null || b === null ? null : b, rest: g === null || b === null ? null : g - b, latestYear: Math.min(+latestOf(gerd.series[c]).period, +latestOf(berd.series[c]).period), flag: stAt(gerd.series[c], year) }; });
  return { year: String(year), rows: rows.sort((a, b) => (a.total === null || a.rest === null ? 1 : b.total === null || b.rest === null ? -1 : b.total - a.total)) };
}
// #16 two-file dumbbell: 25–64 vs 25–34 at the latest year both are published (per country), gap in points
export function twoAges(older, younger) {
  return ORDER.map((c) => { const so = older.series[c], sy = younger.series[c];
    let y = null; for (let i = so.periods.length - 1; i >= 0; i--) { const p = so.periods[i]; if (so.values[i] !== null && at(sy, p) !== null) { y = p; break; } }
    const a = y ? at(so, y) : null, b = y ? at(sy, y) : null; return { code: c, end: y, a, b, gap: a === null || b === null ? null : b - a, flag: y ? stAt(sy, y) : null }; })
    .sort((x, z) => (x.gap === null ? 1 : z.gap === null ? -1 : z.gap - x.gap));
}
// #8 scatter: x and y for one year
export function pairs(xf, yf, year) { return ORDER.map((c) => ({ code: c, x: at(xf.series[c], year), y: at(yf.series[c], year), yFlag: stAt(yf.series[c], year) })); }
// #5 connected scatter: trail 1990..last common year, and % change on each axis
export function trails(xf, yf, from = 1990) {
  return ORDER.map((c) => { const xs = xf.series[c], ys = yf.series[c], pts = [];
    for (const p of xs.periods) { if (+p < from) continue; const x = at(xs, p), y = at(ys, p); if (x !== null && y !== null) pts.push({ year: p, x, y }); }
    const a = pts[0], b = pts[pts.length - 1];
    return { code: c, pts, from: a?.year ?? null, to: b?.year ?? null, dx: a && b ? (b.x / a.x - 1) * 100 : null, dy: a && b ? (b.y / a.y - 1) * 100 : null }; });
}
// #14 emissions since 1990. Per person: total ÷ yearly population, yearly population = mean of the four quarters of the
// joined population (estimated "Y" quarters count as present; a year with any quarter that has no value at all is null).
export function yearPop(popJ, code, year) {
  const s = popJ.population[code]; if (!s) return { value: null, est: false };
  const qs = [1, 2, 3, 4].map((q) => `${year}-Q${q}`), vs = qs.map((p) => at(s, p));
  if (vs.some((v) => v === null)) return { value: null, est: false };
  return { value: vs.reduce((a, b) => a + b, 0) / 4, est: qs.some((p) => stAt(s, p) === "Y") };
}
export function emissions(ghg, popJ, mode = "total", from = "1990") {
  return ORDER.map((c) => { const s = ghg.series[c], pts = [];
    for (const p of s.periods) { if (+p < +from) continue; const v = at(s, p); if (v === null) continue;
      if (mode === "total") pts.push({ year: p, value: v, est: false });
      else { const pop = yearPop(popJ, c, p); pts.push({ year: p, value: pop.value === null ? null : v / pop.value, est: pop.est }); } } // thousand t ÷ thousand people = t per person
    const a = pts.find((q) => q.year === from), b = [...pts].reverse().find((q) => q.value !== null);
    return { code: c, pts, end: b?.year ?? null, change: a && b && a.value !== null ? (b.value / a.value - 1) * 100 : null }; });
}
// #9 Ember: six bands bottom to top (Round 4c); a band = sum of its available fuels (n/a never counted as 0);
// a band is n/a only when none of its fuels is published for that year.
export const MIX_BANDS = [["Coal", ["Coal"]], ["Gas", ["Gas"]], ["Other fossil", ["Other Fossil"]], ["Nuclear", ["Nuclear"]], ["Hydro", ["Hydro"]], ["Wind, solar, bioenergy and other renewables", ["Wind", "Solar", "Bioenergy", "Other Renewables"]]];
export function mix(ember, code) {
  const fuels = ember.series[code], years = fuels.Coal.periods;
  return years.map((y) => { const bands = MIX_BANDS.map(([name, fs]) => { const v = fs.map((f) => (fuels[f] ? at(fuels[f], y) : undefined)).filter((x) => x !== null && x !== undefined); return { name, value: v.length ? v.reduce((a, b) => a + b, 0) : null }; });
    const fuelRows = ember.sources.map((f) => ({ name: f, value: fuels[f] ? at(fuels[f], y) : undefined })).filter((r) => r.value !== undefined);
    return { year: y, bands, fuels: fuelRows }; });
}
// #9 stats box sub-line: only the multi-source band (renewables) gets one, listing each source's own value
// (1 dp, like the band). null = "n/a"; a source with no series for that country (CAN, JPN "Other Renewables") is left out.
export const MIX_SHORT = { "Other Renewables": "Other renewables" };
export function bandParts(row, k) {
  const fs = MIX_BANDS[k][1]; if (fs.length < 2) return null;
  return fs.map((f) => row.fuels.find((r) => r.name === f)).filter(Boolean).map((r) => `${MIX_SHORT[r.name] ?? r.name} ${r.value === null ? "n/a" : `${r.value.toFixed(1)}%`}`).join(" · ");
}
