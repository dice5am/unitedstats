"use client";
import Link from "next/link";
import { useMemo, useRef, useState, useLayoutEffect } from "react";
import { COUNTRIES, WINDOWS, buildLine, headline, windowInfo, workedExample } from "@/lib/series.mjs";
import LineChart, { type Line } from "./LineChart";
import ThemeToggle from "./ThemeToggle";
import Tween from "./Tween";

type Tab = "economy" | "labour";
const fmtM = (p: string) => { const [y, m] = p.split("-").map(Number); return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }); };
const asOf = (id: string) => { const m = /(\d{4})(\d{2})(\d{2})T/.exec(id); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : id; };
const sign = (v: number) => (v > 0.0049 ? "+" : v < -0.0049 ? "−" : "");
const k = (v: number) => `${v.toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function App({ data, tab }: { data: any; tab: Tab }) {
  const [years, setYears] = useState(1);
  const [on, setOn] = useState<Record<string, boolean>>({ CAN: true, USA: true });
  const segRef = useRef<HTMLDivElement>(null);
  const [hl, setHl] = useState({ x: 0, w: 0 });
  const lines = useMemo(() => COUNTRIES.map((c) => ({ ...(buildLine(data, c.code, years) as Line), name: c.short })), [data, years]);
  const win = windowInfo(data, years);
  const we = workedExample(data, "CAN", years);
  const onCount = Object.values(on).filter(Boolean).length;
  const dataAsOf = asOf(data.data_as_of.snapshot_id);
  const span = `${fmtM(win.start)} – ${fmtM(win.end)}`;

  useLayoutEffect(() => {
    const el = segRef.current?.querySelector<HTMLElement>("button.on");
    if (el) setHl({ x: el.offsetLeft, w: el.offsetWidth });
  }, [years, tab]);

  const segKey = (e: React.KeyboardEvent) => {
    const i = WINDOWS.indexOf(years);
    const n = ["ArrowRight", "ArrowDown"].includes(e.key) ? i + 1 : ["ArrowLeft", "ArrowUp"].includes(e.key) ? i - 1 : null;
    if (n === null) return;
    e.preventDefault();
    const j = (n + WINDOWS.length) % WINDOWS.length;
    setYears(WINDOWS[j]);
    (segRef.current?.querySelectorAll("button")[j] as HTMLElement | undefined)?.focus();
  };

  return (
    <div className="page">
      <div className="aura" aria-hidden />
      <header className="hdr">
        <Link href="/labour" className="brand"><span className="mark" aria-hidden />unitedstats</Link>
        <ThemeToggle />
      </header>
      <nav className="tabs" role="tablist" aria-label="Sections">
        <Link role="tab" aria-selected={tab === "economy"} className={tab === "economy" ? "on" : ""} href="/economy">Economy</Link>
        <Link role="tab" aria-selected={tab === "labour"} className={tab === "labour" ? "on" : ""} href="/labour">Labour</Link>
      </nav>

      {tab === "economy" ? (
        <main className="wrap"><section className="card placeholder" role="tabpanel"><p className="eyebrow">Economy</p><p>Coming soon</p></section></main>
      ) : (
        <main className="wrap" role="tabpanel" aria-label="Labour">
          <p className="eyebrow">Labour</p>
          <h1>Employment growth</h1>
          <p className="sub">People employed, 15+, indexed to 100 at window start</p>

          <div className="figs">
            {(["CAN", "USA"] as const).map((c) => {
              const v = headline(data, c, years);
              return (
                <div key={c} className="fig">
                  <div className="figl"><i style={{ background: `var(--${c})` }} />{c === "CAN" ? "Canada" : "United States"}</div>
                  <div className="figv">{v === null ? "n/a" : <><Tween value={v} format={(x) => `${sign(x)}${Math.abs(x).toFixed(2)}`} /><span>%</span></>}</div>
                </div>
              );
            })}
          </div>
          <p className="span">{span} · 3-month average</p>

          <div className="bar">
            <div className="seg" role="radiogroup" aria-label="Timeframe" ref={segRef} onKeyDown={segKey}>
              <span className="hl" style={{ transform: `translateX(${hl.x}px)`, width: hl.w }} aria-hidden />
              {WINDOWS.map((w) => (
                <button key={w} role="radio" aria-checked={years === w} tabIndex={years === w ? 0 : -1} className={years === w ? "on" : ""} onClick={() => setYears(w)}>{w}Y</button>
              ))}
            </div>
            <div className="div" aria-hidden />
            <div className="chips" role="group" aria-label="Countries">
              {lines.map((l) => {
                const active = !!on[l.code], locked = active && onCount === 1;
                return (
                  <button key={l.code} aria-pressed={active} aria-disabled={locked || undefined} className={`chip ${active ? "on" : ""}`}
                    style={{ ["--c" as string]: `var(--${l.code})` }} onClick={() => { if (!locked) setOn((o) => ({ ...o, [l.code]: !o[l.code] })); }}>
                    <i />{l.name}
                  </button>
                );
              })}
            </div>
          </div>

          <section className="card chartcard">
            <LineChart lines={lines} on={on} years={years} data={data} />
          </section>
          <ul className="notes">
            <li><i className="dot amber" />US January jump: cause not confirmed</li>
            <li><i className="tick" />Series break, by year</li>
          </ul>
          <p className="source">Source: OECD · employment 15+, SA · as of {dataAsOf}</p>

          <section className="calc" aria-labelledby="calc-h">
            <h2 id="calc-h">How it’s calculated</h2>
            <p className="sub">Same inputs and maths as the chart above.</p>
            <div className="card panel">
              <div className="grp"><h3>Inputs</h3><dl>
                <dt>Dataset</dt><dd className="mono">OECD DF_IALFS_INDIC</dd>
                <dt>Measure</dt><dd>Employment, 15+, seasonally adjusted</dd>
                <dt>Frequency</dt><dd>Monthly: CA US JP · Qtrly: UK DE FR IT</dd>
                <dt>Snapshot</dt><dd>{dataAsOf}</dd>
              </dl></div>
              <div className="grp"><h3>Window</h3><dl>
                <dt>Start – end</dt><dd className="strong">{span}</dd>
                <dt>Length</dt><dd>{years} year{years > 1 ? "s" : ""} · moves with the switch</dd>
              </dl></div>
              <div className="grp"><h3>Formulas</h3><div className="fx">
                <div className="code"><span>3-month average</span><code>avg(m) = (m−2 + m−1 + m) ÷ 3</code></div>
                <div className="code"><span>Index</span><code>index = avg(now) ÷ avg(start) × 100</code></div>
                <div className="code"><span>Growth %</span><code>growth = index(end) − 100</code></div>
                {we && <p className="ex">Canada, {fmtM(we.end)}: <b>{k(we.avgEnd)} ÷ {k(we.avgStart)} × 100 = {we.index.toFixed(2)}</b> → growth <b>{sign(we.growth)}{Math.abs(we.growth).toFixed(2)}%</b></p>}
              </div></div>
              <div className="grp"><h3>Rules</h3><ul className="rules">
                <li><span className="ic">n/a</span>Gaps (n/a) are never filled</li>
                <li><span className="ic"><svg width="16" height="10"><path d="M1 8 L8 3 L15 6" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="3" r="2" fill="currentColor" /></svg></span>Quarterly: line + dot per quarter</li>
                <li><span className="ic"><svg width="4" height="12"><path d="M2 0v12" stroke="currentColor" strokeWidth="1.5" /></svg></span>Series breaks marked by year</li>
                <li><span className="ic">3m</span>3-mo avg blank if a month is missing</li>
              </ul></div>
            </div>
          </section>
        </main>
      )}
      <footer className="ftr wrap"><span>unitedstats</span><span>Data as of {dataAsOf}</span></footer>
    </div>
  );
}
