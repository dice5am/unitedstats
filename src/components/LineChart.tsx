"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { MON } from "@/lib/charts.mjs";
import { DISPLAY_DP } from "@/lib/series.mjs";
import { SHORT_CODE, mStr, qOfMonth, monotonePath, rawLevel, glowLeaders, statusAt, estAt, ownChange, wholeEstimate, noDataBands, flagTags, dataEnd } from "@/lib/series.mjs";

export type Pt = { period: string; mi: number; value: number | null };
export type Line = {
  code: string; name: string; freq: "monthly" | "quarterly" | "annual"; points: Pt[]; breaks: { mi: number; label: string }[];
  last: number | null; growth: number | null; janJumps: string[]; indexedFrom: string | null; excluded?: boolean; late?: string | null; full?: boolean;
};

const MAIN = new Set(["CAN", "USA"]);
const col = (c: string) => `var(--${c})`;
const COVID = { a: 2020 * 12 + 2, b: 2021 * 12 + 5 };
// one month formatter everywhere ("Sep", never "Sept")
const fmtM = (mi: number, short = false) => `${MON[mi % 12]} ${short ? "’" + String(Math.floor(mi / 12)).slice(2) : Math.floor(mi / 12)}`;
const pEndMi = (p: string) => (/Q/.test(p) ? +p.slice(0, 4) * 12 + +p.slice(-1) * 3 - 1 : /^\d{4}$/.test(p) ? +p * 12 + 11 : +p.slice(0, 4) * 12 + +p.slice(5, 7) - 1);
const qLabel = (p: string) => { const [y, q] = p.split("-"); return `${q} ${y}`; };

