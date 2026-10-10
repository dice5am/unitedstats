// Fails the build if the app's default 1-year view disagrees with data/c1_golden.json.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { buildLine, commonEnds, headline, headlinePick, monotoneSegments, workedExample } from "../lib/series.mjs";

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
console.log("rate sha256", createHash("sha256").update(rraw).digest("hex"));
console.log("data sha256", createHash("sha256").update(raw).digest("hex"));
if (fail) { console.error(`${fail} check(s) failed`); process.exit(1); }
