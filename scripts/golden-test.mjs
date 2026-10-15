import { writeFileSync as writeFileSync, unlinkSync } from "node:fs";
// Fails the build if the app's default 1-year view disagrees with scripts/golden/c1_golden.json.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { avgChange, glowLeaders, mIdx, mStr, estAt, jobsPerCapitaDataset, buildLine, commonEnds, headline, headlinePick, headlineLabels, roundShown, fmtHeadline, econDataset, monotoneSegments as mseg, windowLabel, DEFAULT_ON, parseOn, monotoneSegments, workedExample } from "../lib/series.mjs";

const raw = readFileSync(new URL("../data/c1_labour_series.json", import.meta.url));
const data = JSON.parse(raw);
const golden = JSON.parse(readFileSync(new URL("./golden/c1_golden.json", import.meta.url)));
const tol = golden.tolerance_pct;
const ends = commonEnds(data);
let fail = 0;
const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); if (!ok) fail++; };
check(ends.monthEnd === "2026-08" && ends.quarterEnd === "2026-Q2", `shared end ${ends.monthEnd} / ${ends.quarterEnd}`);
const ref = golden.cases.find((c) => c.window === "12 months" && c.end_month === ends.monthEnd);
if (!ref) { console.error("no golden case for", ends.monthEnd); process.exit(1); }
for (const code of ["CAN", "USA"]) {
  const line = buildLine(data, code, 1);
  const got = line.growth, want = ref[`${code}_pct`];
  check(got !== null && Math.abs(got - want) <= tol && line.points[0].period === ref.start_month,
    `${code} 1y ${ref.start_month}->${ref.end_month}: app ${got?.toFixed(4)} golden ${want}`);
  // the drawn bold line must start at 100 and end at 100 + golden growth
  check(Math.abs(line.points[0].value - 100) < 1e-9, `${code} bold line starts at 100`);
  check(Math.abs(line.last - 100 - want) <= tol, `${code} bold line ends at ${line.last.toFixed(4)}`);
}
// every series in every window starts at 100 at its first valid point
for (const y of [1, 5, 10, 20]) for (const c of ["CAN","USA","JPN","GBR","DEU","FRA","ITA"]) {
  const l = buildLine(data, c, y); const f = l.points.find((p) => p.value !== null);
  if (!f || Math.abs(f.value - 100) > 1e-9) check(false, `${c} ${y}y first value ${f?.value}`);
}
// US Oct 2025 gap: 3-mo avg must be null Oct-Dec 2025, never averaged over two months
const us = buildLine(data, "USA", 1);
check(["2025-10","2025-11","2025-12"].every((p) => us.points.find((x) => x.period === p).value === null), "US avg null Oct-Dec 2025");

// v2: headline figures equal the chart's end values on every window, for every country
for (const y of [1, 5, 10, 20]) for (const c of ["CAN","USA","JPN","GBR","DEU","FRA","ITA"]) {
  const l = buildLine(data, c, y), hv = headline(data, c, y);
  if (hv === null || Math.abs(hv - (l.last - 100)) > 1e-12) check(false, `${c} ${y}y headline ${hv} vs line end ${l.last}`);
}
check(Math.abs(headline(data, "CAN", 1) - ref.CAN_pct) <= tol && Math.abs(headline(data, "USA", 1) - ref.USA_pct) <= tol, "1y headline matches golden");
const we = workedExample(data, "CAN", 1);
check(we && Math.abs(we.growth - ref.CAN_pct) <= tol, `worked example CAN 1y growth ${we?.growth.toFixed(4)}`);
// v2: monotone curve never overshoots — sample every bezier segment, every window, every country
let over = 0, segs = 0;
for (const y of [1, 5, 10, 20]) for (const c of ["CAN","USA","JPN","GBR","DEU","FRA","ITA"]) {
  const l = buildLine(data, c, y); let run = [];
  const test = () => { for (const [p0, c1, c2, p3] of monotoneSegments(run)) { segs++;
      const lo = Math.min(p0.y, p3.y) - 1e-9, hi = Math.max(p0.y, p3.y) + 1e-9;
      for (let k = 1; k < 50; k++) { const t = k / 50, u = 1 - t;
        const yy = u*u*u*p0.y + 3*u*u*t*c1.y + 3*u*t*t*c2.y + t*t*t*p3.y; if (yy < lo || yy > hi) { over++; break; } } }
    run = []; };
  for (const p of l.points) { if (p.value === null) test(); else run.push({ x: p.mi, y: p.value }); } test();
}
check(over === 0, `monotone curve: ${segs} segments, ${over} overshoot`);

// v2.1: fastest/slowest headline over every combination of countries, every window
const ALL = ["CAN","USA","JPN","GBR","DEU","FRA","ITA"]; let combos = 0, bad = 0;
for (const y of [1, 5, 10, 20]) {
  const ends = Object.fromEntries(ALL.map((c) => [c, buildLine(data, c, y).last - 100]));
  for (let mask = 1; mask < 128; mask++) {
    const sel = ALL.filter((_, i) => mask & (1 << i)); combos++;
    const h = headlinePick(data, sel, y), vs = sel.map((c) => ends[c]);
    const mx = Math.max(...vs), mn = Math.min(...vs);
    const f = h.single ?? h.fastest, s = h.single ?? h.slowest;
    const r1 = (v) => Math.round(v * 10) / 10;
    const ok = f && s && Math.abs(f.value - mx) < 1e-12 && (h.single ? r1(s.value) === r1(mn) && r1(mx) === r1(mn) || sel.length === 1 : Math.abs(s.value - mn) < 1e-12)
      && f.codes.every((c) => r1(ends[c]) === r1(mx)) && s.codes.every((c) => r1(ends[c]) === r1(s.value))
      && (sel.length > 1 || h.single);
    if (!ok) bad++;
  }
}
check(bad === 0, `headline fastest/slowest: ${combos} combos, ${bad} wrong`);

const POPJ = JSON.parse(readFileSync(new URL("../data/econ_population_joined.json", import.meta.url))), PCJ = JSON.parse(readFileSync(new URL("../data/econ_gdp_per_capita_joined.json", import.meta.url)));
function JPd() { return jobsPerCapitaDataset(data, POPJ); }
// v11: Unemployment rate (OECD UNE_LF, 15+, SA) — recomputed independently from the raw file
const uraw = readFileSync(new URL("./golden/c1_unemployment_rate.json", import.meta.url));
const un = JSON.parse(uraw);
const G3 = JSON.parse(readFileSync(new URL("./golden/golden_round3.json", import.meta.url)));
const rv = (code, p) => { const s = un.monthly[code]; const i = s.periods.indexOf(p); return i < 0 ? null : s.values[i]; };
const prevM = (p, k) => { const [yy, mm] = p.split("-").map(Number); const t = yy * 12 + mm - 1 - k; return `${Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, "0")}`; };
const a3 = (code, p) => { const v = [0, 1, 2].map((k) => rv(code, prevM(p, k))); return v.some((x) => x === null) ? null : (v[0] + v[1] + v[2]) / 3; };
check(commonEnds(un).monthEnd === "2026-08" && commonEnds(un).quarterEnd === "2026-Q2", "unemployment: shared end Aug 2026 / Q2 2026");
// OECD golden values (pts) are 3-month-average changes: e.g. CAN 12m to Aug 2026 single-month = −0.70, 3-mo avg = −0.533 (golden −0.53)
for (const c of ["CAN", "USA"]) for (const [key, want] of Object.entries(G3.unemployment_rate_pts[c])) {
  const m = /^(\d+)(m|y)_to_(\d{4}-\d{2})$/.exec(key); const months = m[2] === "y" ? +m[1] * 12 : +m[1], end = m[3];
  const indep = a3(c, end) - a3(c, prevM(end, months)), lib = avgChange(un, c, prevM(end, months), end);
  const app = end === "2026-08" ? buildLine(un, c, months / 12, "unemp").growth : lib; // the app's window ends Aug 2026; May uses the same maths
  check(Math.abs(app - want) < 0.01 && Math.abs(app - indep) < 1e-9 && Math.abs(lib - indep) < 1e-9, `unemployment ${c} ${key}: app ${app >= 0 ? "+" : ""}${app.toFixed(3)} pts vs OECD golden ${want >= 0 ? "+" : ""}${want.toFixed(2)} (3-mo avg)`);
}
{ const q = un.quarterly.USA; check(q && q.periods.includes("2025-Q4") && q.values[q.periods.indexOf("2025-Q4")] === null, "unemployment (re-issued file): US quarterly Q4 2025 is an explicit null"); }
// only status "B" makes a break; every break has a real period/position (status may be an array parallel to periods)
{ const want = []; for (const f of ["monthly", "quarterly"]) for (const [c, s2] of Object.entries(un[f])) (s2.status || []).forEach((st, i) => { if (st === "B") want.push(`${c}:${s2.periods[i]}`); });
  const st = new Set(); for (const f of ["monthly", "quarterly"]) for (const s2 of Object.values(un[f])) for (const x of s2.status || []) st.add(String(x));
  let bad = 0; for (const D of [un, data, JPd()]) for (const c of ALL) for (const y of [1, 5, 10, 20]) for (const b of buildLine(D, c, y, D === data ? "jobs" : D === un ? "unemp" : "index").breaks) if (!Number.isFinite(b.mi) || !/· (\d{4}(-\d{2})?|Q[1-4] \d{4})$/.test(b.label)) bad++;
  check(bad === 0 && want.join() === "CAN:1975-12,CAN:1975-Q4", `breaks: only status B creates a marker (statuses in file: ${[...st].join("/")}; B at ${want.join(", ")}); all break positions finite for unemployment, jobs, jobs per capita`); }
const uu = buildLine(un, "USA", 1, "unemp");
check(rv("USA", "2025-10") === null && ["2025-10", "2025-11", "2025-12"].every((p) => uu.points.find((x) => x.period === p).value === null), "unemployment: US Oct 2025 null -> 3-mo avg blank Oct–Dec 2025 (gap, never filled)");
{ const want = Object.entries(un.breaks_annual).flatMap(([c, ys]) => ys.map((y) => `${c}:${y}`)).sort();
  const got = Object.keys(un.breaks_annual).flatMap((c) => buildLine(un, c, 20, "unemp").breaks.filter((b) => /· \d{4}$/.test(b.label)).map((b) => `${c}:${b.label.slice(-4)}`)).sort();
  const in20 = ALL.flatMap((c) => { const l = buildLine(un, c, 20, "unemp"); return l.breaks.filter((b) => b.mi >= l.points[0].mi && b.mi <= l.points[l.points.length - 1].mi).map((b) => `${c}:${b.label.slice(-4)}`); }).sort();
  check(JSON.stringify(got) === JSON.stringify(want) && in20.join() === "DEU:2009,DEU:2010,DEU:2019,FRA:2013,FRA:2020,ITA:2020", `unemployment: breaks_annual carried (${want.length}); inside 20Y window: ${in20.join(" ")}`); }
{ let n = 0, bad = 0, cnt = { "Biggest fall": 0, "Smallest rise": 0, "Biggest rise": 0, "Smallest fall": 0, "No change": 0 };
  for (const y of [1, 5, 10, 20]) { const g = Object.fromEntries(ALL.map((c) => [c, buildLine(un, c, y, "unemp").growth]));
    for (let mask = 1; mask < 128; mask++) { const sel = ALL.filter((_, i) => mask & (1 << i)); n++;
      const h = headlinePick(un, sel, y, "unemp"), lb = headlineLabels(h, "unemp"), vs = sel.map((c) => g[c]);
      const f = h.single ?? h.fastest; if (!f || Math.abs(f.value - Math.max(...vs)) > 1e-12) { bad++; continue; }
      if (h.single) { if (lb.fast !== null) bad++; continue; }
      if (Math.abs(h.slowest.value - Math.min(...vs)) > 1e-12) bad++;
      const mx = roundShown(h.fastest.value, "unemp"), mn = roundShown(h.slowest.value, "unemp");
      if (lb.slow !== (mn === 0 ? "No change" : mn < 0 ? "Biggest fall" : "Smallest rise") || lb.fast !== (mx === 0 ? "No change" : mx > 0 ? "Biggest rise" : "Smallest fall") || !lb.lowerBetter) bad++;
      const sOk = (v, t) => (v > 0 ? t.startsWith("+") : v < 0 ? t.startsWith("−") : !/^[+−]/.test(t));
      if (!sOk(mx, fmtHeadline(h.fastest.value, "unemp")) || !sOk(mn, fmtHeadline(h.slowest.value, "unemp"))) bad++;
      cnt[lb.slow]++; cnt[lb.fast]++; } }
  check(bad === 0, `unemployment headline + labels (lower is better): ${n} combos x windows, ${bad} wrong (${Object.entries(cnt).map(([a2, b2]) => `${a2} ${b2}`).join(", ")})`); }
check(headlineLabels({ single: null, fastest: { value: 0.4 }, slowest: { value: 0.1 } }, "unemp").slow === "Smallest rise" && headlineLabels({ single: null, fastest: { value: -0.1 }, slowest: { value: -0.5 } }, "unemp").fast === "Smallest fall", "unemployment edge cases: all rose -> Smallest rise; all fell -> Smallest fall");
{ const lead = glowLeaders(["CAN", "JPN"].map((c) => { const l = buildLine(un, c, 1, "unemp"); return { code: c, at: (mi) => { const p = l.points.find((q) => q.mi === mi); return p && p.value !== null ? -p.value : null; } }; }), mIdx("2025-08"), mIdx("2026-08"));
  check(lead.every((c) => c === "JPN"), "unemployment glow: lowest line leads (Japan below Canada all year)"); }
{ let ov = 0, segs = 0;
  for (const y of [1, 5, 10, 20]) for (const c of ALL) { const l = buildLine(un, c, y, "unemp"); let run = [];
    const t = () => { for (const [p0, c1, c2, p3] of mseg(run)) { segs++; const lo = Math.min(p0.y, p3.y) - 1e-9, hi = Math.max(p0.y, p3.y) + 1e-9;
      for (let q = 1; q < 50; q++) { const tt = q / 50, u = 1 - tt; const yy = u*u*u*p0.y + 3*u*u*tt*c1.y + 3*u*tt*tt*c2.y + tt*tt*tt*p3.y; if (yy < lo || yy > hi) { ov++; break; } } } run = []; };
    for (const p of l.points) { if (p.value === null) t(); else run.push({ x: p.mi, y: p.value }); } t(); }
  check(ov === 0, `unemployment monotone: ${segs} segments, ${ov} overshoot`); }
// v5: headline labels consistent with the sign of the ROUNDED shown figures (jobs)
{ let n = 0, badL = 0;
  for (const y of [1, 5, 10, 20]) for (let mask = 1; mask < 128; mask++) {
    const sel = ALL.filter((_, i) => mask & (1 << i)); const h = headlinePick(data, sel, y, "jobs"); n++;
    const lb = headlineLabels(h, "jobs");
    if (h.single) { if (lb.fast !== null || lb.slow !== null) badL++; continue; }
    const sOk = (v, t) => (v > 0 ? t.startsWith("+") : v < 0 ? t.startsWith("−") : !/^[+−]/.test(t));
    if (!sOk(roundShown(h.fastest.value, "jobs"), fmtHeadline(h.fastest.value, "jobs")) || !sOk(roundShown(h.slowest.value, "jobs"), fmtHeadline(h.slowest.value, "jobs"))) badL++;
    const want = (v, l) => (roundShown(v, "jobs") === 0 ? "No change" : l); // zero at displayed 1 dp reads "No change"
    if (lb.fast !== want(h.fastest.value, "Fastest growth") || lb.slow !== want(h.slowest.value, "Slowest growth")) badL++;
  }
  check(badL === 0, `jobs headline labels match sign of rounded figures: ${n} combos x windows, ${badL} wrong`); }
