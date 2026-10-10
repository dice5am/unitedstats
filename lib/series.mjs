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
  const m = Math.min(...Object.values(data.monthly).map((s) => mIdx(s.end)));
  const q = Math.min(...Object.values(data.quarterly).map((s) => qIdx(s.end)));
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
export function buildLine(data, code, years) {
  const { monthEndIdx } = commonEnds(data);
  const startMi = monthEndIdx - years * 12;
  const breaks = (data.breaks_by_year[code] || []).map(Number);
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
export function headline(data, code, years) {
  const l = buildLine(data, code, years);
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
