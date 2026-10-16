// Round 4 chart maths (shared by every new card type). Pure functions over the raw data files; no UI.
import { PEER_CODES } from "./series.mjs";
import { COUNTRIES, econDataset, commonEnds, qLabel } from "./series.mjs";

export const qi = (p) => { const [y, q] = p.split("-Q").map(Number); return y * 4 + q - 1; };
export const qs = (i) => `${Math.floor(i / 4)}-Q${(i % 4) + 1}`;
const at = (s, p) => { if (!s) return null; const i = s.periods.indexOf(p); return i < 0 ? null : s.values[i]; };
const lastNN = (s) => { for (let i = s.values.length - 1; i >= 0; i--) if (s.values[i] !== null && s.values[i] !== undefined) return s.periods[i]; return null; };
const stAt = (s, p) => { if (!s || !s.status) return null; if (Array.isArray(s.status)) { const i = s.periods.indexOf(p); return i < 0 ? null : s.status[i]; } return s.status[p] || null; };
export const ORDER = COUNTRIES.map((c) => c.code);
// G20: the G7 in this file's order, then the new areas, keeping only countries every input file carries
export const NEW_AREAS = ["ARG", "AUS", "BRA", "CHN", "IND", "IDN", "MEX", "RUS", "SAU", "ZAF", "KOR", "TUR", "EU"];
const codes = (...fs) => [...ORDER, ...NEW_AREAS].filter((c) => fs.every((f) => f && f.series && f.series[c]));
const keysIn = (m) => [...ORDER, ...NEW_AREAS].filter((c) => m && m[c]);