// v6: Economy — GDP and GDP per capita (OECD QNA), recomputed independently from the raw file
const eraw = readFileSync(new URL("../data/econ_gdp_series.json", import.meta.url));
const econRaw = JSON.parse(eraw);
const econ = { ...econRaw, population: POPJ.population, gdp_per_capita: PCJ.gdp_per_capita }; // gated joined population (Data Lead pass 2026-10-10)
const EV = { gdp: econDataset(econ, "gdp"), pc: econDataset(econ, "pc") };
check(commonEnds(EV.gdp).quarterEnd === "2026-Q2", `gdp: shared end ${commonEnds(EV.gdp).quarterEnd}`);
check(commonEnds(EV.pc).quarterEnd === "2026-Q1" && (econ.gdp_per_capita.FRA.values[econ.gdp_per_capita.FRA.periods.indexOf("2026-Q2")] ?? null) === null, `per capita: shared end ${commonEnds(EV.pc).quarterEnd} (France Q2 2026 null)`);
const rawQ = (s, p) => { const i = s.periods.indexOf(p); return i < 0 ? null : s.values[i]; };
const qBack = (p, n) => { const [yy, q] = p.split("-Q").map(Number); const t = yy * 4 + q - 1 - n; return `${Math.floor(t / 4)}-Q${t % 4 + 1}`; };
for (const [k, src] of [["gdp", econ.gdp], ["pc", econ.gdp_per_capita]]) {
  let nb = 0, n = 0; const end = commonEnds(EV[k]).quarterEnd;
  for (const y of [1, 5, 10, 20, 50]) for (const c of ALL) {
    const l = buildLine(EV[k], c, y, "index"), st = qBack(end, 4 * y); n++;
    const a = rawQ(src[c], st), b = rawQ(src[c], end);
    if (c === "DEU" && st < "1991-Q1") { if (l.late !== "1991-Q1" || l.full) nb++; continue; } // Germany starts Q1 1991 (Cavin)
    if (l.points[0].period !== st || l.points[l.points.length - 1].period !== end) { nb++; continue; }
    if (a === null) { // late starter: drawn from its own first reading, rebased to 100 there, never ranked
      const f = l.points.find((p) => p.value !== null), fr = f ? rawQ(src[c], f.period) : null;
      if (l.full || (f ? (Math.abs(f.value - 100) > 1e-9 || l.late !== f.period || Math.abs(l.last - (b / fr) * 100) > 1e-9 || l.points.slice(0, l.points.indexOf(f)).some((p) => p.value !== null)) : !l.excluded)) nb++;
      continue; }
    if (Math.abs(l.points[0].value - 100) > 1e-12 || Math.abs(l.last - (b / a) * 100) > 1e-9 || Math.abs(l.growth - ((b / a) * 100 - 100)) > 1e-9) nb++;
  }
  check(nb === 0, `${k}: index starts at 100 and end = raw ratio × 100, ${n} country-windows, ${nb} wrong`);
}
{ let pb = 0, pn = 0;
  for (const c of ALL) { const g = econ.gdp[c], pp = econ.population[c], pc = econ.gdp_per_capita[c];
    pc.periods.forEach((p, i) => { const G = rawQ(g, p), P = rawQ(pp, p), v = pc.values[i]; pn++;
      if (G === null || P === null) { if (v !== null) pb++; } else if (v === null || Math.abs(v - G / P) > 1e-9 * Math.abs(v)) pb++; }); }
  check(pb === 0, `per capita = GDP ÷ population recomputed: ${pn} quarters, ${pb} wrong`); }
check(["gdp", "pc"].every((k) => buildLine(EV[k], "ITA", 20, "index").breaks.some((b) => b.label === "Series break · Q1 2010")), "gdp + per capita: Italy Q1 2010 break carried");
{ const j = buildLine(EV.pc, "JPN", 20, "index"), h = headlinePick(EV.pc, ["JPN"], 20, "index"), h2 = headlinePick(EV.pc, ["CAN", "JPN"], 20, "index");
  // joined population (annual-derived before Q3 2007): Japan now has the whole 20Y window and can rank. Values PENDING Warehouse re-issue (not hard-coded).
  check(j.full && !j.late && h.single && h.single.codes.join() === "JPN" && h2.fastest && h2.slowest, `per capita 20Y: Japan full coverage with joined population (${fmtHeadline(j.growth, "index")}%, PENDING Warehouse re-issue); CAN+JPN ranked`); }
for (const k of ["gdp", "pc"]) {
  let n = 0, bad = 0;
  for (const y of [1, 5, 10, 20, 50]) {
    const g = Object.fromEntries(ALL.map((c) => { const l = buildLine(EV[k], c, y, "index"); return [c, l.full ? l.growth : null]; }));
    for (let mask = 1; mask < 128; mask++) {
      const sel = ALL.filter((_, i) => mask & (1 << i)); n++;
      const h = headlinePick(EV[k], sel, y, "index"), lb = headlineLabels(h, "index");
      const vs = sel.map((c) => g[c]).filter((v) => v !== null);
      if (sel.length > 1 ? vs.length < 2 : !vs.length) { if (!h.none || h.single || h.fastest) bad++; continue; }
      const f = h.single ?? h.fastest;
      if (!f || Math.abs(f.value - Math.max(...vs)) > 1e-12 || f.codes.some((c) => g[c] === null)) { bad++; continue; }
      if (h.slowest && Math.abs(h.slowest.value - Math.min(...vs)) > 1e-12) bad++;
      if (vs.length === 1 && !h.single) bad++;
      if (h.single ? lb.fast !== null : (lb.fast !== "Fastest growth" || lb.slow !== "Slowest growth")) bad++;
      const sOk = (v) => { const r = roundShown(v, "index"), t = fmtHeadline(v, "index"); return r > 0 ? t.startsWith("+") : r < 0 ? t.startsWith("−") : !/^[+−]/.test(t); };
      if (!sOk(f.value) || (h.slowest && !sOk(h.slowest.value))) bad++;
    }
  }
  check(bad === 0, `${k}: headline fastest/slowest + labels, ${n} combos x windows, ${bad} wrong`);
}
{ let ov = 0, segs = 0;
  for (const k of ["gdp", "pc"]) for (const y of [1, 5, 10, 20, 50]) for (const c of ALL) { const l = buildLine(EV[k], c, y, "index"); let run = [];
    const t = () => { for (const [p0, c1, c2, p3] of mseg(run)) { segs++; const lo = Math.min(p0.y, p3.y) - 1e-9, hi = Math.max(p0.y, p3.y) + 1e-9;
      for (let q = 1; q < 50; q++) { const tt = q / 50, u = 1 - tt; const yy = u*u*u*p0.y + 3*u*u*tt*c1.y + 3*u*tt*tt*c2.y + tt*tt*tt*p3.y; if (yy < lo || yy > hi) { ov++; break; } } } run = []; };
    for (const p of l.points) { if (p.value === null) t(); else run.push({ x: p.mi, y: p.value }); } t(); }
  check(ov === 0, `economy monotone: ${segs} segments, ${ov} overshoot`); }
// v10: window label follows the frequencies of the countries actually drawn
{ const a = windowLabel(un, ["ITA"], 20, "unemp"), b = windowLabel(un, ["CAN", "ITA"], 20, "unemp"), c = windowLabel(data, ["CAN", "USA"], 1, "jobs"), d = windowLabel(data, ["GBR", "DEU"], 5, "jobs"), e = windowLabel(EV.pc, ["CAN", "USA"], 20, "index");
  check(a.text === "Q3 2006 – Q2 2026 · quarterly", `window: unemployment 20Y Italy only -> "${a.text}"`);
  check(b.freq === "mixed" && b.text === "Aug 2006 – Aug 2026 · 3-month average (monthly) · Q3 2006 – Q2 2026 (quarterly)", `window: unemployment 20Y Canada + Italy (mixed) -> "${b.text}"`);
  check(c.freq === "monthly" && c.text === "Aug 2025 – Aug 2026 · 3-month average", `window: jobs 1Y CAN+US (monthly) -> "${c.text}"`);
  check(d.freq === "quarterly" && /^Q\d \d{4} – Q2 2026 · quarterly$/.test(d.text), `window: jobs 5Y UK+Germany (quarterly) -> "${d.text}"`);
  check(e.text === "Q1 2006 – Q1 2026 · quarterly", `window: per capita 20Y unchanged -> "${e.text}"`); }
// v10: default selection = all seven; invalid/empty ?on falls back to all seven
check(DEFAULT_ON.join() === "CAN,USA,JPN,GBR,DEU,FRA,ITA" && parseOn("").length === 7 && parseOn(null).length === 7 && parseOn("XYZ,,foo").length === 7
  && parseOn("jpn").join() === "JPN" && parseOn("ita,CAN").join() === "CAN,ITA", "default: all seven G7; invalid/empty on -> all seven; valid codes kept in fixed order");
{ const h = headlinePick(data, DEFAULT_ON, 1), hr = headlinePick(un, DEFAULT_ON, 1, "unemp");
  check(h.fastest && h.slowest && hr.fastest && hr.slowest, `default 1Y headline (all seven): jobs ${h.fastest.codes}/${h.slowest.codes}, unemployment ${hr.fastest.codes}/${hr.slowest.codes}`); }
// v11: Jobs per capita = jobs ÷ OECD total population (Warehouse convention: quarterly population on its middle month,
// straight-line interpolation between; monthly: 3-mo avg of jobs ÷ population at each window end). Recomputed independently.
const JP = JPd();
check(commonEnds(JP).monthEnd === "2026-03" && commonEnds(JP).quarterEnd === "2026-Q1", `jobs per capita: shared end ${commonEnds(JP).monthEnd} / ${commonEnds(JP).quarterEnd} (France population stops Q1 2026)`);
{ const popQ = (c, q) => rawQ(econ.population[c], q);
  const qAt = (yy, mm) => `${yy}-Q${Math.floor((mm - 1) / 3) + 1}`;
  const popM = (c, p) => { // independent: population on mid-quarter months (Feb/May/Aug/Nov), linear in between
    const [yy, mm] = p.split("-").map(Number); const t = yy * 12 + mm - 1; const mids = [];
    for (let d = -6; d <= 6; d++) { const u = t + d, uy = Math.floor(u / 12), um = u % 12 + 1; if ([2, 5, 8, 11].includes(um)) mids.push({ t: u, v: popQ(c, qAt(uy, um)) }); }
    const lo = mids.filter((x) => x.t <= t).pop(), hi = mids.find((x) => x.t >= t);
    if (!lo || !hi || lo.v === null || hi.v === null) return null; return lo.t === hi.t ? lo.v : lo.v + (hi.v - lo.v) * (t - lo.t) / (hi.t - lo.t); };
  const jm = (c, p) => { const s = data.monthly[c]; const i = s.periods.indexOf(p); return i < 0 ? null : s.values[i]; };
  const pcAvg = (c, p) => { const v = [0, 1, 2].map((k) => { const q = prevM(p, k), j = jm(c, q), pp = popM(c, q); return j === null || pp === null ? null : j / pp; }); return v.some((x) => x === null) ? null : (v[0] + v[1] + v[2]) / 3; };
  let nb = 0, n = 0;
  for (const y of [1, 5, 10, 20, 50]) for (const c of ALL) { n++; const l = buildLine(JP, c, y, "index");
    if (data.monthly[c]) { const st = prevM("2026-03", y * 12), a = pcAvg(c, st), b = pcAvg(c, "2026-03");
      if (a === null) { const f = l.points.find((p) => p.value !== null); if (l.full || !f || Math.abs(f.value - 100) > 1e-9 || Math.abs(l.growth - (b / pcAvg(c, f.period) * 100 - 100)) > 1e-9) nb++; continue; }
      if (l.points[0].period !== st || Math.abs(l.points[0].value - 100) > 1e-9 || Math.abs(l.growth - (b / a * 100 - 100)) > 1e-9) nb++; }
    else if (c === "DEU" && l.points[0].period < "1991-Q1") { if (l.late !== "1991-Q1" || l.full) nb++; }
    else { const q0 = l.points[0].period, a = rawQ(data.quarterly[c], q0) / popQ(c, q0), b = rawQ(data.quarterly[c], "2026-Q1") / popQ(c, "2026-Q1");
      if (popQ(c, q0) === null || rawQ(data.quarterly[c], q0) === null) { const f = l.points.find((p) => p.value !== null), a2 = rawQ(data.quarterly[c], f.period) / popQ(c, f.period); if (l.full || Math.abs(f.value - 100) > 1e-9 || Math.abs(l.last - b / a2 * 100) > 1e-9) nb++; continue; }
      if (l.points[l.points.length - 1].period !== "2026-Q1" || Math.abs(l.points[0].value - 100) > 1e-9 || Math.abs(l.last - b / a * 100) > 1e-9) nb++; } }
  check(nb === 0, `jobs per capita: index starts at 100 and end = raw ratio (independent interpolation), ${n} country-windows, ${nb} wrong`);
  for (const [c, byW] of Object.entries(G3.jobs_per_capita_pct)) for (const [wk, want] of Object.entries(byW)) { const y = parseInt(wk), l = buildLine(JP, c, y, "index");
    check(Math.abs(l.growth - want) < 0.001 && l.points[l.points.length - 1].period === "2026-03", `jobs per capita ${y}Y ${c}: app ${l.growth >= 0 ? "+" : ""}${l.growth.toFixed(4)}% vs Warehouse golden ${want >= 0 ? "+" : ""}${want.toFixed(4)}% (to Mar 2026)`); }
  const j20 = buildLine(JP, "JPN", 20, "index");
  check(j20.full && !j20.late && headlinePick(JP, ["JPN"], 20, "index").single, `jobs per capita: Japan full on 20Y with joined population (${fmtHeadline(j20.growth, "index")}%, PENDING Warehouse re-issue)`);
  check(JP.monthly.CAN.periods[JP.monthly.CAN.periods.length - 1] === "2026-03" && Object.values(JP.quarterly).every((s) => s.end === "2026-Q1"), "jobs per capita: monthly lines stop at Mar 2026, quarterly at Q1 2026 (no extrapolation)"); }
