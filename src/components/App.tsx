"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { COUNTRIES, WINDOWS, buildLine, commonEnds } from "@/lib/series.mjs";
import LineChart, { type Line } from "./LineChart";

type Tab = "economy" | "labour";

function asOf(id: string) {
  const m = /(\d{4})(\d{2})(\d{2})T/.exec(id);
  if (!m) return id;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function App({ data, tab }: { data: any; tab: Tab }) {
  const [years, setYears] = useState(1);
  const [on, setOn] = useState<Record<string, boolean>>({ CAN: true, USA: true });
  const segRef = useRef<HTMLDivElement>(null);
  const ends = useMemo(() => commonEnds(data), [data]);
  const lines = useMemo(() => COUNTRIES.map((c) => ({ ...(buildLine(data, c.code, years) as Line), name: c.short })), [data, years]);
  const visible = lines.filter((l) => on[l.code]);
  const onCount = Object.values(on).filter(Boolean).length;
  const dataAsOf = asOf(data.data_as_of.snapshot_id);

  const segKey = (e: React.KeyboardEvent) => {
    const i = WINDOWS.indexOf(years);
    const n = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : null;
    if (n === null) return;
    e.preventDefault();
    const j = (n + WINDOWS.length) % WINDOWS.length;
    setYears(WINDOWS[j]);
    (segRef.current?.children[j] as HTMLElement | undefined)?.focus();
  };

  return (
    <main className="shell">
      <header className="top">
        <div className="titles">
          <h1>Canada vs the world</h1>
          <p className="sub">{tab === "labour" ? "Employment, indexed to 100 at window start" : "Economy"}</p>
        </div>
        <span className="badge">Data as of {dataAsOf}</span>
      </header>

      <nav className="tabs" role="tablist" aria-label="Sections">
        <Link role="tab" aria-selected={tab === "economy"} className={tab === "economy" ? "on" : ""} href="/economy">Economy</Link>
        <Link role="tab" aria-selected={tab === "labour"} className={tab === "labour" ? "on" : ""} href="/labour">Labour</Link>
      </nav>

      {tab === "economy" ? (
        <section className="placeholder" role="tabpanel"><p>Coming soon</p></section>
      ) : (
        <section role="tabpanel" aria-label="Labour">
          <div className="seg" role="radiogroup" aria-label="Timeframe" ref={segRef} onKeyDown={segKey}>
            {WINDOWS.map((w) => (
              <button key={w} role="radio" aria-checked={years === w} tabIndex={years === w ? 0 : -1}
                className={years === w ? "on" : ""} onClick={() => setYears(w)}>{w}Y</button>
            ))}
          </div>

          <div className="chipwrap">
            <div className="chips" role="group" aria-label="Countries">
              {lines.map((l) => {
                const active = !!on[l.code];
                const locked = active && onCount === 1;
                return (
                  <button key={l.code} aria-pressed={active} aria-disabled={locked || undefined}
                    className={`chip ${active ? "on" : ""}`} style={{ ["--c" as string]: `var(--${l.code})` }}
                    onClick={() => { if (!locked) setOn((o) => ({ ...o, [l.code]: !o[l.code] })); }}>
                    <span className="sw" /><span>{l.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <LineChart lines={visible} years={years} />

          <footer className="foot">
            <p>Bold = 3-month average; faint = monthly. Dots = quarterly. | = series break. Gaps = n/a, never filled. ◆ US January jumps: cause not confirmed.</p>
            <p>Common cutoff: {fmtMonth(ends.monthEnd)} monthly / {ends.quarterEnd.split("-").reverse().join(" ")} quarterly.</p>
            <p><b>Data as of</b> {dataAsOf} · Source: OECD DF_IALFS_INDIC (employment level, 15+, SA). International sources only.</p>
          </footer>
        </section>
      )}
    </main>
  );
}

function fmtMonth(p: string) {
  const [y, m] = p.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}
