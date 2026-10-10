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
export function comeback(econ, view = "gdp") {
  const ds = econDataset(econ, view === "gdp" ? "gdp" : "pc");
  const end = commonEnds(ds).quarterEnd, b0 = qi("2019-Q1"), e0 = qi(end);
  const panels = ORDER.map((code) => {
    const s = ds.quarterly[code], base = at(s, COMEBACK_BASE);
    const points = [];
    for (let i = b0; i <= e0; i++) { const v = at(s, qs(i)); points.push({ period: qs(i), qi: i, value: v === null || base === null ? null : (v / base) * 100, prov: stAt(s, qs(i)) === "P" }); }
    const back = points.find((p) => p.qi > qi("2020-Q1") && p.value !== null && p.value >= 100) || null;
    const last = points[points.length - 1].value;
    const ol = lastNN(s); // the country's own latest quarter (may be after the shared end)
    return { code, base, points, back: back ? back.period : null, last, own: { period: ol, value: base === null ? null : (at(s, ol) / base) * 100 } };
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
    const ol = lastNN(s), ov = at(s, ol);
    return { code, start: a, end: b, change: a === null || b === null ? null : b - a, est: stAt(s, end) === "E", own: { period: ol, value: ov, change: a === null ? null : ov - a, est: stAt(s, ol) === "E" } };
  }).sort((x, y) => (y.change ?? -Infinity) - (x.change ?? -Infinity));
  return { base: SCORE_BASE, end, rows };
}

// #2 Unemployment heat strip (monthly OECD file, all seven). Columns end at the latest month any country has.
// 1Y = 12 month columns; 5Y = 20 quarter columns; 10Y/20Y = year columns. A quarter/year cell is the mean of its
// months up to the country's latest published month; n/a if any of those months is missing (gaps never filled) or
// if none is published yet. Cells built from fewer months than the period has are "partial" (stated in the stats box).
const mi = (p) => { const [y, m] = p.split("-").map(Number); return y * 12 + m - 1; };
const ms = (i) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monLabel = (p) => `${MON[+p.slice(5) - 1]} ${p.slice(0, 4)}`;
export function heatStrip(um, years) {
  const S = um.series, lastOf = Object.fromEntries(ORDER.map((c) => [c, mi(lastNN(S[c]))]));
  const firstOf = Object.fromEntries(ORDER.map((c) => { const s = S[c]; const i = s.values.findIndex((v) => v !== null && v !== undefined); return [c, mi(s.periods[i])]; }));
  const end = Math.max(...Object.values(lastOf));
  const cols = [];
  if (years === 1) for (let i = end - 11; i <= end; i++) cols.push({ key: ms(i), label: monLabel(ms(i)), months: [ms(i)] });
  else if (years === 5) { const eq = Math.floor(end / 3); for (let q = eq - 19; q <= eq; q++) { const m = []; for (let k = 0; k < 3; k++) m.push(ms(q * 3 + k)); cols.push({ key: `${Math.floor(q / 4)}-Q${(q % 4) + 1}`, label: `Q${(q % 4) + 1} ${Math.floor(q / 4)}`, months: m }); } }
  else { const ey = Math.floor(end / 12); for (let y = ey - years + 1; y <= ey; y++) { const m = []; for (let k = 0; k < 12; k++) m.push(`${y}-${String(k + 1).padStart(2, "0")}`); cols.push({ key: String(y), label: String(y), months: m }); } }
  const rows = ORDER.map((code) => {
    const cells = cols.map((c) => {
      const pub = c.months.filter((p) => mi(p) <= lastOf[code]);
      if (!pub.length) return { v: null, n: 0, of: c.months.length, why: "not yet published" };
      if (mi(c.months[c.months.length - 1]) < firstOf[code]) return { v: null, n: 0, of: c.months.length, why: "before first reading" };
      const v = pub.map((p) => at(S[code], p));
      if (v.some((x) => x === null || x === undefined)) return { v: null, n: pub.length, of: c.months.length, why: "gap" };
      return { v: v.reduce((a, b) => a + b, 0) / v.length, n: pub.length, of: c.months.length, from: pub[0], to: pub[pub.length - 1] };
    });
    return { code, first: ms(firstOf[code]), last: ms(lastOf[code]), lastValue: at(S[code], ms(lastOf[code])), vals: cells.map((x) => x.v), cells };
  });
  const all = rows.flatMap((r) => r.vals).filter((v) => v !== null);
  return { end: ms(end), unit: years === 1 ? "month" : years === 5 ? "quarter" : "year", cols, rows, min: Math.min(...all), max: Math.max(...all) };
}
// 7-step sequential bins between the window's min and max (equal width). Returns 0..6.
export const HEAT_STEPS = 7;
export function heatStep(v, min, max) { if (max <= min) return 0; return Math.min(HEAT_STEPS - 1, Math.floor(((v - min) / (max - min)) * HEAT_STEPS)); }
