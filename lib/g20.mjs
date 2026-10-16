// TODO(PM open flags — NOT decided; no wording invented, data drawn as delivered):
//  - Saudi Arabia population jump (affects every per-person view using SAU population)
//  - Euro area label on #6 / #7 / #20 (the "EU" line is the euro area in those sources)
//  - EU debt series cut at 2025 on #10
//  - China GDP index wording
// G20 sidecar data (Warehouse, data-g20/<same file name>): merges the 13 new areas into a G7 file without touching any
// G7 entry, and builds the per-country citation lines. Shared ends / ranking months stay G7-driven (lib/series.mjs g7v),
// so every locked G7 figure is unchanged; a new country that stops earlier is an early ender at its own latest period.
export const NEW = ["ARG", "AUS", "BRA", "CHN", "IND", "IDN", "MEX", "RUS", "SAU", "ZAF", "KOR", "TUR", "EU"];
const MAPS = ["series", "monthly", "quarterly", "gdp", "population", "gdp_per_capita", "join_gap_pct"];
const lastNN = (s) => { for (let i = s.values.length - 1; i >= 0; i--) if (s.values[i] !== null && s.values[i] !== undefined) return s.periods[i]; return s.periods[s.periods.length - 1]; };
const norm = (s) => (s && Array.isArray(s.values) ? { ...s, end: s.end ?? lastNN(s), missing: s.missing ?? [] } : s);
const perKind = (p) => (/^\d{4}-\d{2}$/.test(p) ? "M" : /^\d{4}-Q\d$/.test(p) ? "Q" : "A");
// PM 2026-10-16: no projected years anywhere. ILO modelled-estimate series (caveat "includes projections") carry years
// up to 2027: every year from the pull year on is a projection and is dropped (China's 2026 ILO point included).
export function dropProjections(b) {
  const cs = b.country_sources || {}, proj = Object.keys(cs).filter((c) => /projection/i.test(JSON.stringify(cs[c])));
  if (!proj.length) return b;
  const out = { ...b };
  for (const k of ["series", "monthly", "quarterly", "annual_only", "gdp"]) if (b[k]) out[k] = Object.fromEntries(Object.entries(b[k]).map(([c, s]) => {
    if (!proj.includes(c) || !s || !Array.isArray(s.periods)) return [c, s];
    const y0 = +String(cs[c].pulled_at || "").slice(0, 4) || 9999, keep = s.periods.map((p) => +p.slice(0, 4) < y0);
    const f = (arr) => (Array.isArray(arr) ? arr.filter((_, i) => keep[i]) : arr);
    return [c, { ...s, periods: f(s.periods), values: f(s.values), status: f(s.status), end: undefined }];
  }));
  return out;
}
export function g20(a, b) {
  if (!b) return a;
  b = dropProjections(b);
  const out = { ...a, g20_sources: b.country_sources || {}, g20_nodata: b.areas_without_data || [], ...(b.eu_handling ? { g20_eu: b.eu_handling } : {}), ...(b.annual_only ? { annual_only: b.annual_only } : {}) };
  for (const k of MAPS) if (b[k] && typeof b[k] === "object") out[k] = { ...(a[k] || {}), ...Object.fromEntries(Object.entries(b[k]).filter(([c]) => !(a[k] && c in a[k])).map(([c, s]) => [c, k === "join_gap_pct" ? s : norm(s)])) };
  // G7 file in { series } (monthly), sidecar in { monthly, quarterly, annual_only }: monthly areas join series; the
  // quarterly/annual-only areas are kept apart (not drawn on monthly-only charts; listed as deferred)
  if (a.series && !b.series && b.monthly) { out.series = { ...a.series, ...Object.fromEntries(Object.entries(b.monthly).map(([c, s]) => [c, norm(s)])) }; out.g20_nonmonthly = Object.keys({ ...(b.quarterly || {}), ...(b.annual_only || {}) }).filter((c) => !b.monthly[c]); }
  // Russia-style splices (country_sources[c].splice[].from): drawn with the existing series-break tick where the chart has one
  const short = (x) => (/^ILO/i.test(x) ? "ILO" : /^OECD/i.test(x) ? "OECD" : /^World Bank/i.test(x) ? "World Bank" : /^IMF/i.test(x) ? "IMF" : /^BIS/i.test(x) ? "BIS" : String(x || "").split(" ")[0]);
  // Cavin's call: after OECD stops, the series continues with another source's ANNUAL figures (annual_continuation).
  // Kept as g20_ext { CODE: { periods, values, src } } and drawn at their own (annual) frequency.
  const srcShort = (r) => { const u = String((r && (r.url || r.raw_path)) || ""); return /worldbank/i.test(u) ? "World Bank" : /imf/i.test(u) ? "IMF" : /ilo/i.test(u) ? "ILO" : /oecd/i.test(u) ? "OECD" : short(r && r.source); };
  if (b.annual_continuation) out.g20_ext = Object.fromEntries(Object.entries(b.annual_continuation).map(([c, x]) => [c, { periods: x.periods, values: x.values, src: srcShort(x.source) }]));
  // Russia-style splices: label "OECD to 2021-Q3 | IMF from 2021-Q4" (locked format) with the REAL last period before the
  // splice (from the country's own series) and the source on each side (SOURCES.json / country_sources)
  const ownSeries = (c) => [b.series, b.monthly, b.quarterly, b.gdp, b.annual_only].map((m) => m && m[c]).filter((x) => x && Array.isArray(x.values));
  const lastBefore = (c, from) => { let best = null; for (const s of ownSeries(c)) s.periods.forEach((p, i) => { if (s.values[i] !== null && s.values[i] !== undefined && p < from && perKind(p) === perKind(from) && (!best || p > best)) best = p; });
    if (!best) for (const s of ownSeries(c)) s.periods.forEach((p, i) => { if (s.values[i] !== null && s.values[i] !== undefined && p < from && (!best || p > best)) best = p; }); return best; };
  const sp = Object.fromEntries(Object.entries(b.country_sources || {}).map(([c, r]) => [c, (r && Array.isArray(r.splice) ? r.splice : []).map((x) => {
    const froms = String(x.from || "").split(" / ").map((t) => t.trim()).filter(Boolean), before = short(r.source);
    const after = x.see && out.g20_ext && out.g20_ext[c] ? out.g20_ext[c].src : x.source ? srcShort(x) : before;
    const f0 = froms[0], to = f0 ? lastBefore(c, f0) : null;
    return { froms, before, after, label: f0 ? `${before} to ${to ?? "?"} | ${after} from ${f0}` : null };
  }).filter((x) => x.froms.length)]).filter(([, v]) => v.length));
  if (Object.keys(sp).length) out.g20_splice = sp;
  // Locked copy (PM 2026-10-16) for Sources by country, by what the file is
  const notes = {};
  const add = (c, t) => { (notes[c] = notes[c] || []).push(t); };
  if (/euro area/i.test(b.eu_handling || "")) add("EU", `Euro area: ${short(b.source)} publishes the euro area, not the EU27, for this series.`);
  if (b.weo_update_date && b.series && b.series.EU) add("EU", "EU: IMF WEO actuals end 2025; forecasts not shown.");
  if (b.gdp && b.gdp.CHN) add("CHN", "China: OECD publishes China's real GDP as growth rates only. We chain them into an index, so compare growth, not levels.");
  // Warehouse 9eebfdd: Saudi population is World Bank SP.POP.TOTL for the whole series (every population-based file)
  if ((b.population && b.population.SAU) || (b.gdp_per_capita && b.gdp_per_capita.SAU)) add("SAU", "Saudi Arabia: population from World Bank throughout.");
  if (Object.keys(notes).length) out.g20_notes = notes;
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
  for (const k of [...MAPS, "annual_only", "g20_ext"]) if (file[k] && typeof file[k] === "object" && !Array.isArray(file[k])) out[k] = Object.fromEntries(Object.entries(file[k]).filter(([c]) => codes.includes(c) || !/^[A-Z]{2,3}$/.test(c)));
  return out;
}
// One citation line per new country, built the same way for every source record (SOURCES.json / country_sources):
// "<source> · <dataflow or indicator> · <frequency> · <period range>[ · <caveat>]"; composite records cite their parts.
const FREQ = { M: "monthly", Q: "quarterly", A: "annual", "M+Q": "monthly + quarterly" };
function recLines(r) {
  if (Array.isArray(r)) return r.flatMap(recLines);
  if (!r || typeof r !== "object") return [];
  if (!r.source) return Object.values(r).filter((v) => v && typeof v === "object" && (v.source || Array.isArray(v))).flatMap(recLines);
  const range = r.period_range ?? [r.monthly_range, r.quarterly_range, r.annual_range].filter(Boolean).join(" + ");
  return [[r.source, r.dataflow ?? r.indicator, FREQ[r.frequency] ?? r.frequency, range, r.caveat].filter(Boolean).join(" · ")];
}
export function citeLines(rec) { return [...new Set(recLines(rec))]; }

// The frequency a country is DRAWN at on a chart, read from where its series sits and its period format.
const perFreq = (p) => (/^\d{4}-\d{2}$/.test(p) ? "monthly" : /^\d{4}-Q\d$/.test(p) ? "quarterly" : /^\d{4}$/.test(p) ? "annual" : null);
export function freqOf(files, code) {
  for (const f of files) { if (!f) continue;
    for (const k of ["monthly", "series", "gdp", "quarterly", "annual", "annual_only"]) { const s = f[k] && f[k][code]; if (s && Array.isArray(s.periods) && s.values.some((v) => v !== null && v !== undefined)) return perFreq(s.periods[0]) ?? (k.startsWith("annual") ? "annual" : null); } }
  return null;
}

// EU slot label: "Euro area" where the source series for the EU slot is the euro area (eu_handling says so: #6, #7, #20)
export const EURO_AREA_LABEL = "Euro area";
export function euLabel(files) { return files.some((f) => f && /euro area/i.test(f.g20_eu || "")) ? EURO_AREA_LABEL : null; }