// ---- Round 4 Wave 1 cards: recomputed independently from the raw files ----
{ const { comeback, scorecard, heatStrip, heatStep, ORDER } = await import("../lib/charts.mjs");
  const qn = (p) => { const [y, q] = p.split("-Q").map(Number); return y * 4 + q - 1; };
  const qp = (i) => `${Math.floor(i / 4)}-Q${(i % 4) + 1}`;
  const val = (s, p) => { const i = s.periods.indexOf(p); return i < 0 ? null : s.values[i]; };
  check(ORDER.join() === "CAN,USA,JPN,GBR,DEU,FRA,ITA", "r4 structure: fixed G7 row/panel order, Canada first");
  // #1 comeback race
  for (const [view, key, end] of [["pc", "gdp_per_capita", "2026-Q1"], ["gdp", "gdp", "2026-Q2"]]) {
    const c = comeback(econ, view); let bad = 0; const backs = [];
    for (const p of c.panels) { const s = econ[key][p.code], b = val(s, "2019-Q4");
      const e = val(s, end) / b * 100; if (Math.abs(p.last - e) > 1e-9) bad++;
      let back = null; for (let i = qn("2020-Q2"); i <= qn(end); i++) { const v = val(s, qp(i)); if (v !== null && v / b * 100 >= 100) { back = qp(i); break; } }
      if (back !== p.back) bad++; backs.push(`${p.code} ${back}`);
      if (p.points[0].period !== "2019-Q1" || p.points[p.points.length - 1].period !== end || Math.abs(p.points.find((q) => q.period === "2019-Q4").value - 100) > 1e-12) bad++; }
    check(bad === 0 && c.end === end, `comeback ${view}: index(Q4 2019)=100, end ${end} = raw ratio, back-to-100 quarter recomputed for all 7 (${backs.join(", ")})`); }
  // #22 jobs recovery scorecard
  { const rraw = JSON.parse(readFileSync(new URL("../data/c1_employment_rate.json", import.meta.url)));
    const sc = scorecard(rraw); const want = ORDER.map((c) => { const s = rraw.quarterly[c]; return [c, val(s, "2026-Q2") - val(s, "2019-Q4")]; }).sort((a, b) => b[1] - a[1]);
    const ok = sc.end === "2026-Q2" && sc.rows.every((r, i) => r.code === want[i][0] && Math.abs(r.change - want[i][1]) < 1e-9);
    check(ok, `recovery scorecard: Q2 2026 − Q4 2019 (pts), ranked: ${want.map(([c, v]) => `${c} ${v >= 0 ? "+" : ""}${v.toFixed(2)}`).join(", ")}`);
    check(sc.rows.find((r) => r.code === "DEU").est && !sc.rows.find((r) => r.code === "CAN").est, "recovery scorecard: Germany's estimated (E) quarter flagged; others not"); }
  // #2 heat strip (monthly file) — recomputed independently from the raw months
  { const UM = JSON.parse(readFileSync(new URL("../data/oecd_unemployment_rate_m_15plus.json", import.meta.url)));
    const mv = (c, p) => { const s2 = UM.series[c]; const i = s2.periods.indexOf(p); return i < 0 ? null : s2.values[i]; };
    const lastM = (c) => { const s2 = UM.series[c]; for (let i = s2.values.length - 1; i >= 0; i--) if (s2.values[i] !== null) return s2.periods[i]; };
    let bad = 0; const shape = [];
    for (const y of [1, 5, 10, 20]) { const h = heatStrip(UM, y); shape.push(`${y}Y ${h.cols.length} ${h.unit}s`);
      if (h.end !== "2026-09" || h.rows.map((r) => r.code).join() !== ORDER.join()) bad++;
      const wantN = { 1: 12, 5: 20, 10: 10, 20: 20 }[y], wantU = { 1: "month", 5: "quarter", 10: "year", 20: "year" }[y];
      if (h.cols.length !== wantN || h.unit !== wantU) bad++;
      for (const r of h.rows) h.cols.forEach((c, i) => {
        const pub = c.months.filter((p) => p <= lastM(r.code)), v = pub.map((p) => mv(r.code, p));
        const want = !pub.length || v.some((x) => x === null) ? null : v.reduce((a2, b2) => a2 + b2, 0) / v.length;
        if ((want === null) !== (r.vals[i] === null) || (want !== null && Math.abs(want - r.vals[i]) > 1e-9)) bad++;
        if (r.vals[i] !== null) { const st = heatStep(r.vals[i], h.min, h.max); if (st < 0 || st > 6) bad++; } }); }
    check(bad === 0, `heat strip (monthly): every cell recomputed from raw months (${shape.join(", ")}); end Sep 2026; 7 steps within 0–6`);
    const h1 = heatStrip(UM, 1), h20 = heatStrip(UM, 20);
    const us = h1.rows.find((r) => r.code === "USA"), uk = h1.rows.find((r) => r.code === "GBR");
    check(us.vals[h1.cols.findIndex((c) => c.key === "2025-10")] === null && h20.rows.find((r) => r.code === "USA").vals[h20.cols.findIndex((c) => c.key === "2025")] === null, "heat strip: US Oct 2025 n/a (month, and the 2025 year cell), never filled");
    check(uk.vals.slice(-3).every((v) => v === null) && uk.cells.at(-1).why === "not yet published", "heat strip: UK ends Jun 2026 -> Jul–Sep cells n/a (not yet published)");
    check(heatStep(h20.min, h20.min, h20.max) === 0 && heatStep(h20.max, h20.min, h20.max) === 6, `heat strip 20Y: scale ${h20.min.toFixed(2)}–${h20.max.toFixed(2)}% maps to steps 0 and 6`); }
}
// ---- data/MANIFEST.json: every data file listed, sha matches, used by an approved (or live) card, imported by a page ----
{ const { readdirSync } = await import("node:fs");
  const reg_built = (c) => /built: true/.test((readFileSync(new URL("../src/charts/meta.ts", import.meta.url), "utf8").split("\n").find((l) => l.includes(`id: "${c.slice(1)}"`)) || ""));
  const man = JSON.parse(readFileSync(new URL("../data/MANIFEST.json", import.meta.url)));
  const LIVE = ["live:unemp", "live:jobs", "live:jobs-pc", "live:gdp", "live:gdp-pc"];
  const okCard = (id) => LIVE.includes(id) || (/^#(\d+)$/.test(id) && +id.slice(1) >= 1 && +id.slice(1) <= 25);
  const pages = readFileSync(new URL("../src/charts/registry.tsx", import.meta.url), "utf8"); // charts load their data through the registry
  const files = readdirSync(new URL("../data/", import.meta.url)).filter((f) => f !== "MANIFEST.json").sort();
  const probs = [];
  for (const f of files) { const e = man.files[f];
    if (!e) { probs.push(`${f}: not in manifest`); continue; }
    const h = createHash("sha256").update(readFileSync(new URL(`../data/${f}`, import.meta.url))).digest("hex");
    if (h !== e.sha256) probs.push(`${f}: sha ${h.slice(0, 8)} ≠ manifest ${e.sha256.slice(0, 8)}`);
    if (!Array.isArray(e.cards) || !e.cards.length || !e.cards.every(okCard)) probs.push(`${f}: no valid card id`);
    if (!pages.includes(`@/data/${f}`) && !man.files[f].cards.every((c) => c.startsWith("#") && !reg_built(c))) probs.push(`${f}: not loaded by any chart`); }
  for (const f of Object.keys(man.files)) if (!files.includes(f)) probs.push(`${f}: in manifest but missing from data/`);
  // self-test: a changed file (any file, live ones included) must be caught by the sha comparison
  { const f0 = files.find((f) => man.files[f]?.cards.some((c) => c.startsWith("live:")));
    const tampered = createHash("sha256").update(Buffer.concat([readFileSync(new URL(`../data/${f0}`, import.meta.url)), Buffer.from(" ")])).digest("hex");
    check(tampered !== man.files[f0].sha256, `data manifest self-test: a one-byte change to live file ${f0} no longer matches its manifest sha (would fail)`); }
  // registry: every chart's data files are in the manifest; prefixed params never collide between charts
  { const reg = readFileSync(new URL("../src/charts/meta.ts", import.meta.url), "utf8");
    const ids = [...reg.matchAll(/^  "?(\w+)"?: \{ id: "(\w+)"[^\n]*titles: \{([^}]*)\}[^\n]*params: \[([^\]]*)\], data: \[([^\]]*)\]/gm)].map((m) => ({ id: m[2], key: m[1], titles: [...m[3].matchAll(/(\w+): "([^"]+)"/g)].flatMap((x) => [x[1], x[2]]), params: [...m[4].matchAll(/"([^"]+)"/g)].map((x) => x[1]), data: [...m[5].matchAll(/"([^"]+)"/g)].map((x) => x[1]) }));
    const allP = ids.flatMap((x) => x.params), dupe = allP.filter((p, i) => allP.indexOf(p) !== i);
    const prefOk = ids.every((x) => x.params.every((p) => /^[a-z]+_/.test(p)) && new Set(x.params.map((p) => p.split("_")[0])).size <= 1);
    const dataOk = ids.every((x) => x.data.every((f) => man.files[f]));
    const keyOk = ids.every((x) => x.id === x.key) && ["1", "2", "22"].every((n) => ids.some((x) => x.id === n));
    const built = [...reg.matchAll(/^  "?(\w+)"?: { id: "\w+",(?: src: \[[^\]]*\],)? built: true/gm)].map((m) => m[1]);
    const regLoad = readFileSync(new URL("../src/charts/registry.tsx", import.meta.url), "utf8");
    const loadOk = ids.filter((x) => built.includes(x.id)).every((x) => new RegExp(`^  "?${x.id}"?: \\{`, "m").test(regLoad));
    check(built.length === 28 && ids.length === 28 && !dupe.length && prefOk && dataOk && keyOk && loadOk, `chart registry: ${ids.length} charts (${built.length} built: ${built.join(", ")}), ids are link keys (${ids.map((x) => `${x.id}[${x.params.join(",") || "no state"}]`).join(" ")}); params prefixed per chart, no collisions; each has a loader; data files all in manifest`);
    const T = Object.fromEntries(ids.map((x) => [x.id, x.titles]));
    check(T["1"].join("|") === "gdp|Real GDP vs 2019|pc|Real GDP per capita vs 2019" && T["2"].includes("Unemployment rate by month") && T["22"].includes("Employment rate change since 2019")
      && T.gdp.join("|") === "gdp|GDP|pc|GDP per capita" && T.jobs.join("|") === "jobs|Jobs|jpc|Jobs per capita" && T.unemp.includes("Unemployment rate"), "chart titles: plain, per view, total first then per capita"); }
  check(probs.length === 0, `data manifest: ${files.length} files, sha256 match, each used by a card (${files.map((f) => `${f} → ${man.files[f]?.cards.join(" ")}`).join("; ")})${probs.length ? " — " + probs.join("; ") : ""}`); }
// ---- Warehouse independent reference figures (scripts/golden/REFERENCE-FIGURES.md), Wave 1 cards, every country ----
// Cards #1 and #22 use the shared end (latest quarter all seven share); Warehouse uses each country's own latest.
// Both are compared: card figure at the shared end where periods agree, and the card's own-latest figure (stats box)
// where they don't. The shared-end vs own-latest gap itself is printed as EXPECTED (by design), never forced.
{ const { comeback, scorecard, heatStrip } = await import("../lib/charts.mjs");
  const md = readFileSync(new URL("./golden/REFERENCE-FIGURES.md", import.meta.url), "utf8");
  const sect = (n) => { const m = new RegExp(`## Card ${n} [^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`).exec(md); return m[1].split("\n").filter((l) => l.startsWith("- ")).map((l) => { const [c, per, v, note] = l.slice(2).split(" | "); return { c, per, v: +v, note: note || "" }; }); };
  const exp = [], mism = [];
  { const ref = sect(1), cb = comeback(econ, "pc"); let n = 0;
    for (const r of ref) { const p = cb.panels.find((x) => x.code === r.c); const back = /back to 100 at (\d{4}-Q\d)/.exec(r.note)[1];
      if (p.back !== back) mism.push(`#1 ${r.c} back: ours ${p.back} vs Warehouse ${back}`);
      const ours = r.per === cb.end ? p.last : p.own.period === r.per ? p.own.value : null;
      if (ours === null || Math.abs(ours - r.v) > 0.05) mism.push(`#1 ${r.c} ${r.per}: ours ${ours?.toFixed(2)} vs Warehouse ${r.v}`); else n++;
      if (r.per !== cb.end) exp.push(`#1 ${r.c}: card ${p.last.toFixed(1)} at ${cb.end} (shared end); own latest ${p.own.value.toFixed(1)} at ${p.own.period} = Warehouse ${r.v}`); }
    check(mism.filter((x) => x.startsWith("#1")).length === 0, `ref #1 comeback (per person): ${n} of 7 match Warehouse (±0.05) at their period (shared end or the stats box's own latest); back-to-100 quarter matches for all 7`); }
  { const rr = JSON.parse(readFileSync(new URL("../data/c1_employment_rate.json", import.meta.url))), sc = scorecard(rr); let n = 0;
    for (const r of ref22()) { const b = r.per.split("→")[1], row = sc.rows.find((x) => x.code === r.c);
      const ours = b === sc.end ? row.change : row.own.period === b ? row.own.change : null;
      if (ours === null || Math.abs(ours - r.v) > 0.005) mism.push(`#22 ${r.c} ${b}: ours ${ours?.toFixed(3)} vs Warehouse ${r.v}`); else n++;
      if (b !== sc.end) exp.push(`#22 ${r.c}: card ${row.change >= 0 ? "+" : ""}${row.change.toFixed(2)} pts to ${sc.end} (shared end); own latest ${row.own.change >= 0 ? "+" : ""}${row.own.change.toFixed(2)} to ${row.own.period} = Warehouse ${r.v}`); }
    function ref22() { return sect(22); }
    check(mism.filter((x) => x.startsWith("#22")).length === 0, `ref #22 scorecard: ${n} of 7 match Warehouse (±0.005 pts) at their period (shared end or own latest)`); }
  { const UM = JSON.parse(readFileSync(new URL("../data/oecd_unemployment_rate_m_15plus.json", import.meta.url))), h = heatStrip(UM, 1); let n = 0;
    for (const r of sect(2)) { const row = h.rows.find((x) => x.code === r.c), i = h.cols.findIndex((c) => c.key === r.per);
      const ours = i < 0 ? null : row.vals[i];
      if (row.last !== r.per || ours === null || Math.abs(ours - r.v) > 0.05) mism.push(`#2 ${r.c} ${r.per}: ours ${ours} (latest ${row.last}) vs Warehouse ${r.v}`); else n++; }
    check(mism.filter((x) => x.startsWith("#2 ")).length === 0, `ref #2 heat strip (monthly): latest month and value match Warehouse for ${n} of 7 (${sect(2).map((r) => `${r.c} ${r.per} ${r.v}`).join(", ")})`); }
  for (const e of exp) console.log("EXPECTED " + e);
  for (const m of mism) console.log("MISMATCH " + m);
}
// Difference notes: exact text from the Warehouse gate file, for #3 #7 #10 #14 #22 #25; #22 rendered in its card.
{ const { DIFFERENCE_NOTES } = await import("../lib/differenceNotes.mjs");
  const md = readFileSync(new URL("./golden/DIFFERENCE-NOTES.md", import.meta.url), "utf8");
  const want = Object.fromEntries(md.split("\n").map((l) => /^- \*\*#(\d+) [^*]+:\*\* (.+)$/.exec(l)).filter(Boolean).map((m) => [m[1], m[2]]));
  const ids = ["3", "7", "10", "14", "22", "25"];
  const sc = readFileSync(new URL("../src/components/Scorecard.tsx", import.meta.url), "utf8");
  check(ids.every((i) => want[i] && DIFFERENCE_NOTES[i] === want[i]) && Object.keys(DIFFERENCE_NOTES).sort().join() === ids.slice().sort().join() && sc.includes('DIFFERENCE_NOTES["22"]'),
    `difference notes: exact text stored for #${ids.join(", #")}; #22 shown in its How it's calculated`); }
console.log("econ sha256", createHash("sha256").update(eraw).digest("hex"));
console.log("unemployment sha256", createHash("sha256").update(uraw).digest("hex"));
console.log("data sha256", createHash("sha256").update(raw).digest("hex"));
// ---- Round 4b: 50Y on every timeframe switch, late starters, <2 full-coverage headlines, #7 policy rates ----
{ const { policyDataset, WINDOWS, estAt } = await import("../lib/series.mjs");
  const { heatStrip } = await import("../lib/charts.mjs");
  const BIS = JSON.parse(readFileSync(new URL("../data/bis_policy_rate_m.json", import.meta.url)));
  const PD = policyDataset(BIS);
  check(WINDOWS.join() === "1,5,10,20,50", `timeframes: ${WINDOWS.map((w) => w + "Y").join(" ")}`);
  const { applyStarts: AS } = await import("../lib/series.mjs");
  const sets = [["unemployment", un, "unemp", ALL], ["jobs", AS(data), "jobs", ALL], ["jobs per capita", JP, "index", ALL], ["gdp", EV.gdp, "index", ALL], ["gdp per capita", EV.pc, "index", ALL], ["policy rates", PD, "level", [...ALL, "XM"]]];
  const srcOf = (ds, c) => (ds.monthly && ds.monthly[c]) || ds.quarterly[c];
  for (const [name, ds, mode, codes] of sets) {
    const { monthEndIdx } = commonEnds(ds); const startMi = monthEndIdx - 600; let bad = [], late = [], full = [];
    for (const c of codes) { const l = buildLine(ds, c, 50, mode), s = srcOf(ds, c);
      if (l.points[0].mi < startMi - 2 || l.points[0].mi > startMi + 3) bad.push(`${c} start`);
      const fi = l.points.findIndex((p) => p.value !== null);
      if (fi < 0) { if (!l.excluded) bad.push(`${c} empty not excluded`); continue; }
      // late iff the first drawn reading is after the window's first period; never filled (no value before it)
      if ((fi > 0) !== !!l.late || (fi > 0 && l.full)) bad.push(`${c} late flag`);
      if (l.points.slice(0, fi).some((p) => p.value !== null)) bad.push(`${c} filled`);
      if (mode === "index" && Math.abs(l.points[fi].value - 100) > 1e-9) bad.push(`${c} not 100 at own start`);
      if (mode === "level") for (const p of l.points) { const i = s.periods.indexOf(p.period), v = i < 0 ? null : s.values[i]; if ((v ?? null) !== p.value) { bad.push(`${c} ${p.period} level`); break; } }
      if (l.full) full.push(c); else if (l.late) late.push(`${c} from ${l.late}`); else late.push(`${c} ends early (last ${[...l.points].reverse().find((p) => p.value !== null).period})`); }
    // headline over every combo: ranks only full-window countries; <2 full among >1 selected -> no ranking
    let hb = 0, hn = 0, nn = 0; const gl = Object.fromEntries(codes.map((c) => { const l = buildLine(ds, c, 50, mode); return [c, l.full ? l.growth : null]; }));
    for (let m = 1; m < 1 << ALL.length; m++) { const sel = ALL.filter((_, i) => m & (1 << i)); if (mode === "level" && sel.some((c) => ["DEU", "FRA", "ITA"].includes(c))) sel.push("XM"); hn++;
      const h = headlinePick(ds, sel, 50, mode), vs = sel.map((c) => gl[c]).filter((v) => v !== null && v !== undefined);
      if (sel.length > 1 ? vs.length < 2 : !vs.length) { nn++; if (!h.none || h.fastest || h.single) hb++; continue; }
      const f = h.single ?? h.fastest; if (!f || Math.abs(f.value - Math.max(...vs)) > 1e-12 || f.codes.some((c) => gl[c] === null)) hb++; }
    check(!bad.length && !hb, `50Y ${name}: window from ${mStr(startMi)}; full: ${full.join(" ") || "none"}; not full (late start / ends early): ${late.join(", ") || "none"}; ${hn} combos, ${nn} with <2 full -> "no ranking"${bad.length ? " BAD " + bad.join(",") : ""}${hb ? ` ${hb} headline wrong` : ""}`);
  }
  // late-starter cases named by Cavin: France jobs 'from 2003', indexed label case; fewer-than-two-full case
  { const f = buildLine(data, "FRA", 50, "jobs"), h = headlinePick(data, ["FRA", "ITA"], 50, "jobs"), h2 = headlinePick(EV.gdp, ["CAN", "USA"], 50, "index");
    check(f.late === "2003-Q1" && !f.full && Math.abs(f.points.find((p) => p.value !== null).value - 100) < 1e-12, `late starter: France jobs 50Y from ${f.late}, 100 on its own first quarter, not ranked`);
    check(h.none && h.fullCodes.length === 0 && h2.fastest && h2.slowest, "50Y jobs FRA+ITA (both late): no country has the whole period -> no ranking; 50Y GDP CAN+USA (both full) -> ranked"); }
  // joined population: dashed (estimated) points = exactly the Y-flagged quarters; 1Y/5Y/10Y identical to round 3 /
  // the unjoined file; no step at any January; no join tick (max gap under 0.3%); Germany note when pre-1991 is in the window
  { const EVraw = econDataset(econRaw, "pc"), JPraw = jobsPerCapitaDataset(data, econRaw); let dm = 0, dn = 0, same = 0, sn = 0;
    for (const c of ALL) { const l = buildLine(EV.pc, c, 50, "index"), Ys = new Set(Object.entries(POPJ.population[c].status || {}).filter(([, v]) => v === "Y").map(([p]) => p));
      for (const p of l.points) { if (p.value === null) continue; dn++; if (estAt(EV.pc, c, p.period) !== Ys.has(p.period)) dm++; }
      for (const y of [1, 5, 10]) for (const [A, B] of [[EV.pc, EVraw], [JP, JPraw]]) { sn++; const a = buildLine(A, c, y, "index").growth, b = buildLine(B, c, y, "index").growth; if (a !== b) same++; } }
    check(dm === 0 && dn > 0, `joined population: dashed points match Y flags (${dn} drawn GDP-per-capita points on 50Y, ${dm} mismatched)`);
    check(same === 0, `joined population: 1Y/5Y/10Y per-capita values identical to the unjoined file for all 7 (${sn} GDP pc + jobs pc country-windows, ${same} differ); round-3 jobs per capita goldens above unchanged`);
    let jumps = []; for (const c of ALL) { const s = POPJ.population[c], v = s.values.map((x) => x ?? null);
      for (let i = 2; i < v.length; i++) if (v[i] !== null && v[i - 1] !== null && v[i - 2] !== null) { const d1 = v[i] - v[i - 1], d0 = v[i - 1] - v[i - 2]; if (s.periods[i].endsWith("Q1") && ((s.status || {})[s.periods[i - 1]] === "Y") && Math.abs(d1 - d0) > Math.max(0.002 * v[i], 3 * Math.abs(d0) + 1)) jumps.push(`${c} ${s.periods[i]}`); } }
    const gaps = Object.entries(POPJ.join_gap_pct).filter(([, g]) => g !== null), maxg = Math.max(...gaps.map(([, g]) => Math.abs(g)));
    const ticks = ALL.flatMap((c) => buildLine(EV.pc, c, 50, "index").breaks.filter((b) => /Population source/.test(b.label)));
    check(!jumps.length && maxg < 0.3 && !ticks.length, `joined population: no step at any January in the annual-derived stretch or at the switch (${jumps.join(",") || "none"}); max join gap ${maxg.toFixed(3)}% < 0.3% -> no join tick`);
    const sw = ALL.filter((c) => POPJ.population[c].derived_until).map((c) => `${c} ${POPJ.population[c].derived_until} -> quarterly`);
    const cc = readFileSync(new URL("../src/components/ChartCard.tsx", import.meta.url), "utf8"), NM = { CAN: "Canada", FRA: "France", DEU: "Germany", GBR: "UK", ITA: "Italy", JPN: "Japan" };
    const yr = (c) => { const [y, q] = POPJ.population[c].derived_until.split("-Q").map(Number); return q === 4 ? y + 1 : y; };
    const want = `Switch to quarterly: ${["CAN", "FRA", "GBR", "ITA", "JPN"].map((c) => `${NM[c]} ${yr(c)}`).join(", ")}.`;
    check(cc.includes(want) && (cc.match(/\{POP_JOIN_LINE\}/g) || []).length === 2, `How it's calculated population line matches the gated file: "${want}" (GDP per capita + Jobs per capita)`);
    check(sw.length === 6, `joined population switch quarters (from the gated file): ${sw.join(", ")}`);
 }
  // heat strip 50Y: one column per year, labels every 10 years, cells before a country's first monthly reading n/a
  { const h = heatStrip(JSON.parse(readFileSync(new URL("../data/oecd_unemployment_rate_m_15plus.json", import.meta.url))), 50);
    const ys = h.cols.map((c) => +c.key), contig = ys.every((y, i) => !i || y === ys[i - 1] + 1);
    const pre = h.rows.map((r) => { const k = h.cols.findIndex((c) => c.months[11] >= r.first); return `${r.code}:${h.cols.slice(0, k).every((_, i) => r.cells[i].v === null && r.cells[i].why === "before first reading") ? "ok" : "BAD"}@${r.first.slice(0, 4)}`; });
    check(h.unit === "year" && h.cols.length === 50 && contig && !pre.some((x) => x.includes("BAD")), `heat strip 50Y: ${h.cols.length} yearly columns ${ys[0]}–${ys.at(-1)}; before first reading n/a (${pre.join(" ")})`); }
  // #7: national lines to Dec 1998, a single break mark at Jan 1999 on the euro-area line, Japan's gaps kept
  { const xm = buildLine(PD, "XM", 50, "level"), de = buildLine(PD, "DEU", 50, "level"), jp = PD.monthly.JPN;
    const deLast = [...de.points].reverse().find((p) => p.value !== null).period;
    const allBreaks = [...ALL, "XM"].flatMap((c) => buildLine(PD, c, 50, "level").breaks);
    const jpNull = BIS.series.JPN.values.filter((v, i) => v === null && BIS.series.JPN.periods[i] >= "1999-01").length;
    const eq = BIS.series.XM.periods.every((p, i) => ["DEU", "FRA", "ITA"].every((c) => { const s = BIS.series[c], j = s.periods.indexOf(p); return j >= 0 && s.values[j] === BIS.series.XM.values[i]; }));
    check(deLast === "1998-12" && xm.late === "1999-01" && allBreaks.length === 1 && allBreaks[0].mi === mIdx("1999-01") && jpNull === 116 && jp.values.filter((v) => v === null).length >= 116 && eq,
      `#7 policy: DE/FR/IT national to ${deLast}, euro-area line from ${xm.late}, ${allBreaks.length} break mark (Jan 1999), Japan ${jpNull} missing months kept null, BIS DE/FR/IT from 1999 = XM`);
    const h1 = headlinePick(PD, [...ALL, "XM"], 1, "level"), lb = headlineLabels(h1, "level");
    check(h1.fastest && h1.slowest && ((roundShown(h1.fastest.value, "level") > 0) === (lb.fast === "Biggest rise")) && ((roundShown(h1.slowest.value, "level") < 0) === (lb.slow === "Biggest fall")),
      `#7 1Y headline: ${lb.fast} ${h1.fastest.codes} ${fmtHeadline(h1.fastest.value, "level")} / ${lb.slow} ${h1.slowest.codes} ${fmtHeadline(h1.slowest.value, "level")} pts`); }
}
// ---- Prepared (not wired): Unemployment rate on c1_unemployment_rate_long.json (OECD monthly), pending the Data Lead's gate ----
{ const { unempLongDataset, UNEMP_MONTHLY_GATED } = await import("../lib/series.mjs");
  const rawL = readFileSync(new URL("../data/c1_unemployment_rate_long.json", import.meta.url)), F = JSON.parse(rawL);
  const sha = createHash("sha256").update(rawL).digest("hex"), UMd = unempLongDataset(F);
  const ce = commonEnds(UMd), us = buildLine(UMd, "USA", 1, "unemp"), uk = buildLine(UMd, "GBR", 1, "unemp");
  const lastOf = (l) => [...l.points].reverse().find((p) => p.value !== null).period;
  const h = headlinePick(UMd, ALL, 1, "unemp"), ranked = [...(h.fastest?.codes ?? []), ...(h.slowest?.codes ?? []), ...(h.single?.codes ?? [])];
  const l50 = Object.fromEntries(ALL.map((c) => [c, buildLine(UMd, c, 50, "unemp").late]));
  check(sha.startsWith("ccf0417e") && /seasonally adjusted/.test(F.measure) && ce.monthEnd === "2026-09" && UMd.rankEnd === "2026-08" && lastOf(us) === "2026-09" && us.points[0].period === "2025-08"
    && lastOf(uk) === "2026-06" && !uk.full && !ranked.includes("GBR") && l50.GBR?.startsWith("1983") && l50.FRA?.startsWith("1983") && l50.ITA?.startsWith("1983") && l50.DEU?.startsWith("1991") && !l50.CAN,
    `unemployment long file (prepared, gated=${UNEMP_MONTHLY_GATED}, sha ${sha.slice(0, 8)}, measure says seasonally adjusted): ranking anchored on ${UMd.rankEnd}, US line + stats box to ${lastOf(us)}; UK ends ${lastOf(uk)} -> not ranked; 50Y late starters UK/FR/IT 1983, DE 1991`);
  check(UNEMP_MONTHLY_GATED === !!JSON.parse(readFileSync(new URL("../data/MANIFEST.json", import.meta.url))).files["c1_unemployment_rate_long.json"], `unemployment long file: in the manifest only once gated (gated=${UNEMP_MONTHLY_GATED})`);
  // Warehouse Aug-based references (US given; 20Y being re-confirmed; 50Y + other countries pending) — not round 3
  const REF = { USA: { 1: -0.10, 5: -1.33, 10: -0.73, 20: -0.53 } }, PROV = { USA: [20] };
  for (const [c, byW] of Object.entries(REF)) for (const [w, want] of Object.entries(byW)) { const g = buildLine(UMd, c, +w, "unemp").growth;
    const ok = g !== null && Math.abs(g - want) < 0.01, prov = (PROV[c] || []).includes(+w);
    if (prov) console.log(`${ok ? "PROVISIONAL-MATCH" : "PROVISIONAL-DIFF"} unemployment long ${w}Y ${c}: app ${g?.toFixed(2)} vs Warehouse ${want} pts (being re-confirmed)`);
    else check(ok, `unemployment long ${w}Y ${c} (to Aug 2026): app ${g === null ? "n/a" : (g >= 0 ? "+" : "") + g.toFixed(2)} vs Warehouse ${want} pts`); }
}
// Zero reads "No change", never +0.00 / −0.00; 50Y start labels follow the shared window rule
{ const { headlineLabels: HL, fmtHeadline: FH, windowLabel: WL } = await import("../lib/series.mjs");
  const mk = (a, b) => ({ fastest: { value: a, codes: ["CAN"], periods: [] }, slowest: { value: b, codes: ["USA"], periods: [] } });
  const z = [HL(mk(0.004, -0.5), "unemp"), HL(mk(0.5, -0.004), "unemp"), HL(mk(0.001, -0.3), "index"), HL(mk(0.2, -0.0049), "level")];
  const t = [0.004, -0.004, 0.0049, -0.0049, 0].map((v) => FH(v, "unemp"));
  check(z[0].fast === "No change" && z[1].slow === "No change" && z[2].fast === "No change" && z[3].slow === "No change" && t.every((x) => x === "0.00"),
    `zero: a figure rounding to 0 reads "No change" (unemployment, growth, policy) and shows ${[...new Set(t)].join("/")} (never +0.00 or −0.00)`);
  const a = WL(un, ["CAN", "USA"], 50, "unemp"), b = WL(un, ["GBR", "DEU"], 50, "unemp"), c = WL(EV.gdp, ["CAN"], 50, "index");
  check(a.text.startsWith("Aug 1976 – Aug 2026") && b.text.startsWith("Q3 1976 – Q2 2026") && c.text.startsWith("Q2 1976 – Q2 2026"),
    `50Y start labels: monthly "${a.text}"; quarterly unemployment "${b.text}"; GDP "${c.text}"`); }
const WINDOWS_ALL = [1, 5, 10, 20, 50];
{ const { perCapitaStart } = await import("../lib/series.mjs"); const s = data.quarterly.DEU, v = (p) => s.values[s.periods.indexOf(p)];
  const j = (v("1991-Q1") / v("1990-Q4") - 1) * 100, fake = { periods: ["1990-Q4", "1991-Q1"], values: [28000, 34500] };
  check(perCapitaStart("DEU", s) === null && perCapitaStart("DEU", fake) === "1991-Q1" && Math.abs(j) < 10,
    `Germany territory: jobs Q4 1990 ${v("1990-Q4")}k -> Q1 1991 ${v("1991-Q1")}k (${j.toFixed(1)}%, no West-only jump; 1976-Q1 ${v("1976-Q1")}k = unified scale) -> no per-capita start override; a +23% jump would start per capita at 1991-Q1`); }
// Whole-series estimate vs partial estimate: German jobs are OECD "E" on every quarter -> solid line + "OECD estimate"
// tag in every view; dashes only for Y-flagged (estimated population) stretches.
{ const { wholeEstimate } = await import("../lib/series.mjs"); const J2 = jobsPerCapitaDataset(data, POPJ);
  const nE = Object.values(data.quarterly.DEU.status).filter((x) => x === "E").length, nV = data.quarterly.DEU.values.filter((v) => v !== null).length;
  const plainDash = buildLine(data, "DEU", 50, "jobs").points.some((p) => p.value !== null && estAt(data, "DEU", p.period));
  const pcPts = buildLine(J2, "DEU", 50, "index").points.filter((p) => p.value !== null);
  const pcDash = pcPts.some((p) => estAt(J2, "DEU", p.period)), firstSolid = pcPts[0].period;
  const others = ALL.filter((c) => c !== "DEU").filter((c) => wholeEstimate(data, c) || wholeEstimate(J2, c) || wholeEstimate(EV.gdp, c) || wholeEstimate(EV.pc, c));
  check(nE === nV && wholeEstimate(data, "DEU") && wholeEstimate(J2, "DEU") && !plainDash && !pcDash && firstSolid === "1991-Q1" && !others.length && !wholeEstimate(EV.gdp, "DEU"),
    `estimates: Germany jobs ${nE}/${nV} quarters OECD "E" -> solid line + "OECD estimate" tag (jobs and jobs per capita); no dashes on any German line (starts ${firstSolid}, no "Estimated population" tag); no other whole-series estimates`); }
// Data Lead independent rebuild (crosscheck/golden4_rebuild/output.json)
{ const out = JSON.parse(readFileSync("/workspace/skyscraper/unitedstats-warehouse/crosscheck/golden4_rebuild/output.json")); const UL2 = (await import("../lib/series.mjs")).unempLongDataset(JSON.parse(readFileSync(new URL("../data/c1_unemployment_rate_long.json", import.meta.url))));
  const { ownChange: oc } = await import("../lib/series.mjs"); const JP4 = jobsPerCapitaDataset(data, POPJ); let n = 0; const bad = [];
  for (const r of out) { const y = parseInt(r.window), c = r.country.slice(0, 3); let ours;
    if (r.key === "gdp_50Y_pct") ours = buildLine(EV.gdp, c, y, "index").growth; else if (r.key === "gdp_per_capita_50Y_pct") ours = buildLine(EV.pc, c, y, "index").growth;
    else if (r.key === "jobs_per_capita_pct") ours = buildLine(JP4, c, y, "index").growth;
    else if (r.key.startsWith("unemployment")) { const l = buildLine(UL2, c, y, "unemp"); ours = r.country.includes("own") ? (oc(UL2, c, y)?.change ?? null) : l.full ? l.growth : null; if (r.country.includes("own") && y === 50) ours = l.full ? ours : null; }
    else continue; if (c === "DEU" && !r.key.startsWith("unemployment")) continue; n++; // Germany from 1991 (Cavin): rebuild predates it
    const want = r.rebuilt; if (want === null ? ours !== null : ours === null || Math.abs(ours - want) > 0.0006) bad.push(`${r.key} ${r.country} ${r.window} ours ${ours} vs ${want}`); }
  check(!bad.length, `Data Lead rebuild (golden4_rebuild/output.json): ${n - bad.length}/${n} match at the rebuild's precision${bad.length ? " — DIFF " + bad.join("; ") : ""}`); }
// Germany starts Q1 1991 on GDP, GDP per capita, Jobs, Jobs per capita (Cavin): late starter on 50Y, not ranked,
// stats-box own figure from Q1 1991; 1Y–20Y unchanged
{ const { applyStarts, SERIES_START } = await import("../lib/series.mjs"); const G4 = JSON.parse(readFileSync(new URL("./golden/golden_round4.json", import.meta.url))).germany_from_1991;
  const JD = applyStarts(data), JPD = jobsPerCapitaDataset(data, POPJ), rk = (h) => [...(h.fastest?.codes ?? []), ...(h.slowest?.codes ?? []), ...(h.single?.codes ?? [])];
  const charts = [["GDP", EV.gdp, "index", "gdp_pct"], ["GDP per capita", EV.pc, "index", "gdp_per_capita_pct"], ["Jobs", JD, "jobs", "jobs_pct"], ["Jobs per capita", JPD, "index", "jobs_per_capita_pct"]];
  const out = [], bad = [];
  for (const [nm, d, m, key] of charts) { const l = buildLine(d, "DEU", 50, m), f = l.points.find((p) => p.value !== null), e = [...l.points].reverse().find((p) => p.value !== null), h = headlinePick(d, ALL, 50, m);
    out.push(`${nm} ${f.period}→${e.period} ${l.growth >= 0 ? "+" : ""}${l.growth.toFixed(2)}% (round4 ${G4[key].value} to ${G4[key].end})`);
    if (l.late !== "1991-Q1" || l.full || rk(h).includes("DEU") || e.period !== G4[key].end || Math.abs(l.growth - G4[key].value) > 0.005 || estAt(d, "DEU", f.period)) bad.push(nm);
    for (const y of [1, 5, 10, 20]) { const raw = nm === "Jobs" ? data : nm === "Jobs per capita" ? null : null; if (raw && buildLine(raw, "DEU", y, m).growth !== buildLine(d, "DEU", y, m).growth) bad.push(`${nm} ${y}Y changed`); } }
  const cc = readFileSync(new URL("../src/components/ChartCard.tsx", import.meta.url), "utf8") + readFileSync(new URL("../src/components/LineChart.tsx", import.meta.url), "utf8");
  check(SERIES_START.DEU === "1991-Q1" && !bad.length && !/"not ranked"|unified Germany|unified territory|DEU_NOTE/.test(cc), `Germany from Q1 1991 on GDP / GDP pc / Jobs / Jobs pc: 50Y late starter, unranked, solid, own figures match round4 germany_from_1991 (${out.join("; ")}); no "not ranked" tag or territory footnote${bad.length ? " BAD " + bad.join(",") : ""}`); }
// Plain Jobs 50Y, every country (room-ready, for Warehouse to check)
{ const { applyStarts } = await import("../lib/series.mjs"); const JD = applyStarts(data);
  console.log("Jobs 50Y (ours): " + ALL.map((c) => { const l = buildLine(JD, c, 50, "jobs"), f = l.points.find((p) => p.value !== null), e = [...l.points].reverse().find((p) => p.value !== null);
    return `${c} ${f.period} → ${e.period} ${l.growth >= 0 ? "+" : ""}${l.growth.toFixed(2)}%${l.full ? "" : " (from " + l.late + ", not ranked)"}`; }).join("; ")); }
// every data file's sha256 must be listed by the Warehouse (crosscheck/chart_gate/export_shas.txt) or in a gate note
{ const { readdirSync } = await import("node:fs"); const WH = "/workspace/skyscraper/unitedstats-warehouse";
  const listed = readFileSync(`${WH}/crosscheck/chart_gate/export_shas.txt`, "utf8").split("\n").map((l) => l.trim().split(/\s+/)[0]).filter((x) => /^[0-9a-f]{8,}$/.test(x));
  const notes = readdirSync(`${WH}/gates`).filter((f) => f.endsWith(".md")).map((f) => readFileSync(`${WH}/gates/${f}`, "utf8")).join("\n");
  // gate-note shas: full hashes, or "prefix…suffix" / "prefix X, suffix Y" forms
  const pairs = [...notes.matchAll(/\b([0-9a-f]{8,64})(?:\s*(?:…|\.\.\.|,? suffix )\s*([0-9a-f]{4,}))?/g)].map((m) => [m[1], m[2] || ""]);
  const gated = (sha) => listed.some((x) => sha.startsWith(x)) || pairs.some(([a, b]) => sha.startsWith(a) && (!b || sha.endsWith(b)));
  const shaOf = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
  const man = JSON.parse(readFileSync(new URL("../data/MANIFEST.json", import.meta.url)));
  const unl = Object.keys(man.files).filter((f) => !gated(shaOf(new URL(`../data/${f}`, import.meta.url))));
  for (const f of unl) console.log(`  UNLISTED sha: data/${f} ${shaOf(new URL(`../data/${f}`, import.meta.url)).slice(0, 12)}`);
  // self-test: a modified temp copy of a live file must be caught
  const f0 = Object.keys(man.files)[0], tmp = `/tmp/gatecheck-${process.pid}.json`; writeFileSync(tmp, Buffer.concat([readFileSync(new URL(`../data/${f0}`, import.meta.url)), Buffer.from(" ")]));
  const caught = !gated(shaOf(tmp)); unlinkSync(tmp);
  check(unl.length === 0 && caught, `Warehouse sha list: all ${Object.keys(man.files).length} data files listed in export_shas.txt or a gate note${unl.length ? ` (UNLISTED: ${unl.join(", ")})` : ""}; self-test: modified temp copy of ${f0} ${caught ? "caught" : "NOT caught"}`); }
// App Lead round: flag tags, ranked dates, own-latest end values, US January note scope
{ const { flagTags, jobsDataset, applyStarts } = await import("../lib/series.mjs"); const JD = jobsDataset(data), JPD = applyStarts(jobsPerCapitaDataset(data, POPJ));
  const G = applyStarts(EV.gdp), PC = applyStarts(EV.pc), j = (d, p) => flagTags(d, "DEU", p).join(" · ");
  const deuJobs = JD.quarterly.DEU.periods.filter((p, i) => JD.quarterly.DEU.values[i] !== null).every((p) => flagTags(JD, "DEU", p).includes("OECD estimate"));
  const gdpOk = [G, PC].every((d) => j(d, "1995-Q1") === "" && j(d, "2022-Q4") === "" && j(d, "2023-Q1") === "provisional" && j(d, "2026-Q1") === "provisional");
  const jpcOk = j(JPD, "2022-Q4") === "OECD estimate" && j(JPD, "2023-Q1") === "OECD estimate · provisional";
  const orderOk = ["Estimated population", "OECD estimate", "provisional"].join() === ["provisional", "Estimated population", "OECD estimate"].sort((a, b) => ["Estimated population", "OECD estimate", "provisional"].indexOf(a) - ["Estimated population", "OECD estimate", "provisional"].indexOf(b)).join();
  check(deuJobs && gdpOk && jpcOk && orderOk, `flag tags: Germany Jobs "OECD estimate" on every point; GDP/GDP pc none before 2023-Q1, "provisional" from 2023-Q1; Jobs pc 2023-Q1 "${j(JPD, "2023-Q1")}"; order estimate · OECD estimate · provisional`);
  const UL = (await import("../lib/series.mjs")).unempLongDataset(JSON.parse(readFileSync(new URL("../data/c1_unemployment_rate_long.json", import.meta.url))));
  const hj = headlinePick(JD, ["USA", "CAN"], 1, "jobs"), hu = headlinePick(UL, ALL, 50, "unemp"), hp = headlinePick(JPD, ["USA", "CAN"], 1, "index");
  const per = (h) => [...(h.fastest?.periods || []), ...(h.slowest?.periods || []), ...(h.single?.periods || [])];
  check(per(hj).every((p) => p <= "2026-08") && per(hj).includes("2026-08") && per(hu).every((p) => p === "2026-08" || /Q/.test(p)) && per(hp).every((p) => p === "2026-03"), `ranked dates: US Jobs 1Y ${per(hj).join("/")}, unemployment 50Y ${[...new Set(per(hu))].join("/")}, Jobs pc ${[...new Set(per(hp))].join("/")}`);
  const lasts = ["CAN", "JPN", "USA"].map((c) => buildLine(JD, c, 50, "jobs").last);
  check(lasts.every((v) => v !== null), `Jobs 50Y end labels use each country's own latest value (CAN ${lasts[0]?.toFixed(1)}, JPN ${lasts[1]?.toFixed(1)}, USA ${lasts[2]?.toFixed(1)}), never n/a`);
  const cc = readFileSync(new URL("../src/components/ChartCard.tsx", import.meta.url), "utf8");
  check(/kind === "jobs" \? \{\} : \{ janJumps: \[\]/.test(cc) && /hasJan = kind === "jobs"/.test(cc), `US January note: Jobs and Jobs per capita only (cleared on every other chart)`);
  check(!/<ul className="notes">[\s\S]{0,200}hasJan/.test(cc) && /\{hasJan && <li><span className="ic">[^\n]*US Jan jump/.test(cc) && !/January/.test(cc + readFileSync(new URL("../src/components/LineChart.tsx", import.meta.url), "utf8")), "US Jan note sits in How it's calculated (when the US is selected), not under the chart; text says 'Jan', never 'January'");
  const lc = readFileSync(new URL("../src/components/LineChart.tsx", import.meta.url), "utf8");
  check(/allQ \? `\$\{qL\(m0\)\} to \$\{qL\(m1\)\}`/.test(lc), `screen-reader summary uses quarters on quarterly-only charts ("Q2 1976 to Q2 2026")`); }
// headline source tag: names come from the registry (meta src) and must match the chart's full source line
{ const meta = readFileSync(new URL("../src/charts/meta.ts", import.meta.url), "utf8"), rd = (f) => readFileSync(new URL(`../src/components/${f}`, import.meta.url), "utf8");
  const srcOf = (id) => { const m = meta.match(new RegExp(`^  "?${id}"?: \\{ id: "${id}", src: \\[([^\\]]*)\\]`, "m")); return m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : null; };
  const cc = rd("ChartCard.tsx"), line = (re) => (cc.match(re) || [""])[0];
  const lines = { gdp: line(/Source: OECD quarterly national accounts/), unemp: line(/Source: OECD · unemployment rate/), jobs: line(/Source: OECD · employment 15\+/), "7": line(/Source: BIS central bank policy rates/),
    "1": (rd("Comeback.tsx").match(/source=\{?["`]([^"`]+)/) || [])[1], "2": (rd("HeatStrip.tsx").match(/"(Source: OECD · unemployment[^"]+)"/) || [])[1], "22": (rd("Scorecard.tsx").match(/source="([^"]+)"/) || [])[1],
    ...(() => { const fin = readFileSync(new URL("../src/charts/finance.tsx", import.meta.url), "utf8"); const o = {};
      for (const m of fin.matchAll(/id: "(\d+)"[\s\S]*?source: (?:\(v\) => )?[`"](Source: [^`"]+)/g)) o[m[1]] = m[2];
      o["21"] = (rd("StackBar.tsx").match(/source="([^"]+)"/) || [])[1]; return o; })() };
  const bad = Object.entries(lines).filter(([id, l]) => { const s = srcOf(id); return !s || !s.length || !l || !s.every((n) => l.includes(n)); }).map(([id]) => id);
  const hard = /srctag">\{?["'`](OECD|BIS)/.test(cc + rd("kit.tsx"));
  check(!bad.length && !hard, `source tags: every built chart's tag names (${Object.keys(lines).map((id) => `${id}=${(srcOf(id) || []).join("+")}`).join(", ")}) appear in its full source line; none hard-coded${bad.length ? ` (BAD: ${bad})` : ""}`); }
// ---- Finance wave: Warehouse reference figures (REFERENCE-FIGURES.md) + independent in-test maths + structure ----
{ const F = await import("../lib/finance.mjs");
  // expected figures are read straight from the Warehouse's file (not self-computed); the in-test maths is an extra, independent check
  const WREF = "/workspace/skyscraper/unitedstats-warehouse/REFERENCE-FIGURES.md", md = readFileSync(WREF, "utf8");
  check(md === readFileSync(new URL("./golden/REFERENCE-FIGURES.md", import.meta.url), "utf8"), `Finance references read from ${WREF} (repo copy scripts/golden/REFERENCE-FIGURES.md identical)`);
  const J = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url)));
  const sec = (n) => new RegExp(`## Card ${n} [^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`).exec(md)[1].split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2).split(" | "));
  const raw = (file, c, p) => { const s = file.series[c], i = s.periods.indexOf(p); return i < 0 ? null : s.values[i]; };
  const lastOf = (file, c) => { const s = file.series[c]; for (let i = s.values.length - 1; i >= 0; i--) if (s.values[i] !== null) return [s.periods[i], s.values[i]]; };
  const mm = [];
  // #10 debt: latest actual − 2007
  { const f = J("imf_weo_GGXWDG_NGDP.json"), d = F.dumbbell(f, "2007");
    for (const [c, per, vals] of sec(10)) { const [p0, p1] = per.split("→"), [a, b] = vals.split(" (")[0].split("→").map(Number), dl = +/Δ (-?[\d.]+)/.exec(vals)[1];
      const r = d.rows.find((x) => x.code === c), [lp, lv] = lastOf(f, c), ind = lv - raw(f, c, "2007");
      if (r.end !== p1 || lp !== p1 || p0 !== "2007" || Math.abs(r.change - dl) > 0.05 || Math.abs(ind - r.change) > 1e-9 || Math.abs(r.startValue - a) > 0.05 || Math.abs(r.endValue - b) > 0.05) mm.push(`#10 ${c}: ours ${r.end} ${r.change?.toFixed(2)} vs Warehouse ${p1} ${dl}`); }
    const sorted = d.rows.every((r, i) => !i || d.rows[i - 1].change >= r.change);
    check(!mm.length && sorted && d.rows.every((r) => +r.end <= 2025), `#10 debt vs Warehouse: all 7 match (Δ within 0.05; ends = each country's last actual, CAN/FRA/JPN 2024, others 2025); sorted by increase; no projection years`); }
  // #6 house prices: % change, 2010-Q1 → own latest
  { const f = J("oecd_house_price_to_income.json"), d = F.dumbbell(f, "2010-Q1", "pct"); const n0 = mm.length;
    for (const [c, per, vals] of sec(6)) { const p1 = per.split("→")[1], pc = +/\((-?[\d.]+)%\)/.exec(vals)[1], r = d.rows.find((x) => x.code === c);
      const [lp, lv] = lastOf(f, c), ind = (lv / raw(f, c, "2010-Q1") - 1) * 100;
      if (r.end !== p1 || lp !== p1 || Math.abs(r.change - pc) > 0.05 || Math.abs(ind - r.change) > 1e-9) mm.push(`#6 ${c}: ours ${r.end} ${r.change?.toFixed(2)}% vs Warehouse ${p1} ${pc}%`); }
    check(mm.length === n0 && d.rows.find((r) => r.code === "JPN").end === "2025-Q4", `#6 house prices vs Warehouse: all 7 match (% change within 0.05); Japan dated to its own Q4 2025`); }
  // #20 household credit: 2007-Q4 and latest
  { const f = J("bis_household_credit_pct_gdp.json"), m = F.multiples(f, "2006-Q1", "2007-Q4"); const n0 = mm.length;
    for (const [c, per, vals] of sec(20)) { const [a, b] = vals.split("→").map(Number), p = m.panels.find((x) => x.code === c);
      if (p.last.period !== per.split("→")[1] || Math.abs(p.ref.value - a) > 0.05 || Math.abs(p.last.value - b) > 0.05) mm.push(`#20 ${c}: ours ${p.ref.value?.toFixed(1)}→${p.last.value.toFixed(1)} vs Warehouse ${vals}`); }
    const shared = m.min === Math.min(0, ...m.panels.flatMap((p) => p.points.map((x) => x.value)).filter((v) => v !== null));
    check(mm.length === n0 && shared && /770 = "Percentage of GDP"/.test(f.unit), `#20 household credit vs Warehouse: Q4 2007 and latest (Q1 2026) match for all 7; shared y-scale; unit 770 = % of GDP confirmed in the file`); }
  // #19 current account: latest quarter; gaps stay null; late starters flagged
  { const f = J("oecd_bop_current_account_pct_gdp_q.json"), m = F.multiples(f, F.winFromQ("2026-Q2", 50)); const n0 = mm.length;
    for (const [c, per, v] of sec(19)) { const p = m.panels.find((x) => x.code === c); if (p.last.period !== per || Math.abs(p.last.value - +v) > 0.05) mm.push(`#19 ${c}: ours ${p.last.period} ${p.last.value.toFixed(2)} vs Warehouse ${per} ${v}`); }
    const late = m.panels.filter((p) => p.late).map((p) => `${p.code} ${p.late}`), zeroFill = m.panels.some((p) => p.points.some((x, i) => x.value === 0 && raw(f, p.code, x.period) !== 0));
    const w10 = F.winFromQ("2026-Q2", 10) === "2016-Q2";
    check(mm.length === n0 && !zeroFill && w10 && late.join() === "CAN 1981-Q1,JPN 1996-Q1,DEU 1991-Q1,FRA 1999-Q1,ITA 1995-Q1", `#19 current account vs Warehouse: latest Q2 2026 matches for all 7; 10Y window from Q2 2016; 50Y late starters ${late.join(", ")}; no gap filled with 0`); }
  // #21 openness: latest year per country (Warehouse) vs our year view
  { const e = J("wb_NE.EXP.GNFS.ZS.json"), i = J("wb_NE.IMP.GNFS.ZS.json"); const n0 = mm.length;
    for (const [c, y, vals] of sec(21)) { const tot = +/= ([\d.]+)/.exec(vals)[1], o = F.openness(e, i, y).rows.find((x) => x.code === c);
      if (o.total === null || Math.abs(o.total - tot) > 0.05 || Math.abs(o.total - (raw(e, c, y) + raw(i, c, y))) > 1e-9) mm.push(`#21 ${c} ${y}: ours ${o.total?.toFixed(2)} vs Warehouse ${tot}`); }
    const d24 = F.openness(e, i, F.OPEN_DEFAULT), d25 = F.openness(e, i, "2025");
    const na25 = d25.rows.filter((r) => r.total === null).map((r) => `${r.code} (${r.latestYear} latest)`).join(", ");
    check(mm.length === n0 && F.OPEN_DEFAULT === "2024" && d24.rows.every((r) => r.total !== null) && na25 === "USA (2024 latest), JPN (2024 latest)", `#21 openness vs Warehouse: each country's latest-year total matches (2025, US/Japan 2024); default 2024 has all seven (never mixes years); 2025 shows ${na25}`); }
  // #13 inflation: latest month headline and core; fixed diverging bands; heat cells never filled
  { const { heatStrip } = await import("../lib/charts.mjs"); const hl = J("oecd_cpi_headline_yoy.json"), co = J("oecd_cpi_core_yoy.json"); const n0 = mm.length;
    for (const [c, per, vals] of sec(13)) { const [h, k] = [/headline (-?[\d.]+)/, /core (-?[\d.]+)/].map((re) => +re.exec(vals)[1]);
      const H1 = heatStrip(hl, 1), C1 = heatStrip(co, 1), col = H1.cols.findIndex((x) => x.key === per);
      const hv = H1.rows.find((r) => r.code === c).vals[col], cv = C1.rows.find((r) => r.code === c).vals[C1.cols.findIndex((x) => x.key === per)];
      if (hv === null || cv === null || Math.abs(hv - h) > 1e-6 || Math.abs(cv - k) > 1e-6) mm.push(`#13 ${c} ${per}: ours ${hv}/${cv} vs Warehouse ${h}/${k}`); }
    const steps = [-0.5, 0, 0.99, 1, 1.49, 1.5, 2, 2.49, 2.5, 3.9, 4, 5.9, 6, 9].map(F.cpiStep).join("");
    check(mm.length === n0 && steps === "01122333445566", `#13 inflation vs Warehouse: Aug 2026 headline and core match for all 7 (1Y cells = published monthly values); fixed bands around 2% (step map ${steps})`); }
  if (mm.length) console.log("  FINANCE MISMATCHES:\n  " + mm.join("\n  ")); }
// #10 difference note: word for word from the Warehouse gate file, and rendered in #10's How it's calculated; #13 title follows the toggle
{ const { DIFFERENCE_NOTES } = await import("../lib/differenceNotes.mjs"); const gate = readFileSync("/workspace/skyscraper/unitedstats-warehouse/gates/DIFFERENCE-NOTES.md", "utf8");
  const line = (gate.split("\n").find((l) => l.startsWith("- **#10 ")) || "").replace(/^- \*\*#10 [^*]+:\*\* /, "");
  const fin = readFileSync(new URL("../src/charts/finance.tsx", import.meta.url), "utf8"), debt = fin.slice(fin.indexOf("export const debtSpec"), fin.indexOf("export const houseSpec"));
  const meta = readFileSync(new URL("../src/charts/meta.ts", import.meta.url), "utf8");
  check(line.length > 50 && DIFFERENCE_NOTES["10"] === line && /DIFFERENCE_NOTES\["10"\]/.test(debt), `#10 How it's calculated note = DIFFERENCE-NOTES.md word for word ("${line.slice(0, 48)}…")`);
  check(/"13": \{[^\n]*titles: \{ headline: "Inflation", core: "Core inflation" \}/.test(meta) && /chartTitle\(cfg\.id, view\)/.test(readFileSync(new URL("../src/components/HeatStrip.tsx", import.meta.url), "utf8")), `#13 title follows the toggle: "Inflation" / "Core inflation"`);
  const src = ["src/components/LineChart.tsx", "src/components/ChartCard.tsx", "lib/charts.mjs"].map((f) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8")).join("\n");
  check(!/toLocaleDateString/.test(src) && /"Sep"/.test(src), `one month formatter everywhere: "Sep", never "Sept"`); }
// Labour wave (#17, #12, #18, #24): expected values read FROM the Warehouse's REFERENCE-FIGURES.md; ours from lib/finance.mjs
{ const F = await import("../lib/finance.mjs"); const md = readFileSync("/workspace/skyscraper/unitedstats-warehouse/REFERENCE-FIGURES.md", "utf8");
  const sec = (n) => new RegExp(`## Card ${n} [^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`).exec(md)[1].split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2).split(" | "));
  const J = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8")), num = (t) => parseFloat(t.replace("−", "-"));
  const y = F.youthRatio(J("oecd_unemployment_rate_m_15_24.json"), J("oecd_unemployment_rate_m_15plus.json")), bad17 = [];
  for (const [c, per, v] of sec(17)) { const r = y.rows.find((x) => x.code === c); if (!r || r.end !== per || Math.abs(r.ratio - num(v)) > 0.005 + 1e-9) bad17.push(`${c} ${per} ours ${r?.end} ${r?.ratio?.toFixed(3)} vs ${v}`); }
  const sorted17 = y.rows.every((r, i, a) => !i || a[i - 1].ratio >= r.ratio), spk = y.rows.every((r) => r.spark.length === 60 && Math.abs(r.spark[59] - r.ratio) < 1e-12);
  check(sec(17).length === 7 && !bad17.length && sorted17 && spk, `#17 youth ÷ overall at each own latest month = Warehouse (2 dp) for all 7 (${y.rows.map((r) => `${r.code} ${r.end} ${r.ratio.toFixed(2)}`).join(", ")}); sorted; 60-month sparks end on the bar value${bad17.length ? " MISMATCH " + bad17.join("; ") : ""}`);
  const w = F.slope(J("oecd_avg_annual_wage_usd_ppp.json"), 1990), bad12 = [];
  for (const [c, per, v] of sec(12)) { const r = w.rows.find((x) => x.code === c); if (per !== `1990→${r.end}` || Math.abs(r.change - num(v)) > 0.05 + 1e-9) bad12.push(`${c} ours ${r.change.toFixed(2)} vs ${v}`); }
  check(sec(12).length === 7 && !bad12.length, `#12 wage growth 1990→2025 = Warehouse (1 dp) for all 7 (${w.rows.map((r) => `${r.code} ${r.change.toFixed(1)}%`).join(", ")})${bad12.length ? " MISMATCH " + bad12.join("; ") : ""}`);
  const h = F.changeSince(J("oecd_avg_annual_hours_worked.json"), 2000), bad18 = [];
  for (const [c, per, v] of sec(18)) { const r = h.rows.find((x) => x.code === c), m = /(-?[\d.]+) h \((-?[\d.]+)%\)/.exec(v); if (per !== `2000→${r.end}` || Math.abs(r.change - +m[1]) > 0.5 + 1e-9 || Math.abs(r.pct - +m[2]) > 0.05 + 1e-9) bad18.push(`${c} ours ${r.change.toFixed(1)} h ${r.pct.toFixed(2)}% vs ${v}`); }
  check(sec(18).length === 7 && !bad18.length, `#18 hours change 2000→2025 = Warehouse (hours to 1, % to 1 dp) for all 7 (${h.rows.map((r) => `${r.code} ${Math.round(r.change)}`).join(", ")})${bad18.length ? " MISMATCH " + bad18.join("; ") : ""}`);
  const ls = J("ilo_labour_share_gdp.json"), sh = F.slope(ls, 2004, "pts"), bad24 = [];
  for (const [c, per, v] of sec(24)) { const r = sh.rows.find((x) => x.code === c), m = /([\d.]+)→([\d.]+) \(Δ (-?[\d.]+)\)/.exec(v);
    if (per !== `2004→${r.end}` || Math.abs(r.startValue - +m[1]) > 0.05 + 1e-9 || Math.abs(r.endValue - +m[2]) > 0.05 + 1e-9 || Math.abs(r.change - +m[3]) > 0.051) bad24.push(`${c} ours ${r.end} ${r.change.toFixed(2)} vs ${per} ${v}`); }
  check(sec(24).length === 7 && !bad24.length && F.wholeFlag(ls, "USA") === "I" && F.wholeFlag(ls, "CAN") === null, `#24 labour share 2004→own last actual year = Warehouse for all 7 (${sh.rows.map((r) => `${r.code} ${r.end} ${r.change.toFixed(1)}`).join(", ")}); US whole-series ILO "I" flag → solid line + stats-box tag${bad24.length ? " MISMATCH " + bad24.join("; ") : ""}`); }
// Economy wave (#3, #25, #15): expected values read FROM the Warehouse REFERENCE-FIGURES.md; ours from lib/waves.mjs
{ const V = await import("../lib/waves.mjs"); const md = readFileSync("/workspace/skyscraper/unitedstats-warehouse/REFERENCE-FIGURES.md", "utf8");
  const sec = (n) => new RegExp(`## Card ${n} [^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`).exec(md)[1].split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2).split(" | "));
  const J = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
  const L = V.league(J("oecd_gdp_per_capita_ppp_current.json")), bad3 = [];
  for (const [c, y, v] of sec(3)) { const i = L.years.indexOf(y), m = /rank (\d) \(([\d,]+)\)/.exec(v); if (L.rank[c][i] !== +m[1] || Math.round(L.value[c][i]) !== +m[2].replace(/,/g, "")) bad3.push(`${c} ${y} ours ${L.rank[c][i]} ${Math.round(L.value[c][i])} vs ${v}`); }
  const yrsRanked = L.years.every((y, i) => { const pre = +y < 1991, r = V.ORDER.filter((c) => !(pre && c === "DEU")).map((c) => L.rank[c][i]); return r.every((x) => x !== null) && new Set(r).size === r.length && Math.max(...r) === r.length && (!pre || L.rank.DEU[i] === null); });
  check(sec(3).length === 7 && !bad3.length && L.years[0] === "1970" && yrsRanked, `#3 GDP per person rank ${L.years[L.years.length - 1]} = Warehouse for all 7 (${sec(3).map(([c, , v]) => `${c} ${v.split(" (")[0].replace("rank ", "")}`).join(", ")}); every year 1970–1990 ranks the six without Germany 1–6, 1991+ ranks all seven 1–7${bad3.length ? " MISMATCH " + bad3.join("; ") : ""}`);
{ const b = readFileSync("src/components/Bump.tsx", "utf8"), e = +L.years[L.years.length - 1];
  const win = ["10", "20", "50"].map((w) => `${w}Y = ${e - +w}–${e}${L.years.includes(String(e - +w)) ? "" : " (MISSING START)"}`);
  check(/lg_win: \["50", WINS\]/.test(b) && /WINS = \["10", "20", "50"\]/.test(b) && /"1970": "50", "1990": "20", "2005": "10"/.test(b) && /\+L\.years\[L\.years\.length - 1\] - \+st\.lg_win/.test(b) && !/"1970"\]/.test(b) && win.every((x) => !x.includes("MISSING")), `#3 timeframe 10Y/20Y/50Y (default 50Y) counted back from own last year: ${win.join(", ")}; old lg_from 1970→50Y, 1990→20Y, 2005→10Y`); }
{ const sw = md.slice(md.indexOf("## #3 GDP per person ranking, standard windows")), bw = [];
  const rows = [...sw.matchAll(/^- (10Y|20Y|50Y) start \((\d{4})\).*?: (1\. .+)$|^- (End|Germany entry point) \((\d{4})\): (.+)$/gm)].map((m) => [m[2] ?? m[5], m[3] ?? m[6], m[1] ?? m[4]]);
  for (const [y, list, lab] of rows) { const i = L.years.indexOf(y); for (const [, r, c, v] of list.matchAll(/(\d)\. (\w{3}) \$([\d,]+)/g)) if (L.rank[c][i] !== +r || Math.round(L.value[c][i]) !== +v.replace(/,/g, "")) bw.push(`${lab} ${c} ours ${L.rank[c][i]} $${Math.round(L.value[c][i])} vs ${r} $${v}`); }
  const e = +L.years[L.years.length - 1], wantY = ["10Y", "20Y", "50Y"].map((w) => String(e - parseInt(w)));
  const ex = rows.find((r) => r[2] === "50Y"); check(rows.length === 5 && rows.slice(0, 3).every((r, k) => r[0] === wantY[k]) && rows.at(-1)[0] === String(e) && rows[3][0] === "1991" && !/DEU/.test(ex[1]) && L.rank.DEU[L.years.indexOf(ex[0])] === null && !bw.length, `#3 window start/end ranks = Warehouse 'standard windows' (10Y ${wantY[0]}, 20Y ${wantY[1]}, 50Y ${wantY[2]} without Germany, Germany entry 1991, end ${e}; 34 ranks + values)${bw.length ? " MISMATCH " + bw.join("; ") : ""}`); }
{ const ec = readFileSync("src/charts/economy.tsx", "utf8"), sr = readFileSync("src/components/StackRank.tsx", "utf8");
  check(/parts: \["Business", "Government, universities and other"\], fmt: f1,/.test(ec) && /const f1 = \(v: number\) => `\$\{v\.toFixed\(1\)\}%`/.test(ec) && sr.includes('className="yp-n"><YearPick'), "#15 displays 1 dp (e.g. 3.4%); golden compares full values; 390 year selector is the picker-style dropdown"); }
  const G = V.ownLatest(J("oecd_idd_gini_disposable.json"), 100), bad25 = [];
  for (const [c, y, v] of sec(25)) { const r = G.find((x) => x.code === c); if (r.end !== y || Math.abs(r.value / 100 - +v) > 0.0005 + 1e-9) bad25.push(`${c} ours ${r.end} ${(r.value / 100).toFixed(4)} vs ${y} ${v}`); }
  check(sec(25).length === 7 && !bad25.length, `#25 Gini own latest year = Warehouse for all 7 (${G.map((r) => `${r.code} ${r.end} ${r.value.toFixed(1)}`).join(", ")}; shown ×100)${bad25.length ? " MISMATCH " + bad25.join("; ") : ""}`);
{ const rb = readFileSync("src/components/RankBar.tsx", "utf8"), ec = readFileSync("src/charts/economy.tsx", "utf8");
  check(/className="rby"[^>]*>\{CODE2\[row\.code\]\} \{row\.end\}/.test(rb) && !/@media[^{]*\{[^}]*\.rby\{[^}]*display:none/.test(readFileSync("src/app/globals.css", "utf8")) && ec.includes('note: "Years differ by country"'), "#25 every dot label reads code + own year ('CA 2023', 'JP 2021') at all widths; stats box says years differ by country"); }
  const ge = J("oecd_msti_gerd_pct_gdp.json"), be = J("oecd_msti_berd_pct_gdp.json"), bad15 = [];
  for (const [c, y, v] of sec(15)) { const r = V.rdStack(ge, be, y).rows.find((x) => x.code === c), m = /GERD ([\d.]+), BERD ([\d.]+), rest ([\d.]+)/.exec(v);
    if (Math.abs(r.total - +m[1]) > 0.005 + 1e-9 || Math.abs(r.business - +m[2]) > 0.005 + 1e-9 || Math.abs(r.rest - +m[3]) > 0.0051) bad15.push(`${c} ${y} ours ${r.total?.toFixed(3)} ${r.business?.toFixed(3)} ${r.rest?.toFixed(3)} vs ${v}`); }
  const d23 = V.rdStack(ge, be, V.RD_DEFAULT).rows;
  check(sec(15).length === 7 && !bad15.length && V.RD_DEFAULT === "2023" && d23.every((r) => r.total !== null && r.rest !== null), `#15 R&D GERD/BERD/rest = Warehouse at each country's year for all 7; default year 2023 has all seven (never mixes years)${bad15.length ? " MISMATCH " + bad15.join("; ") : ""}`); }
// Society wave (#4, #11, #23, #8, #16): expected values read FROM the Warehouse REFERENCE-FIGURES.md
{ const V = await import("../lib/waves.mjs"), F = await import("../lib/finance.mjs"); const md = readFileSync("/workspace/skyscraper/unitedstats-warehouse/REFERENCE-FIGURES.md", "utf8");
  const sec = (n) => new RegExp(`## Card ${n} [^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`).exec(md)[1].split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2).split(" | "));
  const J = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8")), near = (a, b, t) => a !== null && Math.abs(a - b) <= t + 1e-9;
  const g = F.slope(J("wb_SP.POP.65UP.TO.ZS.json"), 1990, "pts"), b4 = [];
  for (const [c, per, v] of sec(4)) { const r = g.rows.find((x) => x.code === c), m = /([\d.]+)→([\d.]+) \(Δ ([\d.]+)\)/.exec(v); if (per !== `1990→${r.end}` || !near(r.startValue, +m[1], 0.05) || !near(r.endValue, +m[2], 0.05) || !near(r.change, +m[3], 0.051)) b4.push(`${c} ours ${r.change?.toFixed(2)} vs ${v}`); }
  check(sec(4).length === 7 && !b4.length, `#4 share 65+ 1990→2025 = Warehouse for all 7 (${g.rows.map((r) => `${r.code} +${r.change.toFixed(1)}`).join(", ")})${b4.length ? " MISMATCH " + b4.join("; ") : ""}`);
  const fe = V.ownLatest(J("wb_SP.DYN.TFRT.IN.json")), b11 = [];
  for (const [c, y, v] of sec(11)) { const r = fe.find((x) => x.code === c); if (r.end !== y || !near(r.value, +v, 0.005)) b11.push(`${c} ours ${r.end} ${r.value} vs ${y} ${v}`); }
  check(sec(11).length === 7 && !b11.length, `#11 fertility latest = Warehouse for all 7 (${fe.map((r) => `${r.code} ${r.value.toFixed(2)}`).join(", ")}); reference line 2.1${b11.length ? " MISMATCH " + b11.join("; ") : ""}`);
  const mg = J("wb_SM.POP.TOTL.ZS.json"), at = (c, y) => { const s = mg.series[c]; const i = s.periods.indexOf(y); return i < 0 ? null : s.values[i]; }, b23 = [];
  for (const [c, y, v, n] of sec(23)) { const b = /1990: ([\d.]+)/.exec(n); if (!near(at(c, y), +v, 0.05) || !near(at(c, "1990"), +b[1], 0.05)) b23.push(`${c} ours ${at(c, y)} / ${at(c, "1990")} vs ${v} / ${b[1]}`); }
  check(sec(23).length === 7 && !b23.length, `#23 migrant share 2024 and 1990 = Warehouse for all 7; squares = round(share)${b23.length ? " MISMATCH " + b23.join("; ") : ""}`);
  const hx = J("wb_SH.XPD.CHEX.GD.ZS.json"), le = J("oecd_life_expectancy_birth.json"), b8 = [];
  for (const [c, y, v] of sec(8)) { const p = V.pairs(hx, le, y).find((x) => x.code === c), m = /([\d.]+)% GDP, ([\d.]+) yrs/.exec(v); if (!near(p.x, +m[1], 0.05) || !near(p.y, +m[2], 0.05)) b8.push(`${c} ${y} ours ${p.x} ${p.y} vs ${v}`); }
  const d23 = V.pairs(hx, le, "2023").every((p) => p.x !== null && p.y !== null), d24 = V.pairs(hx, le, "2024").filter((p) => p.x === null).map((p) => p.code).join(",");
  check(sec(8).length === 7 && !b8.length && d23 && d24 === "USA,JPN", `#8 health spending and life expectancy = Warehouse at each country's year for all 7; default 2023 complete; 2024 n/a for ${d24}${b8.length ? " MISMATCH " + b8.join("; ") : ""}`);
  const ta = V.twoAges(J("oecd_eag_tertiary_attainment_25_64.json"), J("oecd_eag_tertiary_attainment_25_34.json")), b16 = [];
  for (const [c, y, v] of sec(16)) { const r = ta.find((x) => x.code === c), m = /25-34 ([\d.]+) vs 25-64 ([\d.]+) \(gap ([\d.]+)\)/.exec(v); if (r.end !== y || !near(r.b, +m[1], 0.05) || !near(r.a, +m[2], 0.05) || !near(r.gap, +m[3], 0.051)) b16.push(`${c} ours ${r.gap?.toFixed(2)} vs ${v}`); }
  check(sec(16).length === 7 && !b16.length, `#16 degree gap 25–34 vs 25–64 = Warehouse for all 7 (${ta.map((r) => `${r.code} ${r.gap.toFixed(1)}`).join(", ")})${b16.length ? " MISMATCH " + b16.join("; ") : ""}`); }
