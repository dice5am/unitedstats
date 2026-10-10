// Pure data logic shared by the app and the golden test.
// Windows end on the latest period ALL monthly (resp. quarterly) countries share.

export const COUNTRIES = [
  { code: "CAN", name: "Canada", short: "Canada" },
  { code: "USA", name: "United States", short: "US" },
  { code: "JPN", name: "Japan", short: "Japan" },
  { code: "GBR", name: "United Kingdom", short: "UK" },
  { code: "DEU", name: "Germany", short: "Germany" },
  { code: "FRA", name: "France", short: "France" },
  { code: "ITA", name: "Italy", short: "Italy" },
];
export const WINDOWS = [1, 5, 10, 20];
// Flagged by Data Platform Lead: OECD shows unusually large US January changes; cause not confirmed.
export const JAN_JUMPS = { USA: ["2025-01", "2026-01"] };

export const mIdx = (p) => { const [y, m] = p.split("-").map(Number); return y * 12 + (m - 1); };
export const mStr = (i) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
const qIdx = (p) => { const [y, q] = p.split("-Q").map(Number); return y * 4 + (q - 1); };
const qStr = (i) => `${Math.floor(i / 4)}-Q${(i % 4) + 1}`;
const qMid = (qi) => Math.floor(qi / 4) * 12 + (qi % 4) * 3 + 1; // month index of quarter's middle month
export const qOfMonth = (mi) => Math.floor(mi / 12) * 4 + Math.floor((mi % 12) / 3);

function lookup(s, key) {
  const i = s.periods.indexOf(key);
  if (i < 0) return null;
  const v = s.values[i];
  return v === null || v === undefined ? null : v;
}

export function commonEnds(data) {
  const q = Math.min(...Object.values(data.quarterly).map((s) => qIdx(s.end)));
  // quarterly-only datasets (economy): the window ends on the shared quarter's middle month
  const mv = Object.values(data.monthly || {});
  const m = mv.length ? Math.min(...mv.map((s) => mIdx(s.end))) : qMid(q);
  return { monthEnd: mStr(m), quarterEnd: qStr(q), monthEndIdx: m, quarterEndIdx: q };
}

// 3-month trailing mean ending at month index; null if any month missing.
function avg3(s, mi) {
  let t = 0;
  for (let k = 0; k < 3; k++) { const v = lookup(s, mStr(mi - k)); if (v === null) return null; t += v; }
  return t / 3;
}

export function monthlyGrowth(data, code, startMonth, endMonth) {
  const s = data.monthly[code];
  const a = avg3(s, mIdx(startMonth)), b = avg3(s, mIdx(endMonth));
  if (a === null || b === null) return null;
  return (b / a - 1) * 100;
}

// One country's indexed series for an N-year window.
// Monthly: avg = bold 3-mo trailing average, raw = faint monthly; both share the avg base (100 at first valid avg).
// Quarterly: quarters whose mid-month falls in the window; 100 at first valid quarter.
function breakList(data, code) {
  // counts: published by year (drawn mid-year); rate: status "B" on the quarter itself
  if (data.breaks_by_year) return (data.breaks_by_year[code] || []).map((y) => ({ mi: Number(y) * 12 + 6, label: `Series break · ${y}` }));
  const out = [];
  // yearly-only breaks (e.g. unemployment breaks_annual): drawn mid-year, like the Jobs yearly breaks
  for (const y of (data.breaks_annual && data.breaks_annual[code]) || []) out.push({ mi: Number(y) * 12 + 6, label: `Series break · ${y}` });
  for (const f of ["quarterly", "monthly"]) {
    const s = data[f] && data[f][code]; if (!s) continue;
    for (const [p, st] of Object.entries(s.status || {})) if (st === "B") {
      if (p.includes("Q")) { const qi = qIdx(p); out.push({ mi: qMid(qi), label: `Series break · ${p.split("-").reverse().join(" ")}` }); }
      else out.push({ mi: mIdx(p), label: `Series break · ${p}` });
    }
  }
  return out;
}

