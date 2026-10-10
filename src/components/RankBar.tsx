"use client";
// Ranked horizontal bars (DESIGN-SYSTEM Round 4), sorted, value at the bar end, each country dated with its own latest period.
// "ratio": bars from 0 with a reference line at 1 and a mini sparkline per bar (#17). "diverging": bars from zero both ways (#18).
import { useMemo, useState, type ReactNode } from "react";
import { COUNTRIES } from "@/lib/series.mjs";
import { chartTitle, srcTag, type ChartId } from "@/src/charts/meta";
import { CardFrame, StatBox } from "./kit";
import { HeadFigs, rankLabels, sgn } from "./HeadFigs";

const CODE2: Record<string, string> = { CAN: "CA", USA: "US", JPN: "JP", FRA: "FR", GBR: "UK", DEU: "DE", ITA: "IT" };

const NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.short]));
export type BarRow = { code: string; value: number | null; end: string | null; spark?: (number | null)[]; stat: { name: string; value: string }[] };
export type RankBarSpec = {
  id: ChartId; eyebrow: string; kind: "ratio" | "diverging" | "dot"; dp: number; unit?: string; per: (p: string) => string; unitLabel: string;
  labels: { up: string; down: string; upSmall: string; downSmall: string } | { top: string; bottom: string };
  rows: (file: any) => { rows: BarRow[]; latest: string; start?: string }; sub: (latest: string) => ReactNode; source: string; legend?: ReactNode; calc: (d: any) => ReactNode;
};
function Spark({ v, lo, hi }: { v: (number | null)[]; lo: number; hi: number }) {
  const W = 56, H = 18, n = v.length; let p = "", pen = false;
  v.forEach((x, i) => { if (x === null) { pen = false; return; } const X = (i / (n - 1)) * W, Y = H - 1 - ((x - lo) / (hi - lo || 1)) * (H - 2); p += `${pen ? "L" : "M"}${X.toFixed(1)},${Y.toFixed(1)}`; pen = true; });
  return <svg className="rbs" width={W} height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden><path d={p} fill="none" stroke="currentColor" strokeWidth={1.5} /></svg>;
}
export default function RankBar({ file, spec }: { file: unknown; spec: RankBarSpec }) {
  const d = useMemo(() => spec.rows(file), [file, spec]);
  const [sel, setSel] = useState<string | null>(null);
  const [at, setAt] = useState<{ y: number; h: number; H: number } | undefined>();
  const ok = d.rows.filter((r) => r.value !== null), vs = ok.map((r) => r.value!);
  // dot plots don't need zero on the axis; bars always start at zero
  const z = spec.kind === "dot" ? null : 0, vlo = Math.min(...(z === null ? vs : [0, ...vs])), vhi = Math.max(...(z === null ? vs : [0, ...vs]));
  const step = [0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200].find((s) => (vhi - vlo) / s <= 4) ?? 500;
  const lo = Math.floor(vlo / step) * step, hi = Math.ceil(vhi / step) * step, x = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => lo + i * step);
  const shown = (v: number) => Math.round(v * 10 ** spec.dp) / 10 ** spec.dp;
  const fmt = (v: number) => spec.kind === "diverging" ? sgn(shown(v), spec.dp) : `${v.toFixed(spec.dp)}${spec.kind === "ratio" ? "×" : ""}`; // #17 ratio reads "3.35×"
  const all = ok.flatMap((r) => (r.spark || []).filter((z): z is number => z !== null)), slo = Math.min(...all), shi = Math.max(...all);
  const top = ok[0], bot = ok[ok.length - 1], L = spec.labels;
  const lab = (v: number, f: boolean) => "top" in L ? (f ? L.top : L.bottom) : rankLabels(v, f, shown(v), L);
  const r = sel ? d.rows.find((q) => q.code === sel)! : null;
  const mixed = new Set(ok.map((q) => q.end)).size > 1;
  // date only the rows that differ from the most common end (e.g. UK Jun, US Sep vs everyone else Aug)
  const cnt: Record<string, number> = {}; ok.forEach((q) => { cnt[q.end!] = (cnt[q.end!] || 0) + 1; }); const common = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
  return (
    <CardFrame id={`chart-${spec.id}`} eyebrow={spec.eyebrow} title={chartTitle(spec.id)} sub={spec.sub(d.latest)} tag={srcTag(spec.id, spec.per(d.latest))}
      headline={top && bot && <HeadFigs tag={srcTag(spec.id, spec.per(d.latest))} figs={[[top, true], [bot, false]].map(([q, f]) => { const z = q as typeof top; return { code: z.code, label: lab(z.value!, f as boolean), value: fmt(z.value!), unit: spec.unit, date: d.start ? `${d.start} → ${spec.per(z.end!)}` : spec.per(z.end!) }; })} />}
      legend={<>{spec.legend}{mixed && <li>Each country at its own latest {spec.kind === "ratio" ? "month" : "year"}, dated where it differs</li>}</>}
      source={spec.source} calc={spec.calc(d)}>
      <div className={`sc rb k-${spec.kind}${ok.some((q) => q.spark) ? " sp" : ""}`} onPointerDown={() => setSel(null)}>
        {r && <StatBox title={`${NAME[r.code]} · ${spec.unitLabel}`} onClose={() => setSel(null)} rows={r.stat.map((s) => ({ code: r.code, ...s }))} at={at} />}
        <ol className="scl">
          {d.rows.map((row) => (
            <li key={row.code}>
              <button type="button" className={`scr${sel === row.code ? " on" : ""}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { const b = e.currentTarget, box = b.closest(".sc") as HTMLElement; setAt({ y: b.getBoundingClientRect().top - box.getBoundingClientRect().top, h: b.offsetHeight, H: box.offsetHeight }); setSel(sel === row.code ? null : row.code); }}
                aria-label={`${NAME[row.code]}: ${row.value === null ? "n/a" : fmt(row.value)}${spec.unit ? " " + spec.unit : ""}${row.end ? ", " + spec.per(row.end) : ""}`}>
                <span className="scn"><i style={{ background: `var(--${row.code})` }} />{NAME[row.code]}</span>
                <span className="sct">
                  {ticks.map((t) => <span key={t} className={`dbg${t === 0 ? " z" : ""}`} style={{ left: `${x(t)}%` }} aria-hidden />)}
                  {spec.kind === "ratio" && <span className="rbref" style={{ left: `${x(1)}%` }} aria-hidden />}
                  {row.value !== null && spec.kind === "dot" ? <><span className="rbd" style={{ left: `${x(row.value)}%`, background: `var(--${row.code})` }} /><span className="rby" data-testid="dot-label" style={{ left: `${x(row.value)}%` }}>{CODE2[row.code]} {row.end}</span></> : row.value !== null ? <span className="scb" style={{ left: `${Math.min(x(0), x(row.value))}%`, width: `${Math.abs(x(row.value) - x(0))}%`, background: `var(--${row.code})` }} /> : <span className="na">n/a</span>}
                </span>
                <span className="scv">{row.value === null ? "n/a" : fmt(row.value)}{mixed && spec.kind !== "dot" && row.end && row.end !== common && <em>{spec.per(row.end)}</em>}</span>
                {row.spark && <span className="rbsp" style={{ color: `var(--${row.code})` }}><Spark v={row.spark} lo={slo} hi={shi} /></span>}
              </button>
            </li>
          ))}
        </ol>
        <div className="scr dbax" aria-hidden><span /><span className="sct">{ticks.map((t) => <span key={t} style={{ left: `${x(t)}%` }}>{t}</span>)}</span><span />{ok.some((q) => q.spark) && <span />}</div>
      </div>
    </CardFrame>
  );
}