let ctx: CanvasRenderingContext2D | null = null;
function textW(s: string, px: number, weight: number) {
  if (typeof document === "undefined") return s.length * px * 0.6;
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return s.length * px * 0.6;
  ctx.font = `${weight} ${px}px "Be Vietnam Pro", system-ui, sans-serif`;
  return ctx.measureText(s).width;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function LineChart({ lines: all, on, years, data, mode = "jobs", emptyMsg = null, onBandLegend }: { lines: Line[]; on: Record<string, boolean>; years: number; data: any; mode?: "jobs" | "unemp" | "index" | "level"; emptyMsg?: string | null; onBandLegend?: (labels: string[]) => void }) {
  const RU = mode === "unemp"; // unemployment: lower is better
  const R = RU || mode === "level"; // a level in %, not indexed (unemployment, policy rate)
  const IX = mode === "index" || mode === "jobs";
  const [vh, setVh] = useState(0);
  useEffect(() => { const f = () => setVh(window.innerWidth >= 1024 ? window.innerHeight : 0); f(); addEventListener("resize", f); return () => removeEventListener("resize", f); }, []);
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [covTip, setCovTip] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  // tap rule: a line or its end label sets focus (others dim to 30%) and opens the stats box; empty space clears both
  const [focus, setFocus] = useState<string | null>(null);
  const [brkTip, setBrkTip] = useState<{ x: number; y: number; label: string } | null>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => { if (e.contentRect.width > 0) setW(e.contentRect.width); });
    ro.observe(el); return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const close = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setHover(null); setBrkTip(null); setFocus(null); } };
    document.addEventListener("pointerdown", close); return () => document.removeEventListener("pointerdown", close);
  }, []);
  const open = hover !== null;
  useEffect(() => {
    if (!open) return;
    const y0 = window.scrollY;
    const onScroll = () => { if (Math.abs(window.scrollY - y0) > 8) { setHover(null); setFocus(null); } };
    window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  const lines = all.filter((l) => on[l.code] && !l.excluded);
  const picked = all.filter((l) => on[l.code]);
  const allQ = all.every((l) => l.freq === "quarterly");
  const qL = (mi: number, short = false) => { const q = qOfMonth(mi); const yy = Math.floor(q / 4); return `Q${(q % 4) + 1} ${short ? "’" + String(yy).slice(2) : yy}`; };
  const mainOn = lines.some((l) => MAIN.has(l.code));
  const wide = w >= 768;
  // ≥1024: the chart fills the rest of the window, sized from the viewport height (not the content), min 480.
  // <1024: fixed heights, so switching charts never changes the plot height.
  // Short windows (<800px tall): 340 min and compact chrome (title 28, figures 32, no description, 12px gap); else 480 min.
  const h = vh ? (vh < 800 ? Math.max(340, vh - 400) : Math.max(480, vh - 545)) : wide ? 500 : 320; // offsets = header, title, figures row, legend + source line
  const lblPx = wide ? 13 : 12;
  // <768: names, falling back to 2-letter codes when the names won't fit (width or vertical spread)
  const minGap = Math.ceil(lblPx * 1.25) + 4; // label box height + >= 4px clear between labels
  const nameW = Math.max(36, ...lines.map((l) => textW(l.name, lblPx, MAIN.has(l.code) ? 700 : 500)));
  const useCodes = !wide && (nameW + 22 > (w || 390) * 0.26 || lines.length * minGap > h - 34 - 58 - 10);
  const from = (l: Line) => (IX && l.late && !(data.noLateMark || []).includes(l.code) ? ` · from ${l.late.slice(0, 4)}` : "");
  const label = (l: Line) => (wide && l.last !== null ? `${l.name}${from(l)} ${l.last.toFixed(R ? DISPLAY_DP.rate : 1)}${R ? "%" : ""}` : (useCodes ? SHORT_CODE[l.code] ?? l.code : l.name) + from(l));
  const gutter = Math.ceil(Math.max(36, ...lines.map((l) => textW(label(l), lblPx, MAIN.has(l.code) ? 700 : 500)))) + (wide ? 28 : 22);
  const pad = { l: wide ? 48 : 38, r: gutter, t: 34, b: 58 };
  const iw = Math.max(10, w - pad.l - pad.r), ih = h - pad.t - pad.b, bottom = pad.t + ih;

  const pts = all.flatMap((l) => l.points);
  const m0 = Math.min(...pts.map((p) => p.mi)), m1 = Math.max(...pts.map((p) => p.mi));
  const { y0, y1 } = useMemo(() => {
    const vs = lines.flatMap((l) => l.points.map((p) => p.value)).filter((v): v is number => v !== null);
    if (!vs.length) return { y0: R ? 0 : 95, y1: R ? 100 : 105 };
    let lo = R ? Math.min(...vs) : Math.min(100, ...vs), hi = R ? Math.max(...vs) : Math.max(100, ...vs);
    const span = Math.max(hi - lo, 0.5); lo -= span * 0.1; hi += span * 0.08;
    return { y0: lo, y1: hi };
  }, [lines, R]);

  const bandOut = useRef<string>("");
  useEffect(() => { if (onBandLegend) onBandLegend(bandOut.current ? bandOut.current.split("|") : []); });
  if (!w) return <div ref={ref} className="chart skeleton" style={{ height: 320 }} />;
  if (emptyMsg) return (
    <div ref={ref} className="chart empty" style={{ height: h }} role="status">
      <div className="emptycard">{emptyMsg}</div>
    </div>
  );

  const x = (mi: number) => pad.l + ((mi - m0) / (m1 - m0 || 1)) * iw;
  const y = (v: number) => pad.t + (1 - (v - y0) / (y1 - y0)) * ih;
  const ticks = niceTicks(y0, y1, wide ? 5 : 4);
  const dec0 = 0; void dec0;
  const dec = ticks.length > 1 && ticks[1] - ticks[0] < 1 ? 1 : 0;
  // x ticks: max 4 at <768
  const maxT = wide ? 6 : 4;
  const xt: number[] = [];
  if (years <= 1) { const st = wide ? 3 : 4; for (let mi = m1; mi >= m0; mi -= st) xt.unshift(mi); }
  else { const yrs = years / (maxT - 1); const st = Math.max(1, Math.ceil(yrs)) * 12; for (let mi = m1; mi >= m0; mi -= st) xt.unshift(mi); }
  while (xt.length > maxT) xt.shift();

  // no-data bands (excluded earlier years): visual only
  const bands = noDataBands(data, lines.map((l) => l.code), years, mode).map((b) => {
    const bx = x(b.to), tw = textW(b.label, 11, 400);
    const room = bx - pad.l - 16, cut = b.label.indexOf(": ");
    const lines2 = cut > 0 ? [b.label.slice(0, cut + 1), b.label.slice(cut + 2)] : [b.label];
    // one line if it fits with 8px clear each side; else two lines (split after the colon); else legend row
    const rows = tw <= room ? [b.label] : lines2.length === 2 && Math.max(...lines2.map((t) => textW(t, 11, 400))) <= room ? lines2 : null;
    return { ...b, bx, rows, inside: !!rows };
  });
  bandOut.current = bands.filter((b) => !b.inside).map((b) => b.label).join("|"); // labels that don't fit go to the legend row
  // gaps: blank stretches inside visible monthly lines
  const gaps: { a: number; b: number; label: string }[] = [];
  for (const l of lines) {
    if (l.freq !== "monthly") continue;
    let s: number | null = null;
    l.points.forEach((p, i) => {
      const prevOk = i > 0 && l.points[i - 1].value !== null;
      if (p.value === null && s === null && prevOk) s = p.mi;
      if (p.value !== null && s !== null) {
        const miss = (data.monthly[l.code].missing as string[]).filter((m: string) => { const [yy, mm] = m.split("-").map(Number); const mi = yy * 12 + mm - 1; return mi >= s! && mi < p.mi; });
        const mm = miss.map((m: string) => fmtM(Number(m.slice(0, 4)) * 12 + Number(m.slice(5)) - 1));
        gaps.push({ a: s, b: p.mi - 1, label: `No ${data.gapSource ?? "OECD"} data · ${mm.length > 2 ? `${mm[0]} – ${mm[mm.length - 1]}` : mm.join(", ") || fmtM(s)}` });
        s = null;
      }
    });
  }

  const covid = COVID.b >= m0 && COVID.a <= m1 ? { a: Math.max(COVID.a, m0), b: Math.min(COVID.b, m1) } : null;
  const showJumps = years <= 5;

  // end labels
  // #7: national DE/FR/IT lines stop in Dec 1998; the euro-area line carries the end label
  const ends = lines.filter((l) => !(data.noEndLabel || []).includes(l.code) || !lines.some((q) => q.code === "XM")).map((l) => {
    const lp = [...l.points].reverse().find((p) => p.value !== null);
    return lp ? { l, mi: lp.mi, v: lp.value as number, ty: y(lp.value as number) } : null;
  }).filter((e): e is NonNullable<typeof e> => !!e).sort((a, b) => a.ty - b.ty)
    // Design rule 2026-10-16: at phone width with more than 8 lines, label only the top line, the bottom line and Canada
    // (max 3), plus the tapped line as part of its focus; 1366 and up keep every label. Slots stay inside the plot.
    .filter((e, i, arr) => wide || lines.length <= 8 || i === 0 || i === arr.length - 1 || e.l.code === "CAN" || e.l.code === focus);
  // labels never leave the plot: with many lines on a short plot (20 at 1366x657) the slot gap tightens to fit
  const gapE = ends.length > 1 ? Math.min(minGap, (bottom - 4 - (pad.t + 6)) / (ends.length - 1)) : minGap;
  for (let i = 0; i < ends.length; i++) ends[i].ty = Math.max(ends[i].ty, pad.t + 6, i ? ends[i - 1].ty + gapE : -Infinity);
  for (let i = ends.length - 1; i >= 0; i--) ends[i].ty = Math.min(ends[i].ty, i === ends.length - 1 ? bottom - 4 : ends[i + 1].ty - gapE);

  // tooltip
  const ptAt = (l: Line, mi: number) => {
    if (l.freq === "monthly") return l.points.find((p) => p.mi === mi) ?? null;
    if (l.freq === "annual") { const yr = Math.floor(mi / 12), lastA = l.points[l.points.length - 1]; return l.points.find((p) => Math.floor(p.mi / 12) === yr) ?? (lastA && yr > Math.floor(lastA.mi / 12) ? lastA : null); }
    const q = qOfMonth(mi), last = l.points[l.points.length - 1];
    return l.points.find((p) => qOfMonth(p.mi) === q) ?? (last && q > qOfMonth(last.mi) ? last : null);
  };
  const pick = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    setHover(Math.min(m1, Math.max(m0, Math.round(m0 + ((clientX - r.left - pad.l) / iw) * (m1 - m0)))));
  };
  const rows = hover === null ? [] : picked.map((l) => {
    const p = l.excluded ? null : ptAt(l, hover);
    if (l.excluded) { const de = dataEnd(data, l.code); return { l, p: null, v: null, lvl: null, note: de && pEndMi(de) < hover ? `data ends ${de}` : "", tag: null }; }
    const lvl = p ? rawLevel(data, l.code, p.period) : null;
    const band = bands.find((b) => b.code === l.code && hover < b.to);
    if (band) return { l, p: null, v: null, lvl: null, note: band.label, tag: null };
    const pre = l.late && hover < l.points.find((q) => q.value !== null)!.mi ? `from ${/^\d{4}$/.test(l.late) ? l.late : l.late.includes("Q") ? qLabel(l.late) : fmtM(Number(l.late.slice(0, 4)) * 12 + Number(l.late.slice(5)) - 1)}` : null;
    // early ender (e.g. UK monthly to Jun 2026): past its last reading, show its own last figure tagged "to <month>"
    const lastP = [...l.points].reverse().find((q) => q.value !== null);
    if (!l.excluded && l.freq === "monthly" && lastP && lastP.mi < m1 && hover > lastP.mi) { const oc = R ? ownChange(data, l.code, years) : null;
      return { l, p: lastP, v: lastP.value, lvl: rawLevel(data, l.code, lastP.period), tag: `to ${fmtM(lastP.mi)}${oc ? ` · ${oc.change > 0.004 ? "+" : oc.change < -0.004 ? "−" : ""}${Math.abs(oc.change).toFixed(2)} pts over ${years}Y` : ""}` }; }
    const fl = p && p.value !== null ? flagTags(data, l.code, p.period) : []; // general rule: estimate · OECD estimate · provisional
    // n/a after a country's own last period (e.g. Russia GDP): say where its data ends
    const de = (!p || p.value === null) ? dataEnd(data, l.code) : null; if (de && pEndMi(de) < hover) fl.push(`data ends ${de}`);
    return { l, p, v: p ? p.value : null, lvl, oe: fl.includes("OECD estimate"), note: fl.join(" · "), tag: pre ?? (l.freq === "annual" && p ? `${p.period} · annual` : l.freq === "quarterly" && p ? (allQ ? qLabel(p.period) : `${qLabel(p.period)} · quarterly`) : null) };
  }).sort((a, b) => (a.v === null ? 1 : b.v === null ? -1 : b.v - a.v));
  const jan = hover !== null && showJumps && lines.some((l) => l.janJumps.includes(mStr(hover)));
  const brk = hover !== null ? lines.flatMap((l) => l.breaks.filter((b) => Math.abs(b.mi - hover) <= (b.label.includes("Q") ? 1 : 6)).map((b) => `${l.name}: ${b.label}`)) : [];
  const cx = hover === null ? 0 : x(hover);
  const ptYs = rows.filter((r) => r.p && r.v !== null).map((r) => y(r.v!));
  const tipH = 44 + Math.min(rows.length, 10) * 24 + rows.filter((r) => "note" in r && r.note).length * 18 + (jan ? 26 : 0) + brk.length * 22;
  const hits = (a: number, b: number) => ptYs.filter((py) => py > a - 8 && py < b + 8).length;
  const topHits = hits(0, tipH), botHits = hits(h - tipH, h);
  const tipBottom = ptYs.some((py) => py < pad.t + ih / 2) ? !(botHits > topHits) : topHits > botHits;
  const tipW = wide ? 340 : 0;
  const tipLeft = wide ? (cx + 24 + tipW > w ? Math.max(0, cx - 24 - tipW) : cx + 24) : 0;

  // summary dates: monthly windows read from the first monthly reading (a 3-month average labelled by its end month), not the mid-quarter of a quarterly country
  const mOnly = all.filter((l) => l.freq === "monthly").flatMap((l) => l.points.filter((q) => q.value !== null).map((q) => q.mi)), sm0 = mOnly.length ? Math.min(...mOnly) : m0;
  const summary = `${RU ? "Unemployment rate" : R ? "Policy rate" : "Index"}, ${allQ ? `${qL(m0)} to ${qL(m1)}` : `${fmtM(sm0)} to ${fmtM(m1)}`}: ` + lines.map((l) => `${l.name} ${l.last === null ? "n/a" : l.last.toFixed(R ? DISPLAY_DP.rate : 1)}`).join(", ");
  // Glow follows the leader: highest selected line at each month (hysteresis in glowLeaders).
  const valAt = (l: Line, mi: number): number | null => {
    if (l.freq === "monthly") { const p = l.points.find((q) => q.mi === mi); return p ? p.value : null; }
    let lo: Pt | null = null, hi: Pt | null = null;
    for (const p of l.points) { if (p.value === null) continue; if (p.mi <= mi) lo = p; if (p.mi >= mi && !hi) hi = p; }
    if (!lo || !hi) return null;
    return lo.mi === hi.mi ? lo.value : lo.value! + ((hi.value! - lo.value!) * (mi - lo.mi)) / (hi.mi - lo.mi);
  };
  const leaders = glowLeaders(lines.map((l) => ({ code: l.code, at: (mi: number) => { const v = valAt(l, mi); return v === null ? null : RU ? -v : v; } })), m0, m1); // unemployment: lower is better -> glow on the LOWEST line
  const glowCodes = [...new Set(leaders.filter((c): c is string => !!c))];
  const span = x(m1) - x(m0) || 1, ramp = 6;
  const maskStops = (code: string) => {
    const st: { o: number; a: number }[] = [];
    leaders.forEach((c, i) => {
      const mi = m0 + i, X = x(mi);
      const lead = c === code;
      st.push({ o: Math.max(0, Math.min(1, (X - x(m0)) / span)), a: lead ? 1 : 0 });
    });
    // soften switches over ~12px
    const out: { o: number; a: number }[] = [];
    for (let i = 0; i < st.length; i++) {
      if (i && st[i].a !== st[i - 1].a) {
        const mid = (st[i].o + st[i - 1].o) / 2, r = ramp / span;
        out.push({ o: Math.max(0, mid - r), a: st[i - 1].a }, { o: Math.min(1, mid + r), a: st[i].a });
      }
      out.push(st[i]);
    }
    return out;
  };
  const glowPath = (l: Line) => monotonePath(l.points.map((p) => ({ x: x(p.mi), y: p.value === null ? null : y(p.value) })));
  const areaPath = (l: Line) => {
    const ps = l.points.filter((p) => p.value !== null);
    if (ps.length < 2) return "";
    // area per contiguous run
    let d = "", run: Pt[] = [];
    const flush = () => { if (run.length > 1) d += `${monotonePath(run.map((p) => ({ x: x(p.mi), y: y(p.value!) })))}L${x(run[run.length - 1].mi)},${bottom}L${x(run[0].mi)},${bottom}Z`; run = []; };
    for (const p of l.points) { if (p.value === null) flush(); else run.push(p); }
    flush(); return d;
  };

  return (
    <div ref={ref} className={`chart${focus && lines.some((l) => l.code === focus) ? " dimmed" : ""}`} style={{ height: wide ? h : undefined }} tabIndex={0}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") { setHover(null); setFocus(null); } }} aria-label="Chart; use arrow keys to step months"
      onKeyDown={(e) => {
        if (e.key === "Escape") { setFocus(null); return setHover(null); }
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        setHover((hv) => Math.min(m1, Math.max(m0, (hv ?? m1) + (e.key === "ArrowRight" ? 1 : -1))));
      }}>
      <svg width={w} height={h} role="img" aria-label={summary}
        onPointerMove={(e) => (e.pointerType === "mouse" || (e.buttons && hover !== null)) && pick(e.clientX)}
        onPointerDown={(e) => { setBrkTip(null); setCovTip(false); setFocus(null); setHover(null); }}
>
        <defs>
          {glowCodes.map((c) => (
            <g key={c}>
              <linearGradient id={`ar-${c}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={col(c)} stopOpacity="var(--area-a)" /><stop offset="1" stopColor={col(c)} stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`mg-${c}`} gradientUnits="userSpaceOnUse" x1={x(m0)} x2={x(m1)} y1="0" y2="0">
                {maskStops(c).map((st, i) => <stop key={i} offset={st.o} stopColor="white" stopOpacity={st.a} />)}
              </linearGradient>
              <mask id={`mk-${c}`} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
                <rect x={0} y={0} width={w} height={h} fill={`url(#mg-${c})`} />
              </mask>
            </g>
          ))}
          <filter id="glow" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation={wide ? 6 : 4} /></filter>
        </defs>
        <text key={`yt${mode}`} x={Math.max(0, pad.l - 10 - Math.max(...ticks.map((v) => textW(R ? v.toFixed(1) : v.toFixed(dec), 12, 400))))} y={pad.t - 14} className="ytitle fadein">{RU ? "Unemployment rate, %" : R ? "Policy rate, %" : "Index · start = 100"}</text>
        {bands.map((b) => (
          <g key={`band${b.code}`} className="ndband" data-code={b.code} pointerEvents="none">
            <defs><linearGradient id={`ndb-${b.code}`} x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="var(--ndband)" /><stop offset={Math.max(0, 1 - 8 / Math.max(8, b.bx - pad.l))} stopColor="var(--ndband)" /><stop offset="1" stopColor="var(--ndband)" stopOpacity="0" /></linearGradient></defs>
            <rect x={pad.l} y={pad.t} width={Math.max(0, b.bx - pad.l)} height={ih} fill={`url(#ndb-${b.code})`} />
            {b.inside && <text x={pad.l + 8} y={pad.t + 8 + 9} className="from ndlabel" aria-label={b.label}>{b.rows!.map((t, i) => <tspan key={i} x={pad.l + 8} dy={i ? 14 : 0}>{t}</tspan>)}</text>}
          </g>
        ))}
        {covid && <g>
          <rect x={x(covid.a)} y={pad.t} width={Math.max(1, x(covid.b) - x(covid.a))} height={ih} className="covid" />
          {wide && <text x={x(covid.a) + 6} y={pad.t + 14} className="ax covlbl">COVID-19</text>}
        </g>}
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={pad.l + iw} y1={y(v)} y2={y(v)} className={!R && Math.abs(v - 100) < 1e-9 ? "base" : "grid"} />
            <text x={pad.l - 10} y={y(v) + 4} textAnchor="end" className="ax">{R ? v.toFixed(1) : v.toFixed(dec)}</text>
          </g>
        ))}
        {!R && !ticks.some((v) => Math.abs(v - 100) < 1e-9) && <line x1={pad.l} x2={pad.l + iw} y1={y(100)} y2={y(100)} className="base" />}
        {xt.filter((mi) => !gaps.some((g) => Math.abs(x(mi) - (x(g.a) + x(g.b)) / 2) < (wide ? 36 : 26))).map((mi, i) => <text key={mi} x={x(mi)} y={bottom + 22} textAnchor={i === 0 ? "start" : i === xt.length - 1 ? "end" : "middle"} className="ax">{years <= 1 ? (allQ ? qL(mi, !wide) : fmtM(mi, !wide)) : Math.floor(mi / 12)}</text>)}

        {glowCodes.map((c) => { const l = lines.find((q) => q.code === c)!; return (
          <g key={`gl${c}${years}${mode}`} mask={`url(#mk-${c})`} className={`fadein glowg${focus === c ? " focus" : ""}`}>
            {lines.length === 1 && <path d={areaPath(l)} fill={`url(#ar-${c})`} />}
            <path d={glowPath(l)} fill="none" stroke={col(c)} strokeWidth={wide ? 7 : 5} opacity="var(--glow-a)" filter="url(#glow)" />
          </g>); })}

        {all.map((l) => {
          const vis = !!on[l.code];
          const main = MAIN.has(l.code);
          const op = vis ? 1 : 0; void mainOn;
          // Estimated population ("Y"): that stretch is dashed, turning solid at the switch quarter.
          const est = l.points.map((p) => p.value !== null && estAt(data, l.code, p.period));
          const anyEst = est.some(Boolean);
          const d = monotonePath(l.points.map((p, i) => ({ x: x(p.mi), y: p.value === null || est[i] ? null : y(p.value) })));
          const dd = anyEst ? monotonePath(l.points.map((p, i) => ({ x: x(p.mi), y: p.value !== null && (est[i] || (i > 0 && est[i - 1])) ? y(p.value) : null }))) : "";
          return (
            <g key={l.code} className={`series${focus === l.code ? " focus" : ""}${vis ? "" : " off"}`} style={{ opacity: op }} aria-hidden={!vis}>
              <path key={`${l.code}${years}${mode}`} d={d} pathLength={1} className="ln draw" fill="none" stroke={col(l.code)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              {vis && !l.excluded && <path d={monotonePath(l.points.map((p) => ({ x: x(p.mi), y: p.value === null ? null : y(p.value) })))} className="hit" data-code={l.code} fill="none" stroke="transparent" strokeWidth={wide ? 12 : 20} pointerEvents="stroke"
                onPointerEnter={(e) => { if (e.pointerType === "mouse") setFocus(l.code); }} onPointerLeave={(e) => { if (e.pointerType === "mouse") setFocus(null); }}
                onPointerDown={(e) => { e.stopPropagation(); setBrkTip(null); setCovTip(false); setFocus(l.code); pick(e.clientX); }} />}
              {vis && !allQ && l.freq !== "monthly" && l.points.map((q) => q.value !== null && <circle key={`f${q.period}`} className="fpt" data-freq={l.freq} cx={x(q.mi)} cy={y(q.value)} r={2.5} fill={col(l.code)} />)}
              {dd && <path key={`d${l.code}${years}${mode}`} d={dd} className="ln est fadein" data-code={l.code} fill="none" stroke={col(l.code)} strokeWidth={2} strokeDasharray="4 3" strokeLinecap="butt" />}
              {vis && showJumps && l.janJumps.map((jp) => {
                const p = l.points.find((q) => q.period === jp);
                // on the line where it exists; for a blank 3-mo avg, sit on the next drawn point
                const q = p && p.value !== null ? p : l.points.find((qq) => qq.mi > (p?.mi ?? 0) && qq.value !== null);
                return q && q.value !== null ? <circle key={jp} cx={x(q.mi)} cy={y(q.value)} r={5} fill="var(--amber)" stroke="var(--card-solid)" strokeWidth={1.5} /> : null;
              })}
            </g>
          );
        })}

        {(() => { const placed: [number, number][] = []; return gaps.map((g) => {
          const a = x(g.a), b = x(g.b), mid = (a + b) / 2, py = bottom + 44;
          const tw = textW(g.label, 12, 500) + 20;
          const px = Math.min(Math.max(mid - tw / 2, pad.l), pad.l + iw - tw);
          if (placed.some(([l, r]) => px < r + 6 && px + tw > l - 6)) return <path key={g.a} d={`M${a},${bottom - 2}v6M${a},${bottom + 4}H${b}M${b},${bottom - 2}v6`} className="bracket gapb" />;
          placed.push([px, px + tw]);
          return (
            <g key={g.a} className="gap">
              <path d={`M${a},${bottom - 2}v6M${a},${bottom + 4}H${b}M${b},${bottom - 2}v6M${mid},${bottom + 4}V${py - 10}`} className="bracket gapb" />
              <rect x={px} y={py - 10} width={tw} height={20} rx={10} className="pill" />
              <text x={px + tw / 2} y={py + 4} textAnchor="middle" className="ax">{g.label}</text>
            </g>
          );
        }); })()}

        {ends.map((e) => (
          <g key={e.l.code} className={`fadein endl${focus === e.l.code ? " focus" : ""}`} data-code={e.l.code}
            onPointerEnter={(ev) => { if (ev.pointerType === "mouse") { setFocus(e.l.code); setHover(e.mi); } }} onPointerLeave={(ev) => { if (ev.pointerType === "mouse") setFocus(null); }}
            onPointerDown={(ev) => { ev.stopPropagation(); setFocus(e.l.code); setHover(e.mi); }}>
            {/* leader lives in the label gutter only: starts at the plot's right edge at the line's own y (no stub across
                the plot for lines that end early), one short horizontal, a single bend, then to the label */}
            {(() => { const reach = x(e.mi) >= pad.l + iw - 0.5; return (
            <path className={reach ? "leader" : "leader early"} d={`M${pad.l + iw + (reach ? 4 : 2)},${y(e.v)} H${pad.l + iw + 6} L${pad.l + iw + 11},${e.ty} H${pad.l + iw + 13}`} stroke={col(e.l.code)} strokeWidth={0.7} strokeOpacity={reach ? 0.6 : 0.4} fill="none" strokeLinejoin="round" />); })()}
            <circle cx={x(e.mi)} cy={y(e.v)} r={3} fill={col(e.l.code)} />
            <text x={pad.l + iw + 16} y={e.ty + 4} fill={col(e.l.code)} fontSize={lblPx} fontWeight={MAIN.has(e.l.code) ? 700 : 500} className="num">{label(e.l)}</text>
          </g>
        ))}

        {/* late starters: 6px hollow start dot in the country colour + small grey "from YYYY" */}
        {(() => { const boxes: [number, number, number, number][] = []; // placed "from" labels; a label that can't sit clear is dropped (the dot stays)
          return lines.filter((l) => l.late && !(data.noLateMark || []).includes(l.code)).map((l) => ({ l, f: l.points.find((p) => p.value !== null)! })).sort((a, b) => a.f.mi - b.f.mi).map(({ l, f }) => {
          const fx = x(f.mi), fy = y(f.value!);
          const t = `from ${l.late!.slice(0, 4)}`, tw = textW(t, 11, 400), tx = Math.min(fx + 6, pad.l + iw - tw);
          const ty = [fy - 8, fy + 16, fy - 21, fy + 29].find((cy) => cy - 10 > pad.t && cy < bottom - 2 && !boxes.some(([l0, t0, r0, b0]) => tx < r0 + 4 && tx + tw > l0 - 4 && cy - 10 < b0 && cy > t0));
          if (ty !== undefined) boxes.push([tx, ty - 10, tx + tw, ty]);
          return (<g key={`ls${l.code}`} className="late fadein" data-code={l.code}>
            <circle cx={fx} cy={fy} r={3} fill="var(--card-solid)" stroke={col(l.code)} strokeWidth={1.5} />
          </g>);
        }); })()}
        {lines.flatMap((l) => l.breaks.map((bk) => {
          if (!Number.isFinite(bk.mi) || bk.mi < m0 || bk.mi > m1) return null;
          const p = l.points.reduce<Pt | null>((best, q) => (q.value !== null && (!best || Math.abs(q.mi - bk.mi) < Math.abs(best.mi - bk.mi)) ? q : best), null);
          if (!p || p.value === null || Math.abs(p.mi - bk.mi) > (l.freq === "annual" ? 6 : l.freq === "quarterly" ? 2 : 1)) return null; // must sit on a drawn stretch
          const bx = x(p.mi), by = y(p.value); // snap to the nearest drawn reading so the tick sits on the line
          return (
            <g key={`${l.code}${bk.mi}`} className="brk" data-code={l.code} data-mi={bk.mi} onPointerEnter={(e) => e.pointerType === "mouse" && setBrkTip({ x: bx, y: by, label: bk.label })}
              onPointerLeave={(e) => e.pointerType === "mouse" && setBrkTip(null)}
              onPointerDown={(e) => { e.stopPropagation(); setBrkTip((t) => (t && t.label === bk.label && t.x === bx ? null : { x: bx, y: by, label: bk.label })); }}>
              <rect x={bx - 1} y={by - 6} width={2} height={12} rx={1} className="brkt" />
              <rect x={bx - 12} y={by - 12} width={24} height={24} fill="transparent" aria-label={bk.label}><title>{bk.label}</title></rect>
            </g>
          );
        }))}
        {brkTip && (() => {
          const tw = textW(brkTip.label, 12, 500) + 20, lo = pad.l + 2, hi = pad.l + iw - 2;
          let tx: number, ty: number;
          if (!wide) { tx = Math.min(Math.max(brkTip.x - tw / 2, lo), hi - tw); ty = pad.t + 2; }
          else { tx = brkTip.x + 12 + tw <= hi ? brkTip.x + 12 : brkTip.x - 12 - tw; tx = Math.max(lo, tx); ty = Math.max(pad.t, brkTip.y - 10); }
          return (
          <g className="brklbl" pointerEvents="none">
            {!wide && <path d={`M${brkTip.x},${ty + 20}V${brkTip.y - 8}`} className="bracket" />}
            <rect x={tx} y={ty} width={tw} height={20} rx={10} className="pill" /><text x={tx + tw / 2} y={ty + 14} textAnchor="middle" className="ax">{brkTip.label}</text></g>); })()}
        {hover !== null && <g>
          <line x1={cx} x2={cx} y1={pad.t} y2={bottom} className="cross" />
          {rows.map((r) => r.p && r.v !== null && <circle key={r.l.code} cx={x(r.p.mi)} cy={y(r.v)} r={4.5} fill={col(r.l.code)} stroke="var(--card-solid)" strokeWidth={2} />)}
        </g>}
      {/* 390: the COVID band has its own tap target (≥24px wide, on top of the read-out layer): a tap shows its label, never the stats box */}
        {!wide && covid && (() => { const cx = (x(covid.a) + x(covid.b)) / 2, bw = Math.max(24, x(covid.b) - x(covid.a)); return <g className="covhit">
          <rect x={cx - bw / 2} y={pad.t} width={bw} height={ih} fill="transparent" style={{ pointerEvents: "all", cursor: "pointer" }} data-testid="covid-hit" onPointerDown={(e) => { e.stopPropagation(); setHover(null); setCovTip((t) => !t); }} />
          {covTip && <g className="covpill" pointerEvents="none"><rect x={Math.min(Math.max(pad.l, cx - 92), w - pad.r - 184)} y={pad.t + 6} width={184} height={24} rx={12} /><text x={Math.min(Math.max(pad.l, cx - 92), w - pad.r - 184) + 92} y={pad.t + 22} textAnchor="middle">COVID-19 · Mar 2020 – Jun 2021</text></g>}
        </g>; })()}
        </svg>

      {hover !== null && (
        <div className={`tip ${tipBottom ? "bot" : "top"}`} style={wide ? { left: tipLeft, width: tipW } : undefined} role="status" onPointerDown={(e) => e.stopPropagation()}>
          <div className="tiph"><span className="mo">{allQ ? qL(hover) : fmtM(hover)}</span>{wide && <span className="cols">{RU ? "rate, 3-mo avg" : R ? "rate, end of month" : mode === "jobs" ? "index · employed" : "index, start = 100"}</span>}
            <button className="tipx" aria-label="Close" onClick={() => { setHover(null); setFocus(null); }}><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></button></div>
          <div className="tiprows">{rows.map((r) => (
            <div key={r.l.code} className={`tipr${focus === r.l.code ? " focus" : ""}`}>
              <i style={{ background: col(r.l.code) }} /><span className="nm">{r.l.name}</span>
              {r.tag && <em>{r.tag}</em>}
              <b>{r.v === null ? "n/a" : `${r.v.toFixed(R ? DISPLAY_DP.rate : 1)}${R ? "%" : ""}`}</b>
              {wide && mode === "jobs" && <span className="lv">{r.lvl === null ? "n/a" : `${(r.lvl / 1000).toFixed(2)}m`}</span>}
              {"note" in r && r.note && <span className="tipnote">{r.note}</span>}
            </div>
          ))}</div>
          {!wide && covid && hover !== null && hover >= covid.a && hover <= covid.b && <div className="tipn covtip">Shaded: COVID-19 (Mar 2020 – Jun 2021)</div>}
          {jan && <div className="tipn"><i className="dot amber" />US Jan jump: cause not confirmed</div>}
          {brk.map((b) => <div key={b} className="tipn">{b}</div>)}
        </div>
      )}

      <div className="sr-only"><table>
        <caption>{summary}</caption>
        <thead><tr><th>Period</th>{lines.map((l) => <th key={l.code}>{l.name}</th>)}</tr></thead>
        <tbody>{(lines.find((l) => l.freq === "monthly") ?? lines[0])?.points.map((p) => (
          <tr key={p.period}><td>{/Q/.test(p.period) ? qLabel(p.period) : fmtM(p.mi)}</td>{lines.map((l) => { const q = ptAt(l, p.mi); return <td key={l.code}>{q && q.value !== null ? q.value.toFixed(R ? DISPLAY_DP.rate : 1) : "n/a"}</td>; })}</tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

function niceTicks(lo: number, hi: number, n: number) {
  const raw = (hi - lo) / n, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(4));
  return out;
}