// Design rule (generic): a country with no data at the window's first period is EXCLUDED from that
// window — no line, no glow, ignored by the headline (growth/last null, excluded: true).
export function buildLine(data, code, years, mode = "jobs") {
  const l = buildLineRaw(data, code, years, mode);
  if (l.points.length && l.points[0].value === null) {
    return { ...l, excluded: true, growth: null, last: null, indexedFrom: null, points: l.points.map((p) => ({ ...p, value: null, raw: null })) };
  }
  return { ...l, excluded: false };
}
function buildLineRaw(data, code, years, mode) {
  if (mode === "unemp") return buildRate(data, code, years);
  const { monthEndIdx } = commonEnds(data);
  const startMi = monthEndIdx - years * 12;
  const breaks = breakList(data, code);
  if (data.monthly[code]) {
    const s = data.monthly[code];
    const months = [];
    for (let mi = startMi; mi <= monthEndIdx; mi++) months.push({ mi, raw: lookup(s, mStr(mi)), avg: avg3(s, mi) });
    const first = months.find((m) => m.avg !== null);
    const base = first ? first.avg : null;
    const ix = (v) => (base && v !== null ? (v / base) * 100 : null);
    const points = months.map((m) => ({ period: mStr(m.mi), mi: m.mi, value: ix(m.avg), raw: ix(m.raw) }));
    const last = points[points.length - 1].value;
    return {
      code, freq: "monthly", points, breaks,
      indexedFrom: first && first.mi !== startMi ? mStr(first.mi) : null,
      growth: base === null ? null : monthlyGrowth(data, code, mStr(first.mi), mStr(monthEndIdx)),
      last, janJumps: (JAN_JUMPS[code] || []).filter((p) => mIdx(p) >= startMi && mIdx(p) <= monthEndIdx),
    };
  }
  const s = data.quarterly[code];
  const { quarterEndIdx } = commonEnds(data);
  const qs = [];
  for (let qi = qOfMonth(startMi); qi <= quarterEndIdx; qi++) if (qMid(qi) >= startMi && qMid(qi) <= monthEndIdx) qs.push(qi);
  const firstQ = qs.find((qi) => lookup(s, qStr(qi)) !== null);
  const base = firstQ === undefined ? null : lookup(s, qStr(firstQ));
  const points = qs.map((qi) => { const v = lookup(s, qStr(qi)); return { period: qStr(qi), mi: qMid(qi), value: base && v !== null ? (v / base) * 100 : null }; });
  const last = points.length ? points[points.length - 1].value : null;
  return {
    code, freq: "quarterly", points, breaks, last, janJumps: [],
    indexedFrom: firstQ !== undefined && firstQ !== qs[0] ? qStr(firstQ) : null,
    growth: last === null ? null : last - 100,
  };
}

// ---- v2 shared helpers (headline, window, worked example, monotone curve) ----
export function windowInfo(data, years) {
  const { monthEndIdx } = commonEnds(data);
  return { start: mStr(monthEndIdx - years * 12), end: mStr(monthEndIdx), years };
}

// Headline figure = the drawn line's end value − 100 (same function as the chart).
export function headline(data, code, years, mode = "jobs") {
  const l = buildLine(data, code, years, mode);
  return l.last === null ? null : l.last - 100;
}

// Raw (un-averaged) level in thousands for tooltip; monthly by month, quarterly by quarter.
export function rawLevel(data, code, period) {
  const s = data.monthly[code] || data.quarterly[code];
  return lookup(s, period);
}

// Worked example: avg(end), avg(start), index, growth for a monthly country.
export function workedExample(data, code, years) {
  const { start, end } = windowInfo(data, years);
  const s = data.monthly[code];
  const a = avg3(s, mIdx(start)), b = avg3(s, mIdx(end));
  if (a === null || b === null) return null;
  return { start, end, avgStart: a, avgEnd: b, index: (b / a) * 100, growth: (b / a - 1) * 100 };
}