// Environment wave (#5, #14, #9): expected values read FROM the Warehouse REFERENCE-FIGURES.md (and the Ember gate for #9)
{ const V = await import("../lib/waves.mjs"); const md = readFileSync("/workspace/skyscraper/unitedstats-warehouse/REFERENCE-FIGURES.md", "utf8");
  const sec = (n) => new RegExp(`## Card ${n} [^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`).exec(md)[1].split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2).split(" | "));
  const J = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
  const T = V.trails(J("wb_NY.GDP.PCAP.PP.KD.json"), J("wb_EN.GHG.CO2.PC.CE.AR5.json")), b5 = [];
  for (const [c, per, v] of sec(5)) { const t = T.find((x) => x.code === c), m = /GDP pc (-?[\d.]+)%, CO2 pc (-?[\d.]+)%/.exec(v); if (per !== `${t.from}→${t.to}` || Math.round(t.dx) !== +m[1] || Math.round(t.dy) !== +m[2]) b5.push(`${c} ours ${t.dx.toFixed(1)} ${t.dy.toFixed(1)} vs ${v}`); }
  check(sec(5).length === 7 && !b5.length, `#5 GDP per person and CO2 per person change 1990→2024 = Warehouse (whole %) for all 7${b5.length ? " MISMATCH " + b5.join("; ") : ""}`);
  const ghg = J("oecd_ghg_total.json"), pop = J("econ_population_joined.json"), tot = V.emissions(ghg, pop, "total"), pp = V.emissions(ghg, pop, "pp"), b14 = [];
  for (const [c, per, v] of sec(14)) { const r = tot.find((x) => x.code === c); if (per !== `1990→${r.end}` || Math.abs(r.change - +v) > 0.05 + 1e-9) b14.push(`${c} ours ${r.end} ${r.change.toFixed(2)} vs ${per} ${v}`); }
  check(sec(14).length === 7 && !b14.length && tot.find((r) => r.code === "USA").end === "2022", `#14 total GHG change since 1990 = Warehouse for all 7 (US to 2022: early ender, not ranked)${b14.length ? " MISMATCH " + b14.join("; ") : ""}`);
  const ppRef = [...md.slice(md.indexOf("## #14 Greenhouse gas emissions per person")).matchAll(/- (\w{3}): 1990 ([\d.]+) t\/person; (\d{4}) ([\d.]+) t\/person; change (-?[\d.]+)%/g)], bpp = [];
  for (const [, c, a, y, b, ch] of ppRef) { const r = pp.find((x) => x.code === c); if (Math.abs(r.pts[0].value - +a) > 0.0005 + 1e-9 || r.end !== y || Math.abs(r.pts[r.pts.length - 1].value - +b) > 0.0005 + 1e-9 || Math.abs(r.change - +ch) > 0.005 + 1e-9) bpp.push(`${c} ours ${r.pts[0].value.toFixed(3)} ${r.end} ${r.change.toFixed(3)} vs ${a} ${y} ${ch}`); }
  check(ppRef.length === 7 && !bpp.length, `#14 per person (t CO2e, yearly pop = mean of 4 quarters, Y quarters count) = Warehouse for all 7 (${pp.map((r) => `${r.code} ${r.change.toFixed(2)}%`).join(", ")})${bpp.length ? " MISMATCH " + bpp.join("; ") : ""}`);
  const estY = Object.fromEntries(pp.map((r) => [r.code, r.pts.filter((q) => q.est).map((q) => q.year)])), dashed = (c) => { const p = pp.find((r) => r.code === c).pts; return p.some((q, i) => i && q.est && p[i - 1].est); };
  const flagYears = (c) => { const s = pop.population[c], out = new Set(); s.periods.forEach((p, i) => { const st = Array.isArray(s.status) ? s.status[i] : s.status?.[p]; if (st === "Y" && +p.slice(0, 4) >= 1990) out.add(p.slice(0, 4)); }); return [...out].filter((y) => ghg.series[c].periods.includes(y)); };
  const okEst = V.ORDER.every((c) => JSON.stringify(estY[c]) === JSON.stringify(flagYears(c))) && estY.DEU.join() === "1990" && !dashed("DEU") && dashed("GBR") && dashed("ITA") && dashed("JPN") && !dashed("CAN") && !dashed("FRA") && !dashed("USA");
  check(okEst, `#14 per person estimated-population years follow the joined file's Y flags (DEU ${estY.DEU.join()}; GBR ${estY.GBR[0]}–${estY.GBR.at(-1)}; ITA ${estY.ITA[0]}–${estY.ITA.at(-1)}; JPN ${estY.JPN[0]}–${estY.JPN.at(-1)}); dashed: UK, Italy, Japan; Germany single tagged point, no dash; CA/FR/US solid`);
  const em = J("ember_electricity_mix_share.json"); let worst = 0, aggOk = true, ukNa = true;
  for (const c of V.ORDER) for (const r of V.mix(em, c)) { const t = r.bands.reduce((a, b) => a + (b.value ?? 0), 0), f = r.fuels.reduce((a, b) => a + (b.value ?? 0), 0); worst = Math.max(worst, Math.abs(t - 100)); if (Math.abs(t - f) > 1e-9) aggOk = false;
    if (c === "GBR" && +r.year >= 2020 && r.fuels.find((x) => x.name === "Other Renewables").value !== null) ukNa = false; }
  const noOR = ["CAN", "JPN"].every((c) => !em.series[c]["Other Renewables"]);
  check(worst <= 0.1 && aggOk && ukNa && noOR && V.MIX_BANDS.length === 6, `#9 Ember: six bands = sum of the 9 fuels only (aggregates never added), every country-year totals 100 ± ${worst.toFixed(2)}; UK other renewables 2020–25 n/a (not 0); Canada/Japan have no other-renewables band`);
  const r9 = sec(9); check(r9.length === 7 && /wb_EG\.ELC/.test(md.slice(md.indexOf("## Card 9"), md.indexOf("## Card 14"))), `#9 EXPECTED difference: REFERENCE-FIGURES Card 9 is computed from World Bank shares (e.g. ${r9[0][0]} ${r9[0][1]}: ${r9[0][2].split(" |")[0]}); the chart uses the gated Ember file (one-chart exception), so it is checked against the Ember gate instead`); }
