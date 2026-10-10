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
export const WINDOWS = [1, 5, 10, 20, 50];
// Flagged by Data Platform Lead: OECD shows unusually large US January changes; cause not confirmed.
// Every window (50Y included) uses one rule: the start is the same month exactly N years before the end month
// (monthly: Aug 2026 end -> Jun–Aug 1976 3-month average, labelled Aug 1976; quarterly: Q3 1976 – Q2 2026).
export const winStart = (monthEndIdx, years) => monthEndIdx - years * 12;
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
  const mv = Object.values(data.monthly || {});
  const qv = Object.values(data.quarterly || {});
  // monthly-only datasets (policy rates): quarter end follows the shared month
  const q = qv.length ? Math.min(...qv.map((s) => qIdx(s.end))) : qOfMonth(Math.min(...mv.map((s) => mIdx(s.end))));
  // quarterly-only datasets (economy): the window ends on the shared quarter's middle month
  // endRule "latest" (unemployment monthly, prepared): the window ends on the latest month any country has;
  // countries that stop earlier (UK) show as ending early at their own month — the shared end is not pulled back.
  const m = mv.length ? (data.endRule === "latest" ? Math.max : Math.min)(...mv.map((s) => mIdx(s.end))) : qMid(q);
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
  if (data.breaks_custom && data.breaks_custom[code]) return data.breaks_custom[code]; // #7 only
  // counts: published by year (drawn mid-year); rate: status "B" on the quarter itself
  if (data.breaks_by_year) return (data.breaks_by_year[code] || []).map((y) => ({ mi: Number(y) * 12 + 6, label: `Series break · ${y}` }));
  const out = [];
  // yearly-only breaks (e.g. unemployment breaks_annual): drawn mid-year, like the Jobs yearly breaks
  for (const y of (data.breaks_annual && data.breaks_annual[code]) || []) out.push({ mi: Number(y) * 12 + 6, label: `Series break · ${y}` });
  for (const f of ["quarterly", "monthly"]) {
    const s = data[f] && data[f][code]; if (!s) continue;
    // status is either { period: flag } or an array parallel to periods (unemployment file) — map indices to periods
    const ent = Array.isArray(s.status) ? s.status.map((st, i) => [s.periods[i], st]) : Object.entries(s.status || {});
    for (const [p, st] of ent) if (st === "B" && typeof p === "string" && /^\d{4}-(Q[1-4]|\d{2})$/.test(p)) {
      if (p.includes("Q")) { const qi = qIdx(p); out.push({ mi: qMid(qi), label: `Series break · ${p.split("-").reverse().join(" ")}` }); }
      else out.push({ mi: mIdx(p), label: `Series break · ${p}` });
    }
  }
  return out;
}

