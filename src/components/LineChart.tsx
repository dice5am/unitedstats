"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { mStr, qOfMonth } from "@/lib/series.mjs";

export type Pt = { period: string; mi: number; value: number | null; raw?: number | null };
export type Line = {
  code: string; name: string; freq: "monthly" | "quarterly"; points: Pt[]; breaks: number[];
  last: number | null; growth: number | null; janJumps: string[]; indexedFrom: string | null;
};

const MAIN = new Set(["CAN", "USA"]);
const col = (c: string) => `var(--${c})`;
const COVID = { a: 2020 * 12 + 2, b: 2021 * 12 + 5 }; // Mar 2020 - Jun 2021

const fmtM = (mi: number, yr: "2-digit" | "numeric" = "numeric") =>
  new Date(Date.UTC(Math.floor(mi / 12), mi % 12, 1)).toLocaleDateString("en-GB", { month: "short", year: yr, timeZone: "UTC" });
const qLabel = (p: string) => { const [y, q] = p.split("-"); return q ? `${q} ${y}` : p; };

let ctx: CanvasRenderingContext2D | null = null;
function textW(s: string, px: number, weight: number) {
  if (typeof document === "undefined") return s.length * px * 0.6;
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return s.length * px * 0.6;
  ctx.font = `${weight} ${px}px "Be Vietnam Pro", system-ui, sans-serif`;
  return ctx.measureText(s).width;
}