// #1 The comeback race: index = value ÷ value(2019-Q4) × 100, from 2019-Q1 to the shared end quarter.
// "Back" = first quarter after 2020-Q1 at or above 100.
export const COMEBACK_BASE = "2019-Q4";
export function comeback(econ, view = "gdp") {
  const ds = econDataset(econ, view === "gdp" ? "gdp" : "pc");
  const end = commonEnds(ds).quarterEnd, b0 = qi("2019-Q1"), e0 = qi(end);
  const panels = keysIn(ds.quarterly).map((code) => {
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
  const end = qs(Math.min(...ORDER.filter((c) => rate.quarterly[c]).map((c) => qi(lastNN(rate.quarterly[c]))))); // shared end: G7 only
  const rows = keysIn(rate.quarterly).map((code) => {
    const s = rate.quarterly[code], a = at(s, SCORE_BASE), b = at(s, end);
    const ol = lastNN(s), ov = at(s, ol);
    return { code, freq: "quarterly", start: a, end: b, change: a === null || b === null ? null : b - a, est: stAt(s, end) === "E", own: { period: ol, value: ov, change: a === null ? null : ov - a, est: stAt(s, ol) === "E" } };
  }).concat(keysIn(rate.annual_only || {}).filter((c) => !rate.quarterly[c]).map((code) => {
    // G20 annual-only (China): drawn at its own frequency, 2019 -> its latest year, tagged "annual"
    const s = rate.annual_only[code], a = at(s, SCORE_BASE.slice(0, 4)), ol = lastNN(s), ov = ol ? at(s, ol) : null;
    return { code, freq: "annual", start: a, end: ov, change: a === null || ov === null ? null : ov - a, est: false, own: { period: ol, value: ov, change: a === null || ov === null ? null : ov - a, est: false } };
  })).sort((x, y) => (y.change ?? -Infinity) - (x.change ?? -Infinity));
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
  const S = um.series, HK = keysIn(S).filter((c) => /^\d{4}-\d{2}$/.test(S[c].periods[0] || "")), lastOf = Object.fromEntries(HK.map((c) => [c, mi(lastNN(S[c]))]));
  const firstOf = Object.fromEntries(HK.map((c) => { const s = S[c]; const i = s.values.findIndex((v) => v !== null && v !== undefined); return [c, mi(s.periods[i])]; }));
  const end = Math.max(...Object.values(lastOf));
  const cols = [];
  if (years === 1) for (let i = end - 11; i <= end; i++) cols.push({ key: ms(i), label: monLabel(ms(i)), months: [ms(i)] });
  else if (years === 5) { const eq = Math.floor(end / 3); for (let q = eq - 19; q <= eq; q++) { const m = []; for (let k = 0; k < 3; k++) m.push(ms(q * 3 + k)); cols.push({ key: `${Math.floor(q / 4)}-Q${(q % 4) + 1}`, label: `Q${(q % 4) + 1} ${Math.floor(q / 4)}`, months: m }); } }
  else { const ey = Math.floor(end / 12); for (let y = ey - years + 1; y <= ey; y++) { const m = []; for (let k = 0; k < 12; k++) m.push(`${y}-${String(k + 1).padStart(2, "0")}`); cols.push({ key: String(y), label: String(y), months: m }); } }
  const rows = HK.map((code) => {
    const cells = cols.map((c) => {
      const pub = c.months.filter((p) => mi(p) <= lastOf[code]);
      if (!pub.length) return { v: null, n: 0, of: c.months.length, why: "not yet published" };
      if (mi(c.months[c.months.length - 1]) < firstOf[code]) return { v: null, n: 0, of: c.months.length, why: "before first reading" };
      const v = pub.map((p) => at(S[code], p));
      if (v.some((x) => x === null || x === undefined)) return { v: null, n: pub.length, of: c.months.length, why: "gap" };
      return { v: v.reduce((a, b) => a + b, 0) / v.length, n: pub.length, of: c.months.length, from: pub[0], to: pub[pub.length - 1] };
    });
    return { code, freq: "monthly", first: ms(firstOf[code]), last: ms(lastOf[code]), lastValue: at(S[code], ms(lastOf[code])), vals: cells.map((x) => x.v), cells };
  });
  // G20: quarterly-only and annual-only areas drawn at their OWN frequency: a cell takes the value of the quarter/year
  // it falls in (a month column shows its quarter's value), or the mean of the quarters published in a year column.
  const own = (code, s, freq) => {
    const keyOf = (m) => (freq === "annual" ? m.slice(0, 4) : `${m.slice(0, 4)}-Q${Math.floor((+m.slice(5, 7) - 1) / 3) + 1}`);
    const capK = keyOf(ms(end)); // never past the chart's latest month (ILO annual files carry projections)
    const ok = s.periods.filter((p, i) => s.values[i] !== null && s.values[i] !== undefined && p <= capK); if (!ok.length) return null;
    const first = ok[0], last = ok[ok.length - 1];
    const cells = cols.map((c) => {
      const keys = [...new Set(c.months.map(keyOf))], of = freq === "annual" ? keys.length : c.months.length > 3 ? 4 : keys.length;
      const pub = keys.filter((k) => k <= last);
      if (!pub.length) return { v: null, n: 0, of, why: "not yet published", unit: freq };
      if (keys[keys.length - 1] < first) return { v: null, n: 0, of, why: "before first reading", unit: freq };
      // own-frequency rows: mean of the periods actually published in the column (Indonesia publishes two quarters a year);
      // nothing is filled, and the stats box says how many of the column's periods it uses
      const got = pub.filter((k) => { const x = at(s, k); return x !== null && x !== undefined; });
      if (!got.length) return { v: null, n: 0, of, why: "gap", unit: freq };
      return { v: got.reduce((a, k) => a + at(s, k), 0) / got.length, n: got.length, of, from: got[0], to: got[got.length - 1], unit: freq };
    });
    return { code, freq, first, last, lastValue: at(s, last), vals: cells.map((x) => x.v), cells };
  };
  for (const code of PEER_CODES) { if (HK.includes(code)) continue;
    // a non-monthly series inside the monthly map (e.g. Australia's quarterly CPI on #13) is drawn at its own frequency too
    const sp = S[code] && S[code].periods[0]; if (sp && /^\d{4}-Q\d$/.test(sp)) { const r = own(code, S[code], "quarterly"); if (r) rows.push(r); continue; }
    if (sp && /^\d{4}$/.test(sp)) { const r = own(code, S[code], "annual"); if (r) rows.push(r); continue; }
    const q = um.quarterly && um.quarterly[code], a = um.annual_only && um.annual_only[code];
    const r = q ? own(code, q, "quarterly") : a ? own(code, a, "annual") : null; if (r) rows.push(r); }
  rows.sort((x, y) => PEER_CODES.indexOf(x.code) - PEER_CODES.indexOf(y.code));
  const all = rows.flatMap((r) => r.vals).filter((v) => v !== null);
  return { end: ms(end), unit: years === 1 ? "month" : years === 5 ? "quarter" : "year", cols, rows, min: Math.min(...all), max: Math.max(...all) };
}
// Period label at any frequency: "Aug 2026" / "Q2 2025" / "2024"
export const perLabel = (p) => (/^\d{4}-\d{2}$/.test(p) ? monLabel(p) : /^\d{4}-Q\d$/.test(p) ? `${p.slice(5)} ${p.slice(0, 4)}` : p);
// 7-step sequential bins between the window's min and max (equal width). Returns 0..6.
export const HEAT_STEPS = 7;
export function heatStep(v, min, max) { if (max <= min) return 0; return Math.min(HEAT_STEPS - 1, Math.floor(((v - min) / (max - min)) * HEAT_STEPS)); }
