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