export default function LineChart({ lines, years }: { lines: Line[]; years: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [hover, setHover] = useState<number | null>(null); // month index
  const [tipSize, setTipSize] = useState({ w: 160, h: 80 });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const close = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setHover(null); };
    document.addEventListener("pointerdown", close); return () => document.removeEventListener("pointerdown", close);
  }, []);
  useLayoutEffect(() => {
    if (tipRef.current) setTipSize({ w: tipRef.current.offsetWidth, h: tipRef.current.offsetHeight });
  }, [hover, lines]);

  const wide = w >= 768;
  const h = w >= 1024 ? 480 : 300;
  const lblPx = wide ? 13 : 12;
  const label = (l: Line) => (wide && l.last !== null ? `${l.name} ${l.last.toFixed(1)}` : l.name);
  const gutter = Math.ceil(Math.max(40, ...lines.map((l) => textW(label(l), lblPx, MAIN.has(l.code) ? 700 : 400)))) + 8 + 14;
  const pad = { l: 44, r: gutter, t: 16, b: 30 };
  const iw = Math.max(10, w - pad.l - pad.r), ih = h - pad.t - pad.b;

  const all = lines.flatMap((l) => l.points);
  const m0 = all.length ? Math.min(...all.map((p) => p.mi)) : 0;
  const m1 = all.length ? Math.max(...all.map((p) => p.mi)) : 1;
  const { y0, y1 } = useMemo(() => {
    const vs = lines.flatMap((l) => l.points.flatMap((p) => [p.value, p.raw ?? null])).filter((v): v is number => v !== null);
    let lo = Math.min(100, ...vs), hi = Math.max(100, ...vs);
    const span = Math.max(hi - lo, 0.5); lo -= span * 0.06; hi += span * 0.06;
    return { y0: lo, y1: hi };
  }, [lines]);

  if (!lines.length) return <div ref={ref} className="chart empty" style={{ height: 300 }}>No country selected</div>;
  if (!w) return <div ref={ref} className="chart skeleton" style={{ height: 300 }} />;

  const x = (mi: number) => pad.l + ((mi - m0) / (m1 - m0 || 1)) * iw;
  const y = (v: number) => pad.t + (1 - (v - y0) / (y1 - y0)) * ih;
  const ticks = niceTicks(y0, y1, w < 560 ? 4 : 6);
  const step = years <= 1 ? 3 : years <= 5 ? 12 : years <= 10 ? 24 : 48;
  const xt: number[] = [];
  if (years <= 1) for (let mi = m1; mi >= m0; mi -= step) xt.unshift(mi);
  else { for (let mi = Math.ceil(m0 / 12) * 12; mi <= m1; mi += step) xt.push(mi); }
  const dec = ticks.length > 1 && ticks[1] - ticks[0] < 1 ? 1 : 0;

  const path = (pts: { mi: number; v: number | null }[]) => {
    let d = "", pen = false;
    for (const p of pts) {
      if (p.v === null) { pen = false; continue; }
      d += `${pen ? "L" : "M"}${x(p.mi).toFixed(1)},${y(p.v).toFixed(1)}`; pen = true;
    }
    return d;
  };

  // End labels: column sorted by value, top-down collision resolve, clamp to plot.
  const minGap = wide ? 16 : 14;
  const ends = lines.map((l) => {
    const lp = [...l.points].reverse().find((p) => p.value !== null);
    return lp ? { l, mi: lp.mi, v: lp.value as number, ty: y(lp.value as number) } : null;
  }).filter((e): e is NonNullable<typeof e> => !!e).sort((a, b) => a.ty - b.ty);
  for (let i = 0; i < ends.length; i++) {
    ends[i].ty = Math.max(ends[i].ty, pad.t + 6, i ? ends[i - 1].ty + minGap : -Infinity);
  }
  const bottom = pad.t + ih;
  for (let i = ends.length - 1; i >= 0; i--) {
    ends[i].ty = Math.min(ends[i].ty, i === ends.length - 1 ? bottom : ends[i + 1].ty - minGap);
  }

  const covid = COVID.b >= m0 && COVID.a <= m1 ? { a: Math.max(COVID.a, m0), b: Math.min(COVID.b, m1) } : null;
  const showJumps = years <= 5;
  const breaks = lines.flatMap((l) => l.breaks.map((yr) => ({ l, yr, mi: yr * 12 + 6 })))
    .filter((b) => b.mi >= m0 && b.mi <= m1);

  // tooltip rows
  const rowFor = (l: Line, mi: number) => {
    if (l.freq === "monthly") { const p = l.points.find((p) => p.mi === mi); return { v: p ? p.value : null, tag: null as string | null }; }
    const q = qOfMonth(mi); const lastQ = l.points[l.points.length - 1];
    // months after the common quarterly cutoff (e.g. Jul-Aug 2026) read the latest quarter
    const p = l.points.find((pp) => qOfMonth(pp.mi) === q) ?? (lastQ && qOfMonth(mi) > qOfMonth(lastQ.mi) ? lastQ : undefined);
    return { v: p ? p.value : null, tag: p ? qLabel(p.period) : null };
  };
  const pick = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    const mi = Math.round(m0 + ((clientX - r.left - pad.l) / iw) * (m1 - m0));
    setHover(Math.min(m1, Math.max(m0, mi)));
  };
  const rows = hover === null ? [] : lines.map((l) => ({ l, ...rowFor(l, hover) }))
    .sort((a, b) => (a.v === null ? 1 : b.v === null ? -1 : b.v - a.v));
  const notes: string[] = [];
  if (hover !== null) {
    const p = mStr(hover);
    if (showJumps && lines.some((l) => l.janJumps.includes(p))) notes.push("◆ US January jump: cause not confirmed");
    for (const b of breaks) if (Math.floor(hover / 12) === b.yr) notes.push(`| ${b.l.name}: series break ${b.yr} (OECD)`);
    for (const l of lines) if (l.indexedFrom) notes.push(`${l.name} indexed from ${qLabel(l.indexedFrom)}`);
  }
  const onlyQ = lines.every((l) => l.freq === "quarterly");
  const cx = hover === null ? 0 : x(hover);
  const tipLeft = cx + 12 + tipSize.w > pad.l + iw + pad.r ? cx - 12 - tipSize.w : cx + 12;
  const tipTop = Math.min(Math.max(pad.t, pad.t + 4), Math.max(pad.t, bottom - tipSize.h));

  const summary = `Employment index, ${fmtM(m0)}–${fmtM(m1)}: ` + lines.map((l) => `${l.name} ${l.last === null ? "n/a" : l.last.toFixed(1)}`).join(", ");

  return (
    <div ref={ref} className="chart" style={{ height: h }} tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Escape") return setHover(null);
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        setHover((hv) => Math.min(m1, Math.max(m0, (hv ?? m1) + (e.key === "ArrowRight" ? 1 : -1))));
      }}>
      <svg width={w} height={h} role="img" aria-label={summary}
        onPointerMove={(e) => (e.pointerType === "mouse" || e.buttons) && pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}>
        {covid && <g>
          <rect x={x(covid.a)} y={pad.t} width={Math.max(1, x(covid.b) - x(covid.a))} height={ih} fill="#fff" opacity={0.05} />
          <text x={x(covid.a) + 4} y={pad.t + 12} className="ax">COVID-19</text>
        </g>}
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={pad.l + iw} y1={y(v)} y2={y(v)} className={Math.abs(v - 100) < 1e-9 ? "base" : "grid"} />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" className="ax">{v.toFixed(dec)}</text>
          </g>
        ))}
        {!ticks.some((v) => Math.abs(v - 100) < 1e-9) && <line x1={pad.l} x2={pad.l + iw} y1={y(100)} y2={y(100)} className="base" />}
        {xt.map((mi) => <text key={mi} x={x(mi)} y={h - 8} textAnchor="middle" className="ax">{years <= 1 ? fmtM(mi, "2-digit") : Math.floor(mi / 12)}</text>)}

        {lines.map((l) => {
          const main = MAIN.has(l.code);
          if (l.freq === "monthly") return (
            <g key={l.code}>
              <path d={path(l.points.map((p) => ({ mi: p.mi, v: p.raw ?? null })))} fill="none" stroke={col(l.code)} strokeWidth={1} strokeOpacity={0.28} />
              <path className="ln" d={path(l.points.map((p) => ({ mi: p.mi, v: p.value })))} fill="none" stroke={col(l.code)}
                strokeWidth={main ? 2.5 : 1.5} strokeOpacity={main ? 1 : 0.8} strokeLinejoin="round" strokeLinecap="round" />
              {showJumps && l.janJumps.map((p) => {
                const pt = l.points.find((q) => q.period === p); if (!pt || pt.raw == null) return null;
                const X = x(pt.mi), Y = y(pt.raw);
                return <path key={p} d={`M${X},${Y - 4}L${X + 4},${Y}L${X},${Y + 4}L${X - 4},${Y}Z`} fill="var(--amber)" />;
              })}
            </g>);
          return (
            <g key={l.code}>
              <path d={path(l.points.map((p) => ({ mi: p.mi, v: p.value })))} fill="none" stroke={col(l.code)} strokeWidth={1} strokeOpacity={0.5} />
              {l.points.map((p) => p.value !== null &&
                <circle key={p.period} cx={x(p.mi)} cy={y(p.value)} r={years >= 20 ? 2 : 3} fill={col(l.code)} />)}
            </g>);
        })}

        {breaks.map((b) => {
          const p = b.l.points.reduce((best, q) => (q.value !== null && Math.abs(q.mi - b.mi) < Math.abs((best?.mi ?? 1e9) - b.mi) ? q : best), null as Pt | null);
          if (!p || p.value === null) return null;
          return <line key={`${b.l.code}${b.yr}`} x1={x(b.mi)} x2={x(b.mi)} y1={y(p.value) - 4} y2={y(p.value) + 4} stroke={col(b.l.code)} strokeWidth={1.5} />;
        })}

        {ends.map((e) => (
          <g key={e.l.code}>
            <line x1={x(e.mi)} y1={y(e.v)} x2={pad.l + iw + 10} y2={e.ty} stroke={col(e.l.code)} strokeWidth={0.6} strokeOpacity={0.7} />
            <text x={pad.l + iw + 14} y={e.ty + 4} fill={col(e.l.code)} fontSize={lblPx}
              fontWeight={MAIN.has(e.l.code) ? 700 : 400} style={{ fontVariantNumeric: "tabular-nums" }}>{label(e.l)}</text>
          </g>
        ))}

        {hover !== null && <g>
          <line x1={cx} x2={cx} y1={pad.t} y2={bottom} stroke="var(--text-secondary)" strokeWidth={1} />
          {rows.map((r) => r.v !== null && (() => {
            const pt = r.l.freq === "monthly" ? r.l.points.find((p) => p.mi === hover) : (r.l.points.find((p) => qOfMonth(p.mi) === qOfMonth(hover)) ?? r.l.points[r.l.points.length - 1]);
            return pt && pt.value !== null ? <circle key={r.l.code} cx={x(pt.mi)} cy={y(pt.value)} r={4} fill={col(r.l.code)} stroke="var(--bg)" strokeWidth={2} /> : null;
          })())}
        </g>}
      </svg>

      {hover !== null && (
        <div ref={tipRef} className="tip" style={{ left: tipLeft, top: tipTop }} role="status">
          <div className="tipd">{onlyQ ? qLabel(rows.find((r) => r.tag)?.tag ?? fmtM(hover)) : fmtM(hover)}</div>
          {rows.map((r) => (
            <div key={r.l.code} className="tipr">
              <i style={{ background: col(r.l.code) }} />{r.l.name}
              {r.tag && !onlyQ && <em>{r.tag}</em>}
              <b>{r.v === null ? "n/a" : r.v.toFixed(1)}</b>
            </div>
          ))}
          {notes.map((n) => <div key={n} className="tipn">{n}</div>)}
        </div>
      )}

      <div className="sr-only"><table>
        <caption>{summary}</caption>
        <thead><tr><th>Period</th>{lines.map((l) => <th key={l.code}>{l.name}</th>)}</tr></thead>
        <tbody>{(lines.find((l) => l.freq === "monthly") ?? lines[0]).points.map((p) => (
          <tr key={p.period}><td>{p.period}</td>{lines.map((l) => { const r = rowFor(l, p.mi); return <td key={l.code}>{r.v === null ? "n/a" : r.v.toFixed(1)}</td>; })}</tr>
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
