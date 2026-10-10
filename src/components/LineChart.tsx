"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { mStr, qOfMonth, monotonePath, rawLevel } from "@/lib/series.mjs";

export type Pt = { period: string; mi: number; value: number | null };
export type Line = {
  code: string; name: string; freq: "monthly" | "quarterly"; points: Pt[]; breaks: number[];
  last: number | null; growth: number | null; janJumps: string[]; indexedFrom: string | null;
};

const MAIN = new Set(["CAN", "USA"]);
const col = (c: string) => `var(--${c})`;
const COVID = { a: 2020 * 12 + 2, b: 2021 * 12 + 5 };
const fmtM = (mi: number, short = false) =>
  new Date(Date.UTC(Math.floor(mi / 12), mi % 12, 1)).toLocaleDateString("en-GB", { month: "short", year: short ? "2-digit" : "numeric", timeZone: "UTC" }).replace(/ (\d\d)$/, " ’$1");
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
export default function LineChart({ lines: all, on, years, data }: { lines: Line[]; on: Record<string, boolean>; years: number; data: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [tipSize, setTipSize] = useState({ w: 200, h: 100 });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => { if (e.contentRect.width > 0) setW(e.contentRect.width); });
    ro.observe(el); return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const close = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setHover(null); };
    document.addEventListener("pointerdown", close); return () => document.removeEventListener("pointerdown", close);
  }, []);
  useLayoutEffect(() => { if (tipRef.current) setTipSize({ w: tipRef.current.offsetWidth, h: tipRef.current.offsetHeight }); }, [hover, on, years]);

  const lines = all.filter((l) => on[l.code]);
  const mainOn = lines.some((l) => MAIN.has(l.code));
  const wide = w >= 768;
  const h = wide ? 500 : 320;
  const lblPx = wide ? 13 : 12;
  const label = (l: Line) => (wide && l.last !== null ? `${l.name} ${l.last.toFixed(1)}` : l.name);
  const gutter = Math.ceil(Math.max(36, ...lines.map((l) => textW(label(l), lblPx, MAIN.has(l.code) ? 700 : 500)))) + (wide ? 28 : 22);
  const pad = { l: wide ? 48 : 38, r: gutter, t: 20, b: 58 };
  const iw = Math.max(10, w - pad.l - pad.r), ih = h - pad.t - pad.b, bottom = pad.t + ih;

  const pts = all.flatMap((l) => l.points);
  const m0 = Math.min(...pts.map((p) => p.mi)), m1 = Math.max(...pts.map((p) => p.mi));
  const { y0, y1 } = useMemo(() => {
    const vs = lines.flatMap((l) => l.points.map((p) => p.value)).filter((v): v is number => v !== null);
    let lo = Math.min(100, ...vs), hi = Math.max(100, ...vs);
    const span = Math.max(hi - lo, 0.5); lo -= span * 0.1; hi += span * 0.08;
    return { y0: lo, y1: hi };
  }, [lines]);

  if (!w) return <div ref={ref} className="chart skeleton" style={{ height: 320 }} />;

  const x = (mi: number) => pad.l + ((mi - m0) / (m1 - m0 || 1)) * iw;
  const y = (v: number) => pad.t + (1 - (v - y0) / (y1 - y0)) * ih;
  const ticks = niceTicks(y0, y1, wide ? 5 : 4);
  const dec = ticks.length > 1 && ticks[1] - ticks[0] < 1 ? 1 : 0;
  // x ticks: max 4 at <768
  const maxT = wide ? 6 : 4;
  const xt: number[] = [];
  if (years <= 1) { const st = wide ? 3 : 4; for (let mi = m1; mi >= m0; mi -= st) xt.unshift(mi); }
  else { const yrs = years / (maxT - 1); const st = Math.max(1, Math.ceil(yrs)) * 12; for (let mi = m1; mi >= m0; mi -= st) xt.unshift(mi); }
  while (xt.length > maxT) xt.shift();

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
        gaps.push({ a: s, b: p.mi - 1, label: `No OECD data · ${miss.map((m: string) => fmtM(Number(m.slice(0, 4)) * 12 + Number(m.slice(5)) - 1)).join(", ") || fmtM(s)}` });
        s = null;
      }
    });
  }

  const covid = COVID.b >= m0 && COVID.a <= m1 ? { a: Math.max(COVID.a, m0), b: Math.min(COVID.b, m1) } : null;
  const showJumps = years <= 5;

  // end labels
  const minGap = wide ? 20 : 16;
  const ends = lines.map((l) => {
    const lp = [...l.points].reverse().find((p) => p.value !== null);
    return lp ? { l, mi: lp.mi, v: lp.value as number, ty: y(lp.value as number) } : null;
  }).filter((e): e is NonNullable<typeof e> => !!e).sort((a, b) => a.ty - b.ty);
  for (let i = 0; i < ends.length; i++) ends[i].ty = Math.max(ends[i].ty, pad.t + 6, i ? ends[i - 1].ty + minGap : -Infinity);
  for (let i = ends.length - 1; i >= 0; i--) ends[i].ty = Math.min(ends[i].ty, i === ends.length - 1 ? bottom - 4 : ends[i + 1].ty - minGap);

  // tooltip
  const ptAt = (l: Line, mi: number) => {
    if (l.freq === "monthly") return l.points.find((p) => p.mi === mi) ?? null;
    const q = qOfMonth(mi), last = l.points[l.points.length - 1];
    return l.points.find((p) => qOfMonth(p.mi) === q) ?? (last && q > qOfMonth(last.mi) ? last : null);
  };
  const pick = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    setHover(Math.min(m1, Math.max(m0, Math.round(m0 + ((clientX - r.left - pad.l) / iw) * (m1 - m0)))));
  };
  const rows = hover === null ? [] : lines.map((l) => {
    const p = ptAt(l, hover);
    const lvl = p ? rawLevel(data, l.code, p.period) : null;
    return { l, p, v: p ? p.value : null, lvl, tag: l.freq === "quarterly" && p ? qLabel(p.period) : null };
  }).sort((a, b) => (a.v === null ? 1 : b.v === null ? -1 : b.v - a.v));
  const jan = hover !== null && showJumps && lines.some((l) => l.janJumps.includes(mStr(hover)));
  const brk = hover !== null ? lines.flatMap((l) => l.breaks.filter((b) => b === Math.floor(hover / 12)).map((b) => `${l.name}: series break ${b}`)) : [];
  const cx = hover === null ? 0 : x(hover);
  const tipLeft = cx + 16 + tipSize.w > w ? cx - 16 - tipSize.w : cx + 16;
  const tipTop = Math.max(pad.t, Math.min(pad.t + 8, bottom - tipSize.h));

  const summary = `Employment index, ${fmtM(m0)}–${fmtM(m1)}: ` + lines.map((l) => `${l.name} ${l.last === null ? "n/a" : l.last.toFixed(1)}`).join(", ");
  const can = all.find((l) => l.code === "CAN")!;
  const canPts = can.points.map((p) => ({ x: x(p.mi), y: p.value === null ? null : y(p.value) }));
  const canFirst = canPts.find((p) => p.y !== null), canLast = [...canPts].reverse().find((p) => p.y !== null);
  const area = canFirst && canLast ? `${monotonePath(canPts)}L${canLast.x},${bottom}L${canFirst.x},${bottom}Z` : "";

  return (
    <div ref={ref} className="chart" style={{ height: h }} tabIndex={0} aria-label="Employment chart; use arrow keys to step months"
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
        <defs>
          <linearGradient id="caArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--CAN)" stopOpacity="var(--area-a)" /><stop offset="1" stopColor="var(--CAN)" stopOpacity="0" />
          </linearGradient>
          <filter id="glow" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation={wide ? 6 : 4} /></filter>
        </defs>
        {covid && <g>
          <rect x={x(covid.a)} y={pad.t} width={Math.max(1, x(covid.b) - x(covid.a))} height={ih} className="covid" />
          <text x={x(covid.a) + 6} y={pad.t + 14} className="ax">COVID-19</text>
        </g>}
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={pad.l + iw} y1={y(v)} y2={y(v)} className={Math.abs(v - 100) < 1e-9 ? "base" : "grid"} />
            <text x={pad.l - 10} y={y(v) + 4} textAnchor="end" className="ax">{v.toFixed(dec)}</text>
          </g>
        ))}
        {!ticks.some((v) => Math.abs(v - 100) < 1e-9) && <line x1={pad.l} x2={pad.l + iw} y1={y(100)} y2={y(100)} className="base" />}
        {xt.map((mi, i) => <text key={mi} x={x(mi)} y={bottom + 22} textAnchor={i === 0 ? "start" : i === xt.length - 1 ? "end" : "middle"} className="ax">{years <= 1 ? fmtM(mi, !wide) : Math.floor(mi / 12)}</text>)}

        {on.CAN && area && <path key={`a${years}`} d={area} fill="url(#caArea)" className="fadein" />}
        {on.CAN && <path key={`g${years}`} d={monotonePath(canPts)} fill="none" stroke="var(--CAN)" strokeWidth={wide ? 7 : 5} opacity="var(--glow-a)" filter="url(#glow)" className="fadein" />}

        {all.map((l) => {
          const vis = !!on[l.code];
          const main = MAIN.has(l.code);
          const op = !vis ? 0 : main || !mainOn ? 1 : 0.7;
          const d = monotonePath(l.points.map((p) => ({ x: x(p.mi), y: p.value === null ? null : y(p.value) })));
          return (
            <g key={l.code} className="series" style={{ opacity: op }} aria-hidden={!vis}>
              <path key={`${l.code}${years}`} d={d} pathLength={1} className="ln draw" fill="none" stroke={col(l.code)} strokeWidth={main ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" />
              {l.freq === "quarterly" && l.points.map((p) => p.value !== null && <circle key={p.period} cx={x(p.mi)} cy={y(p.value)} r={years >= 20 ? 2 : 3} fill={col(l.code)} />)}
              {vis && l.breaks.map((b) => {
                const mi = b * 12 + 6; if (mi < m0 || mi > m1) return null;
                const p = l.points.reduce<Pt | null>((best, q) => (q.value !== null && (!best || Math.abs(q.mi - mi) < Math.abs(best.mi - mi)) ? q : best), null);
                return p && p.value !== null ? <line key={b} x1={x(mi)} x2={x(mi)} y1={y(p.value) - 6} y2={y(p.value) + 6} stroke={col(l.code)} strokeWidth={1.5} /> : null;
              })}
              {vis && showJumps && l.janJumps.map((jp) => {
                const p = l.points.find((q) => q.period === jp);
                // on the line where it exists; for a blank 3-mo avg, sit on the next drawn point
                const q = p && p.value !== null ? p : l.points.find((qq) => qq.mi > (p?.mi ?? 0) && qq.value !== null);
                return q && q.value !== null ? <circle key={jp} cx={x(q.mi)} cy={y(q.value)} r={5} fill="var(--amber)" stroke="var(--card-solid)" strokeWidth={1.5} /> : null;
              })}
            </g>
          );
        })}

        {gaps.map((g) => {
          const a = x(g.a), b = x(g.b), mid = (a + b) / 2, py = bottom + 44;
          const tw = textW(g.label, 12, 500) + 20;
          const px = Math.min(Math.max(mid - tw / 2, pad.l), pad.l + iw - tw);
          return (
            <g key={g.a} className="gap">
              <path d={`M${a},${bottom - 2}v6M${a},${bottom + 4}H${b}M${b},${bottom - 2}v6`} className="bracket gapb" />
              <rect x={px} y={py - 10} width={tw} height={20} rx={10} className="pill" />
              <text x={px + tw / 2} y={py + 4} textAnchor="middle" className="ax">{g.label}</text>
            </g>
          );
        })}

        {ends.map((e) => (
          <g key={e.l.code} className="fadein">
            <path d={`M${x(e.mi) + 4},${y(e.v)} C${pad.l + iw + 6},${y(e.v)} ${pad.l + iw + 4},${e.ty} ${pad.l + iw + 12},${e.ty}`} stroke={col(e.l.code)} strokeWidth={0.7} strokeOpacity={0.6} fill="none" />
            <circle cx={x(e.mi)} cy={y(e.v)} r={3} fill={col(e.l.code)} />
            <text x={pad.l + iw + 16} y={e.ty + 4} fill={col(e.l.code)} fontSize={lblPx} fontWeight={MAIN.has(e.l.code) ? 700 : 500} className="num">{label(e.l)}</text>
          </g>
        ))}

        {hover !== null && <g>
          <line x1={cx} x2={cx} y1={pad.t} y2={bottom} className="cross" />
          {rows.map((r) => r.p && r.v !== null && <circle key={r.l.code} cx={x(r.p.mi)} cy={y(r.v)} r={4.5} fill={col(r.l.code)} stroke="var(--card-solid)" strokeWidth={2} />)}
        </g>}
      </svg>

      {hover !== null && (
        <div ref={tipRef} className={`tip ${wide ? "" : "dock"}`} style={wide ? { left: tipLeft, top: tipTop } : undefined} role="status">
          <div className="tiph"><span>{fmtM(hover)}</span>{wide && <span className="cols">index · employed</span>}</div>
          {rows.map((r) => (
            <div key={r.l.code} className="tipr">
              <i style={{ background: col(r.l.code) }} /><span className="nm">{r.l.name}</span>
              {r.tag && <em>{r.tag}</em>}
              <b>{r.v === null ? "n/a" : r.v.toFixed(1)}</b>
              {wide && <span className="lv">{r.lvl === null ? "n/a" : `${(r.lvl / 1000).toFixed(2)}m`}</span>}
            </div>
          ))}
          {jan && <div className="tipn"><i className="dot amber" />US January jump: cause not confirmed</div>}
          {brk.map((b) => <div key={b} className="tipn">{b}</div>)}
        </div>
      )}

      <div className="sr-only"><table>
        <caption>{summary}</caption>
        <thead><tr><th>Period</th>{lines.map((l) => <th key={l.code}>{l.name}</th>)}</tr></thead>
        <tbody>{(lines.find((l) => l.freq === "monthly") ?? lines[0])?.points.map((p) => (
          <tr key={p.period}><td>{p.period}</td>{lines.map((l) => { const q = ptAt(l, p.mi); return <td key={l.code}>{q && q.value !== null ? q.value.toFixed(1) : "n/a"}</td>; })}</tr>
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