// Source lines wrap on every chart and never truncate (only descriptions may); the COVID band has its own tap target at 390
{ const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8"), rules = [...css.matchAll(/([^{}]*\.source[^{}]*)\{([^}]*)\}/g)];
  const lc = readFileSync(new URL("../src/components/LineChart.tsx", import.meta.url), "utf8");
  check(rules.length > 0 && rules.every(([, , b]) => !/nowrap|ellipsis|line-clamp/.test(b)) && /white-space:normal/.test(rules[0][2]), `source lines: ${rules.length} CSS rules, none nowrap/ellipsis/clamp (wrap on every chart at every width)`);
  check(/data-testid="covid-hit"/.test(lc) && /e\.stopPropagation\(\); setHover\(null\); setCovTip/.test(lc), `COVID band: own ≥24px tap target at 390, above the read-out layer; tap shows the label, not the stats box`); }
// Labour fixes: #17 title/description; #24 headline dates use each country's own end
{ const F = await import("../lib/finance.mjs"); const meta = readFileSync(new URL("../src/charts/meta.ts", import.meta.url), "utf8"), slope = readFileSync(new URL("../src/components/Slope.tsx", import.meta.url), "utf8");
  const ls = JSON.parse(readFileSync(new URL("../data/ilo_labour_share_gdp.json", import.meta.url), "utf8")), d = F.slope(ls, 2004, "pts");
  const ok24 = d.rows.every((r) => r.end === ls.series[r.code].periods.filter((p, i) => ls.series[r.code].values[i] !== null).pop()) && /date: `\$\{d\.start\} → \$\{q\.end\}`/.test(slope);
  check(/titles: \{ _: "Youth unemployment vs overall rate" \}, desc: "Youth unemployment rate \(age 15–24\) ÷ overall rate"/.test(meta), `#17 title "Youth unemployment vs overall rate", description "Youth unemployment rate (age 15–24) ÷ overall rate"`);
  check(ok24, `#24 headline dates = each country's own end (${d.rows.map((r) => `${r.code} 2004 → ${r.end}`).join(", ")})`); }
