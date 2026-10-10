// Pure data logic shared by the app and the golden test.
// Windows end on the latest period ALL monthly (resp. quarterly) countries share.

export const COUNTRIES = [
  { code: "CAN", name: "Canada" },
  { code: "USA", name: "United States" },
  { code: "JPN", name: "Japan" },
  { code: "GBR", name: "United Kingdom" },
  { code: "DEU", name: "Germany" },
  { code: "FRA", name: "France" },
  { code: "ITA", name: "Italy" },
];
export const WINDOWS = [1, 5, 10, 20];

const mIdx = (p) => { const [y, m] = p.split("-").map(Number); return y * 12 + (m - 1); };
const mStr = (i) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
const qIdx = (p) => { const [y, q] = p.split("-Q").map(Number); return y * 4 + (q - 1); };
const qStr = (i) => `${Math.floor(i / 4)}-Q${(i % 4) + 1}`;
const qOfMonth = (mi) => Math.floor(mi / 12) * 4 + Math.floor((mi % 12) / 3);

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

// 3-month mean ending at month index; null if any month missing.
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

// Build one country's indexed line for an N-year window.
export function buildLine(data, code, years) {
  const { monthEndIdx, quarterEndIdx } = commonEnds(data);
  const startMi = monthEndIdx - years * 12;
  const breaks = (data.breaks_by_year[code] || []).map(Number);
  if (data.monthly[code]) {
    const s = data.monthly[code];
    const base = avg3(s, startMi);
    const pts = [];
    for (let mi = startMi; mi <= monthEndIdx; mi++) {
      const v = lookup(s, mStr(mi));
      pts.push({ period: mStr(mi), t: mi / 12, value: base && v !== null ? (v / base) * 100 : null });
    }
    const g = base === null ? null : monthlyGrowth(data, code, mStr(startMi), mStr(monthEndIdx));
    return { code, freq: "monthly", base: base !== null, points: pts, growth: g, breaks };
  }
  const s = data.quarterly[code];
  const startQi = qOfMonth(startMi);
  const base = lookup(s, qStr(startQi));
  const pts = [];
  for (let qi = startQi; qi <= quarterEndIdx; qi++) {
    const v = lookup(s, qStr(qi));
    // plot quarter at its middle month
    pts.push({ period: qStr(qi), t: (Math.floor(qi / 4) * 12 + (qi % 4) * 3 + 1) / 12, value: base && v !== null ? (v / base) * 100 : null });
  }
  const last = pts[pts.length - 1].value;
  return { code, freq: "quarterly", base: base !== null, points: pts, growth: base && last !== null ? last - 100 : null, breaks };
}