// Late starters (Cavin 2026-10-10, replaces "left out"): a country whose first reading falls inside the window is
// drawn from that reading (indexed charts rebase it to 100 there) and flagged late: "<period>"; full = data at the
// window start. Headlines rank only full-window countries. A country with no reading in the window at all is
// excluded (nothing drawn). Nulls are never filled.
export function buildLine(data, code, years, mode = "jobs") {
  const l = buildLineRaw(data, code, years, mode);
  const fi = l.points.findIndex((p) => p.value !== null);
  if (fi < 0) return { ...l, excluded: true, late: null, full: false, growth: null, last: null, indexedFrom: null, points: l.points.map((p) => ({ ...p, value: null, raw: null })) };
  const late = fi > 0 ? l.points[fi].period : null;
  return { ...l, excluded: false, late, full: fi === 0 && l.growth !== null };
}
function buildLineRaw(data, code, years, mode) {
  if (mode === "unemp" || mode === "level") return buildRate(data, code, years, mode === "level");
  const { monthEndIdx } = commonEnds(data);
  const anchor = data.rankEnd ? mIdx(data.rankEnd) : monthEndIdx; // jobs: ranking/window on the shared month, lines run on
  const startMi = winStart(anchor, years);
  const breaks = breakList(data, code);
  if (data.monthly[code]) {
    const s = data.monthly[code];
    const months = [];
    for (let mi = startMi; mi <= monthEndIdx; mi++) months.push({ mi, raw: lookup(s, mStr(mi)), avg: avg3(s, mi) });
    const first = months.find((m) => m.avg !== null);
    const base = first ? first.avg : null;
    const ix = (v) => (base && v !== null ? (v / base) * 100 : null);
    const points = months.map((m) => ({ period: mStr(m.mi), mi: m.mi, value: ix(m.avg), raw: ix(m.raw) }));
    // endRule "latest": each line ends at its OWN latest reading (CAN/JPN Aug while the US runs to Sep)
    const last = data.endRule === "latest" ? ([...points].reverse().find((p) => p.value !== null)?.value ?? null) : points[points.length - 1].value;
    return {
      code, freq: "monthly", points, breaks,
      indexedFrom: first && first.mi !== startMi ? mStr(first.mi) : null,
      growth: base === null ? null : monthlyGrowth(data, code, mStr(first.mi), mStr(anchor)),
      last, janJumps: (JAN_JUMPS[code] || []).filter((p) => mIdx(p) >= startMi && mIdx(p) <= monthEndIdx),
    };
  }
  const s = data.quarterly[code];
  const { quarterEndIdx } = commonEnds(data);
  const qs = [];
  for (let qi = qOfMonth(startMi); qi <= quarterEndIdx; qi++) if (qi >= qOfMonth(startMi) && qMid(qi) <= monthEndIdx) qs.push(qi);
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
  const anchor = data.rankEnd ? mIdx(data.rankEnd) : monthEndIdx; // unemployment: window named by the shared ranking month
  return { start: mStr(winStart(anchor, years)), end: mStr(anchor), years };
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
  const all = codes.map((c) => {
    const l = buildLine(data, c, years, mode);
    const lp = [...l.points].reverse().find((p) => p.value !== null);
    // ranked figure is dated at the shared ranking end (e.g. US Aug 2026), never the later line end
    const per = lp && data.rankEnd && /^\d{4}-\d{2}$/.test(lp.period) && lp.period > data.rankEnd ? data.rankEnd : lp ? lp.period : null;
    return { code: c, value: l.growth, period: per, full: l.full };
  });
  // rank only countries with data for the whole window
  const items = all.filter((i) => i.full && i.value !== null);
  const none = (codes.length === 1 && !items.length) || (codes.length > 1 && items.length < 2);
  if (none) return { single: null, fastest: null, slowest: null, none: true, fullCodes: items.map((i) => i.code) };
  const r1 = (v) => Math.round(v * 10) / 10;
  const max = Math.max(...items.map((i) => i.value)), min = Math.min(...items.map((i) => i.value));
  const group = (v) => { const g = items.filter((i) => r1(i.value) === r1(v)); return { codes: g.map((i) => i.code), value: v, periods: [...new Set(g.map((i) => i.period))] }; };
  if (items.length === 1) return { single: group(items[0].value), fastest: null, slowest: null, none: false };
  const f = group(max), s = group(min);
  if (r1(max) === r1(min)) return { single: f, fastest: null, slowest: null, none: false };
  return { single: null, fastest: f, slowest: s, none: false };
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

const rankGrowth = (points, anchor, first) => { const e = points.find((p) => p.mi === anchor); return first && e && e.value !== null ? e.value - first.value : null; };
// Unemployment rate (%): not indexed. Monthly = 3-mo average level; quarterly = quarter level.
// growth = change in percentage points, end − start (first valid plotted value).
function buildRate(data, code, years, level = false) {
  const { monthEndIdx, quarterEndIdx } = commonEnds(data);
  // rankEnd (unemployment long file): the window and the ranked change are anchored on the shared month (Aug 2026);
  // lines still draw to the latest month any country has (US Sep 2026).
  const anchor = data.rankEnd ? mIdx(data.rankEnd) : monthEndIdx;
  const startMi = winStart(anchor, years);
  const breaks = breakList(data, code);
  let points;
  if (data.monthly[code]) {
    const s = data.monthly[code];
    points = [];
    for (let mi = startMi; mi <= monthEndIdx; mi++) points.push({ period: mStr(mi), mi, value: level ? lookup(s, mStr(mi)) : avg3(s, mi) });
  } else {
    const s = data.quarterly[code];
    points = [];
    for (let qi = qOfMonth(startMi); qi <= quarterEndIdx; qi++) if (qi >= qOfMonth(startMi) && qMid(qi) <= monthEndIdx) points.push({ period: qStr(qi), mi: qMid(qi), value: lookup(s, qStr(qi)) });
  }
  const first = points.find((p) => p.value !== null);
  const lastP = [...points].reverse().find((p) => p.value !== null);
  const last = data.endRule === "latest" && data.rankEnd ? (lastP ? lastP.value : null) : points.length ? points[points.length - 1].value : null;
  return {
    code, freq: data.monthly[code] ? "monthly" : "quarterly", points, breaks, last, janJumps: (JAN_JUMPS[code] || []).filter((p) => mIdx(p) >= startMi && mIdx(p) <= monthEndIdx),
    indexedFrom: null, growth: data.rankEnd ? rankGrowth(points, anchor, first) : first && lastP && (last !== null || (data.endRule === "latest" && (data.earlyEndRule ?? EARLY_END_RULE) === "own-end")) ? lastP.value - first.value : null,
  };
}

// Headline labels + display, decided from the ROUNDED figure that is shown (same rounding as the UI).
// rate: 1 dp in pts; jobs: 2 dp in %. Lowest: "Biggest drop" if shown min < 0, else "Smallest gain".
// Highest: "Fastest gain", or "Smallest drop" if shown max < 0. Jobs: Fastest/Slowest growth.
// Display rounding config (pending Design confirmation): percent-change figures 1 dp with "%", point changes 2 dp in "pts".
// Only the display rounds; the golden test compares full precision. Labels ("No change", rise/fall) use the displayed figure.
export const DISPLAY_DP = { pct: 1, pts: 2, rate: 2, share: 1 } // Round 4c: growth 1 dp; point changes 2; rates in percent 2; shares of GDP/income 1;
export const isPts = (mode) => mode === "unemp" || mode === "level" || mode === "rate";
export const headlineDp = (mode) => DISPLAY_DP[isPts(mode) ? "pts" : "pct"];
export function roundShown(v, mode) { const f = 10 ** headlineDp(mode); const r = Math.round(v * f) / f; return r === 0 ? 0 : r; }
export function fmtHeadline(v, mode) { const r = roundShown(v, mode); return `${r > 0 ? "+" : r < 0 ? "−" : ""}${Math.abs(r).toFixed(headlineDp(mode))}${isPts(mode) ? "" : "%"}`; }
export function headlineLabels(h, mode) {
  if (!h || h.single || !h.fastest || !h.slowest) return { fast: null, slow: null };
  const mx = roundShown(h.fastest.value, mode), mn = roundShown(h.slowest.value, mode);
  const z = (r, lbl) => (r === 0 ? "No change" : lbl); // a figure that rounds to zero reads "No change"
  if (mode === "level") return { fast: z(mx, mx > 0 ? "Biggest rise" : "Smallest fall"), slow: z(mn, mn < 0 ? "Biggest fall" : "Smallest rise") };
  if (mode !== "unemp") return { fast: z(mx, "Fastest growth"), slow: z(mn, "Slowest growth") };
  // unemployment: lower is better. slow = lowest change (shown first), fast = highest change.
  return { slow: z(mn, mn < 0 ? "Biggest fall" : "Smallest rise"), fast: z(mx, mx > 0 ? "Biggest rise" : "Smallest fall"), lowerBetter: true };
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
    if (kind === "pc") for (const [p, st] of Object.entries(econ.population[c].status || {})) if ((st === "P" || st === "Y") && !status[p]) status[p] = st;
    quarterly[c] = { periods: src.periods, values: src.values, status, missing: src.missing || [], end: lastNonNull(src), start: src.start };
  }
  return applyStarts({ kind, monthly: {}, quarterly, data_as_of: econ.data_as_of, source: econ.source });
}
export const qLabel = (p) => p.split("-").reverse().join(" ");
export const statusAt = (data, code, period) => { const s = (data.quarterly && data.quarterly[code]) || (data.monthly && data.monthly[code]); return (s && s.status && s.status[period]) || null; };
// Worked example for a quarterly indexed series: value(end) ÷ value(start) × 100.
export function quarterExample(data, code, years) {
  const l = buildLine(data, code, years, "index");
  if (l.excluded || l.last === null) return null;
  const f = l.points.find((p) => p.value !== null); // late starter: its own first reading
  const a = lookup(data.quarterly[code], f.period), b = lookup(data.quarterly[code], l.points[l.points.length - 1].period);
  if (a === null || b === null) return null;
  return { start: f.period, end: l.points[l.points.length - 1].period, vStart: a, vEnd: b, index: (b / a) * 100, growth: (b / a - 1) * 100 };
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
  if (!ql.length) return { freq: "monthly", start, end, range: `${start} – ${end}`, text: `${start} – ${end} · ${data.kind === "policy" ? "end of month" : "3-month average"}` };
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
export function jobsPerCapitaDataset(jobs0, econ) {
  const jobs = applyStarts(jobs0);
  const popEnd = Math.min(...Object.values(econ.population).map((s) => qIdx(lastNonNull(s))));
  const qEnd = Math.min(popEnd, ...Object.values(jobs.quarterly).map((s) => qIdx(s.end)));
  const mEnd = Math.min(qOfMonthEnd(qEnd), ...Object.values(jobs.monthly).map((s) => mIdx(s.end)));
  const monthly = {}, quarterly = {};
  for (const [c, s] of Object.entries(jobs.monthly)) {
    const pop = econ.population[c], periods = [], values = [];
    const status = {}, prov = {}, pst = pop.status || {}, jst = s.status || {};
    s.periods.forEach((p, i) => { const mi = mIdx(p); if (mi > mEnd) return; const pv = popAtMonth(pop, mi), v = s.values[i];
      { let qa = qOfMonth(mi); if (qMid(qa) > mi) qa -= 1; if (jst[p] === "P" || pst[qStr(qa)] === "P" || (qMid(qa) !== mi && pst[qStr(qa + 1)] === "P")) prov[p] = true; }
      // a month whose interpolated population leans on an annual-derived ("Y") quarter is estimated
      let q0 = qOfMonth(mi); if (qMid(q0) > mi) q0 -= 1; if (pst[qStr(q0)] === "Y" || (qMid(q0) !== mi && pst[qStr(q0 + 1)] === "Y")) status[p] = "Y";
      periods.push(p); values.push(v === null || v === undefined || pv === null ? null : v / pv); });
    monthly[c] = { periods, values, status, prov, missing: (s.missing || []).filter((m) => mIdx(m) <= mEnd), end: mStr(mEnd), start: s.start };
  }
  for (const [c, s] of Object.entries(jobs.quarterly)) {
    const pop = econ.population[c], periods = [], values = [];
    const pcStart = perCapitaStart(c, s); // territory mismatch guard (data-driven)
    const status = {}, prov = {};
    s.periods.forEach((p, i) => { if (qIdx(p) > qEnd) return; const pv = lookup(pop, p), v = pcStart && qIdx(p) < qIdx(pcStart) ? null : s.values[i];
      if ((pop.status || {})[p] === "Y") status[p] = "Y";
      if ((pop.status || {})[p] === "P" || (Array.isArray(s.status) ? null : (s.status || {})[p]) === "P") prov[p] = true; // provisional population or jobs
      periods.push(p); values.push(v === null || v === undefined || pv === null ? null : v / pv); });
    quarterly[c] = { periods, values, status, prov, missing: [], end: qStr(qEnd), start: s.start };
  }
  const wholeEst = Object.fromEntries([...Object.keys(jobs.monthly), ...Object.keys(jobs.quarterly)].map((c) => [c, wholeEstimate(jobs, c)]));
  return { kind: "jobs_pc", wholeEst, monthly, quarterly, breaks_by_year: jobs.breaks_by_year, data_as_of: jobs.data_as_of };
}
const qOfMonthEnd = (qi) => Math.floor(qi / 4) * 12 + (qi % 4) * 3 + 2; // last month of quarter

// #7 policy rates (BIS WS_CBPOL, end of month). National lines to Dec 1998; from Jan 1999 one euro-area line (XM)
// stands for DEU/FRA/ITA, starting with a single break mark. Japan's missing months stay null (gaps).
export const EURO = ["DEU", "FRA", "ITA"];
export function policyDataset(bis) {
  const cut = (s, to) => { const i = s.periods.indexOf(to); const per = s.periods.slice(0, i + 1), val = s.values.slice(0, i + 1); return { periods: per, values: val, end: lastNN(per, val), missing: [] }; };
  const lastNN = (per, val) => { for (let i = val.length - 1; i >= 0; i--) if (val[i] !== null && val[i] !== undefined) return per[i]; return per[per.length - 1]; };
  const monthly = {};
  for (const c of ["CAN", "USA", "JPN", "GBR"]) { const s = bis.series[c]; monthly[c] = { periods: s.periods, values: s.values, end: s.periods[s.periods.length - 1], missing: s.periods.filter((p, i) => s.values[i] === null && p >= s.periods[s.values.findIndex((v) => v !== null)]) }; }
  for (const c of EURO) monthly[c] = { ...cut(bis.series[c], "1998-12"), end: bis.series.XM.periods[bis.series.XM.periods.length - 1] };
  const x = bis.series.XM; monthly.XM = { periods: x.periods, values: x.values, end: x.periods[x.periods.length - 1], missing: [] };
  return { kind: "policy", gapSource: "BIS", monthly, quarterly: {}, noEndLabel: EURO, breaks_custom: { XM: [{ mi: mIdx("1999-01"), label: "Series break · Jan 1999 · euro area replaces national rates" }] }, noLateMark: ["XM"], data_as_of: { snapshot: bis.pulled_at }, source: bis.source };
}

// Population extended to 1976 (Cavin 2026-10-10; Data Lead gate passed): Warehouse joined files. OECD quarterly
// population unchanged wherever published; earlier quarters derived from OECD annual population, status "Y"
// (drawn dashed, tagged "estimated"). No join tick: every join gap is under JOIN_TICK_PCT.
export const JOIN_TICK_PCT = 0.3;
export function econWithJoinedPopulation(econ, popJ, pcJ) {
  return { ...econ, population: popJ.population, gdp_per_capita: pcJ.gdp_per_capita, join_gap_pct: popJ.join_gap_pct };
}
// Is a drawn point built on annual-derived ("Y", estimated) population? Monthly points are 3-month averages,
// so any of the three months counts.
export function estAt(data, code, period) {
  if (data.monthly && data.monthly[code]) { const st = data.monthly[code].status || {}, mi = mIdx(period); return [0, 1, 2].some((k) => st[mStr(mi - k)] === "Y"); }
  const s = data.quarterly && data.quarterly[code]; return !!(s && s.status && s.status[period] === "Y");
}

// ---- Unemployment rate on the OECD monthly series (Cavin approved; WAITING for the Data Lead's gate) ----
// One file for #2 and the Unemployment chart: oecd_unemployment_rate_m_15plus.json. UK, France, Italy from 1983,
// Germany from 1991 (late starters on 50Y). UK ends Jun 2026, others Aug: the shared end stays Aug; the UK ends early.
export const UNEMP_MONTHLY_GATED = true; // Data Lead gate PASS 2026-10-10 (UNEMPLOYMENT-LONG-GATE.md)
// Early enders (decided 2026-10-10): treated like late starters — the headline ranks only countries with data for the
// whole window; an early ender's own figure is in the stats box tagged "to <its last month>". Kept as one switch.
export const EARLY_END_RULE = "exclude";
// c1_unemployment_rate_long.json (Warehouse, from the OECD monthly source; same format as c1_unemployment_rate.json,
// monthly for all seven). Shared ranking month = the latest month most countries share (Aug 2026).
export function unempLongDataset(f) {
  const ends = Object.values(f.monthly).map((s) => s.end || lastNN0(s));
  const cnt = {}; for (const e of ends) cnt[e] = (cnt[e] || 0) + 1;
  const rankEnd = Object.entries(cnt).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1))[0][0];
  // status arrays -> { period: flag } so the stats box can tag Italy 1983–1991 "provisional" (line stays solid)
  const monthly = Object.fromEntries(Object.entries(f.monthly).map(([c, s]) => [c, { ...s, status: Array.isArray(s.status) ? Object.fromEntries(s.status.map((st, i) => [s.periods[i], st]).filter(([, st]) => st)) : s.status || {} }]));
  return { ...f, monthly, kind: "unemp_m", endRule: "latest", rankEnd };
}
const lastNN0 = (s) => { for (let i = s.values.length - 1; i >= 0; i--) if (s.values[i] !== null) return s.periods[i]; return null; };

