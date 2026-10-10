"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { COUNTRIES, WINDOWS, buildLine, headlinePick, headlineLabels, fmtHeadline, windowInfo, workedExample, econDataset, quarterExample, qLabel, commonEnds } from "@/lib/series.mjs";
import LineChart, { type Line } from "./LineChart";
import ThemeToggle from "./ThemeToggle";
import Tween from "./Tween";
import Picker from "./Picker";

type Tab = "economy" | "labour";
const fmtM = (p: string) => { const [y, m] = p.split("-").map(Number); return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }); };
const asOf = (id: string) => { const m = /(\d{4})(\d{2})(\d{2})T/.exec(id); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : id; };
const sign = (v: number) => (v > 0.0049 ? "+" : v < -0.0049 ? "−" : "");
const fmtL = (v: number) => (v >= 1000 ? Math.round(v).toLocaleString("en-GB") : v.toLocaleString("en-GB", { maximumFractionDigits: 3 }));
const k = (v: number) => `${v.toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const writeUrl = (v: string, w: number, codes: string[]) => {
  const ordered = COUNTRIES.map((c) => c.code).filter((c) => codes.includes(c));
  const next = `${location.pathname}?view=${v}&win=${w}&on=${ordered.join(",")}${location.hash}`;
  if (next !== location.pathname + location.search + location.hash) history.replaceState(null, "", next);
};
type View = "jobs" | "rate" | "gdp" | "pc";
const VIEWS: Record<Tab, [View, string][]> = { labour: [["jobs", "Jobs"], ["rate", "Employment rate"]], economy: [["gdp", "GDP"], ["pc", "GDP per capita"]] };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function App({ data, rate, econ, tab }: { data: any; rate: any; econ?: any; tab: Tab }) {
  const [view, setView] = useState<View>(VIEWS[tab][0][0]);
  const E = tab === "economy";
  const eds = useMemo(() => (econ ? { gdp: econDataset(econ, "gdp"), pc: econDataset(econ, "pc") } : null), [econ]);
  const vRef = useRef<HTMLDivElement>(null);
  const [vhl, setVhl] = useState({ x: 0, w: 0 });
  const pickView = (v: View) => setView(v);
  useLayoutEffect(() => { const el = vRef.current?.querySelector<HTMLElement>("button.on"); if (el) setVhl({ x: el.offsetLeft, w: el.offsetWidth }); }, [view, tab]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ds: any = view === "rate" ? rate : view === "gdp" ? eds!.gdp : view === "pc" ? eds!.pc : data;
  const mode = view === "rate" ? "rate" : view === "jobs" ? "jobs" : "index";
  const [years, setYears] = useState(1);
  const [on, setOn] = useState<Record<string, boolean>>({ CAN: true, USA: true });
  // URL state (?view, ?win, ?on): read once before paint (no hydration mismatch: server renders defaults),
  // invalid values fall back to defaults; then mirror changes with replaceState.
  const urlRead = useRef<0 | 1 | 2>(0);
  useLayoutEffect(() => {
    const q = new URLSearchParams(location.search);
    const qv = q.get("view"), v = VIEWS[tab].some(([k]) => k === qv) ? (qv as View) : VIEWS[tab][0][0];
    const qw = Number(q.get("win")), w = WINDOWS.includes(qw) ? qw : 1;
    const codes0 = (q.get("on") || "").split(",").map((c) => c.trim().toUpperCase()).filter((c) => COUNTRIES.some((x) => x.code === c));
    const codes = codes0.length ? codes0 : ["CAN", "USA"];
    setView(v); setYears(w); setOn(Object.fromEntries(codes.map((c) => [c, true])));
    writeUrl(v, w, codes); // canonicalise invalid params right away
    urlRead.current = 1;
  }, [tab]);
  useEffect(() => {
    if (urlRead.current !== 2) { if (urlRead.current === 1) urlRead.current = 2; return; } // skip the commit that still holds pre-URL state
    writeUrl(view, years, COUNTRIES.map((c) => c.code).filter((c) => on[c]));
  }, [view, years, on]);
  const segRef = useRef<HTMLDivElement>(null);
  const [hl, setHl] = useState({ x: 0, w: 0 });
  const lines = useMemo(() => COUNTRIES.map((c) => ({ ...(buildLine(ds, c.code, years, mode) as Line), name: c.short })), [ds, years, mode]);
  const win = windowInfo(data, years);
  const we = workedExample(data, "CAN", years);
  const rex = (() => { const l = buildLine(rate, "CAN", years, "rate") as Line; const f = l.points.find((p) => p.value !== null); return f && l.last !== null ? { start: f.value!, end: l.last, d: l.last - f.value! } : null; })();
  const dataAsOf = asOf(data.data_as_of.snapshot_id);
  // provisional row only where the stats box actually tags provisional ("P") periods
  const hasProv = ["monthly", "quarterly"].some((f) => Object.values(ds[f] || {}).some((x) => Object.values((x as { status?: Record<string, string> }).status || {}).includes("P")));
  const econAsOf = econ ? asOf(econ.data_as_of.snapshot_id) : "";
  const qEnd = E ? qLabel(commonEnds(ds).quarterEnd) : "";
  const qx = E ? quarterExample(ds, "CAN", years) : null;
  const qSpan = E ? (() => { const l = lines[0]; return `${qLabel(l.points[0].period)} – ${qLabel(l.points[l.points.length - 1].period)}`; })() : "";
  // legend items only when the matching marker is actually drawn (same conditions as LineChart)
  const shown = lines.filter((l) => on[l.code] && !l.excluded);
  const allPts = lines.flatMap((l) => l.points), m0 = Math.min(...allPts.map((p) => p.mi)), m1 = Math.max(...allPts.map((p) => p.mi));
  const hasBreak = shown.some((l) => l.points.some((p) => p.value !== null) && l.breaks.some((b) => b.mi >= m0 && b.mi <= m1));
  const hasJan = years <= 5 && shown.some((l) => l.janJumps.length > 0);
  const hasQ = shown.some((l) => l.freq === "quarterly" && l.points.some((p) => p.value !== null));
  const naNote = Object.fromEntries(lines.filter((l) => l.excluded).map((l) => [l.code, `n/a for ${years}Y`]));
  const emptyMsg = (() => { const sel = lines.filter((l) => on[l.code]); return sel.length && sel.every((l) => l.excluded) ? `No OECD data for ${sel.map((l) => COUNTRIES.find((c) => c.code === l.code)!.name).join(", ")} over ${years}Y` : null; })();
  const rateAsOf = asOf(rate.data_as_of.addendum_id);
  const span = `${fmtM(win.start)} – ${fmtM(win.end)}`;

  useLayoutEffect(() => {
    const seg = segRef.current; if (!seg) return;
    const m = () => { const el = seg.querySelector<HTMLElement>("button.on"); if (el) setHl({ x: el.offsetLeft, w: el.offsetWidth }); };
    m(); const ro = new ResizeObserver(m); ro.observe(seg); return () => ro.disconnect();
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

      {(
        <main className="wrap" role="tabpanel" aria-label={E ? "Economy" : "Labour"}>
          <p className="eyebrow">{E ? "Economy" : "Labour"}</p>
          <h1 key={view} className="fadein">{{ jobs: "Employment growth", rate: "Employment rate", gdp: "GDP", pc: "GDP per capita" }[view]}</h1>
          <p key={`s${view}`} className="sub fadein">{{ rate: "Share of people aged 15–64 who are employed · seasonally adjusted", jobs: "People employed, 15+ · seasonally adjusted · not adjusted for population", gdp: "Real GDP · inflation-adjusted · seasonally adjusted · each country\u2019s own currency", pc: "Real GDP per person · inflation-adjusted · each country\u2019s own currency" }[view]}</p>
          <div className="vseg" role="radiogroup" aria-label="Measure" ref={vRef}>
            <span className="hl" style={{ transform: `translateX(${vhl.x}px)`, width: vhl.w }} aria-hidden />
            {VIEWS[tab].map(([v, vl]) => (
              <button key={v} role="radio" aria-checked={view === v} className={view === v ? "on" : ""} onClick={() => pickView(v)}>{vl}</button>
            ))}
          </div>

          <div className="figs">
            {(() => {
              const sel = COUNTRIES.map((c) => c.code).filter((c) => on[c]);
              const nm0 = (c: string) => COUNTRIES.find((x) => x.code === c)!.short;
              const h = headlinePick(ds, sel, years, mode);
              if (!h.single && !h.fastest) return <div key={`${view}-na`} className="fig"><div className="figl" /><div className="figc">{sel.map((cc) => <span key={cc}><i style={{ background: `var(--${cc})` }} />{nm0(cc)}</span>)}</div><div className="figv na">n/a</div><div className="figp">No data at the start of {years}Y</div></div>;
              const R = view === "rate";
              const nm = (c: string) => COUNTRIES.find((x) => x.code === c)!.short;
              const per = (ps: string[]) => ps.map((p) => p.includes("Q") ? p.split("-").reverse().join(" ") : fmtM(p)).join(" / ");
              const cards = h.single ? [{ label: h.single.codes.map(nm).join(" · "), k: null as string | null, p: h.single }]
                : (() => { const lb = headlineLabels(h, mode); return [{ label: lb.fast!, k: "f", p: h.fastest! }, { label: lb.slow!, k: "s", p: h.slowest! }]; })();
              return cards.map((c, i) => (
                <div key={`${view}-${c.k ?? "one"}-${c.label}`} className="fig">
                  <div className="figl">{c.k ? c.label : null}</div>
                  <div className="figc" key={c.p.codes.join()}>{c.p.codes.map((cc) => <span key={cc}><i style={{ background: `var(--${cc})` }} />{nm(cc)}</span>)}</div>
                  <div className="figv"><Tween value={c.p.value} format={(x) => fmtHeadline(x, mode)} /><span>{R ? "pts" : "%"}</span></div>
                  <div className="figp">{per(c.p.periods)}</div>
                </div>
              ));
            })()}
          </div>
          <p className="span">{E ? `${qSpan} · quarterly` : `${span} · 3-month average`}</p>

          <div className="bar">
            <div className="seg" role="radiogroup" aria-label="Timeframe" ref={segRef} onKeyDown={segKey}>
              <span className="hl" style={{ transform: `translateX(${hl.x}px)`, width: hl.w }} aria-hidden />
              {WINDOWS.map((w) => (
                <button key={w} role="radio" aria-checked={years === w} tabIndex={years === w ? 0 : -1} className={years === w ? "on" : ""} onClick={() => setYears(w)}>{w}Y</button>
              ))}
            </div>
            <div className="div" aria-hidden />
            <Picker on={on} setOn={setOn} na={naNote} />
          </div>

          <section className="card chartcard">
            <LineChart lines={lines} on={on} years={years} data={ds} mode={mode} emptyMsg={emptyMsg} />
          </section>
          <ul className="notes">
            {hasJan && <li><i className="dot amber" />US January jump: cause not confirmed</li>}
            {E && hasQ && <li><i className="qdot" />One dot per quarter</li>}
            {hasBreak && <li><i className="tick" />{view === "jobs" ? "Series break, by year" : "Series break, by quarter"}</li>}
          </ul>
          <p className="source">{E ? `Source: OECD quarterly national accounts · ${view === "pc" ? "real GDP and population" : "real GDP"}, SA · as of ${econAsOf}` : `Source: OECD · ${view === "rate" ? "employment rate 15–64" : "employment 15+"}, SA · as of ${view === "rate" ? rateAsOf : dataAsOf}`}</p>

          <section className="calc" aria-labelledby="calc-h">
            <h2 id="calc-h">How it’s calculated</h2>
            <p className="sub">Same inputs and maths as the chart above.</p>
            <div className="card panel">
              {E ? (<>
              <div className="grp"><h3>Measures</h3><dl>
                <dt>{view === "pc" ? "Per capita" : "GDP"}</dt><dd>{view === "pc" ? "Real GDP ÷ population, both from the OECD." : "Total output after inflation. Not per person."}</dd>
                <dt>Currency</dt><dd>Own currency · growth only, no exchange rates</dd>
              </dl></div>
              <div className="grp"><h3>Inputs</h3><dl>
                <dt>Dataset</dt><dd className="mono">OECD DF_QNA · B1GQ{view === "pc" ? " + POP" : ""}</dd>
                <dt>Measure</dt><dd>{view === "pc" ? "Real GDP (chain-linked volume) ÷ population, persons" : "Real GDP, chain-linked volume, seasonally adjusted"}</dd>
                <dt>Frequency</dt><dd>Quarterly, all seven</dd>
                <dt>Snapshot</dt><dd>{econAsOf}</dd>
              </dl></div>
              <div className="grp"><h3>Window</h3><dl>
                <dt>Start – end</dt><dd className="strong">{qSpan}</dd>
                <dt>Ends</dt><dd>Ends {qEnd}, the latest quarter all seven share.</dd>
                <dt>Length</dt><dd>{years} year{years > 1 ? "s" : ""} · moves with the switch</dd>
              </dl></div>
              <div className="grp"><h3>Formulas</h3><div className="fx">
                {view === "pc" && <div className="code"><span>Per capita</span><code>per capita = real GDP ÷ population</code></div>}
                <div className="code"><span>Index</span><code>index = value(now) ÷ value(start) × 100</code></div>
                <div className="code"><span>Growth %</span><code>growth = index(end) − 100</code></div>
                {qx && <p className="ex">Canada, {qLabel(qx.end)}: <b>{fmtL(qx.vEnd)} ÷ {fmtL(qx.vStart)} × 100 = {qx.index.toFixed(2)}</b> → growth <b>{sign(qx.growth)}{Math.abs(qx.growth).toFixed(2)}%</b></p>}
              </div></div>
              <div className="grp"><h3>Cross-check</h3><div className="xc">
                <p>Checked against IMF yearly growth: within 0.3 pts except DEU 2017/20/24, FRA 2024, GBR 2017, ITA 2016.</p>
                {view === "pc" && <p>Population: within 0.3 pts except FRA 2014, USA 2020.</p>}
              </div></div>
            </>) : view === "rate" ? (<>
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
                <li><span className="ic"><svg width="5" height="15"><rect x="1.5" y="1.5" width="2" height="12" rx="1" fill="var(--text-2)" stroke="var(--card-solid)" strokeWidth="3" paintOrder="stroke" /></svg></span>{view === "jobs" ? "Series breaks marked by year" : "Series breaks marked by quarter"}</li>
                {!E && <li><span className="ic">3m</span>3-mo avg blank if a month is missing</li>}
                {hasProv && <li><span className="ic">P</span>Latest quarters may be provisional</li>}
                <li><span className="ic">—</span>No data at start: left out</li>
              </ul></div>
            </div>
          </section>
        </main>
      )}
      <footer className="ftr wrap"><span>unitedstats</span><span>Data as of {E ? econAsOf : dataAsOf}</span></footer>
    </div>
  );
}
