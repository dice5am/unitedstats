"use client";
import { useEffect, useMemo, useRef, useState } from "react";

export type Pt = { period: string; t: number; value: number | null };
export type Line = { code: string; freq: "monthly" | "quarterly"; points: Pt[]; growth: number | null; breaks: number[] };

export const COLORS: Record<string, string> = {
  CAN: "#ff5a5f", USA: "#5b8def", JPN: "#c9a96e", GBR: "#7fb7a4", DEU: "#a58fd0", FRA: "#d48fa9", ITA: "#8fa3b8",
};

export default function LineChart({ lines, years }: { lines: Line[]; years: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(800);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const h = w < 560 ? 300 : 420;
  const pad = { l: 40, r: 14, t: 22, b: 28 };

  const { t0, t1, y0, y1 } = useMemo(() => {
    const all = lines.flatMap((l) => l.points);
    const ts = all.map((p) => p.t), vs = all.map((p) => p.value).filter((v): v is number => v !== null);
    let lo = Math.min(100, ...vs), hi = Math.max(100, ...vs);
    const span = Math.max(hi - lo, 1); lo -= span * 0.08; hi += span * 0.08;
    return { t0: Math.min(...ts), t1: Math.max(...ts), y0: lo, y1: hi };
  }, [lines]);

  if (!lines.length) return <div ref={ref} className="chart emptychart">Pick a country to show its line.</div>;

  const x = (t: number) => pad.l + ((t - t0) / (t1 - t0 || 1)) * (w - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - y0) / (y1 - y0)) * (h - pad.t - pad.b);
  const ticks = niceTicks(y0, y1, 5);
  const firstYear = Math.ceil(t0), lastYear = Math.floor(t1);
  const yearStep = years <= 1 ? 0 : years <= 5 ? 1 : years <= 10 ? 2 : 4;
  const xYears: number[] = [];
  if (yearStep) for (let yy = firstYear; yy <= lastYear; yy += yearStep) xYears.push(yy);
  const breaks = Array.from(new Set(lines.flatMap((l) => l.breaks.map((b) => `${b}|${l.code}`))))
    .map((s) => { const [yr, c] = s.split("|"); return { yr: +yr, c }; })
    .filter((b) => b.yr + 0.5 >= t0 && b.yr + 0.5 <= t1);

  const path = (pts: Pt[]) => {
    let d = "", pen = false;
    for (const p of pts) {
      if (p.value === null) { pen = false; continue; }
      d += `${pen ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.value).toFixed(1)}`; pen = true;
    }
    return d;
  };

  const monthLine = lines.find((l) => l.freq === "monthly") ?? lines[0];
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const t = t0 + ((e.clientX - r.left - pad.l) / (w - pad.l - pad.r)) * (t1 - t0);
    let best = 0, bd = Infinity;
    monthLine.points.forEach((p, i) => { const d = Math.abs(p.t - t); if (d < bd) { bd = d; best = i; } });
    setHover(best);
  };
  const hp = hover !== null ? monthLine.points[hover] : null;
  const nearest = (l: Line) => {
    if (!hp) return null;
    let best: Pt | null = null, bd = Infinity;
    for (const p of l.points) { const d = Math.abs(p.t - hp.t); if (d < bd) { bd = d; best = p; } }
    return best && bd < 0.13 ? best : null;
  };

  return (
    <div ref={ref} className="chart">
      <svg width={w} height={h} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Employment index chart">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} className={v === 100 ? "base" : "grid"} />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" className="ax">{v}</text>
          </g>
        ))}
        {xYears.map((yy) => <text key={yy} x={x(yy)} y={h - 8} textAnchor="middle" className="ax">{yy}</text>)}
        {!yearStep && monthLine.points.filter((_, i) => i % 3 === 0).map((p) => (
          <text key={p.period} x={x(p.t)} y={h - 8} textAnchor="middle" className="ax">{monthLabel(p.period)}</text>
        ))}
        {breaks.map((b, i) => (
          <g key={`${b.yr}${b.c}`}>
            <line x1={x(b.yr + 0.5)} x2={x(b.yr + 0.5)} y1={pad.t} y2={h - pad.b} className="brk" stroke={COLORS[b.c]} />
            <text x={x(b.yr + 0.5) + 3} y={pad.t - 6 + (i % 2) * 0} className="brkt" fill={COLORS[b.c]}>{b.yr} break</text>
          </g>
        ))}
        {lines.map((l) => (
          <g key={l.code}>
            <path d={path(l.points)} fill="none" stroke={COLORS[l.code]} strokeWidth={l.code === "CAN" ? 2.6 : 1.8}
              strokeOpacity={l.freq === "quarterly" ? 0.55 : 1} strokeLinejoin="round" strokeLinecap="round" />
            {l.freq === "quarterly" && l.points.map((p) => p.value !== null &&
              <circle key={p.period} cx={x(p.t)} cy={y(p.value)} r={years <= 5 ? 3.2 : 2} fill={COLORS[l.code]} />)}
          </g>
        ))}
        {hp && <line x1={x(hp.t)} x2={x(hp.t)} y1={pad.t} y2={h - pad.b} className="cursor" />}
        {hp && lines.map((l) => { const p = nearest(l); return p && p.value !== null &&
          <circle key={l.code} cx={x(p.t)} cy={y(p.value)} r={4} fill={COLORS[l.code]} stroke="#0f1115" strokeWidth={2} />; })}
      </svg>
      {hp && (
        <div className="tip" style={{ left: Math.min(Math.max(x(hp.t), 90), w - 90) }}>
          <div className="tipd">{monthLabel(hp.period, true)}</div>
          {lines.map((l) => { const p = nearest(l); return (
            <div key={l.code} className="tipr"><i style={{ background: COLORS[l.code] }} />{l.code}
              <b>{l.freq === "quarterly" && !p ? "—" : p && p.value !== null ? p.value.toFixed(1) : "n/a"}</b></div>
          ); })}
        </div>
      )}
    </div>
  );
}

function monthLabel(p: string, long = false) {
  const [y, m] = p.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "short", ...(long ? { year: "numeric" } : { year: "2-digit" }), timeZone: "UTC" });
}
function niceTicks(lo: number, hi: number, n: number) {
  const raw = (hi - lo) / n, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(+v.toFixed(4));
  return out;
}
