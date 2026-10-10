// Round 4 chart maths (shared by every new card type). Pure functions over the raw data files; no UI.
import { COUNTRIES, econDataset, commonEnds, qLabel } from "./series.mjs";

export const qi = (p) => { const [y, q] = p.split("-Q").map(Number); return y * 4 + q - 1; };
export const qs = (i) => `${Math.floor(i / 4)}-Q${(i % 4) + 1}`;
const at = (s, p) => { if (!s) return null; const i = s.periods.indexOf(p); return i < 0 ? null : s.values[i]; };
const lastNN = (s) => { for (let i = s.values.length - 1; i >= 0; i--) if (s.values[i] !== null && s.values[i] !== undefined) return s.periods[i]; return null; };
const stAt = (s, p) => { if (!s || !s.status) return null; if (Array.isArray(s.status)) { const i = s.periods.indexOf(p); return i < 0 ? null : s.status[i]; } return s.status[p] || null; };
export const ORDER = COUNTRIES.map((c) => c.code);

// #1 The comeback race: index = value ÷ value(2019-Q4) × 100, from 2019-Q1 to the shared end quarter.
// "Back" = first quarter after 2020-Q1 at or above 100.
export const COMEBACK_BASE = "2019-Q4";
export function comeback(econ, view = "pc") {
  const ds = econDataset(econ, view === "gdp" ? "gdp" : "pc");
  const end = commonEnds(ds).quarterEnd, b0 = qi("2019-Q1"), e0 = qi(end);
  const panels = ORDER.map((code) => {
    const s = ds.quarterly[code], base = at(s, COMEBACK_BASE);
    const points = [];
    for (let i = b0; i <= e0; i++) { const v = at(s, qs(i)); points.push({ period: qs(i), qi: i, value: v === null || base === null ? null : (v / base) * 100, prov: stAt(s, qs(i)) === "P" }); }
    const back = points.find((p) => p.qi > qi("2020-Q1") && p.value !== null && p.value >= 100) || null;
    const last = points[points.length - 1].value;
    return { code, base, points, back: back ? back.period : null, last };
  });
  const vals = panels.flatMap((p) => p.points.map((q) => q.value)).filter((v) => v !== null);
  return { view, end, base: COMEBACK_BASE, panels, min: Math.min(...vals), max: Math.max(...vals) };
}

// #22 Jobs recovery scorecard: employment rate 15–64, change = shared latest quarter − 2019-Q4, in points.
export const SCORE_BASE = "2019-Q4";
export function scorecard(rate) {
  const end = qs(Math.min(...ORDER.map((c) => qi(lastNN(rate.quarterly[c])))));
  const rows = ORDER.map((code) => {
    const s = rate.quarterly[code], a = at(s, SCORE_BASE), b = at(s, end);
    return { code, start: a, end: b, change: a === null || b === null ? null : b - a, est: stAt(s, end) === "E" };
  }).sort((x, y) => (y.change ?? -Infinity) - (x.change ?? -Infinity));
  return { base: SCORE_BASE, end, rows };
}

// #2 Unemployment heat strip (quarterly, held file). 1Y/5Y = quarter columns; 10Y/20Y = year columns
// (mean of that year's quarters; n/a if any quarter is missing; the current year uses the quarters published so far).
export function heatStrip(un, years) {
  const endQ = Math.min(...ORDER.map((c) => qi(lastNN(un.quarterly[c]))));
  let cols;
  if (years <= 5) {
    cols = []; for (let i = endQ - years * 4 + 1; i <= endQ; i++) cols.push({ key: qs(i), label: qLabel(qs(i)), qs: [qs(i)], partial: false });
  } else {
    const ey = Math.floor(endQ / 4); cols = [];
    for (let y = ey - years + 1; y <= ey; y++) { const n = y === ey ? (endQ % 4) + 1 : 4; const q = []; for (let k = 0; k < n; k++) q.push(`${y}-Q${k + 1}`); cols.push({ key: String(y), label: String(y), qs: q, partial: n < 4 }); }
  }
  const rows = ORDER.map((code) => ({ code, vals: cols.map((c) => { const v = c.qs.map((p) => at(un.quarterly[code], p)); return v.some((x) => x === null) ? null : v.reduce((a, b) => a + b, 0) / v.length; }) }));
  const all = rows.flatMap((r) => r.vals).filter((v) => v !== null);
  return { end: qs(endQ), unit: years <= 5 ? "quarter" : "year", cols, rows, min: Math.min(...all), max: Math.max(...all) };
}
// 7-step sequential bins between the window's min and max (equal width). Returns 0..6.
export const HEAT_STEPS = 7;
export function heatStep(v, min, max) { if (max <= min) return 0; return Math.min(HEAT_STEPS - 1, Math.floor(((v - min) / (max - min)) * HEAT_STEPS)); }