// #7 policy rates: each line's latest figure (the app's own buildLine, every window) = Warehouse REFERENCE-FIGURES.md Card 7, read from the file
{ const S = await import("../lib/series.mjs"); const md = readFileSync("/workspace/skyscraper/unitedstats-warehouse/REFERENCE-FIGURES.md", "utf8");
  const rows = /## Card 7 [^\n]*\n([\s\S]*?)(?=\n## |$)/.exec(md)[1].split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2).split(" | "));
  const ds = S.policyDataset(JSON.parse(readFileSync(new URL("../data/bis_policy_rate_m.json", import.meta.url), "utf8"))), bad = [];
  for (const yrs of [1, 5, 10, 20, 50]) for (const [c, per, v] of rows) { const l = S.buildLine(ds, c, yrs, "level"), lp = [...l.points].reverse().find((q) => q.value !== null);
    if (!lp || lp.period !== per || Math.abs(lp.value - parseFloat(v)) > 1e-9 || Math.abs(l.last - parseFloat(v)) > 1e-9) bad.push(`${yrs}Y ${c} ours ${lp?.period} ${lp?.value} vs ${per} ${v}`); }
  check(rows.length === 5 && !bad.length, `#7 policy rate latest = Warehouse REFERENCE-FIGURES.md for ${rows.map(([c, p, v]) => `${c} ${p} ${v}`).join(", ")} at every window${bad.length ? " MISMATCH " + bad.slice(0, 4).join("; ") : ""}`); }
