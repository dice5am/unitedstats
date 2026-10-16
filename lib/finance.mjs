// Finance wave (#13, #10, #6, #20, #19, #21): pure calculations shared by the cards and the golden test.
// Inputs are Warehouse exports in the common { series: { CODE: { periods, values, status } } } shape.
export const ORDER = ["CAN", "USA", "JPN", "GBR", "DEU", "FRA", "ITA"];
// G20: the G7 in this file's order, then the new areas, keeping only countries every input file carries
export const NEW_AREAS = ["ARG", "AUS", "BRA", "CHN", "IND", "IDN", "MEX", "RUS", "SAU", "ZAF", "KOR", "TUR", "EU"];
const codes = (...fs) => [...ORDER, ...NEW_AREAS].filter((c) => fs.every((f) => f && f.series && f.series[c]));
const keysIn = (m) => [...ORDER, ...NEW_AREAS].filter((c) => m && m[c]);
const at = (s, p) => { const i = s.periods.indexOf(p); return i < 0 ? null : s.values[i] ?? null; };
export const stOf = (s, i) => (Array.isArray(s.status) ? s.status[i] : (s.status || {})[s.periods[i]]) || null;
export const lastNN = (s) => { for (let i = s.values.length - 1; i >= 0; i--) if (s.values[i] !== null && s.values[i] !== undefined) return i; return -1; };
const firstNN = (s) => s.values.findIndex((v) => v !== null && v !== undefined);

