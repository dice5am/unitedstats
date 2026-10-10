"use client";
import { Fragment, useEffect, useMemo, useRef, useState, useLayoutEffect, type MutableRefObject } from "react";
import { COUNTRIES, WINDOWS, buildLine, headlinePick, headlineLabels, fmtHeadline, workedExample, quarterExample, qLabel, commonEnds, windowLabel, DEFAULT_ON, parseOn } from "@/lib/series.mjs";
import LineChart, { type Line } from "./LineChart";
import Tween from "./Tween";
import Picker from "./Picker";
import { writeParams, CalcDisclosure, useDocTitle } from "./kit";
import { chartTitle } from "@/src/charts/meta";

// One self-contained chart card: measure toggle, timeframe, picker, headline, chart, legend, How it's calculated.
// Every card on a page owns its own state and its own URL params (prefix), sharing nothing with its siblings.
export type Kind = "unemp" | "jobs" | "econ";
type View = "unemp" | "jobs" | "jpc" | "gdp" | "pc";
type Mode = "unemp" | "jobs" | "index";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DS = any;

const VIEWS: Record<Kind, [View, string][]> = { unemp: [["unemp", "Unemployment rate"]], jobs: [["jobs", "Jobs"], ["jpc", "Jobs per capita"]], econ: [["gdp", "GDP"], ["pc", "GDP per capita"]] };
const URLV: Record<View, string> = { unemp: "unemp", jobs: "jobs", jpc: "pc", gdp: "gdp", pc: "pc" };
const MODE: Record<View, Mode> = { unemp: "unemp", jobs: "jobs", jpc: "index", gdp: "index", pc: "index" };
// Design decision: "How it's calculated" is a disclosure, closed by default at every width.
// false = the old always-open section.
export const CALC_DISCLOSURE = true;

// Titles come from the central registry (src/charts/meta.ts) and follow the selected view.
const HEAD: Record<View, string> = { unemp: chartTitle("unemp"), jobs: chartTitle("jobs", "jobs"), jpc: chartTitle("jobs", "jpc"), gdp: chartTitle("gdp", "gdp"), pc: chartTitle("gdp", "pc") };
const SUB: Record<View, string> = {
  unemp: "Unemployed as % of labour force, age 15+ · seasonally adjusted",
  jobs: "People employed, 15+ · seasonally adjusted · not adjusted for population",
  jpc: "People employed per person in the population · indexed to 100 at start",
  gdp: "Real GDP · inflation-adjusted · seasonally adjusted · each country\u2019s own currency",
  pc: "Real GDP per person · inflation-adjusted · each country\u2019s own currency",
};
// URL keys per chart, all prefixed (g_*, u_*, j_*). Old unprefixed links (view/win/on) still map onto the right chart.
const KEYS: Record<Kind, { view?: string; win: string; on: string }> = { econ: { view: "g_view", win: "g_win", on: "g_on" }, unemp: { win: "u_win", on: "u_on" }, jobs: { view: "j_view", win: "j_win", on: "j_on" } };
const LEGACY = ["view", "win", "on"];

