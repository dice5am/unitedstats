// Fails the build if the app's default 1-year view disagrees with data/c1_golden.json.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { avgChange, glowLeaders, mIdx, jobsPerCapitaDataset, buildLine, commonEnds, headline, headlinePick, headlineLabels, roundShown, fmtHeadline, econDataset, monotoneSegments as mseg, windowLabel, DEFAULT_ON, parseOn, monotoneSegments, workedExample } from "../lib/series.mjs";

const raw = readFileSync(new URL("../data/c1_labour_series.json", import.meta.url));
const data = JSON.parse(raw);
const golden = JSON.parse(readFileSync(new URL("../data/c1_golden.json", import.meta.url)));
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

// v11: Unemployment rate (OECD UNE_LF, 15+, SA) — recomputed independently from the raw file
const uraw = readFileSync(new URL("../data/c1_unemployment_rate.json", import.meta.url));
const un = JSON.parse(uraw);
const G3 = JSON.parse(readFileSync(new URL("../data/golden_round3.json", import.meta.url)));
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
const JP = jobsPerCapitaDataset(data, econ);
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
  for (const c of ["CAN", "USA"]) { const app = buildLine(JP, c, 1, "index").growth, want = G3.jobs_per_capita_1y_pct[c];
    check(Math.abs(app - want) < 0.0005, `jobs per capita 1Y ${c}: app ${app >= 0 ? "+" : ""}${app.toFixed(4)}% vs Warehouse golden ${want >= 0 ? "+" : ""}${want.toFixed(4)}% (Mar 2025 → Mar 2026)`); }
  const j20 = buildLine(JP, "JPN", 20, "index");
  check(j20.excluded && !buildLine(JP, "JPN", 10, "index").excluded && !headlinePick(JP, ["JPN"], 20, "index").single, "jobs per capita: Japan (population from Q3 2007) excluded from 20Y only; Japan-only 20Y headline n/a");
  check(JP.monthly.CAN.periods[JP.monthly.CAN.periods.length - 1] === "2026-03" && Object.values(JP.quarterly).every((s) => s.end === "2026-Q1"), "jobs per capita: monthly lines stop at Mar 2026, quarterly at Q1 2026 (no extrapolation)"); }
console.log("econ sha256", createHash("sha256").update(eraw).digest("hex"));
console.log("unemployment sha256", createHash("sha256").update(uraw).digest("hex"));
console.log("data sha256", createHash("sha256").update(raw).digest("hex"));
if (fail) { console.error(`${fail} check(s) failed`); process.exit(1); }