// ---- Dumbbell (#10 debt, #6 house prices vs incomes) ----
// start = a fixed period; end = each country's OWN latest reading (dated). change "pts" = end − start; "pct" = (end ÷ start − 1) × 100.
// Sorted by change, largest first. No start value -> n/a (never filled).
export function dumbbell(file, start, change = "pts") {
  const rows = codes(file).map((code) => {
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
  const panels = codes(file).map((code) => {
    const s = file.series[code], li = lastNN(s), fi = firstNN(s);
    const f0 = Math.max(qi(from), qi(s.periods[fi])), pts = [];
    for (let q = f0; q <= qi(s.periods[li]); q++) { const p = qs(q), i = s.periods.indexOf(p); pts.push({ period: p, value: i < 0 ? null : s.values[i] ?? null, status: i < 0 ? null : stOf(s, i) }); }
    // annual continuation after the quarterly series stops (Russia: IMF from 2022), at its own frequency: one point per
    // year, placed mid-year, only years after the last quarter's year and inside the window
    const X = file.g20_ext && file.g20_ext[code], ly = +s.periods[li].slice(0, 4);
    const ext = X ? X.periods.map((y, i) => ({ period: y, value: X.values[i] ?? null, src: X.src, freq: "annual" })).filter((e) => e.value !== null && +e.period > ly && +e.period * 4 + 3 >= qi(from)) : [];
    // head = the latest DRAWN point whatever its source (PM/Design lock 2026-10-16): the annual extension when there is one
    const lastE = ext.length ? ext[ext.length - 1] : null;
    const head = lastE ? { period: lastE.period, value: lastE.value, src: lastE.src, freq: "annual" } : { period: s.periods[li], value: s.values[li], src: null, freq: "quarterly" };
    return { code, points: pts, ext, head, late: qi(s.periods[fi]) > qi(from) ? s.periods[fi] : null, last: { period: s.periods[li], value: s.values[li], status: stOf(s, li) }, ref: ref ? { period: ref, value: at(s, ref) } : null };
  });
  const vals = panels.flatMap((p) => [...p.points, ...p.ext].map((x) => x.value)).filter((v) => v !== null);
  const toX = [...panels.map((p) => p.last.period), ...panels.flatMap((p) => p.ext.map((e) => `${e.period}-Q4`))].sort().pop();
  return { panels, from, to: panels.map((p) => p.last.period).sort().pop(), toX, min: Math.min(0, ...vals), max: Math.max(0, ...vals) };
}
// window start for an N-year quarterly window ending at `endQ` (same quarter N years earlier, like every other chart)
export const winFromQ = (endQ, years) => qs(qi(endQ) - 4 * years);

// ---- Stacked ranked bar (#21 openness): exports + imports, % of GDP, for ONE year ----
// Default 2024 (all seven have it: the default never mixes years). Missing year -> n/a, tagged with the country's own latest year.
export function openness(exp, imp, year) {
  const rows = codes(exp, imp).map((code) => {
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

// ---- Labour wave (#17, #12, #18, #24): same shared shapes ----
const mIdx = (p) => { const [y, m] = p.split("-").map(Number); return y * 12 + m - 1; };
const mStr = (i) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
// #17: youth (15–24) ÷ overall (15+) unemployment rate, same month, at each country's OWN latest month with both published.
// spark = the ratio for the 60 months to that point (gaps stay null).
export function youthRatio(youth, all, sparkMonths = 60) {
  const rows = codes(youth, all).map((code) => {
    const y = youth.series[code], a = all.series[code];
    let end = null;
    for (let i = y.values.length - 1; i >= 0; i--) { const v = y.values[i], w = at(a, y.periods[i]); if (v !== null && v !== undefined && w !== null && w !== undefined) { end = y.periods[i]; break; } }
    if (!end) return { code, freq: "monthly", end: null, youth: null, all: null, ratio: null, spark: [] };
    const yv = at(y, end), av = at(a, end), spark = [];
    for (let i = mIdx(end) - sparkMonths + 1; i <= mIdx(end); i++) { const p = mStr(i), u = at(y, p), o = at(a, p); spark.push(u === null || o === null || !o ? null : u / o); }
    return { code, freq: "monthly", end, youth: yv, all: av, ratio: yv / av, spark };
  });
  // G20: quarterly-only / annual-only areas at their OWN frequency (same-period ratio; sparkline = last 5 years of their periods)
  // own-frequency periods never run past the chart's latest monthly reading (ILO annual files carry projections to 2027)
  const capY = rows.map((r) => r.end).filter(Boolean).sort().pop()?.slice(0, 4) ?? "9999", capQ = (() => { const e = rows.map((r) => r.end).filter(Boolean).sort().pop(); return e ? `${e.slice(0, 4)}-Q${Math.floor((+e.slice(5, 7) - 1) / 3) + 1}` : "9999"; })();
  for (const code of NEW_AREAS) { if (rows.some((r) => r.code === code)) continue;
    const pair = (k) => (youth[k] && youth[k][code] && all[k] && all[k][code] ? [youth[k][code], all[k][code]] : null);
    const [freq, pr] = pair("quarterly") ? ["quarterly", pair("quarterly")] : pair("annual_only") ? ["annual", pair("annual_only")] : [null, null]; if (!pr) continue;
    const [y, a] = pr, per = y.periods.filter((p) => p <= (freq === "annual" ? capY : capQ)).filter((p) => { const u = at(y, p), o = at(a, p); return u !== null && u !== undefined && o !== null && o !== undefined && o !== 0; });
    if (!per.length) { rows.push({ code, freq, end: null, youth: null, all: null, ratio: null, spark: [] }); continue; }
    const end = per[per.length - 1], n = freq === "annual" ? 5 : 20, ei = y.periods.indexOf(end);
    const spark = y.periods.slice(Math.max(0, ei - n + 1), ei + 1).map((p) => { const u = at(y, p), o = at(a, p); return u === null || u === undefined || o === null || o === undefined || !o ? null : u / o; });
    rows.push({ code, freq, end, youth: at(y, end), all: at(a, end), ratio: at(y, end) / at(a, end), spark });
  }
  rows.sort((x, z) => (x.ratio === null ? 1 : z.ratio === null ? -1 : z.ratio - x.ratio));
  const ends = [...new Set(rows.filter((r) => r.freq === "monthly").map((r) => r.end).filter(Boolean))].sort();
  return { rows, latest: ends[ends.length - 1], ends };
}
// #12 / #24 slope: start year vs each country's own latest (or a fixed end year). growth "pct" = end/start − 1; "pts" = end − start.
export function slope(file, start, change = "pct", endYear = null) {
  const rows = codes(file).map((code) => {
    const s = file.series[code], li = endYear ? s.periods.indexOf(String(endYear)) : lastNN(s);
    const a = at(s, String(start)), b = li < 0 ? null : s.values[li] ?? null;
    return { code, start: String(start), startValue: a, end: li < 0 ? null : s.periods[li], endValue: b, change: a === null || b === null ? null : change === "pct" ? (b / a - 1) * 100 : b - a, status: li < 0 ? null : stOf(s, li) };
  });
  return { rows: [...rows].sort((x, z) => (x.change === null ? 1 : z.change === null ? -1 : z.change - x.change)), start: String(start), ends: [...new Set(rows.map((r) => r.end).filter(Boolean))].sort() };
}
// #18 diverging ranked bar: latest − start (and %); sorted largest first.
export function changeSince(file, start) {
  const s0 = slope(file, start, "pts");
  return { ...s0, rows: s0.rows.map((r) => ({ ...r, pct: r.startValue && r.endValue !== null ? (r.endValue / r.startValue - 1) * 100 : null })) };
}
// whole-series flag (e.g. ILO "I" imputation on every US year): tag in the stats box, line stays solid (Cavin's rule)
export function wholeFlag(file, code) { const s = file.series[code]; const f = s.values.map((v, i) => (v === null ? undefined : stOf(s, i))).filter((x) => x !== undefined); return f.length && f.every((x) => x && x === f[0]) ? f[0] : null; }