const fmtM = (p: string) => { const [y, m] = p.split("-").map(Number); return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }); };
export const asOf = (id: string) => { const m = /(\d{4})(\d{2})(\d{2})T/.exec(id); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : id; };
const sign = (v: number) => (v > 0.0049 ? "+" : v < -0.0049 ? "−" : "");
const fmtL = (v: number) => (v >= 1000 ? Math.round(v).toLocaleString("en-GB") : v.toLocaleString("en-GB", { maximumFractionDigits: 3 }));
const k = (v: number) => `${v.toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;


export default function ChartCard({ kind, sets, primary = false, initialSearch }: {
  kind: Kind; sets: Partial<Record<View, DS>>; primary?: boolean; initialSearch: MutableRefObject<string | null>;
}) {
  const views = VIEWS[kind], keys = KEYS[kind], E = kind === "econ";
  const [view, setView] = useState<View>(views[0][0]);
  const [years, setYears] = useState(1);
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(DEFAULT_ON.map((c) => [c, true])));
  const secRef = useRef<HTMLElement>(null);
  const vRef = useRef<HTMLDivElement>(null);
  const segRef = useRef<HTMLDivElement>(null);
  const [vhl, setVhl] = useState({ x: 0, w: 0 });
  const [hl, setHl] = useState({ x: 0, w: 0 });

  // URL state: read once before paint (server renders defaults -> no hydration mismatch), validate, canonicalise.
  // Old Labour links (?view=jobs|rate&win=&on=) map onto the matching card; ?view=rate scrolls to Unemployment.
  const urlRead = useRef<0 | 1 | 2>(0);
  const keyStr = (v: View, w: number, codes: string[]) => ({ ...(keys.view ? { [keys.view]: URLV[v] } : {}), [keys.win]: String(w), [keys.on]: DEFAULT_ON.filter((c) => codes.includes(c)).join(",") });
  useLayoutEffect(() => {
    const q = new URLSearchParams(initialSearch.current ?? location.search);
    const lv = q.get("view");
    const hasOld = q.has("view") || q.has("win") || q.has("on");
    const legacy = hasOld && (E || (kind === "unemp" && lv === "rate") || (kind === "jobs" && lv !== "rate"));
    const qv = keys.view ? (q.get(keys.view) ?? (legacy && E ? lv : null)) : null;
    const v = views.find(([vv]) => URLV[vv] === qv)?.[0] ?? views[0][0];
    const qw = Number(q.get(keys.win) ?? (legacy ? q.get("win") : null)), w = WINDOWS.includes(qw) ? qw : 1;
    const codes = parseOn(q.get(keys.on) ?? (legacy ? q.get("on") : null));
    setView(v); setYears(w); setOn(Object.fromEntries(codes.map((c) => [c, true])));
    writeParams(keyStr(v, w, codes), LEGACY);
    if (kind === "unemp" && lv === "rate") requestAnimationFrame(() => secRef.current?.scrollIntoView({ block: "start" }));
    urlRead.current = 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (urlRead.current !== 2) { if (urlRead.current === 1) urlRead.current = 2; return; }
    writeParams(keyStr(view, years, DEFAULT_ON.filter((c) => on[c])), LEGACY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, years, on]);

  useLayoutEffect(() => { const el = vRef.current?.querySelector<HTMLElement>("button.on"); if (el) setVhl({ x: el.offsetLeft, w: el.offsetWidth }); }, [view]);
  useLayoutEffect(() => {
    const seg = segRef.current; if (!seg) return;
    const m = () => { const el = seg.querySelector<HTMLElement>("button.on"); if (el) setHl({ x: el.offsetLeft, w: el.offsetWidth }); };
    m(); const ro = new ResizeObserver(m); ro.observe(seg); return () => ro.disconnect();
  }, [years]);

  const ds = sets[view]; const mode = MODE[view]; const R = mode === "unemp";
  const lines = useMemo(() => COUNTRIES.map((c) => ({ ...(buildLine(ds, c.code, years, mode) as Line), name: c.short })), [ds, years, mode]);
  const sel = DEFAULT_ON.filter((c) => on[c]);
  const wl = windowLabel(ds, sel, years, mode);
  const asOfStr = asOf(ds.data_as_of.snapshot_id ?? ds.data_as_of.snapshot ?? "");
  const hasProv = ["monthly", "quarterly"].some((f) => Object.values(ds[f] || {}).some((x) => Object.values((x as { status?: Record<string, string> }).status || {}).includes("P")));
  const shown = lines.filter((l) => on[l.code] && !l.excluded);
  const allPts = lines.flatMap((l) => l.points), m0 = Math.min(...allPts.map((p) => p.mi)), m1 = Math.max(...allPts.map((p) => p.mi));
  const brks = shown.filter((l) => l.points.some((p) => p.value !== null)).flatMap((l) => l.breaks.filter((b) => b.mi >= m0 && b.mi <= m1));
  const brkUnit = brks.length && brks.every((b) => b.label.includes("Q")) ? "quarter" : "year";
  const hasJan = years <= 5 && shown.some((l) => l.janJumps.length > 0);
  const naNote = Object.fromEntries(lines.filter((l) => l.excluded).map((l) => [l.code, `n/a for ${years}Y`]));
  const emptyMsg = (() => { const s = lines.filter((l) => on[l.code]); return s.length && s.every((l) => l.excluded) ? `No OECD data for ${s.map((l) => COUNTRIES.find((c) => c.code === l.code)!.name).join(", ")} over ${years}Y` : null; })();
  const windowRow = <><dt>Start – end</dt><dd className="strong">{wl.range}{wl.freq === "quarterly" ? " · quarterly" : ""}</dd></>;
  const lengthRow = <><dt>Length</dt><dd>{years} year{years > 1 ? "s" : ""} · moves with the switch</dd></>;
  const hid = `calc-h-${kind}`;

  const segKey = (e: React.KeyboardEvent) => {
    const i = WINDOWS.indexOf(years);
    const n = ["ArrowRight", "ArrowDown"].includes(e.key) ? i + 1 : ["ArrowLeft", "ArrowUp"].includes(e.key) ? i - 1 : null;
    if (n === null) return;
    e.preventDefault();
    const j = (n + WINDOWS.length) % WINDOWS.length;
    setYears(WINDOWS[j]);
    (segRef.current?.querySelectorAll("button")[j] as HTMLElement | undefined)?.focus();
  };
  const H = primary ? "h1" : "h2";
  useDocTitle(secRef, HEAD[view]);

  const calc = (() => {
    if (E) {
      const qx = quarterExample(ds, "CAN", years);
      return (<>
        <div className="grp"><h3>Measures</h3><dl>
          <dt>{view === "pc" ? "Per capita" : "GDP"}</dt><dd>{view === "pc" ? "Real GDP ÷ population, both from the OECD." : "Total output after inflation. Not per person."}</dd>
          <dt>Currency</dt><dd>Own currency · growth only, no exchange rates</dd>
        </dl></div>
        <div className="grp"><h3>Inputs</h3><dl>
          <dt>Dataset</dt><dd className="mono">OECD DF_QNA · B1GQ{view === "pc" ? " + POP" : ""}</dd>
          <dt>Measure</dt><dd>{view === "pc" ? "Real GDP (chain-linked volume) ÷ population, persons" : "Real GDP, chain-linked volume, seasonally adjusted"}</dd>
          <dt>Frequency</dt><dd>Quarterly, all seven</dd>
          <dt>Snapshot</dt><dd>{asOfStr}</dd>
        </dl></div>
        <div className="grp"><h3>Window</h3><dl>
          {windowRow}
          <dt>Ends</dt><dd>Ends {qLabel(commonEnds(ds).quarterEnd)}, the latest quarter all seven share.</dd>
          {lengthRow}
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
      </>);
    }
    if (R) {
      const l = lines.find((x) => x.code === "CAN")!; const f = l.points.find((p) => p.value !== null);
      const rex = f && l.last !== null ? { start: f.value!, end: l.last, d: l.last - f.value! } : null;
      return (<>
        <div className="grp"><h3>Measures</h3><dl>
          <dt>Rate</dt><dd>OECD unemployment rate, ages 15+, seasonally adjusted. Change shown in percentage points.</dd>
          <dt>Shown as</dt><dd>The rate itself, in %. Not indexed. Lower is better.</dd>
        </dl></div>
        <div className="grp"><h3>Inputs</h3><dl>
          <dt>Dataset</dt><dd className="mono">OECD DF_IALFS_INDIC · UNE_LF</dd>
          <dt>Measure</dt><dd>Unemployed as % of labour force, 15+, seasonally adjusted</dd>
          <dt>Frequency</dt><dd>Monthly: CA US JP · Qtrly: UK DE FR IT</dd>
          <dt>Snapshot</dt><dd>{asOfStr}</dd>
        </dl></div>
        <div className="grp"><h3>Window</h3><dl>{windowRow}{lengthRow}</dl></div>
        <div className="grp"><h3>Formulas</h3><div className="fx">
          <div className="code"><span>3-month average</span><code>avg(m) = (m−2 + m−1 + m) ÷ 3</code></div>
          <div className="code"><span>Change</span><code>change = end − start, in points</code></div>
          {rex && <p className="ex">Canada, {fmtM(l.points[l.points.length - 1].period)}: <b>{rex.end.toFixed(2)}% − {rex.start.toFixed(2)}% = {sign(rex.d)}{Math.abs(rex.d).toFixed(2)} pts</b></p>}
        </div></div>
      </>);
    }
    const we = workedExample(ds, "CAN", years);
    const P = view === "jpc";
    return (<>
      <div className="grp"><h3>Measures</h3><dl>
        {P ? <><dt>Per capita</dt><dd>Jobs ÷ OECD total population. Monthly countries use population interpolated in a straight line between quarters.</dd></>
          : <><dt>Counts</dt><dd>Number of people employed, age 15+. A headcount, not a rate.</dd>
            <dt>Not</dt><dd>Adjusted for population: faster population growth can add jobs without a better employment rate.</dd></>}
      </dl></div>
      <div className="grp"><h3>Inputs</h3><dl>
        <dt>Dataset</dt><dd className="mono">OECD DF_IALFS_INDIC{P ? " + DF_QNA POP" : ""}</dd>
        <dt>Measure</dt><dd>Employment, 15+, seasonally adjusted{P ? "; population, persons, each quarter placed on its middle month" : ""}</dd>
        <dt>Frequency</dt><dd>Monthly: CA US JP · Qtrly: UK DE FR IT</dd>
        <dt>Snapshot</dt><dd>{asOfStr}</dd>
      </dl></div>
      <div className="grp"><h3>Window</h3><dl>{windowRow}{P && <><dt>Ends</dt><dd>Q1 2026 / Mar 2026: France’s population stops at Q1 2026. Never extrapolated.</dd></>}{lengthRow}</dl></div>
      <div className="grp"><h3>Formulas</h3><div className="fx">
        {P && <div className="code"><span>Per capita</span><code>jobs(m) ÷ population(m)</code></div>}
        <div className="code"><span>3-month average</span><code>avg(m) = (m−2 + m−1 + m) ÷ 3</code></div>
        <div className="code"><span>Index</span><code>index = avg(now) ÷ avg(start) × 100</code></div>
        <div className="code"><span>Growth %</span><code>growth = index(end) − 100</code></div>
        {we && (P
          ? <p className="ex">Canada, {fmtM(we.end)}: <b>{(we.avgEnd * 100).toFixed(2)} ÷ {(we.avgStart * 100).toFixed(2)} × 100 = {we.index.toFixed(2)}</b> (jobs per 100 people) → growth <b>{sign(we.growth)}{Math.abs(we.growth).toFixed(2)}%</b></p>
          : <p className="ex">Canada, {fmtM(we.end)}: <b>{k(we.avgEnd)} ÷ {k(we.avgStart)} × 100 = {we.index.toFixed(2)}</b> → growth <b>{sign(we.growth)}{Math.abs(we.growth).toFixed(2)}%</b></p>)}
      </div></div>
      {P && <div className="grp"><h3>Cross-check</h3><div className="xc"><p>Population: within 0.3 pts except FRA 2014, USA 2020.</p></div></div>}
    </>);
  })();

  const calcBody = (
        <div className="card panel">
          {calc}
          <div className="grp"><h3>Rules</h3><ul className="rules">
            <li><span className="ic">n/a</span>Gaps (n/a) are never filled</li>
            <li><span className="ic"><svg width="16" height="10"><path d="M1 8 L8 3 L15 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>Quarterly countries: one reading per quarter, joined by a line</li>
            <li><span className="ic"><svg width="5" height="15"><rect x="1.5" y="1.5" width="2" height="12" rx="1" fill="var(--text-2)" stroke="var(--card-solid)" strokeWidth="3" paintOrder="stroke" /></svg></span>{E ? "Series breaks marked by quarter" : "Series breaks marked by year"}</li>
            {!E && <li><span className="ic">3m</span>3-mo avg blank if a month is missing</li>}
            {hasProv && <li><span className="ic">P</span>Latest quarters may be provisional</li>}
            <li><span className="ic">—</span>No data at start: left out</li>
          </ul></div>
        </div>
  );

  return (
    <section className="cardsec" ref={secRef} aria-labelledby={`h-${kind}`} id={`card-${kind}`}>
      <p className="eyebrow">{E ? "Economy" : "Labour"}</p>
      <H id={`h-${kind}`} key={view} className="h1 fadein">{HEAD[view]}</H>
      <p key={`s${view}`} className="sub fadein">{SUB[view]}</p>
      {views.length > 1 && (
        <div className="vseg" role="radiogroup" aria-label="Measure" ref={vRef}>
          <span className="hl" style={{ transform: `translateX(${vhl.x}px)`, width: vhl.w }} aria-hidden />
          {views.map(([v, vl]) => (
            <button key={v} role="radio" aria-checked={view === v} className={view === v ? "on" : ""} onClick={() => setView(v)}>{vl}</button>
          ))}
        </div>
      )}

      <div className="figs">
        {(() => {
          const nm = (c: string) => COUNTRIES.find((x) => x.code === c)!.short;
          const h = headlinePick(ds, sel, years, mode);
          if (!h.single && !h.fastest) return <div key={`${view}-na`} className="fig"><div className="figl" /><div className="figc">{sel.map((cc) => <span key={cc}><i style={{ background: `var(--${cc})` }} />{nm(cc)}</span>)}</div><div className="figv na">n/a</div><div className="figp">No data at the start of {years}Y</div></div>;
          const per = (ps: string[]) => ps.map((p) => p.includes("Q") ? p.split("-").reverse().join(" ") : fmtM(p)).join(" / ");
          const lb = headlineLabels(h, mode);
          const cards = h.single ? [{ label: h.single.codes.map(nm).join(" · "), k: null as string | null, p: h.single }]
            : lb.lowerBetter ? [{ label: lb.slow!, k: "s", p: h.slowest! }, { label: lb.fast!, k: "f", p: h.fastest! }]
            : [{ label: lb.fast!, k: "f", p: h.fastest! }, { label: lb.slow!, k: "s", p: h.slowest! }];
          return cards.map((c) => (
            <div key={`${view}-${c.k ?? "one"}-${c.label}`} className="fig">
              <div className="figl">{c.k ? c.label : null}</div>
              <div className="figc" key={c.p.codes.join()}>{c.p.codes.map((cc) => <span key={cc}><i style={{ background: `var(--${cc})` }} />{nm(cc)}</span>)}</div>
              <div className={R ? "figv pts" : "figv"}><Tween value={c.p.value} format={(x) => fmtHeadline(x, mode)} /><span>{R ? "pts" : "%"}</span></div>
              <div className="figp">{per(c.p.periods)}</div>
            </div>
          ));
        })()}
      </div>
      <p className="span">{wl.text.split(" · ").map((t, i) => <Fragment key={i}>{i ? " · " : ""}<span className="nw">{t}</span></Fragment>)}</p>

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
        {brks.length > 0 && <li><i className="tick" />Series break, by {brkUnit}</li>}
      </ul>
      <p className="source">{E ? `Source: OECD quarterly national accounts · ${view === "pc" ? "real GDP and population" : "real GDP"}, SA · as of ${asOfStr}`
        : R ? `Source: OECD · unemployment rate 15+, SA · as of ${asOfStr}`
        : `Source: OECD · employment 15+${view === "jpc" ? " ÷ OECD total population" : ""}, SA · as of ${asOfStr}`}</p>

      <section className="calc" aria-labelledby={hid}>
        {CALC_DISCLOSURE ? <CalcDisclosure hid={hid}>{calcBody}</CalcDisclosure> : <>
        <h2 id={hid}>How it’s calculated</h2>
        <p className="sub">Same inputs and maths as the chart above.</p>
        {calcBody}</>}
      </section>
    </section>
  );
}


