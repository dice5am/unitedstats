// Fails the build if the app's default 1-year view disagrees with scripts/golden/c1_golden.json.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { avgChange, glowLeaders, mIdx, jobsPerCapitaDataset, buildLine, commonEnds, headline, headlinePick, headlineLabels, roundShown, fmtHeadline, econDataset, monotoneSegments as mseg, windowLabel, DEFAULT_ON, parseOn, monotoneSegments, workedExample } from "../lib/series.mjs";

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

function JPd() { return jobsPerCapitaDataset(data, JSON.parse(readFileSync(new URL("../data/econ_gdp_series.json", import.meta.url)))); }
// v11: Unemployment rate (OECD UNE_LF, 15+, SA) — recomputed independently from the raw file
const uraw = readFileSync(new URL("../data/c1_unemployment_rate.json", import.meta.url));
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
{ let n = 0, bad = 0, cnt = { "Biggest fall": 0, "Smallest rise": 0, "Biggest rise": 0, "Smallest fall": 0 };
  for (const y of [1, 5, 10, 20]) { const g = Object.fromEntries(ALL.map((c) => [c, buildLine(un, c, y, "unemp").growth]));
    for (let mask = 1; mask < 128; mask++) { const sel = ALL.filter((_, i) => mask & (1 << i)); n++;
      const h = headlinePick(un, sel, y, "unemp"), lb = headlineLabels(h, "unemp"), vs = sel.map((c) => g[c]);
      const f = h.single ?? h.fastest; if (!f || Math.abs(f.value - Math.max(...vs)) > 1e-12) { bad++; continue; }
      if (h.single) { if (lb.fast !== null) bad++; continue; }
      if (Math.abs(h.slowest.value - Math.min(...vs)) > 1e-12) bad++;
      const mx = roundShown(h.fastest.value, "unemp"), mn = roundShown(h.slowest.value, "unemp");
      if (lb.slow !== (mn < 0 ? "Biggest fall" : "Smallest rise") || lb.fast !== (mx > 0 ? "Biggest rise" : "Smallest fall") || !lb.lowerBetter) bad++;
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
    if (lb.fast !== "Fastest growth" || lb.slow !== "Slowest growth") badL++;
  }
  check(badL === 0, `jobs headline labels match sign of rounded figures: ${n} combos x windows, ${badL} wrong`); }
// v6: Economy — GDP and GDP per capita (OECD QNA), recomputed independently from the raw file
const eraw = readFileSync(new URL("../data/econ_gdp_series.json", import.meta.url));
const econ = JSON.parse(eraw);
const EV = { gdp: econDataset(econ, "gdp"), pc: econDataset(econ, "pc") };
check(commonEnds(EV.gdp).quarterEnd === "2026-Q2", `gdp: shared end ${commonEnds(EV.gdp).quarterEnd}`);
check(commonEnds(EV.pc).quarterEnd === "2026-Q1" && econ.gdp_per_capita.FRA.values[econ.gdp_per_capita.FRA.periods.indexOf("2026-Q2")] === null, `per capita: shared end ${commonEnds(EV.pc).quarterEnd} (France Q2 2026 null)`);
const rawQ = (s, p) => { const i = s.periods.indexOf(p); return i < 0 ? null : s.values[i]; };
const qBack = (p, n) => { const [yy, q] = p.split("-Q").map(Number); const t = yy * 4 + q - 1 - n; return `${Math.floor(t / 4)}-Q${t % 4 + 1}`; };
for (const [k, src] of [["gdp", econ.gdp], ["pc", econ.gdp_per_capita]]) {
  let nb = 0, n = 0; const end = commonEnds(EV[k]).quarterEnd;
  for (const y of [1, 5, 10, 20]) for (const c of ALL) {
    const l = buildLine(EV[k], c, y, "index"), st = qBack(end, 4 * y); n++;
    const a = rawQ(src[c], st), b = rawQ(src[c], end);
    if (l.points[0].period !== st || l.points[l.points.length - 1].period !== end) { nb++; continue; }
    if (a === null) { if (!l.excluded || l.growth !== null) nb++; continue; }
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
  check(j.excluded && j.growth === null && j.points.every((p) => p.value === null) && !buildLine(EV.pc, "JPN", 10, "index").excluded, "per capita: Japan (starts Q3 2007) excluded from 20Y only");
  check(!h.single && !h.fastest && !h.slowest && h2.single && h2.single.codes.join() === "CAN", "per capita 20Y: Japan-only -> headline n/a; CAN+JPN -> Canada alone"); }
for (const k of ["gdp", "pc"]) {
  let n = 0, bad = 0;
  for (const y of [1, 5, 10, 20]) {
    const g = Object.fromEntries(ALL.map((c) => [c, buildLine(EV[k], c, y, "index").growth]));
    for (let mask = 1; mask < 128; mask++) {
      const sel = ALL.filter((_, i) => mask & (1 << i)); n++;
      const h = headlinePick(EV[k], sel, y, "index"), lb = headlineLabels(h, "index");
      const vs = sel.map((c) => g[c]).filter((v) => v !== null);
      if (!vs.length) { if (h.single || h.fastest) bad++; continue; }
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
  for (const k of ["gdp", "pc"]) for (const y of [1, 5, 10, 20]) for (const c of ALL) { const l = buildLine(EV[k], c, y, "index"); let run = [];
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
  for (const y of [1, 5, 10, 20]) for (const c of ALL) { n++; const l = buildLine(JP, c, y, "index");
    if (data.monthly[c]) { const st = prevM("2026-03", y * 12), a = pcAvg(c, st), b = pcAvg(c, "2026-03");
      if (a === null) { if (!l.excluded) nb++; continue; }
      if (l.points[0].period !== st || Math.abs(l.points[0].value - 100) > 1e-9 || Math.abs(l.growth - (b / a * 100 - 100)) > 1e-9) nb++; }
    else { const q0 = l.points[0].period, a = rawQ(data.quarterly[c], q0) / popQ(c, q0), b = rawQ(data.quarterly[c], "2026-Q1") / popQ(c, "2026-Q1");
      if (popQ(c, q0) === null) { if (!l.excluded) nb++; continue; }
      if (l.points[l.points.length - 1].period !== "2026-Q1" || Math.abs(l.points[0].value - 100) > 1e-9 || Math.abs(l.last - b / a * 100) > 1e-9) nb++; } }
  check(nb === 0, `jobs per capita: index starts at 100 and end = raw ratio (independent interpolation), ${n} country-windows, ${nb} wrong`);
  for (const [c, byW] of Object.entries(G3.jobs_per_capita_pct)) for (const [wk, want] of Object.entries(byW)) { const y = parseInt(wk), l = buildLine(JP, c, y, "index");
    check(Math.abs(l.growth - want) < 0.001 && l.points[l.points.length - 1].period === "2026-03", `jobs per capita ${y}Y ${c}: app ${l.growth >= 0 ? "+" : ""}${l.growth.toFixed(4)}% vs Warehouse golden ${want >= 0 ? "+" : ""}${want.toFixed(4)}% (to Mar 2026)`); }
  const j20 = buildLine(JP, "JPN", 20, "index");
  check(j20.excluded && !buildLine(JP, "JPN", 10, "index").excluded && !headlinePick(JP, ["JPN"], 20, "index").single, "jobs per capita: Japan (population from Q3 2007) excluded from 20Y only; Japan-only 20Y headline n/a");
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
  const man = JSON.parse(readFileSync(new URL("../data/MANIFEST.json", import.meta.url)));
  const LIVE = ["live:unemp", "live:jobs", "live:jobs-pc", "live:gdp", "live:gdp-pc"];
  const okCard = (id) => LIVE.includes(id) || (/^#(\d+)$/.test(id) && +id.slice(1) >= 1 && +id.slice(1) <= 25);
  const pages = ["economy", "labour"].map((t) => readFileSync(new URL(`../src/app/${t}/page.tsx`, import.meta.url), "utf8")).join("\n");
  const files = readdirSync(new URL("../data/", import.meta.url)).filter((f) => f !== "MANIFEST.json").sort();
  const probs = [];
  for (const f of files) { const e = man.files[f];
    if (!e) { probs.push(`${f}: not in manifest`); continue; }
    const h = createHash("sha256").update(readFileSync(new URL(`../data/${f}`, import.meta.url))).digest("hex");
    if (h !== e.sha256) probs.push(`${f}: sha ${h.slice(0, 8)} ≠ manifest ${e.sha256.slice(0, 8)}`);
    if (!Array.isArray(e.cards) || !e.cards.length || !e.cards.every(okCard)) probs.push(`${f}: no valid card id`);
    if (!pages.includes(`@/data/${f}`)) probs.push(`${f}: not imported by any page`); }
  for (const f of Object.keys(man.files)) if (!files.includes(f)) probs.push(`${f}: in manifest but missing from data/`);
  // self-test: a changed file (any file, live ones included) must be caught by the sha comparison
  { const f0 = files.find((f) => man.files[f].cards.some((c) => c.startsWith("live:")));
    const tampered = createHash("sha256").update(Buffer.concat([readFileSync(new URL(`../data/${f0}`, import.meta.url)), Buffer.from(" ")])).digest("hex");
    check(tampered !== man.files[f0].sha256, `data manifest self-test: a one-byte change to live file ${f0} no longer matches its manifest sha (would fail)`); }
  // registry: every chart's data files are in the manifest; prefixed params never collide between charts
  { const reg = readFileSync(new URL("../src/charts/meta.ts", import.meta.url), "utf8");
    const ids = [...reg.matchAll(/^  "?(\w+)"?: \{ id: "(\w+)"[^\n]*titles: \{([^}]*)\}[^\n]*params: \[([^\]]*)\], data: \[([^\]]*)\]/gm)].map((m) => ({ id: m[2], key: m[1], titles: [...m[3].matchAll(/(\w+): "([^"]+)"/g)].flatMap((x) => [x[1], x[2]]), params: [...m[4].matchAll(/"([^"]+)"/g)].map((x) => x[1]), data: [...m[5].matchAll(/"([^"]+)"/g)].map((x) => x[1]) }));
    const allP = ids.flatMap((x) => x.params), dupe = allP.filter((p, i) => allP.indexOf(p) !== i);
    const prefOk = ids.every((x) => x.params.every((p) => /^[a-z]+_/.test(p)) && new Set(x.params.map((p) => p.split("_")[0])).size <= 1);
    const dataOk = ids.every((x) => x.data.every((f) => man.files[f]));
    const keyOk = ids.every((x) => x.id === x.key) && ["1", "2", "22"].every((n) => ids.some((x) => x.id === n));
    const regLoad = readFileSync(new URL("../src/charts/registry.tsx", import.meta.url), "utf8");
    const loadOk = ids.every((x) => new RegExp(`^  "?${x.id}"?: \\{`, "m").test(regLoad));
    check(ids.length === 6 && !dupe.length && prefOk && dataOk && keyOk && loadOk, `chart registry: ${ids.length} standalone charts, ids are link keys (${ids.map((x) => `${x.id}[${x.params.join(",") || "no state"}]`).join(" ")}); params prefixed per chart, no collisions; each has a loader; data files all in manifest`);
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
console.log("econ sha256", createHash("sha256").update(eraw).digest("hex"));
console.log("unemployment sha256", createHash("sha256").update(uraw).digest("hex"));
console.log("data sha256", createHash("sha256").update(raw).digest("hex"));
if (fail) { console.error(`${fail} check(s) failed`); process.exit(1); }
