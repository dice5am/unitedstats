// Fails the build if the app's default 1-year view disagrees with analysis/c1_golden.json.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { buildLine, commonEnds } from "../lib/series.mjs";

const raw = readFileSync(new URL("../data/c1_labour_series.json", import.meta.url));
const data = JSON.parse(raw);
const golden = JSON.parse(readFileSync(new URL("../data/c1_golden.json", import.meta.url)));
const tol = golden.tolerance_pct;
const ends = commonEnds(data);
let fail = 0;
if (ends.monthEnd !== "2026-08" || ends.quarterEnd !== "2026-Q2") { console.error("shared end wrong", ends); fail++; }
const ref = golden.cases.find((c) => c.window === "12 months" && c.end_month === ends.monthEnd);
if (!ref) { console.error("no golden case for", ends.monthEnd); process.exit(1); }
for (const code of ["CAN", "USA"]) {
  const line = buildLine(data, code, 1);
  const got = line.growth, want = ref[`${code}_pct`];
  const ok = got !== null && Math.abs(got - want) <= tol && line.points[0].period === ref.start_month;
  console.log(`${ok ? "PASS" : "FAIL"} ${code} 1y ${ref.start_month}->${ref.end_month}: app ${got?.toFixed(4)} golden ${want}`);
  if (!ok) fail++;
}
console.log("data sha256", createHash("sha256").update(raw).digest("hex"));
if (fail) { console.error(`${fail} golden check(s) failed`); process.exit(1); }
