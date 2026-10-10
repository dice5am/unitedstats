"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { COUNTRIES, WINDOWS, buildLine, headlinePick, headlineLabels, fmtHeadline, windowInfo, workedExample } from "@/lib/series.mjs";
import LineChart, { type Line } from "./LineChart";
import ThemeToggle from "./ThemeToggle";
import Tween from "./Tween";
import Picker from "./Picker";

type Tab = "economy" | "labour";
const fmtM = (p: string) => { const [y, m] = p.split("-").map(Number); return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }); };
const asOf = (id: string) => { const m = /(\d{4})(\d{2})(\d{2})T/.exec(id); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : id; };
const sign = (v: number) => (v > 0.0049 ? "+" : v < -0.0049 ? "−" : "");
const k = (v: number) => `${v.toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function App({ data, rate, tab }: { data: any; rate: any; tab: Tab }) {
  const [view, setView] = useState<"jobs" | "rate">("jobs");
  const vRef = useRef<HTMLDivElement>(null);
  const [vhl, setVhl] = useState({ x: 0, w: 0 });
  useEffect(() => { const v = new URLSearchParams(location.search).get("view"); if (v === "rate" || v === "jobs") setView(v); }, []);
  const pickView = (v: "jobs" | "rate") => { setView(v); const u = new URL(location.href); u.searchParams.set("view", v); history.replaceState(null, "", u); };
  useLayoutEffect(() => { const el = vRef.current?.querySelector<HTMLElement>("button.on"); if (el) setVhl({ x: el.offsetLeft, w: el.offsetWidth }); }, [view, tab]);
  const ds = view === "rate" ? rate : data;
  const [years, setYears] = useState(1);
  const [on, setOn] = useState<Record<string, boolean>>({ CAN: true, USA: true });
  const segRef = useRef<HTMLDivElement>(null);
  const [hl, setHl] = useState({ x: 0, w: 0 });
  const lines = useMemo(() => COUNTRIES.map((c) => ({ ...(buildLine(ds, c.code, years, view) as Line), name: c.short })), [ds, years, view]);
  const win = windowInfo(data, years);
  const we = workedExample(data, "CAN", years);
  const rex = (() => { const l = buildLine(rate, "CAN", years, "rate") as Line; const f = l.points.find((p) => p.value !== null); return f && l.last !== null ? { start: f.value!, end: l.last, d: l.last - f.value! } : null; })();
  const dataAsOf = asOf(data.data_as_of.snapshot_id);
  const rateAsOf = asOf(rate.data_as_of.addendum_id);
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
          <h1 key={view} className="fadein">{view === "rate" ? "Employment rate" : "Employment growth"}</h1>
          <p key={`s${view}`} className="sub fadein">{view === "rate" ? "Share of people aged 15–64 who are employed · seasonally adjusted" : "People employed, 15+ · seasonally adjusted · not adjusted for population"}</p>
          <div className="vseg" role="radiogroup" aria-label="Measure" ref={vRef}>
            <span className="hl" style={{ transform: `translateX(${vhl.x}px)`, width: vhl.w }} aria-hidden />
            {(["jobs", "rate"] as const).map((v) => (
              <button key={v} role="radio" aria-checked={view === v} className={view === v ? "on" : ""} onClick={() => pickView(v)}>{v === "jobs" ? "Jobs" : "Employment rate"}</button>
            ))}
          </div>

          <div className="figs">
            {(() => {
              const sel = COUNTRIES.map((c) => c.code).filter((c) => on[c]);
              const h = headlinePick(ds, sel, years, view);
              const R = view === "rate";
              const nm = (c: string) => COUNTRIES.find((x) => x.code === c)!.short;
              const per = (ps: string[]) => ps.map((p) => p.includes("Q") ? p.split("-").reverse().join(" ") : fmtM(p)).join(" / ");
              const cards = h.single ? [{ label: h.single.codes.map(nm).join(" · "), k: null as string | null, p: h.single }]
                : (() => { const lb = headlineLabels(h, view); return [{ label: lb.fast!, k: "f", p: h.fastest! }, { label: lb.slow!, k: "s", p: h.slowest! }]; })();
              return cards.map((c, i) => (
                <div key={`${view}-${c.k ?? "one"}-${c.label}`} className="fig">
                  <div className="figl">{c.k ? c.label : null}</div>
                  <div className="figc" key={c.p.codes.join()}>{c.p.codes.map((cc) => <span key={cc}><i style={{ background: `var(--${cc})` }} />{nm(cc)}</span>)}</div>
                  <div className="figv"><Tween value={c.p.value} format={(x) => fmtHeadline(x, view)} /><span>{R ? "pts" : "%"}</span></div>
                  <div className="figp">{per(c.p.periods)}</div>
                </div>
              ));
            })()}
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
            <Picker on={on} setOn={setOn} />
          </div>

          <section className="card chartcard">
            <LineChart lines={lines} on={on} years={years} data={ds} mode={view} />
          </section>
          <ul className="notes">
            <li><i className="dot amber" />US January jump: cause not confirmed</li>
            <li><i className="tick" />{view === "rate" ? "Series break, by quarter" : "Series break, by year"}</li>
          </ul>
          <p className="source">Source: OECD · {view === "rate" ? "employment rate 15–64" : "employment 15+"}, SA · as of {view === "rate" ? rateAsOf : dataAsOf}</p>

          <section className="calc" aria-labelledby="calc-h">
            <h2 id="calc-h">How it’s calculated</h2>
            <p className="sub">Same inputs and maths as the chart above.</p>
            <div className="card panel">
              {view === "rate" ? (<>
              <div className="grp"><h3>Measures</h3><dl>
                <dt>Rate</dt><dd>Employed ÷ population, 15–64</dd>
                <dt>Shown as</dt><dd>The rate itself, in %. Not indexed.</dd>
              </dl></div>
              <div className="grp"><h3>Inputs</h3><dl>
                <dt>Dataset</dt><dd className="mono">OECD DF_IALFS_INDIC · EMP_WAP</dd>
                <dt>Measure</dt><dd>Employment rate, 15–64, seasonally adjusted</dd>
                <dt>Frequency</dt><dd>Monthly: CA US JP · Qtrly: UK DE FR IT</dd>
                <dt>Snapshot</dt><dd>{rateAsOf}</dd>
              </dl></div>
              <div className="grp"><h3>Window</h3><dl>
                <dt>Start – end</dt><dd className="strong">{span}</dd>
                <dt>Length</dt><dd>{years} year{years > 1 ? "s" : ""} · moves with the switch</dd>
              </dl></div>
              <div className="grp"><h3>Formulas</h3><div className="fx">
                <div className="code"><span>3-month average</span><code>avg(m) = (m−2 + m−1 + m) ÷ 3</code></div>
                <div className="code"><span>Change</span><code>change = end − start, in points</code></div>
                {rex && <p className="ex">Canada, {fmtM(win.end)}: <b>{rex.end.toFixed(2)}% − {rex.start.toFixed(2)}% = {sign(rex.d)}{Math.abs(rex.d).toFixed(2)} pts</b></p>}
              </div></div>
            </>) : (<>
              <div className="grp"><h3>Measures</h3><dl>
                <dt>Counts</dt><dd>Number of people employed, age 15+. A headcount, not a rate.</dd>
                <dt>Not</dt><dd>Adjusted for population: faster population growth can add jobs without a better employment rate.</dd>
              </dl></div>
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
              </>)}
              <div className="grp"><h3>Rules</h3><ul className="rules">
                <li><span className="ic">n/a</span>Gaps (n/a) are never filled</li>
                <li><span className="ic"><svg width="16" height="10"><path d="M1 8 L8 3 L15 6" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="3" r="2" fill="currentColor" /></svg></span>Quarterly: line + dot per quarter</li>
                <li><span className="ic"><svg width="2" height="12"><rect width="2" height="12" rx="1" fill="var(--text-2)" /></svg></span>Series breaks marked by year</li>
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
