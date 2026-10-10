// Finance wave (#13, #10, #6, #20, #19, #21): pure calculations shared by the cards and the golden test.
// Inputs are Warehouse exports in the common { series: { CODE: { periods, values, status } } } shape.
export const ORDER = ["CAN", "USA", "JPN", "GBR", "DEU", "FRA", "ITA"];
const at = (s, p) => { const i = s.periods.indexOf(p); return i < 0 ? null : s.values[i] ?? null; };
export const stOf = (s, i) => (Array.isArray(s.status) ? s.status[i] : (s.status || {})[s.periods[i]]) || null;
export const lastNN = (s) => { for (let i = s.values.length - 1; i >= 0; i--) if (s.values[i] !== null && s.values[i] !== undefined) return i; return -1; };
const firstNN = (s) => s.values.findIndex((v) => v !== null && v !== undefined);

// ---- Dumbbell (#10 debt, #6 house prices vs incomes) ----
// start = a fixed period; end = each country's OWN latest reading (dated). change "pts" = end − start; "pct" = (end ÷ start − 1) × 100.
// Sorted by change, largest first. No start value -> n/a (never filled).
export function dumbbell(file, start, change = "pts") {
  const rows = ORDER.map((code) => {
    const s = file.series[code], li = lastNN(s), a = at(s, start), b = li < 0 ? null : s.values[li];
    const d = a === null || b === null ? null : change === "pct" ? (b / a - 1) * 100 : b - a;
    return { code, start, startValue: a, end: li < 0 ? null : s.periods[li], endValue: b, change: d };
  });
  rows.sort((x, y) => (x.change === null ? 1 : y.change === null ? -1 : y.change - x.change));
  const ends = [...new Set(rows.map((r) => r.end).filter(Boolean))].sort();
  return { rows, start, latest: ends[ends.length - 1], ends };
}

// ---- Small multiples over time (#20 household credit, #19 current account), quarterly ----
// Each panel = one country, its readings from `from` (or its own first reading: a late starter) to its own latest.
// ref: optional reference quarter (2007-Q4) marked on each panel. Shared y-scale, always including 0.
const qi = (p) => { const [y, q] = p.split("-Q").map(Number); return y * 4 + q - 1; };
export const qs = (i) => `${Math.floor(i / 4)}-Q${(i % 4) + 1}`;
export function multiples(file, from, ref = null) {
  const panels = ORDER.map((code) => {
    const s = file.series[code], li = lastNN(s), fi = firstNN(s);
    const f0 = Math.max(qi(from), qi(s.periods[fi])), pts = [];
    for (let q = f0; q <= qi(s.periods[li]); q++) { const p = qs(q), i = s.periods.indexOf(p); pts.push({ period: p, value: i < 0 ? null : s.values[i] ?? null, status: i < 0 ? null : stOf(s, i) }); }
    return { code, points: pts, late: qi(s.periods[fi]) > qi(from) ? s.periods[fi] : null, last: { period: s.periods[li], value: s.values[li], status: stOf(s, li) }, ref: ref ? { period: ref, value: at(s, ref) } : null };
  });
  const vals = panels.flatMap((p) => p.points.map((x) => x.value)).filter((v) => v !== null);
  return { panels, from, to: panels.map((p) => p.last.period).sort().pop(), min: Math.min(0, ...vals), max: Math.max(0, ...vals) };
}
// window start for an N-year quarterly window ending at `endQ` (same quarter N years earlier, like every other chart)
export const winFromQ = (endQ, years) => qs(qi(endQ) - 4 * years);

// ---- Stacked ranked bar (#21 openness): exports + imports, % of GDP, for ONE year ----
// Default 2024 (all seven have it: the default never mixes years). Missing year -> n/a, tagged with the country's own latest year.
export function openness(exp, imp, year) {
  const rows = ORDER.map((code) => {
    const e = at(exp.series[code], String(year)), m = at(imp.series[code], String(year));
    const latestYear = Math.min(+exp.series[code].periods[lastNN(exp.series[code])], +imp.series[code].periods[lastNN(imp.series[code])]);
    return { code, exports: e, imports: m, total: e === null || m === null ? null : e + m, latestYear };
  });
  rows.sort((x, y) => (x.total === null ? 1 : y.total === null ? -1 : y.total - x.total));
  return { year: String(year), rows };
}
export const OPEN_YEARS = ["2025", "2024", "2019", "2010", "2000", "1990"];
export const OPEN_DEFAULT = "2024";

// ---- #13 inflation heatmap: diverging around the 2% target, FIXED bands so a colour means the same in every window ----
// steps 0..6: below 0 | 0–1 | 1–1.5 | 1.5–2.5 (near target) | 2.5–4 | 4–6 | 6 and over
export const CPI_BANDS = [0, 1, 1.5, 2.5, 4, 6];
export const CPI_LABELS = ["Below 0%", "0–1%", "1–1.5%", "1.5–2.5%", "2.5–4%", "4–6%", "6% and over"];
export function cpiStep(v) { let i = 0; while (i < CPI_BANDS.length && v >= CPI_BANDS[i]) i++; return i; }
