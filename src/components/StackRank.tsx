"use client";
// Generic stacked ranked bar with a year selector (#15 R&D). Segments on the neutral one-hue ramp (never country colours),
// totals labelled; a year a country hasn't published is n/a, tagged with its latest year. Default year never mixes years.
import { useMemo, useState, type ReactNode } from "react";
import { PEERS } from "@/lib/series.mjs";
import { chartTitle, srcTag, type ChartId } from "@/src/charts/meta";
import { CardFrame, Seg, StatBox, YearPick, useParams, type Init, anchorOf } from "./kit";
import { HeadFigs } from "./HeadFigs";

const NAME = Object.fromEntries(PEERS.map((c) => [c.code, c.short]));
export type StackRow = { code: string; parts: (number | null)[]; total: number | null; latestYear: number; note?: string };
export type StackSpec = {
  id: ChartId; eyebrow: string; param: string; years: string[]; def: string; parts: string[]; fmt: (v: number) => string;
  rows: (year: string) => StackRow[]; labels: [string, string]; sub: (year: string) => ReactNode; source: string; calc: (year: string, rows: StackRow[]) => ReactNode;
};
export default function StackRank({ spec, initial }: { spec: StackSpec } & Init) {
  const [st, set] = useParams(initial, { [spec.param]: [spec.def, spec.years] } as any) as unknown as [Record<string, string>, (k: string, v: string) => void];
  const year = st[spec.param], rows = useMemo(() => spec.rows(year), [spec, year]);
  const [sel, setSel] = useState<string | null>(null);
  const [at, setAt] = useState<{ y: number; h: number; H: number } | undefined>();
  const ok = rows.filter((r) => r.total !== null), max = Math.max(...ok.map((r) => r.total!)), na = rows.filter((r) => r.total === null);
  const top = ok[0], bot = ok[ok.length - 1], r = sel ? rows.find((x) => x.code === sel)! : null;
  const step = [0.5, 1, 2, 5, 10, 20, 25, 50, 100].find((s) => max / s <= 4) ?? 200, hi = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(hi / step) + 1 }, (_, i) => +(i * step).toFixed(2)), x = (v: number) => (v / hi) * 100;
  return (
    <CardFrame id={`chart-${spec.id}`} eyebrow={spec.eyebrow} title={chartTitle(spec.id)} sub={spec.sub(year)} tag={srcTag(spec.id, year)}
      controls={<div className="bar solo"><div className="yp-w"><Seg label="Year" value={year} options={spec.years.map((v) => [v, v])} onChange={(v) => { setSel(null); set(spec.param, v); }} /></div><div className="yp-n"><YearPick label="Year" value={year} options={spec.years} onChange={(v) => { setSel(null); set(spec.param, v); }} /></div></div>}
      headline={top && bot && <HeadFigs tag={srcTag(spec.id, year)} figs={[[top, spec.labels[0]], [bot, spec.labels[1]]].map(([q, l]) => { const z = q as StackRow; return { code: z.code, label: l as string, value: spec.fmt(z.total!), date: year }; })} />}
      legend={<>{spec.parts.map((p, i) => <li key={p}><i className={`stk s${i}`} />{p}</li>)}{na.length > 0 && <li>n/a: {na.map((q) => `${NAME[q.code]} (${q.latestYear} latest)`).join(", ")}</li>}</>}
      source={spec.source} calc={spec.calc(year, rows)}>
      <div className="sc stb" onPointerDown={() => setSel(null)}>
        {r && <StatBox title={`${NAME[r.code]} · ${year}`} onClose={() => setSel(null)} at={at} rows={[...spec.parts.map((p, i) => ({ code: r.code, name: p, value: r.parts[i] === null ? "n/a" : spec.fmt(r.parts[i]!) })),
          { code: r.code, name: "Total", value: r.total === null ? "n/a" : spec.fmt(r.total), note: r.total === null ? `${r.latestYear} latest` : r.note }]} />}
        <ol className="scl">
          {rows.map((q) => { let acc = 0; return (
            <li key={q.code}>
              <button type="button" className={`scr${sel === q.code ? " on" : ""}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { setAt(anchorOf(e.currentTarget)); setSel(sel === q.code ? null : q.code); }}
                aria-label={`${NAME[q.code]}: ${q.total === null ? `n/a, ${q.latestYear} latest` : `${spec.parts.map((p, i) => `${p} ${spec.fmt(q.parts[i]!)}`).join(", ")}, total ${spec.fmt(q.total)}`}`}>
                <span className="scn"><i style={{ background: `var(--${q.code})` }} />{NAME[q.code]}</span>
                <span className="sct">{ticks.map((t) => <span key={t} className="dbg" style={{ left: `${x(t)}%` }} aria-hidden />)}
                  {q.total === null || q.parts.some((v) => v === null) ? <span className="na">n/a · {q.latestYear} latest</span> : q.parts.map((v, i) => { const l = acc; acc += v!; return <span key={i} className={`stk s${i}`} style={{ left: `${x(l)}%`, width: `${x(v!)}%` }} />; })}</span>
                <span className="scv">{q.total === null ? "n/a" : spec.fmt(q.total)}</span>
              </button>
            </li>); })}
        </ol>
        <div className="scr dbax" aria-hidden><span /><span className="sct">{ticks.map((t) => <span key={t} style={{ left: `${x(t)}%` }}>{t}%</span>)}</span><span /></div>
      </div>
    </CardFrame>
  );
}
