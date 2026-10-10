// Fails the build if the app's default 1-year view disagrees with data/c1_golden.json.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { buildLine, commonEnds, headline, headlinePick, headlineLabels, roundShown, fmtHeadline, econDataset, monotoneSegments as mseg, windowLabel, DEFAULT_ON, parseOn, monotoneSegments, workedExample } from "../lib/series.mjs";

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

// v2.2: employment rate (15-64) — recomputed independently from the raw rate file
const rraw = readFileSync(new URL("../data/c1_employment_rate.json", import.meta.url));
const rate = JSON.parse(rraw);
const rv = (code, p) => { const s = rate.monthly[code]; const i = s.periods.indexOf(p); return i < 0 ? null : s.values[i]; };
const prevM = (p, k) => { const [yy, mm] = p.split("-").map(Number); const t = yy * 12 + mm - 1 - k; return `${Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, "0")}`; };
const a3 = (code, p) => { const v = [0, 1, 2].map((k) => rv(code, prevM(p, k))); return v.some((x) => x === null) ? null : (v[0] + v[1] + v[2]) / 3; };
let rbad = 0;
for (const y of [1, 5, 10, 20]) for (const c of ["CAN", "USA", "JPN"]) {
  const st = prevM("2026-08", y * 12), want = a3(c, "2026-08") - a3(c, st);
  const l = buildLine(rate, c, y, "rate");
  if (Math.abs(l.growth - want) > 1e-9 || l.points[0].period !== st) { rbad++; console.error("rate", c, y, l.growth, want); }
}
check(rbad === 0, "rate change (pts) = avg3(Aug 2026) − avg3(start) for CAN/USA/JPN, all windows");
const ru = buildLine(rate, "USA", 1, "rate");
check(["2025-10","2025-11","2025-12"].every((p) => ru.points.find((x) => x.period === p).value === null), "rate: US avg null Oct-Dec 2025");
const it = buildLine(rate, "ITA", 20, "rate");
check(it.breaks.some((b) => b.label.includes("Q4 2008")), "rate: Italy Q4 2008 break carried");
check(commonEnds(rate).monthEnd === "2026-08" && commonEnds(rate).quarterEnd === "2026-Q2", "rate: shared end Aug 2026 / Q2 2026");
let rcb = 0;
for (const y of [1, 5, 10, 20]) {
  const g = Object.fromEntries(ALL.map((c) => [c, buildLine(rate, c, y, "rate").growth]));
  for (let mask = 1; mask < 128; mask++) {
    const sel = ALL.filter((_, i) => mask & (1 << i)); const h = headlinePick(rate, sel, y, "rate");
    const vs = sel.map((c) => g[c]); const f = h.single ?? h.fastest;
    if (!f || Math.abs(f.value - Math.max(...vs)) > 1e-12) rcb++;
    if (h.slowest && Math.abs(h.slowest.value - Math.min(...vs)) > 1e-12) rcb++;
  }
}
check(rcb === 0, "rate headline fastest/slowest: 508 combos");
let rover = 0;
for (const y of [1, 5, 10, 20]) for (const c of ALL) { const l = buildLine(rate, c, y, "rate"); let run = [];
  const t = () => { for (const [p0, c1, c2, p3] of monotoneSegments(run)) { const lo = Math.min(p0.y, p3.y) - 1e-9, hi = Math.max(p0.y, p3.y) + 1e-9;
    for (let k = 1; k < 50; k++) { const tt = k / 50, u = 1 - tt; const yy = u*u*u*p0.y + 3*u*u*tt*c1.y + 3*u*tt*tt*c2.y + tt*tt*tt*p3.y; if (yy < lo || yy > hi) { rover++; break; } } } run = []; };
  for (const p of l.points) { if (p.value === null) t(); else run.push({ x: p.mi, y: p.value }); } t(); }
