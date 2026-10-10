"use client";
import { useMemo, useState } from "react";
import { COUNTRIES, WINDOWS, buildLine, commonEnds } from "@/lib/series.mjs";
import LineChart, { COLORS, type Line } from "./LineChart";

type Tab = "economy" | "labour";

function asOf(id: string) {
  const m = /(\d{4})(\d{2})(\d{2})T/.exec(id);
  if (!m) return id;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
const fmtM = (p: string) => {
  const [y, m] = p.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function App({ data }: { data: any }) {
  const [tab, setTab] = useState<Tab>("labour");
  const [years, setYears] = useState(1);
  const [on, setOn] = useState<Record<string, boolean>>({ CAN: true, USA: true });
  const ends = useMemo(() => commonEnds(data), [data]);
  const lines: Line[] = useMemo(
    () => COUNTRIES.map((c: { code: string }) => buildLine(data, c.code, years) as Line),
    [data, years]
  );
  const visible = lines.filter((l) => on[l.code]);
  const startMonth = lines[0].points[0].period;

  return (
    <main className="shell">
      <header className="top">
        <div className="brand">United Stats<span>Canada vs the world</span></div>
        <nav className="tabs" role="tablist">
          {(["economy", "labour"] as Tab[]).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
              {t === "economy" ? "Economy" : "Labour"}
            </button>
          ))}
        </nav>
      </header>

      {tab === "economy" ? (
        <section className="card empty"><p>Economy charts are coming soon.</p></section>
      ) : (
        <section className="card">
          <div className="head">
            <div>
              <h1>Employment</h1>
              <p className="sub">Persons employed, ages 15+, indexed to 100 at {fmtM(startMonth)}</p>
            </div>
            <div className="seg" role="radiogroup" aria-label="Timeframe">
              {WINDOWS.map((w: number) => (
                <button key={w} role="radio" aria-checked={years === w} className={years === w ? "on" : ""} onClick={() => setYears(w)}>
                  {w}Y
                </button>
              ))}
            </div>
          </div>

          <div className="chips" role="group" aria-label="Countries">
            {lines.map((l) => {
              const c = COUNTRIES.find((x: { code: string }) => x.code === l.code);
              const active = !!on[l.code];
              return (
                <button key={l.code} aria-pressed={active} className={`chip ${active ? "on" : ""}`}
                  style={{ ["--c" as string]: COLORS[l.code] }}
                  onClick={() => setOn((o) => ({ ...o, [l.code]: !o[l.code] }))}>
                  <i />{c?.name ?? l.code}
                  <b>{l.growth === null ? "n/a" : `${l.growth >= 0 ? "+" : ""}${l.growth.toFixed(1)}%`}</b>
                </button>
              );
            })}
          </div>

          <LineChart lines={visible} years={years} />

          <footer className="foot">
            <p>Lines end at {fmtM(ends.monthEnd)} (monthly) and {ends.quarterEnd.replace("-", " ")} (quarterly), the latest period every country shares. Dots are quarterly data. Chip figures compare the 3-month average at each end for monthly countries, and the end quarter for quarterly ones. Gaps show as n/a; dashed ticks mark years with a series break.</p>
            <p>Source: OECD, Infra-annual labour statistics (DF_IALFS_INDIC), seasonally adjusted. Data as of {asOf(data.data_as_of.snapshot_id)}.</p>
          </footer>
        </section>
      )}
    </main>
  );
}
