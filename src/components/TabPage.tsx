"use client";
// Round 4b shell: five tabs, one hero chart per tab, chart switcher.
// 390: full-width picker "Title ▾" with ‹ › arrows + bottom sheet (title + one plain line). ≥1024: sticky left rail.
// ?chart=<id> + that chart's own prefixed params. Switching pushes history (Back steps between charts);
// each chart's params are remembered for the session so switching away and back restores its state.
// Only the shown chart's code and data load; the next chart is preloaded when the browser is idle.
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { CHART_META, TABS, TAB_CHARTS, chartTitle, type ChartId, type TabId } from "@/src/charts/meta";
import { ChartById, isBuilt, preload } from "@/src/charts/registry";

const STORE = "us-chart-params";
const mem = (): Record<string, string> => { try { return JSON.parse(sessionStorage.getItem(STORE) || "{}"); } catch { return {}; } };
const ALL_PARAMS = Object.values(CHART_META).flatMap((m) => m.params);
const LEGACY = ["view", "win", "on"];

// Which chart an old link means (no ?chart=): Labour view=rate / u_* -> unemp; view=jobs / j_* -> jobs; uh_ -> 2;
// Economy view/win/on / g_* -> gdp; cr_ -> 1.
function inferChart(tab: TabId, q: URLSearchParams): ChartId | null {
  const has = (p: string) => [...q.keys()].some((k) => k.startsWith(p));
  if (tab === "labour") { if (q.get("view") === "rate" || has("u_")) return "unemp"; if (q.has("view") || q.has("win") || q.has("on") || has("j_")) return "jobs"; if (has("uh_")) return "2"; }
  if (tab === "economy") { if (has("cr_")) return "1"; if (q.has("view") || q.has("win") || q.has("on") || has("g_")) return "gdp"; }
  return null;
}
function readChart(tab: TabId): ChartId {
  const q = new URLSearchParams(location.search), list = TAB_CHARTS[tab];
  const c = q.get("chart") as ChartId | null;
  return c && list.includes(c) ? c : inferChart(tab, q) ?? list[0];
}

function TabRow({ tab }: { tab: TabId }) {
  return (
    <nav className="tabs5" aria-label="Sections">
      {TABS.map((t) => <Link key={t.id} href={`/${t.id}`} className={t.id === tab ? "on" : ""} aria-current={t.id === tab ? "page" : undefined}>{t.label}</Link>)}
    </nav>
  );
}

