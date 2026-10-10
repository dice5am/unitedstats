"use client";
// Small multiples for yearly series (#11 fertility): one panel per country, same scale, round ticks with light gridlines,
// a dashed reference line (e.g. 2.1) and the latest value in the caption. Tap a panel for its stats box.
import { useMemo, useRef, useState, type ReactNode } from "react";
import { COUNTRIES } from "@/lib/series.mjs";
import { chartTitle, srcTag, type ChartId } from "@/src/charts/meta";
import { CardFrame, Seg, StatBox, useParams, useWidth, useFitH, useWinParam, lastYearOf, STD_WINS, type Init } from "./kit";
import { HeadFigs } from "./HeadFigs";

const NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.short]));
const ORDER = ["CAN", "USA", "JPN", "FRA", "GBR", "DEU", "ITA"];
export type YMSpec = { id: ChartId; eyebrow: string; param: string; old: string; ref?: { value: number; label: string }; dp: number; unitLabel: string;
  labels: [string, string]; sub: (from: string, to: string) => ReactNode; source: string; calc: (rows: { code: string; end: string; value: number }[]) => ReactNode };
export default function YearMultiples({ file, spec, initial }: { file: any; spec: YMSpec } & Init) {
  const [win, setWin] = useWinParam(initial, spec.param, spec.old);
  const from = String(lastYearOf(file) - +win);
  const panels = useMemo(() => ORDER.map((c) => { const s = file.series[c]; const pts = s.periods.map((p: string, i: number) => ({ y: +p, v: s.values[i] as number | null })).filter((q: any) => q.y >= +from);
    const last = [...pts].reverse().find((q: any) => q.v !== null); return { code: c, pts, end: String(last.y), value: last.v as number }; }), [file, from]);
  const [wrap, w] = useWidth<HTMLDivElement>();
  const phNow = useRef(0), fitT = useFitH(wrap, phNow);
  const [sel, setSel] = useState<string | null>(null);
  const all = panels.flatMap((p) => p.pts.map((q: any) => q.v)).filter((v: any) => v !== null).concat(spec.ref ? [spec.ref.value] : []);
  const step = [0.25, 0.5, 1, 2, 5, 10].find((s) => (Math.max(...all) - Math.min(0, ...all)) / s <= 5) ?? 20, lo = Math.min(0, Math.floor(Math.min(...all) / step) * step), hi = Math.ceil(Math.max(...all) / step) * step;
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => +(lo + i * step).toFixed(2));
  const cols = w >= 900 ? 4 : 2, gap = 12, pw = w ? Math.floor((w - gap * (cols - 1)) / cols) - 22 : 0, rows = Math.ceil(7 / cols), ph = fitT ? Math.floor(fitT / rows) : cols === 4 ? 140 : 110, pl = 6, pr = 6, pt = 16, pb = 18;
  phNow.current = rows * ph;
  const y0 = panels[0].pts[0].y, y1 = Math.max(...panels.map((p) => +p.end));
  const x = (yr: number) => pl + ((yr - y0) / (y1 - y0 || 1)) * (pw - pl - pr), y = (v: number) => pt + ((hi - v) / (hi - lo)) * (ph - pt - pb);
  const sorted = [...panels].sort((a, b) => b.value - a.value), p0 = sel ? panels.find((p) => p.code === sel)! : null;
  return (
    <CardFrame id={`chart-${spec.id}`} eyebrow={spec.eyebrow} title={chartTitle(spec.id)} sub={spec.sub(from, String(y1))} tag={srcTag(spec.id, String(y1))}
      controls={<div className="bar solo"><Seg label="Timeframe" value={win} options={STD_WINS.map((v) => [v, `${v}Y`])} onChange={(v) => { setSel(null); setWin(v); }} /></div>}
      headline={<HeadFigs tag={srcTag(spec.id, String(y1))} figs={[[sorted[0], spec.labels[0]], [sorted[6], spec.labels[1]]].map(([q, l]) => { const z = q as typeof sorted[0]; return { code: z.code, label: l as string, value: z.value.toFixed(spec.dp), date: z.end }; })} />}
      legend={<>{spec.ref && <li><i className="refk" />{spec.ref.label}</li>}<li>Same scale in all panels: {lo} to {hi}, gridlines every {step}</li></>}
      source={spec.source} calc={spec.calc(sorted)}>
      <div className="smgrid fm sc" ref={wrap} onPointerDown={() => setSel(null)} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap }}>
        {p0 && <StatBox title={`${NAME[p0.code]} · ${spec.unitLabel}`} onClose={() => setSel(null)} rows={[{ code: p0.code, name: String(y0), value: p0.pts[0].v === null ? "n/a" : p0.pts[0].v.toFixed(spec.dp) }, { code: p0.code, name: p0.end, value: p0.value.toFixed(spec.dp) }]} />}
        {pw > 0 && panels.map((p, i) => { let d = "", pen = false; p.pts.forEach((q: any) => { if (q.v === null) { pen = false; return; } d += `${pen ? "L" : "M"}${x(q.y).toFixed(1)},${y(q.v).toFixed(1)}`; pen = true; });
          return <figure key={p.code} className="smp" role="button" tabIndex={0} onPointerDown={(e) => e.stopPropagation()} onClick={() => setSel(sel === p.code ? null : p.code)}
            aria-label={`${NAME[p.code]}: ${p.pts[0].v?.toFixed(spec.dp)} in ${y0}, ${p.value.toFixed(spec.dp)} in ${p.end}`}>
            <figcaption style={{ color: `var(--${p.code})` }}><span>{NAME[p.code]}</span><b>{p.value.toFixed(spec.dp)}</b></figcaption>
            <svg width={pw} height={ph} aria-hidden>
              {ticks.map((t) => <g key={t}><line x1={pl} x2={pw - pr} y1={y(t)} y2={y(t)} className={t === 0 ? "zl" : "gl"} />{i % cols === 0 && (t === lo || t === hi) && <text x={pl + 2} y={y(t) - 3} className="ax fmt">{t}</text>}</g>)}
              {spec.ref && <line x1={pl} x2={pw - pr} y1={y(spec.ref.value)} y2={y(spec.ref.value)} className="refl" />}
              <path d={d} fill="none" stroke={`var(--${p.code})`} strokeWidth={2} strokeLinejoin="round" />
              <circle cx={x(+p.end)} cy={y(p.value)} r={3} fill={`var(--${p.code})`} />
              <text x={pl} y={ph - 4} className="ax">{y0}</text><text x={pw - pr} y={ph - 4} className="ax" textAnchor="end">{p.end}</text>
            </svg>
          </figure>; })}
      </div>
    </CardFrame>
  );
}
