"use client";
// Waffle small multiples (#23): 10×10 squares per country, one square = 1% of the population, rounded to whole squares;
// the exact value is in the label. Filled squares in the country colour, the rest neutral. Year selector (published years only).
import { useMemo, useState, type ReactNode } from "react";
import { COUNTRIES } from "@/lib/series.mjs";
import { chartTitle, srcTag, type ChartId } from "@/src/charts/meta";
import { CardFrame, YearPick, StatBox, useParams, type Init } from "./kit";
import { HeadFigs } from "./HeadFigs";

const NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.short]));
const ORDER = ["CAN", "USA", "JPN", "FRA", "GBR", "DEU", "ITA"];
export type WaffleSpec = { id: ChartId; eyebrow: string; param: string; years: string[]; def: string; base: string; sub: (y: string) => ReactNode; source: string; calc: (y: string, v: (c: string, y: string) => number | null) => ReactNode };
export default function Waffle({ file, spec, initial }: { file: any; spec: WaffleSpec } & Init) {
  const [st, set] = useParams(initial, { [spec.param]: [spec.def, spec.years] } as any) as unknown as [Record<string, string>, (k: string, v: string) => void];
  const y = st[spec.param];
  const v = useMemo(() => (c: string, yr: string) => { const s = file.series[c], i = s.periods.indexOf(yr); return i < 0 ? null : s.values[i] ?? null; }, [file]);
  const rows = ORDER.map((c) => ({ code: c, value: v(c, y), base: v(c, spec.base) })).sort((a, b) => (a.value === null ? 1 : b.value === null ? -1 : b.value - a.value));
  const [sel, setSel] = useState<string | null>(null);
  const ok = rows.filter((r) => r.value !== null), top = ok[0], bot = ok[ok.length - 1], r = sel ? rows.find((q) => q.code === sel)! : null;
  const pct = (x: number) => `${x.toFixed(1)}%`;
  return (
    <CardFrame id={`chart-${spec.id}`} eyebrow={spec.eyebrow} title={chartTitle(spec.id)} sub={spec.sub(y)} tag={srcTag(spec.id, y)}
      controls={<div className="bar solo"><YearPick label="Year" value={y} options={spec.years} onChange={(x) => { setSel(null); set(spec.param, x); }} /></div>}
      headline={top && bot && <HeadFigs tag={srcTag(spec.id, y)} figs={[[top, "Highest share"], [bot, "Lowest share"]].map(([q, l]) => { const z = q as typeof top; return { code: z.code, label: l as string, value: pct(z.value!), date: `${y} · of the population` }; })} />}
      legend={<><li><i className="wfk on" />1 square = 1% of the population, rounded</li><li>Only published years: 1990, 1995 … 2020 and 2024; nothing in between is estimated</li></>}
      source={spec.source} calc={spec.calc(y, v)}>
      <div className="sc wfg" onPointerDown={() => setSel(null)}>
        {r && <StatBox title={`${NAME[r.code]} · migrants, % of population`} onClose={() => setSel(null)} rows={[{ code: r.code, name: y, value: r.value === null ? "n/a" : pct(r.value) }, ...(y !== spec.base ? [{ code: r.code, name: spec.base, value: r.base === null ? "n/a" : pct(r.base) }] : [])]} />}
        {rows.map((q) => { const n = q.value === null ? 0 : Math.round(q.value); return (
          <button type="button" key={q.code} className={`wf${sel === q.code ? " on" : ""}`} onPointerDown={(e) => e.stopPropagation()} onClick={() => setSel(sel === q.code ? null : q.code)}
            aria-label={`${NAME[q.code]}: ${q.value === null ? "n/a" : pct(q.value)} of the population in ${y}`} style={{ color: `var(--${q.code})` }}>
            <span className="wfh"><span>{NAME[q.code]}</span><b>{q.value === null ? "n/a" : pct(q.value)}</b></span>
            <span className="wfs" aria-hidden>{Array.from({ length: 100 }, (_, i) => <i key={i} className={i < n ? "on" : ""} />)}</span>
            {y !== spec.base && q.base !== null && <span className="wfb">{spec.base}: {pct(q.base)}</span>}
          </button>); })}
      </div>
    </CardFrame>
  );
}