export default function TabPage({ tab }: { tab: TabId }) {
  const list = TAB_CHARTS[tab];
  const [chart, setChart] = useState<ChartId | null>(null); // null on the server: no hydration mismatch
  const [nonce, setNonce] = useState(0);
  const [sheet, setSheet] = useState(false);

  // First read: pick the chart (old links mapped), put ?chart= first in the URL, keep the chart's own params.
  useLayoutEffect(() => {
    const c = readChart(tab), q = new URLSearchParams(location.search);
    q.delete("chart");
    const qs = `chart=${c}${q.toString() ? "&" + q.toString().replace(/%2C/g, ",") : ""}`;
    history.replaceState({ chart: c }, "", `${location.pathname}?${qs}`);
    setChart(c);
    const pop = () => { setChart(readChart(tab)); setNonce((n) => n + 1); };
    addEventListener("popstate", pop); return () => removeEventListener("popstate", pop);
  }, [tab]);

  const go = useCallback((next: ChartId) => {
    if (!chart || next === chart) { setSheet(false); return; }
    const q = new URLSearchParams(location.search), m = mem(), mine = CHART_META[chart].params;
    m[chart] = [...q.entries()].filter(([k]) => mine.includes(k)).map(([k, v]) => `${k}=${v}`).join("&");
    sessionStorage.setItem(STORE, JSON.stringify(m));
    const keep = m[next] ? `&${m[next]}` : "";
    history.pushState({ chart: next }, "", `${location.pathname}?chart=${next}${keep}`);
    setChart(next); setNonce((n) => n + 1); setSheet(false);
    scrollTo({ top: 0 });
  }, [chart]);

  // Idle-preload the next chart in this tab.
  useEffect(() => {
    if (!chart) return;
    const nx = list[(list.indexOf(chart) + 1) % list.length];
    const ric = (window as unknown as { requestIdleCallback?: (f: () => void) => number }).requestIdleCallback;
    const h = ric ? ric(() => preload(nx)) : window.setTimeout(() => preload(nx), 1500);
    return () => { if (!ric) clearTimeout(h); };
  }, [chart, list]);
  useEffect(() => { if (!sheet) return; const k = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [sheet]);
  useEffect(() => {
    if (!chart || isBuilt(chart)) return;
    const t = `${chartTitle(chart)} · unitedstats`, set = () => { document.title = t; };
    set(); const ids = [50, 300, 1000].map((ms) => setTimeout(set, ms)); return () => ids.forEach(clearTimeout);
  }, [chart]);

  const i = chart ? list.indexOf(chart) : 0;
  const step = (d: number) => go(list[(i + d + list.length) % list.length]);
  return (
    <div className="page">
      <div className="aura" aria-hidden />
      <header className="hdr">
        <Link href="/economy" className="brand"><span className="mark" aria-hidden />unitedstats</Link>
        <ThemeToggle />
      </header>
      <TabRow tab={tab} />
      <div className="tabbody wrap">
        <aside className="rail" aria-label={`${TABS.find((t) => t.id === tab)!.label} charts`}>
          <ul>{list.map((c) => <li key={c}><a href={`?chart=${c}`} className={c === chart ? "on" : ""} aria-current={c === chart ? "true" : undefined}
            onClick={(e) => { e.preventDefault(); go(c); }}><b>{chartTitle(c)}</b><span>{CHART_META[c].desc}</span></a></li>)}</ul>
        </aside>
        <div className="stage">
          <div className="cpick">
            <button type="button" className="cpar" aria-label="Previous chart" onClick={() => step(-1)}>‹</button>
            <button type="button" className="cpbtn" aria-haspopup="dialog" aria-expanded={sheet} onClick={() => setSheet(true)}>
              <span>{chart ? chartTitle(chart) : chartTitle(list[0])}</span><span aria-hidden>▾</span>
            </button>
            <button type="button" className="cpar" aria-label="Next chart" onClick={() => step(1)}>›</button>
          </div>
          <main className="hero" aria-live="polite">
            {chart && (isBuilt(chart) ? <ChartById key={`${chart}-${nonce}`} id={chart} /> : (
              <section className="cardsec wip" aria-labelledby="wip-h">
                <p className="eyebrow">{TABS.find((t) => t.id === tab)!.label}</p>
                <h1 id="wip-h" className="h1">{chartTitle(chart)}</h1>
                <p className="sub">{CHART_META[chart].desc}</p>
                <div className="card wipcard"><p>In progress</p></div>
              </section>
            ))}
          </main>
        </div>
      </div>
      {sheet && (
        <div className="sheetwrap" onPointerDown={() => setSheet(false)}>
          <div className="sheet moresheet" role="dialog" aria-modal="true" aria-label="Charts" onPointerDown={(e) => e.stopPropagation()}>
            <div className="grab" aria-hidden />
            <ul>{list.map((c, k) => <li key={c}><a href={`?chart=${c}`} className={c === chart ? "on" : ""} aria-current={c === chart ? "true" : undefined} autoFocus={k === i}
              onClick={(e) => { e.preventDefault(); go(c); }}><b>{chartTitle(c)}</b><span>{CHART_META[c].desc}</span></a></li>)}</ul>
            <button type="button" className="done" onClick={() => setSheet(false)}>Done</button>
          </div>
        </div>
      )}
      <footer className="ftr wrap"><span>unitedstats</span><span>Sources: OECD, BIS, IMF, World Bank, ILOSTAT</span></footer>
    </div>
  );
}
