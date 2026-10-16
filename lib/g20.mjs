// TODO(PM open flags — NOT decided; no wording invented, data drawn as delivered):
//  - Saudi Arabia population jump (affects every per-person view using SAU population)
//  - Euro area label on #6 / #7 / #20 (the "EU" line is the euro area in those sources)
//  - EU debt series cut at 2025 on #10
//  - China GDP index wording
//  - Russia splice markers (no break marks drawn yet)
// G20 sidecar data (Warehouse, data-g20/<same file name>): merges the 13 new areas into a G7 file without touching any
// G7 entry, and builds the per-country citation lines. Shared ends / ranking months stay G7-driven (lib/series.mjs g7v),
// so every locked G7 figure is unchanged; a new country that stops earlier is an early ender at its own latest period.
export const NEW = ["ARG", "AUS", "BRA", "CHN", "IND", "IDN", "MEX", "RUS", "SAU", "ZAF", "KOR", "TUR", "EU"];
const MAPS = ["series", "monthly", "quarterly", "gdp", "population", "gdp_per_capita", "join_gap_pct"];
const lastNN = (s) => { for (let i = s.values.length - 1; i >= 0; i--) if (s.values[i] !== null && s.values[i] !== undefined) return s.periods[i]; return s.periods[s.periods.length - 1]; };
const norm = (s) => (s && Array.isArray(s.values) ? { ...s, end: s.end ?? lastNN(s), missing: s.missing ?? [] } : s);
export function g20(a, b) {
  if (!b) return a;
  const out = { ...a, g20_sources: b.country_sources || {}, g20_nodata: b.areas_without_data || [], ...(b.annual_only ? { annual_only: b.annual_only } : {}) };
  for (const k of MAPS) if (b[k] && typeof b[k] === "object") out[k] = { ...(a[k] || {}), ...Object.fromEntries(Object.entries(b[k]).filter(([c]) => !(a[k] && c in a[k])).map(([c, s]) => [c, k === "join_gap_pct" ? s : norm(s)])) };
  // G7 file in { series } (monthly), sidecar in { monthly, quarterly, annual_only }: monthly areas join series; the
  // quarterly/annual-only areas are kept apart (not drawn on monthly-only charts; listed as deferred)
  if (a.series && !b.series && b.monthly) { out.series = { ...a.series, ...Object.fromEntries(Object.entries(b.monthly).map(([c, s]) => [c, norm(s)])) }; out.g20_nonmonthly = Object.keys({ ...(b.quarterly || {}), ...(b.annual_only || {}) }).filter((c) => !b.monthly[c]); }
  return out;
}
// Present = a series with at least one value, in any of the file's country maps.
export function present(file, code) {
  // annual_only counts as data (PM list: e.g. China unemployment is not "no data"); monthly charts still cannot draw it (deferred)
  return ["series", "monthly", "quarterly", "gdp", "annual_only"].some((k) => { const s = file && file[k] && file[k][code]; return !!(s && Array.isArray(s.values) && s.values.some((v) => v !== null && v !== undefined)); });
}
// Keep only the given codes in every country map (order of the file kept).
export function pickCodes(file, codes) {
  const out = { ...file };
  for (const k of MAPS) if (file[k] && typeof file[k] === "object" && !Array.isArray(file[k])) out[k] = Object.fromEntries(Object.entries(file[k]).filter(([c]) => codes.includes(c) || !/^[A-Z]{2,3}$/.test(c)));
  return out;
}
// One citation line per new country, built the same way for every source record (SOURCES.json / country_sources):
// "<source> · <dataflow or indicator> · <frequency> · <period range>[ · <caveat>]"; composite records cite their parts.
const FREQ = { M: "monthly", Q: "quarterly", A: "annual" };
function recLines(r) {
  if (Array.isArray(r)) return r.flatMap(recLines);
  if (!r || typeof r !== "object") return [];
  if (!r.source) return Object.values(r).filter((v) => v && typeof v === "object" && (v.source || Array.isArray(v))).flatMap(recLines);
  const range = r.period_range ?? [r.monthly_range, r.quarterly_range, r.annual_range].filter(Boolean).join(" + ");
  return [[r.source, r.dataflow ?? r.indicator, FREQ[r.frequency] ?? r.frequency, range, r.caveat].filter(Boolean).join(" · ")];
}
export function citeLines(rec) { return [...new Set(recLines(rec))]; }