// Round 4c decimals: rates in percent 2 dp (unemployment, inflation, policy), shares of GDP/income 1 dp, growth 1 dp, point changes 2 dp
{ const S = await import("../lib/series.mjs"); const rd = (f) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
  const lc = rd("src/components/LineChart.tsx"), hs = rd("src/components/HeatStrip.tsx"), fin = rd("src/charts/finance.tsx");
  const rateUses = (lc.match(/toFixed\(R \? DISPLAY_DP\.rate : 1\)/g) || []).length;
  check(S.DISPLAY_DP.rate === 2 && S.DISPLAY_DP.share === 1 && S.DISPLAY_DP.pct === 1 && S.DISPLAY_DP.pts === 2 && rateUses >= 4 && /toFixed\(DISPLAY_DP\.rate\)/.test(hs) && /const pct1 = \(v: number\) => `\$\{v\.toFixed\(1\)\}%`/.test(fin)
    && S.fmtHeadline(12.345, "gdp").endsWith("12.3%") && S.fmtHeadline(-0.534, "unemp").endsWith("0.53"),
    `Round 4c decimals: rates 2 dp (unemployment/policy end labels, stats box, table: ${rateUses} uses; heat cells), shares 1 dp, growth 1 dp, point changes 2 dp`); }
// display rule: % changes 1 dp with "%", pts 2 dp; labels follow the displayed rounding
{ const { DISPLAY_DP } = await import("../lib/series.mjs"); const H = (a, b, m) => headlineLabels({ fastest: { value: a }, slowest: { value: b } }, m);
  const ok = DISPLAY_DP.pct === 1 && DISPLAY_DP.pts === 2 && fmtHeadline(283.1749, "index") === "+283.2%" && fmtHeadline(99.08, "index") === "+99.1%" && fmtHeadline(-0.5321, "unemp") === "−0.53"
    && fmtHeadline(0.04, "index") === "0.0%" && fmtHeadline(-0.04, "jobs") === "0.0%" && fmtHeadline(-0.004, "unemp") === "0.00"
    && H(0.04, -0.04, "index").fast === "No change" && H(0.04, -0.04, "index").slow === "No change" && H(0.06, -0.3, "jobs").fast === "Fastest growth" && H(0.004, -0.6, "unemp").fast === "No change" && H(0.004, -0.6, "unemp").slow === "Biggest fall";
  let bad = 0; for (const d of [EV.gdp, EV.pc]) for (const y of [1, 5, 10, 20, 50]) { const h = headlinePick(d, ALL, y, "index"); for (const v of [h.fastest?.value, h.slowest?.value]) if (v != null) { const t = fmtHeadline(v, "index"); if (!t.endsWith("%") || /^[+−]0\.0%$/.test(t)) bad++; } }
  check(ok && !bad, `display rule: % changes "+283.2%" (1 dp, % on every figure), pts "−0.53" (2 dp); ±0.04% shows "0.0%" and reads "No change"; never "+0.0%"/"−0.0%"`); }
// Germany no-data band + US jobs ranking at the shared Aug 2026 (line to Sep)
{ const { noDataBands, jobsDataset, applyStarts, NO_DATA_BAND_LABEL } = await import("../lib/series.mjs"); const JD = jobsDataset(data), JPD = jobsPerCapitaDataset(data, POPJ);
  const cs = [[applyStarts(EV.gdp), "index"], [applyStarts(EV.pc), "index"], [JD, "jobs"], [applyStarts(JPD), "index"]];
  const none = cs.every(([d, m]) => [1, 5, 10, 20].every((y) => !noDataBands(d, ALL, y, m).length));
  const at50 = cs.every(([d, m]) => { const b = noDataBands(d, ALL, 50, m); return b.length === 1 && b[0].code === "DEU" && b[0].label === "Germany: no data before 1991" && b[0].period === "1991-Q1"; });
  const off = cs.every(([d, m]) => !noDataBands(d, ALL.filter((c) => c !== "DEU"), 50, m).length);
  const same = cs.every(([d, m]) => JSON.stringify(headlinePick(d, ALL, 50, m)) === JSON.stringify(headlinePick(d, ALL.filter((c) => c !== "DEU"), 50, m)));
  check(NO_DATA_BAND_LABEL === "{country}: no data before {year}" && none && at50 && off && same, `no-data band: Germany on GDP/GDP pc/Jobs/Jobs pc only on 50Y ("Germany: no data before 1991", to Q1 1991), only when Germany is selected, none on 1Y–20Y; 50Y headline identical with Germany on and off`);
  const us = buildLine(JD, "USA", 1, "jobs"), last = [...us.points].reverse().find((p) => p.value !== null).period, R4j = JSON.parse(readFileSync(new URL("./golden/golden_round4.json", import.meta.url)));
  check(JD.rankEnd === "2026-08" && last === "2026-09" && Math.abs(us.growth - -0.5410) < 0.00005, `jobs: US ranked to the shared Aug 2026 (1Y ${us.growth.toFixed(4)}%), line + stats box run to ${last}`);
  const r4sha = createHash("sha256").update(readFileSync(new URL("./golden/golden_round4.json", import.meta.url))).digest("hex");
  check(r4sha.startsWith("232772a6") && r4sha.endsWith("d0f1"), `golden_round4.json LOCKED sha ${r4sha.slice(0, 8)}…${r4sha.slice(-4)}`); }