check(rover === 0, "rate monotone: no overshoot");
// v5: headline labels consistent with the sign of the ROUNDED shown figures, every combo x window x view
for (const [nm, ds, md] of [["jobs", data, "jobs"], ["rate", rate, "rate"]]) {
  let n = 0, badL = 0, negMin = 0, posMin = 0, negMax = 0;
  for (const y of [1, 5, 10, 20]) for (let mask = 1; mask < 128; mask++) {
    const sel = ALL.filter((_, i) => mask & (1 << i)); const h = headlinePick(ds, sel, y, md); n++;
    const lb = headlineLabels(h, md);
    if (h.single) { if (lb.fast !== null || lb.slow !== null) badL++; continue; }
    const mx = roundShown(h.fastest.value, md), mn = roundShown(h.slowest.value, md);
    const sOk = (v, s) => (v > 0 ? s.startsWith("+") : v < 0 ? s.startsWith("−") : !/^[+−]/.test(s));
    if (!sOk(mx, fmtHeadline(h.fastest.value, md)) || !sOk(mn, fmtHeadline(h.slowest.value, md))) badL++;
    if (md === "rate") {
      if (mn < 0) negMin++; else posMin++; if (mx < 0) negMax++;
      if (lb.slow !== (mn < 0 ? "Biggest drop" : "Smallest gain")) badL++;
      if (lb.fast !== (mx < 0 ? "Smallest drop" : "Fastest gain")) badL++;
      if (lb.slow === "Smallest gain" && mn < 0) badL++;
    } else if (lb.fast !== "Fastest growth" || lb.slow !== "Slowest growth") badL++;
  }
  check(badL === 0, `${nm} headline labels match sign of rounded figures: ${n} combos x windows, ${badL} wrong` + (md === "rate" ? ` (Biggest drop ${negMin}, Smallest gain ${posMin}, Smallest drop ${negMax})` : ""));
}
{ const h = headlinePick(rate, ["CAN", "USA"], 20, "rate"); const lb = headlineLabels(h, "rate");
  check(h.slowest.codes[0] === "USA" && h.slowest.value < 0 && lb.slow === "Biggest drop", `rate 20Y CAN+US: US ${fmtHeadline(h.slowest.value, "rate")} pts labelled "${lb.slow}"`); }
{ const h = { single: null, fastest: { value: -0.04 }, slowest: { value: -0.3 } };
  check(headlineLabels(h, "rate").fast === "Fastest gain" && headlineLabels({ single: null, fastest: { value: -0.2 }, slowest: { value: -0.3 } }, "rate").fast === "Smallest drop", "rate: −0.04 shows 0.0 → Fastest gain; all fell → Smallest drop"); }
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
{ const a = windowLabel(rate, ["ITA"], 20, "rate"), b = windowLabel(rate, ["CAN", "ITA"], 20, "rate"), c = windowLabel(data, ["CAN", "USA"], 1, "jobs"), d = windowLabel(data, ["GBR", "DEU"], 5, "jobs"), e = windowLabel(EV.pc, ["CAN", "USA"], 20, "index");
  check(a.text === "Q3 2006 – Q2 2026 · quarterly", `window: rate 20Y Italy only -> "${a.text}"`);
  check(b.freq === "mixed" && b.text === "Aug 2006 – Aug 2026 · 3-month average (monthly) · Q3 2006 – Q2 2026 (quarterly)", `window: rate 20Y Canada + Italy (mixed) -> "${b.text}"`);
  check(c.freq === "monthly" && c.text === "Aug 2025 – Aug 2026 · 3-month average", `window: jobs 1Y CAN+US (monthly) -> "${c.text}"`);
  check(d.freq === "quarterly" && /^Q\d \d{4} – Q2 2026 · quarterly$/.test(d.text), `window: jobs 5Y UK+Germany (quarterly) -> "${d.text}"`);
  check(e.text === "Q1 2006 – Q1 2026 · quarterly", `window: per capita 20Y unchanged -> "${e.text}"`); }
// v10: default selection = all seven; invalid/empty ?on falls back to all seven
check(DEFAULT_ON.join() === "CAN,USA,JPN,GBR,DEU,FRA,ITA" && parseOn("").length === 7 && parseOn(null).length === 7 && parseOn("XYZ,,foo").length === 7
  && parseOn("jpn").join() === "JPN" && parseOn("ita,CAN").join() === "CAN,ITA", "default: all seven G7; invalid/empty on -> all seven; valid codes kept in fixed order");
{ const h = headlinePick(data, DEFAULT_ON, 1), hr = headlinePick(rate, DEFAULT_ON, 1, "rate");
  check(h.fastest && h.slowest && hr.fastest && hr.slowest, `default 1Y headline (all seven): jobs ${h.fastest.codes}/${h.slowest.codes}, rate ${hr.fastest.codes}/${hr.slowest.codes}`); }
console.log("econ sha256", createHash("sha256").update(eraw).digest("hex"));
console.log("rate sha256", createHash("sha256").update(rraw).digest("hex"));
console.log("data sha256", createHash("sha256").update(raw).digest("hex"));
if (fail) { console.error(`${fail} check(s) failed`); process.exit(1); }