// An early ender's own figure (Warehouse convention): the change over its OWN N-year window ending at its last month
// (e.g. UK: Jun 2025 -> Jun 2026 for 1Y), same 3-month averaging. Shown in the stats box, never ranked.
export function ownChange(data, code, years) {
  const s = data.monthly && data.monthly[code]; if (!s) return null;
  let e = s.values.length - 1; while (e >= 0 && (s.values[e] === null || s.values[e] === undefined)) e--; if (e < 0) return null;
  const end = mIdx(s.periods[e]), a = avg3(s, end - years * 12), b = avg3(s, end);
  return a === null || b === null ? null : { end: s.periods[e], change: b - a };
}

// Per-capita start override (data-driven): German population is unified territory throughout. If a German jobs series
// were West Germany only before 1991 it would jump ~+20–25% from Q4 1990 to Q1 1991; then per-capita starts 1991-Q1
// (late starter, not ranked on 50Y). Threshold 10%. The current OECD jobs file shows no jump (unified back-cast).
export const TERRITORY_JUMP_PCT = 10;
export function perCapitaStart(code, s) {
  if (code !== "DEU") return null;
  const a = lookup(s, "1990-Q4"), b = lookup(s, "1991-Q1");
  return a !== null && b !== null && Math.abs(b / a - 1) * 100 > TERRITORY_JUMP_PCT ? "1991-Q1" : null;
}

