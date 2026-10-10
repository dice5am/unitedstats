// Sheet sparklines (Round 4b): a tiny static shape per built chart, computed from the same data and code as the
// chart (Canada's 5Y line, or the chart's own default view), so the chart sheet never loads any chart's data.
import { readFileSync, writeFileSync } from "node:fs";
import { buildLine, econDataset, jobsPerCapitaDataset, policyDataset, unempLongDataset } from "../lib/series.mjs";
import { comeback, scorecard, heatStrip } from "../lib/charts.mjs";
const J = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url)));
const econ = J("econ_gdp_series.json"), un = unempLongDataset(J("c1_unemployment_rate_long.json")), jobs = J("c1_labour_series.json"), um = J("oecd_unemployment_rate_m_15plus.json"), bis = J("bis_policy_rate_m.json");
const vals = (l) => l.points.map((p) => p.value).filter((v) => v !== null);
const thin = (a, n = 24) => a.length <= n ? a : Array.from({ length: n }, (_, i) => a[Math.round((i * (a.length - 1)) / (n - 1))]);
const norm = (a) => { const lo = Math.min(...a), hi = Math.max(...a); return a.map((v) => +(hi > lo ? (v - lo) / (hi - lo) : 0.5).toFixed(3)); };
const out = {
  gdp: { kind: "line", v: norm(thin(vals(buildLine(econDataset(econ, "gdp"), "CAN", 5, "index")))) },
  "1": { kind: "line", v: norm(thin(vals(buildLine(econDataset(econ, "gdp"), "CAN", 10, "index")))) },
  unemp: { kind: "line", v: norm(thin(vals(buildLine(un, "CAN", 5, "unemp")))) },
  jobs: { kind: "line", v: norm(thin(vals(buildLine(jobs, "CAN", 5, "jobs")))) },
  "7": { kind: "line", v: norm(thin(vals(buildLine(policyDataset(bis), "CAN", 10, "level")))) },
  "2": { kind: "heat", v: norm(thin(heatStrip(um, 20).rows[0].vals.filter((x) => x !== null), 20)) },
  "22": { kind: "bars", v: norm(scorecard(J("c1_employment_rate.json")).rows.map((r) => r.change ?? 0)) },
};
writeFileSync(new URL("../src/charts/sparks.json", import.meta.url), JSON.stringify(out) + "\n");
console.log("sparks:", Object.entries(out).map(([k, s]) => `${k}:${s.kind}/${s.v.length}`).join(" "));
