"use client";
// Dumbbell (DESIGN-SYSTEM Round 4): one row per country, grey start dot, country-coloured end dot, 2px connector,
// change label to the right. Rows sorted by change (the brief's "sorted by increase" / "sorting by the gap").
// Generic: #10 public debt, #6 house prices vs incomes. Each end is the country's OWN latest reading, dated.
import { useMemo, useState, type ReactNode } from "react";
import { COUNTRIES } from "@/lib/series.mjs";
import { dumbbell } from "@/lib/finance.mjs";
import { chartTitle, srcTag, type ChartId } from "@/src/charts/meta";
import { CardFrame, StatBox, TagIn } from "./kit";

const NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.short]));
export type DumbbellSpec = {
  id: ChartId; eyebrow: string; start: string; change: "pts" | "pct"; per: (p: string) => string;
  sub: (latest: string) => ReactNode; source: string; unitLabel: string; valueFmt: (v: number) => string; tickFmt: (v: number) => string;
  labels: { up: string; down: string; upSmall: string; downSmall: string }; calc: (d: ReturnType<typeof dumbbell>) => ReactNode;
};
// signed change at the displayed rounding: 1 dp; a figure that rounds to zero is unsigned
export const chg = (v: number, unit: "pts" | "pct") => { const r = Math.round(v * 10) / 10; return `${r > 0 ? "+" : r < 0 ? "−" : ""}${Math.abs(r).toFixed(1)}${unit === "pct" ? "%" : ""}`; };

export default function Dumbbell({ file, spec }: { file: unknown; spec: DumbbellSpec }) {
  const d = useMemo(() => dumbbell(file, spec.start, spec.change), [file, spec.start, spec.change]);
  const [sel, setSel] = useState<string | null>(null);
  const vs = d.rows.flatMap((r) => [r.startValue, r.endValue]).filter((v): v is number => v !== null);
  // round ticks (e.g. 50/100/150/200%) with light gridlines; the domain snaps to whole steps, never raw extents
  const lo0 = Math.min(...vs), hi0 = Math.max(...vs), step = [1, 2, 5, 10, 20, 25, 50, 100, 200].find((st) => (hi0 - lo0) / st <= 5) ?? 500;
  const lo = Math.floor(lo0 / step) * step, hi = Math.ceil(hi0 / step) * step, x = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => lo + i * step);
  const ok = d.rows.filter((r) => r.change !== null), top = ok[0], bot = ok[ok.length - 1];
  const r1 = (v: number) => Math.round(v * 10) / 10;
  const lbl = (v: number, first: boolean) => r1(v) === 0 ? "No change" : first ? (v > 0 ? spec.labels.up : spec.labels.downSmall) : (v < 0 ? spec.labels.down : spec.labels.upSmall);
  const r = sel ? d.rows.find((x) => x.code === sel)! : null;
  const mixed = d.ends.length > 1;
  return (
    <CardFrame id={`chart-${spec.id}`} eyebrow={spec.eyebrow} title={chartTitle(spec.id)} sub={spec.sub(d.latest)}
      tag={srcTag(spec.id, spec.per(d.latest))}
      headline={top && bot ? <div className="figs">
        {[[top, true], [bot, false]].map(([row, f]) => { const x0 = row as typeof top; return (
          <div className="fig" key={x0.code}><div className="figl">{lbl(x0.change!, f as boolean)}</div><div className="figc"><span><i style={{ background: `var(--${x0.code})` }} />{NAME[x0.code]}</span></div>
            <div className={spec.change === "pts" ? "figv pts" : "figv"}>{chg(x0.change!, spec.change)}{spec.change === "pts" && <span>pts</span>}</div><div className="figp">{spec.per(d.start)} → {spec.per(x0.end!)}{f && <TagIn tag={srcTag(spec.id, spec.per(d.latest))} />}</div></div>); })}
      </div> : undefined}
      legend={<>
        <li><i className="dbs" />{spec.per(d.start)}</li><li><i className="dbe" />Latest{mixed ? " (each country’s own, dated)" : ""}</li>
      </>}
      source={spec.source}
      calc={spec.calc(d)}>
      <div className="sc db" onPointerDown={() => setSel(null)}>
        {r && <StatBox title={`${NAME[r.code]} · ${spec.unitLabel}`} onClose={() => setSel(null)} rows={[
          { code: r.code, name: spec.per(d.start), value: r.startValue === null ? "n/a" : spec.valueFmt(r.startValue) },
          { code: r.code, name: r.end ? spec.per(r.end) : "Latest", value: r.endValue === null ? "n/a" : spec.valueFmt(r.endValue) },
          { code: r.code, name: "Change", value: r.change === null ? "n/a" : `${chg(r.change, spec.change)}${spec.change === "pts" ? " pts" : ""}` },
        ]} />}
        <ol className="scl">
          {d.rows.map((row) => (
            <li key={row.code}>
              <button type="button" className={`scr${sel === row.code ? " on" : ""}`} onPointerDown={(e) => e.stopPropagation()} onClick={() => setSel(sel === row.code ? null : row.code)}
                aria-label={`${NAME[row.code]}: ${row.startValue === null ? "n/a" : spec.valueFmt(row.startValue)} in ${spec.per(d.start)}, ${row.endValue === null ? "n/a" : spec.valueFmt(row.endValue)} in ${row.end ? spec.per(row.end) : "n/a"}`}>
                <span className="scn"><i style={{ background: `var(--${row.code})` }} />{NAME[row.code]}</span>
                <span className="sct">
                  {ticks.map((t) => <span key={t} className="dbg" style={{ left: `${x(t)}%` }} aria-hidden />)}
                  {row.startValue !== null && row.endValue !== null ? <>
                    <span className="dbc" style={{ left: `${Math.min(x(row.startValue), x(row.endValue))}%`, width: `${Math.abs(x(row.endValue) - x(row.startValue))}%`, background: `var(--${row.code})` }} />
                    <span className="dbs" style={{ left: `${x(row.startValue)}%` }} />
                    <span className="dbe" style={{ left: `${x(row.endValue)}%`, background: `var(--${row.code})` }} />
                  </> : <span className="na">n/a</span>}
                </span>
                <span className="scv">{row.change === null ? "n/a" : chg(row.change, spec.change)}{mixed && row.end !== d.latest && row.end && <em>{spec.per(row.end)}</em>}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="scr dbax" aria-hidden><span /><span className="sct">{ticks.map((t) => <span key={t} style={{ left: `${x(t)}%` }}>{spec.tickFmt(t)}</span>)}</span><span /></div>
      </div>
    </CardFrame>
  );
}