// Whole-series estimate: the source flags EVERY reading of a country's series "E" (e.g. OECD on all 258 German jobs
// quarters). The line stays solid (dashes are only for partial estimates: our Y-flagged population quarters); the
// stats box shows a quiet "OECD estimate" tag on every point, in every view built from that series.
export function wholeEstimate(data, code) {
  if (data.wholeEst && code in data.wholeEst) return data.wholeEst[code];
  const s = (data.quarterly && data.quarterly[code]) || (data.monthly && data.monthly[code]); if (!s) return false;
  const st = s.status || {}, get = (i) => (Array.isArray(st) ? st[i] : st[s.periods[i]]);
  let n = 0; for (let i = 0; i < s.values.length; i++) if (s.values[i] !== null && s.values[i] !== undefined) { n++; if (get(i) !== "E") return false; }
  return n > 0;
}

// Per-country series start (Cavin 2026-10-10): on GDP, GDP per capita, Jobs and Jobs per capita Germany starts at
// Q1 1991; earlier German readings are dropped (n/a), so on 50Y Germany is a late starter ("from 1991", not ranked).
export const SERIES_START = { DEU: "1991-Q1" };
export function applyStarts(ds) {
  const cut = (f) => Object.fromEntries(Object.entries(ds[f] || {}).map(([c, s]) => {
    const st = SERIES_START[c]; if (!st) return [c, s];
    const lim = f === "quarterly" ? st : `${st.slice(0, 4)}-${String((+st.slice(6) - 1) * 3 + 1).padStart(2, "0")}`;
    return [c, { ...s, values: s.values.map((v, i) => (s.periods[i] < lim ? null : v)), start: lim }];
  }));
  const excludedBefore = Object.fromEntries(Object.keys(SERIES_START).filter((c) => (ds.monthly || {})[c] || (ds.quarterly || {})[c]).map((c) => [c, SERIES_START[c]]));
  return { ...ds, monthly: cut("monthly"), quarterly: cut("quarterly"), excludedBefore };
}