// Round 4 goldens (Warehouse analysis/golden_round4.json, copied to scripts/golden/). round3 stays the 1Y/5Y/10Y baseline.
{ const { unempLongDataset, ownChange, windowLabel: WL, econWithJoinedPopulation } = await import("../lib/series.mjs");
  const { UNEMP_NOTE, UNEMP_EU_NOTE } = { UNEMP_NOTE: (readFileSync(new URL("../src/components/ChartCard.tsx", import.meta.url), "utf8").match(/UNEMP_NOTE = "([^"]+)"/) || [])[1], UNEMP_EU_NOTE: (readFileSync(new URL("../src/components/ChartCard.tsx", import.meta.url), "utf8").match(/UNEMP_EU_NOTE = "([^"]+)"/) || [])[1] };
  const r4raw = readFileSync(new URL("./golden/golden_round4.json", import.meta.url)), R4 = JSON.parse(r4raw), r4sha = createHash("sha256").update(r4raw).digest("hex");
  const r3sha = createHash("sha256").update(readFileSync(new URL("./golden/golden_round3.json", import.meta.url))).digest("hex");
  const up = createHash("sha256").update(readFileSync("/workspace/skyscraper/canada-factcheck/analysis/golden_round4.json")).digest("hex");
  check(r3sha.startsWith("5246aebe"), `golden_round3.json kept (sha ${r3sha.slice(0, 8)}) as the 1Y/5Y/10Y baseline`);
  console.log(`golden_round4.json sha ${r4sha.slice(0, 8)}${up !== r4sha ? ` — Warehouse copy CHANGED (now ${up.slice(0, 8)}): re-copy and re-run` : " (matches Warehouse copy)"}`);
  const UL = unempLongDataset(JSON.parse(readFileSync(new URL("../data/c1_unemployment_rate_long.json", import.meta.url))));
  const T = R4.unemployment_long_pts_aug2026, rows = [];
  for (const [k, byW] of Object.entries(T)) { if (!/^[A-Z]{3}/.test(k)) continue; const c = k.slice(0, 3), own = k.includes("own");
    for (const [wk, want] of Object.entries(byW)) { const y = parseInt(wk), l = buildLine(UL, c, y, "unemp");
      let got = l.full ? l.growth : null; if (own) { const o = ownChange(UL, c, y); got = o && !l.full ? o.change : null; }
      rows.push([c + (own ? " (own, to Jun 2026)" : ""), y, want === null ? (got === null ? "ok" : "BAD") : got !== null && Math.abs(got - want) < 0.005 + 1e-9 ? "ok" : "BAD", want, got]); } }
  const badR = rows.filter((r) => r[2] === "BAD");
  check(!badR.length, `round4 unemployment (final, Aug 2026 end): ${rows.length - badR.length}/${rows.length} match ±0.005 pts incl. 50Y n/a for DE/FR/IT/UK and UK own figure${badR.length ? " — DIFF " + badR.map(([c, y, , w, g]) => `${c} ${y}Y ours ${g === null ? "n/a" : g.toFixed(3)} vs ${w}`).join("; ") : ""}`);
  // pending: GDP per capita + jobs per capita 50Y being recomputed by Warehouse
  const JPR = jobsPerCapitaDataset(data, POPJ), pend = [];
  for (const [c, want] of Object.entries(R4.gdp_per_capita_50Y_pct || {})) { const g = buildLine(EV.pc, c, 50, "index").growth; pend.push(`pc ${c} ours ${g?.toFixed(2)} vs ${want}`); }
  for (const c of ["CAN", "USA"]) { const g = buildLine(JPR, c, 50, "index").growth; pend.push(`jobs pc ${c} ours ${g?.toFixed(4)} vs ${R4.jobs_per_capita_pct[c]["50Y"]}`); }
  for (const c of ALL) { const l = buildLine(JPR, c, 50, "index"), f = l.points.find((p) => p.value !== null), e = [...l.points].reverse().find((p) => p.value !== null);
    if (R4.jobs_per_capita_pct[c] && R4.jobs_per_capita_pct[c]["50Y"] === null && c === "DEU") check(!l.full, "round4 jobs per capita 50Y DEU: null (late starter)");
    if (R4.jobs_per_capita_pct[c]?.["50Y"] != null) check(Math.abs(l.growth - R4.jobs_per_capita_pct[c]["50Y"]) < 0.001, `round4 jobs per capita 50Y ${c}: ${f.period} -> ${e.period} ${l.growth.toFixed(4)}% vs ${R4.jobs_per_capita_pct[c]["50Y"]}`);
    console.log(`jobs per capita 50Y ${c}: ${l.full ? "FULL, ranked" : `late starter from ${l.late}`} ${f.period} -> ${e.period}: ${l.growth >= 0 ? "+" : ""}${l.growth.toFixed(4)}%${R4.jobs_per_capita_pct[c] ? ` (round4 ${R4.jobs_per_capita_pct[c]["50Y"]})` : " (not in round4)"}`); }
  for (const [c, want] of Object.entries(R4.gdp_per_capita_50Y_pct || {})) { if (want === null) { check(!buildLine(EV.pc, c, 50, "index").full, `round4 GDP per capita 50Y ${c}: null (late starter, not ranked)`); continue; } const g = buildLine(EV.pc, c, 50, "index").growth; check(Math.abs(g - want) < 0.005 + 1e-9, `round4 GDP per capita 50Y ${c}: ${g.toFixed(2)}% vs ${want}`); }
  for (const c of ["CAN", "USA"]) for (const w of ["1Y", "5Y", "10Y", "20Y"]) { const g = buildLine(JPR, c, parseInt(w), "index").growth; check(Math.abs(g - R4.jobs_per_capita_pct[c][w]) < 0.001, `round4 jobs per capita ${w} ${c}: ${g.toFixed(4)} vs ${R4.jobs_per_capita_pct[c][w]}`); }
  // each chart's 50Y start = its own shared end minus 50 years (same months)
  const labs = { unemployment: WL(UL, ["CAN", "USA"], 50, "unemp").text, gdp: WL(EV.gdp, ["CAN"], 50, "index").text, "gdp per capita": WL(EV.pc, ["CAN"], 50, "index").text, "jobs per capita": WL(JPR, ["CAN"], 50, "index").text, jobs: WL(data, ["CAN"], 50, "jobs").text };
  check(labs.unemployment.startsWith("Aug 1976 – ") && labs.gdp.startsWith("Q2 1976 – Q2 2026") && labs["gdp per capita"].startsWith("Q1 1976 – Q1 2026") && labs["jobs per capita"].startsWith("Mar 1976 – Mar 2026"),
    `50Y start labels per chart: ${Object.entries(labs).map(([k, v]) => `${k} "${v}"`).join("; ")}`);
  // Canada Dec 1975 break stays in the data but never draws (outside every window)
  const cb = WINDOWS_ALL.flatMap((y) => buildLine(UL, "CAN", y, "unemp").breaks.filter((b) => { const m0 = buildLine(UL, "CAN", y, "unemp").points[0].mi; return b.mi >= m0; }));
  check(UL.monthly.CAN.status["1975-12"] === "B" && !cb.length, `unemployment: Canada Dec 1975 break kept in data (B), drawn on no window (1Y–50Y)`);
  check(UNEMP_NOTE === "OECD monthly estimates; European figures differ from the earlier quarterly series by up to 1.1 points." && UNEMP_EU_NOTE === "smoothed across survey changes; no break flagged by OECD", "unemployment How it's calculated notes: word for word");
  const it = buildLine(UL, "ITA", 50, "unemp"), usOct = buildLine(UL, "USA", 1, "unemp").points.find((p) => p.period === "2025-10");
  check(UL.monthly.ITA.status["1983-01"] === "P" && UL.monthly.ITA.status["1991-12"] === "P" && !estAt(UL, "ITA", "1990-01") && usOct.value === null && it.points.filter((p) => p.mi < 1983 * 12 + 2).every((p) => p.value === null),
    "unemployment labels: Italy 1983–1991 provisional (stats box tag; line solid, not dashed); US Oct 2025 n/a; n/a before each start, never 0"); }
if (fail) { console.error(`${fail} check(s) failed`); process.exit(1); }
// Popovers on row charts anchor beside the tapped row and flip (Scorecard #22, like #18/#24/#15/#10).
{ const sc = readFileSync("src/components/Scorecard.tsx", "utf8");
  check(/at=\{at\}/.test(sc) && /setAt\(anchorOf\(e\.currentTarget\)\)/.test(sc), "#22 stats box anchors beside the tapped row and flips (never covers it)"); }
// #3 Germany no-data band (same spec as the GDP 50Y band: --ndband white 5% / black 4%, 11px text-2 label, legend at 390).
{ const b = readFileSync("src/components/Bump.tsx", "utf8"), css = readFileSync("src/app/globals.css", "utf8");
  check(/className="ndband" data-code="DEU"/.test(b) && /!narrow && <text[^>]*className="from ndlabel"/.test(b) && /narrow && deJ > 0 && <li><i className="ndkey" \/>\{deLabel\}/.test(b) && css.includes('--ndband:rgba(255,255,255,.05)') && css.includes('--ndband:rgba(0,0,0,.04)') && /\.ndlabel\{font-size:11px;fill:var\(--text-2\)\}/.test(css), "#3 'Germany: no data before 1991' band, GDP 50Y band spec; label inside ≥560px, in the legend at 390"); }
// ≥1024 fixed-height charts size from the viewport (useFitH), never below Design's minimums (480 / 340 under 800px tall).
{ const k = readFileSync("src/components/kit.tsx", "utf8"), use = ["Slope", "Scatter", "Multiples", "YearMultiples"].filter((f) => /useFitH\(/.test(readFileSync(`src/components/${f}.tsx`, "utf8")));
  check(/innerHeight < 800 \? 340 : 480/.test(k) && use.length === 4, `viewport-fit heights on ${use.join(", ")} (#4 #12 #24 #8 #5 #19 #20 #11), minimums 480/340 kept`); }
// Round of Design / App Lead fixes on d2d3975.
{ const rd = (f) => readFileSync(f, "utf8"), soc = rd("src/charts/society.tsx"), kit = rd("src/components/kit.tsx"), tm = rd("src/components/TileMap.tsx"), cc = rd("src/components/ChartCard.tsx"), lc = rd("src/components/LineChart.tsx"), lab = rd("src/charts/labour.tsx"), mx = rd("src/components/MixArea.tsx");
  check(/win: \{ param: "gr_win", old: "gr_start" \}/.test(soc) && /param: "fe_win", old: "fe_from"/.test(soc) && /LEGACY_START[^\n]*"1960": "50"[^\n]*"1990": "20"[^\n]*"2005": "10"/.test(kit), "#4 and #11 use the standard 10Y/20Y/50Y switch; old gr_start/fe_from links map 1960→50Y, 1990→20Y, 2005→10Y");
  check(!/not ranked/.test(tm) && /--text-2" : "--heat-hi"/.test(tm), "#14 diverging tiles around zero (grey = lower, heat hue = higher); no 'not ranked' text");
  check(/URLV\[vv\] === qv \|\| vv === qv/.test(cc), "j_view=jpc (and j_view=pc) restore Jobs per capita");
  check(/<td>\{\/Q\/\.test\(p\.period\) \? qLabel\(p\.period\) : fmtM\(p\.mi\)\}<\/td>/.test(lc) && !/April 2026/.test(rd("src/charts/finance.tsx")), "periods read 'Apr 2026' (screen-reader tables and #10 WEO edition), never '2026-04'/'April 2026'");
  check(/sub: \(\) => <>Youth unemployment rate \(age 15–24\) ÷ overall rate<\/>/.test(lab), "#17 description reads 'Youth unemployment rate (age 15–24) ÷ overall rate'");
  check(/YearPick label="Country"/.test(mx) && /pl = 44/.test(mx) && /className="mixa"[^\n]*onPointerLeave/.test(mx), "#9 country dropdown (no overlap), 100% tick inside the plot, hover survives the stats box"); }
// Quick round on f8cc5d8: #5 subtitle wraps; #4 calc describes the window switch; no 'Starts later' on Jobs; #17 description only; #9 bands + anchored box.
{ const rd = (f) => readFileSync(f, "utf8"), css = rd("src/app/globals.css"), soc = rd("src/charts/society.tsx"), cc = rd("src/components/ChartCard.tsx"), lab = rd("src/charts/labour.tsx"), mx = rd("src/components/MixArea.tsx"), meta = rd("src/charts/meta.ts"), w = await import("../lib/waves.mjs");
  check(/#chart-5 \.sub\{white-space:normal !important;overflow:visible !important;text-overflow:clip !important/.test(css), "#5 subtitle wraps at every width, never truncates");
  check(/Timeframe switch 10Y \/ 20Y \/ 50Y \(default 50Y\), each counted back from the chart’s own last year/.test(soc) && !/start year switchable|1960, 1990, 2005/.test(soc), "#4 How it's calculated describes the 10Y/20Y/50Y switch from its own last year (no start-year wording)");
  check(/kind !== "jobs" && latesL\.length > 0/.test(cc), "no 'Starts later' legend line on Jobs or Jobs per capita");
  check(/sub: \(\) => <>Youth unemployment rate \(age 15–24\) ÷ overall rate<\/>,/.test(lab), "#17 visible description is only 'Youth unemployment rate (age 15–24) ÷ overall rate'");
  const bands = w.MIX_BANDS.map(([n]) => n.toLowerCase()), d9 = /"9": \{[^\n]*desc: "([^"]+)"/.exec(meta)[1].toLowerCase();
  check(bands.every((b) => b.split(", ").every((p) => d9.includes(p.replace(" and other renewables", "")))) && !/oil/.test(d9) && /h && narrow && <MixBox/.test(mx) && /h && !narrow && <MixBox[^\n]*float=\{\{ x: x\(hover!\), W: w \}\}/.test(mx) && /#chart-9 \.sub\{white-space:normal !important/.test(css), `#9 description names all six bands (${w.MIX_BANDS.map(([n]) => n).join(" / ")}); hover/tap box anchors beside the guide and flips`); }
// #9 stats box: six band rows in the chart's stack order (top band first, as drawn), each with swatch + Ember sources; rounding line.
{ const w = await import("../lib/waves.mjs"), mx = readFileSync("src/components/MixArea.tsx", "utf8"), E = JSON.parse(readFileSync("data/ember_electricity_mix_share.json", "utf8"));
  const rows = w.MIX_BANDS.map(([n, fs], k) => ({ k, n, fs })).reverse(), fuels = Object.keys(E.series.CAN);
  const allSrc = rows.flatMap((r) => r.fs), okSrc = allSrc.every((f) => Object.values(E.series).some((s) => f in s)) && new Set(allSrc).size === 9;
  check(rows.length === 6 && rows.map((r) => r.k).join() === "5,4,3,2,1,0" && /MIX_BANDS\.map\([^\n]*\)\.reverse\(\)/.test(mx) && /className=\{`mxk m\$\{r\.k\}`\}/.test(mx) && /\{r\.sub && <span className="tipnote">\{r\.sub\.split\(" · "\)/.test(mx) && !/mxround|MIX_ROUNDING/.test(mx) && mx.includes("Shares sum to 100%; rounded figures may differ by 0.1–0.2.") && !/99\.98|may not add to 100%/.test(mx), `#9 stats box: six band rows in stack order (top first: ${rows.map((r) => r.n.split(",")[0]).join(" / ")}), band swatch + its ${allSrc.length} Ember sources; no rounding line in the box; How it's calculated reads 'Shares sum to 100%; rounded figures may differ by 0.1–0.2.'`); }
// #9 sub-lines: single-source bands none; renewables = each source's own value from the file (1 dp), null = n/a, absent series left out; 390 scrolls the docked box into view.
{ const w = await import("../lib/waves.mjs"), E = JSON.parse(readFileSync("data/ember_electricity_mix_share.json", "utf8")), mx = readFileSync("src/components/MixArea.tsx", "utf8"), bad = [], seen = {};
  for (const c of Object.keys(E.series)) for (const row of w.mix(E, c)) for (let k = 0; k < 6; k++) { const sub = w.bandParts(row, k), fs = w.MIX_BANDS[k][1];
    if (fs.length < 2) { if (sub !== null) bad.push(`${c} ${row.year} band ${k} has sub-line`); continue; }
    const want = fs.filter((f) => E.series[c][f]).map((f) => { const s = E.series[c][f], i = s.periods.indexOf(row.year), v = i < 0 ? null : s.values[i]; return `${f === "Other Renewables" ? "Other renewables" : f} ${v === null || v === undefined ? "n/a" : `${v.toFixed(1)}%`}`; }).join(" · ");
    if (sub !== want) bad.push(`${c} ${row.year} "${sub}" vs file "${want}"`); if (row.year === "2025") seen[c] = sub; }
  check(!bad.length && !/Other/.test(seen.CAN) && !/Other/.test(seen.JPN) && /Other renewables n\/a/.test(seen.GBR) && /Wind \d+\.\d%/.test(seen.GBR) && /scrollIntoView\(\{ block: "nearest", behavior: matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches \? "auto" : "smooth" \}\)/.test(mx),
    `#9 sub-lines: none on the 5 single-source bands; renewables = file values for every country-year (CA 2025 "${seen.CAN}", JP "${seen.JPN}", UK "${seen.GBR}"); absent series omitted, nulls n/a; 390 box scrolls into view (block nearest)${bad.length ? " MISMATCH " + bad.slice(0, 3).join("; ") : ""}`); }

// Japan colour = Option B magenta (locked): dark #E86BE0, light #A0168F. No leftover old crimson hex in src/lib/scripts.
{ const css = readFileSync("src/app/globals.css", "utf8");
  const darkHex = (css.match(/:root,\[data-theme="dark"\]\{[^}]*--JPN:(#[0-9A-Fa-f]{6})/) || [])[1];
  const lightHex = (css.match(/\[data-theme="light"\]\{[^}]*--JPN:(#[0-9A-Fa-f]{6})/) || [])[1];
  const leftover = [];
  const walk = (d) => { for (const n of readdirSync(d)) { const p = `${d}/${n}`, st = statSync(p); if (st.isDirectory()) { if (n === "node_modules" || n === ".next" || n === "data") continue; walk(p); } else if (/\.(css|tsx?|mjs|jsx?|md)$/.test(n)) { const old = ["#F060"+"9E", "#B012"+"4F"]; const body = readFileSync(p, "utf8"); if (old.some((h) => body.includes(h))) leftover.push(p); } } };
  for (const root of ["src", "lib"]) walk(root);
  check(darkHex === "#E86BE0" && lightHex === "#A0168F" && leftover.length === 0,
    `Japan colour Option B magenta: dark ${darkHex} / light ${lightHex} (want #E86BE0 / #A0168F); old crimson leftovers: ${leftover.join(", ") || "none"}`); }