// Monotone cubic (Fritsch–Carlson / d3.curveMonotoneX). Input: runs of {x,y} without nulls.
// Returns an SVG path; never overshoots a reading between neighbours.
export function monotoneSegments(pts) {
  const n = pts.length;
  if (n < 2) return [];
  const dx = [], m = [], t = new Array(n);
  for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1].x - pts[i].x; m[i] = (pts[i + 1].y - pts[i].y) / dx[i]; }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t[i] = 0;
    else { const w1 = 2 * dx[i] + dx[i - 1], w2 = dx[i] + 2 * dx[i - 1]; t[i] = (w1 + w2) / (w1 / m[i - 1] + w2 / m[i]); }
  }
  // clamp endpoints (Fritsch–Carlson) so first/last segments also stay monotone
  if (n > 2) {
    if (t[0] * m[0] <= 0) t[0] = 0; else if (Math.abs(t[0]) > 3 * Math.abs(m[0])) t[0] = 3 * m[0];
    if (t[n - 1] * m[n - 2] <= 0) t[n - 1] = 0; else if (Math.abs(t[n - 1]) > 3 * Math.abs(m[n - 2])) t[n - 1] = 3 * m[n - 2];
  }
  const segs = [];
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    segs.push([pts[i], { x: pts[i].x + h, y: pts[i].y + h * t[i] }, { x: pts[i + 1].x - h, y: pts[i + 1].y - h * t[i + 1] }, pts[i + 1]]);
  }
  return segs;
}
export function monotonePath(points) {
  // points: [{x, y|null}] -> path with gaps
  let d = "", run = [];
  const flush = () => {
    if (run.length === 1) d += `M${run[0].x.toFixed(1)},${run[0].y.toFixed(1)}h0`;
    else if (run.length > 1) {
      d += `M${run[0].x.toFixed(1)},${run[0].y.toFixed(1)}`;
      for (const [, c1, c2, p] of monotoneSegments(run)) d += `C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }
    run = [];
  };
  for (const p of points) { if (p.y === null || p.y === undefined) flush(); else run.push(p); }
  flush();
  return d;
}

// Headline: fastest / slowest growth among selected countries, from the same lines the chart draws.
// Ties at one decimal share a figure. One selected country -> single figure.
export function headlinePick(data, codes, years, mode = "jobs") {
  const items = codes.map((c) => {
    const l = buildLine(data, c, years, mode);
    const lp = [...l.points].reverse().find((p) => p.value !== null);
    return { code: c, value: l.growth, period: lp ? lp.period : null };
  }).filter((i) => i.value !== null);
  if (!items.length) return { single: null, fastest: null, slowest: null };
  const r1 = (v) => Math.round(v * 10) / 10;
  const max = Math.max(...items.map((i) => i.value)), min = Math.min(...items.map((i) => i.value));
  const group = (v) => { const g = items.filter((i) => r1(i.value) === r1(v)); return { codes: g.map((i) => i.code), value: v, periods: [...new Set(g.map((i) => i.period))] }; };
  if (items.length === 1) return { single: group(items[0].value), fastest: null, slowest: null };
  const f = group(max), s = group(min);
  if (r1(max) === r1(min)) return { single: f, fastest: null, slowest: null };
  return { single: null, fastest: f, slowest: s };
}

// Glow leader per month: highest selected line, with hysteresis (2 periods or >= 0.05 pts).
// lines: [{code, at(mi) -> value|null}]
export function glowLeaders(series, m0, m1) {
  const out = []; let cur = null, pend = null, pendN = 0;
  for (let mi = m0; mi <= m1; mi++) {
    const vals = series.map((s) => ({ code: s.code, v: s.at(mi) })).filter((x) => x.v !== null).sort((a, b) => b.v - a.v);
    if (!vals.length) { out.push(null); continue; }
    const top = vals[0];
    const curV = cur ? vals.find((x) => x.code === cur) : null;
    if (!curV) { cur = top.code; pend = null; pendN = 0; }
    else if (top.code !== cur) {
      if (top.v - curV.v >= 0.05) { cur = top.code; pend = null; pendN = 0; }
      else { pendN = pend === top.code ? pendN + 1 : 1; pend = top.code; if (pendN >= 2) { cur = top.code; pend = null; pendN = 0; } }
    } else { pend = null; pendN = 0; }
    out.push(cur);
  }
  return out;
}

// Unemployment rate (%): not indexed. Monthly = 3-mo average level; quarterly = quarter level.
// growth = change in percentage points, end − start (first valid plotted value).
function buildRate(data, code, years) {
  const { monthEndIdx, quarterEndIdx } = commonEnds(data);
  const startMi = monthEndIdx - years * 12;
  const breaks = breakList(data, code);
  let points;
  if (data.monthly[code]) {
    const s = data.monthly[code];
    points = [];
    for (let mi = startMi; mi <= monthEndIdx; mi++) points.push({ period: mStr(mi), mi, value: avg3(s, mi) });
  } else {
    const s = data.quarterly[code];
    points = [];
    for (let qi = qOfMonth(startMi); qi <= quarterEndIdx; qi++) if (qMid(qi) >= startMi && qMid(qi) <= monthEndIdx) points.push({ period: qStr(qi), mi: qMid(qi), value: lookup(s, qStr(qi)) });
  }
  const first = points.find((p) => p.value !== null);
  const lastP = [...points].reverse().find((p) => p.value !== null);
  const last = points.length ? points[points.length - 1].value : null;
  return {
    code, freq: data.monthly[code] ? "monthly" : "quarterly", points, breaks, last, janJumps: (JAN_JUMPS[code] || []).filter((p) => mIdx(p) >= startMi && mIdx(p) <= monthEndIdx),
    indexedFrom: null, growth: first && lastP && last !== null ? last - first.value : null,
  };
}

// Headline labels + display, decided from the ROUNDED figure that is shown (same rounding as the UI).
// rate: 1 dp in pts; jobs: 2 dp in %. Lowest: "Biggest drop" if shown min < 0, else "Smallest gain".
// Highest: "Fastest gain", or "Smallest drop" if shown max < 0. Jobs: Fastest/Slowest growth.
export const headlineDp = () => 2;
export function roundShown(v, mode) { const f = 10 ** headlineDp(mode); const r = Math.round(v * f) / f; return r === 0 ? 0 : r; }
export function fmtHeadline(v, mode) { const r = roundShown(v, mode); return `${r > 0 ? "+" : r < 0 ? "−" : ""}${Math.abs(r).toFixed(headlineDp(mode))}`; }
export function headlineLabels(h, mode) {
  if (!h || h.single || !h.fastest || !h.slowest) return { fast: null, slow: null };
  if (mode !== "unemp") return { fast: "Fastest growth", slow: "Slowest growth" };
  // unemployment: lower is better. slow = lowest change (shown first), fast = highest change.
  const mx = roundShown(h.fastest.value, mode), mn = roundShown(h.slowest.value, mode);
  return { slow: mn < 0 ? "Biggest fall" : "Smallest rise", fast: mx > 0 ? "Biggest rise" : "Smallest fall", lowerBetter: true };
}

// ---- Economy (OECD quarterly national accounts) ----
// Adapts econ_gdp_series.json into the same quarterly dataset shape the Labour code uses, so buildLine,
// headlinePick, windowInfo, the chart and the golden test all run unchanged.
// kind "gdp": real GDP (index in app). kind "pc": real GDP ÷ population, as built by the Warehouse.
// status: B break carried from GDP; P provisional if GDP or population is provisional ("as published").
const lastNonNull = (s) => { for (let i = s.values.length - 1; i >= 0; i--) if (s.values[i] !== null) return s.periods[i]; return s.end; };
export function econDataset(econ, kind) {
  const quarterly = {};
  for (const c of Object.keys(econ.gdp)) {
    const src = kind === "pc" ? econ.gdp_per_capita[c] : econ.gdp[c];
    const status = {};
    for (const [p, st] of Object.entries(econ.gdp[c].status || {})) if (st === "B" || st === "P") status[p] = st;
    if (kind === "pc") for (const [p, st] of Object.entries(econ.population[c].status || {})) if (st === "P" && !status[p]) status[p] = st;
    quarterly[c] = { periods: src.periods, values: src.values, status, missing: src.missing || [], end: lastNonNull(src), start: src.start };
  }
  return { kind, monthly: {}, quarterly, data_as_of: econ.data_as_of, source: econ.source };
}
export const qLabel = (p) => p.split("-").reverse().join(" ");
export const statusAt = (data, code, period) => { const s = (data.quarterly && data.quarterly[code]) || (data.monthly && data.monthly[code]); return (s && s.status && s.status[period]) || null; };
// Worked example for a quarterly indexed series: value(end) ÷ value(start) × 100.
export function quarterExample(data, code, years) {
  const l = buildLine(data, code, years, "index");
  if (l.excluded || l.last === null) return null;
  const a = lookup(data.quarterly[code], l.points[0].period), b = lookup(data.quarterly[code], l.points[l.points.length - 1].period);
  return { start: l.points[0].period, end: l.points[l.points.length - 1].period, vStart: a, vEnd: b, index: (b / a) * 100, growth: (b / a - 1) * 100 };
}

// Window label for the countries actually DRAWN (selected, not excluded).
// Quarterly-only -> quarters ("Q3 2006 – Q2 2026 · quarterly"); monthly-only or mixed -> months + "3-month average".
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monthLabel = (p) => { const [y, m] = p.split("-").map(Number); return `${MON[m - 1]} ${y}`; };
export function windowLabel(data, codes, years, mode = "jobs") {
  const drawn = codes.map((c) => buildLine(data, c, years, mode)).filter((l) => !l.excluded && l.points.some((p) => p.value !== null));
  const anyMonthly = Object.keys(data.monthly || {}).length > 0;
  const quarterlyOnly = drawn.length ? drawn.every((l) => l.freq === "quarterly") : !anyMonthly;
  if (quarterlyOnly) {
    const ls = drawn.length ? drawn : codes.map((c) => buildLine(data, c, years, mode));
    const ps = ls.flatMap((l) => l.points.map((p) => p.period)).sort((a, b) => qIdx(a) - qIdx(b));
    const start = qLabel(ps[0]), end = qLabel(ps[ps.length - 1]);
    return { freq: "quarterly", start, end, range: `${start} – ${end}`, text: `${start} – ${end} · quarterly` };
  }
  const w = windowInfo(data, years), start = monthLabel(w.start), end = monthLabel(w.end);
  const ql = drawn.filter((l) => l.freq === "quarterly");
  if (!ql.length) return { freq: "monthly", start, end, range: `${start} – ${end}`, text: `${start} – ${end} · 3-month average` };
  // mixed: name both frequencies so it can't read as all monthly
  const qp = ql.flatMap((l) => l.points.map((p) => p.period)).sort((a, b) => qIdx(a) - qIdx(b));
  const qr = `${qLabel(qp[0])} – ${qLabel(qp[qp.length - 1])}`;
  return { freq: "mixed", start, end, range: `${start} – ${end} (monthly) · ${qr} (quarterly)`, text: `${start} – ${end} · 3-month average (monthly) · ${qr} (quarterly)` };
}

// Default selection: all seven G7 countries. parseOn: "CAN,usa" -> valid codes in fixed order; invalid/empty -> all seven.
export const DEFAULT_ON = COUNTRIES.map((c) => c.code);
export const SHORT_CODE = { CAN: "CA", USA: "US", JPN: "JP", FRA: "FR", GBR: "UK", DEU: "DE", ITA: "IT" };
export function parseOn(str) {
  const want = String(str || "").split(",").map((c) => c.trim().toUpperCase());
  const codes = DEFAULT_ON.filter((c) => want.includes(c));
  return codes.length ? codes : [...DEFAULT_ON];
}

// Rate change in points between two months, each a 3-month trailing average (same maths as the unemployment line).
export function avgChange(data, code, startMonth, endMonth) {
  const s = data.monthly[code]; const a = avg3(s, mIdx(startMonth)), b = avg3(s, mIdx(endMonth));
  return a === null || b === null ? null : b - a;
}

// ---- Jobs per capita: jobs ÷ OECD total population (econ_gdp_series.json) ----
// Quarterly countries: quarter jobs ÷ quarter population. Monthly countries: month jobs ÷ population interpolated in a
// straight line between quarters, each quarterly population placed at its MIDDLE month (Feb, May, Aug, Nov). Months
// outside two known mid-quarter points are null (never extrapolated). Shared end = Q1 2026 / Mar 2026 (France's
// population stops at Q1 2026), so monthly lines stop at Mar 2026. Output has the Jobs dataset shape -> buildLine
// "jobs" maths (3-month average for monthly, index to 100 at window start) runs unchanged.
export function popAtMonth(pop, mi) {
  const qi = (m) => Math.floor(m / 12) * 4 + Math.floor((m % 12) / 3);
  let q0 = qi(mi); if (qMid(q0) > mi) q0 -= 1; const q1 = q0 + 1;
  const a = lookup(pop, qStr(q0)), b = lookup(pop, qStr(q1));
  const m0 = qMid(q0), m1 = qMid(q1);
  if (mi === m0) return a;
  if (a === null || b === null) return null;
  return a + ((b - a) * (mi - m0)) / (m1 - m0);
}
export function jobsPerCapitaDataset(jobs, econ) {
  const popEnd = Math.min(...Object.values(econ.population).map((s) => qIdx(lastNonNull(s))));
  const qEnd = Math.min(popEnd, ...Object.values(jobs.quarterly).map((s) => qIdx(s.end)));
  const mEnd = Math.min(qOfMonthEnd(qEnd), ...Object.values(jobs.monthly).map((s) => mIdx(s.end)));
  const monthly = {}, quarterly = {};
  for (const [c, s] of Object.entries(jobs.monthly)) {
    const pop = econ.population[c], periods = [], values = [];
    s.periods.forEach((p, i) => { const mi = mIdx(p); if (mi > mEnd) return; const pv = popAtMonth(pop, mi), v = s.values[i];
      periods.push(p); values.push(v === null || v === undefined || pv === null ? null : v / pv); });
    monthly[c] = { periods, values, status: {}, missing: (s.missing || []).filter((m) => mIdx(m) <= mEnd), end: mStr(mEnd), start: s.start };
  }
  for (const [c, s] of Object.entries(jobs.quarterly)) {
    const pop = econ.population[c], periods = [], values = [];
    s.periods.forEach((p, i) => { if (qIdx(p) > qEnd) return; const pv = lookup(pop, p), v = s.values[i];
      periods.push(p); values.push(v === null || v === undefined || pv === null ? null : v / pv); });
    quarterly[c] = { periods, values, status: {}, missing: [], end: qStr(qEnd), start: s.start };
  }
  return { kind: "jobs_pc", monthly, quarterly, breaks_by_year: jobs.breaks_by_year, data_as_of: jobs.data_as_of };
}
const qOfMonthEnd = (qi) => Math.floor(qi / 4) * 12 + (qi % 4) * 3 + 2; // last month of quarter