// No-data band (Cavin): for a country whose earlier years we EXCLUDED (SERIES_START), when it is selected and the
// window starts before its start. Purely visual: never touches values, glow, headline or stats-box figures.
const NAMES = { CAN: "Canada", USA: "United States", JPN: "Japan", GBR: "UK", DEU: "Germany", FRA: "France", ITA: "Italy" };
export function noDataBands(data, codes, years, mode) {
  const out = [];
  for (const [c, st] of Object.entries(data.excludedBefore || {})) {
    if (!codes.includes(c)) continue;
    const l = buildLine(data, c, years, mode); if (l.excluded || !l.points.length) continue;
    const f = l.points.find((p) => p.value !== null); if (!f || f.period < st || l.points[0].value !== null) continue;
    out.push({ code: c, to: f.mi, period: f.period, label: NO_DATA_BAND_LABEL.replace("{country}", NAMES[c] || c).replace("{year}", st.slice(0, 4)) });
  }
  return out;
}
// Band label wording: one constant (Cavin may change it).
export const NO_DATA_BAND_LABEL = "{country}: no data before {year}";
// Jobs chart dataset: Germany from Q1 1991; US line runs to Sep 2026 but ranking uses the shared Aug 2026 (same rule as unemployment).
export function jobsDataset(raw) {
  const ds = applyStarts(raw), ends = Object.values(ds.monthly).map((s) => s.end), cnt = {};
  for (const e of ends) cnt[e] = (cnt[e] || 0) + 1;
  const rankEnd = Object.entries(cnt).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1))[0][0];
  return { ...ds, endRule: "latest", rankEnd };
}

// Flag tags for one point, in the fixed order: our estimate, OECD estimate, provisional. Each flag only on the periods it covers.
export function flagTags(data, code, period) {
  const s = (data.monthly && data.monthly[code]) || (data.quarterly && data.quarterly[code]); if (!s || !period) return [];
  const st = statusAt(data, code, period);
  const est = estAt(data, code, period), oe = wholeEstimate(data, code) || st === "E", pr = st === "P" || !!(s.prov && s.prov[period]);
  return [est ? "Estimated population" : null, oe ? "OECD estimate" : null, pr ? "provisional" : null].filter(Boolean);
}
