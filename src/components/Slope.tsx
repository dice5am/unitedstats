"use client";
// Slope chart (DESIGN-SYSTEM Round 4): two columns (start | each country's own latest), one 2px line per country in its colour,
// value labels at both ends spread vertically with ≥4px between them; the right label carries the change. #12 wages, #24 labour share.
import { useMemo, useState, type ReactNode } from "react";
import { COUNTRIES } from "@/lib/series.mjs";
import { slope, wholeFlag } from "@/lib/finance.mjs";
import { chartTitle, srcTag, type ChartId } from "@/src/charts/meta";
import { CardFrame, StatBox, useWidth } from "./kit";
import { HeadFigs, rankLabels, sgn } from "./HeadFigs";

const NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.short]));
const CODE: Record<string, string> = { CAN: "CA", USA: "US", JPN: "JP", FRA: "FR", GBR: "UK", DEU: "DE", ITA: "IT" };
export type SlopeSpec = {
  id: ChartId; eyebrow: string; start: number; change: "pct" | "pts"; dp: number; valueFmt: (v: number) => string; unitLabel: string;
  labels: { up: string; down: string; upSmall: string; downSmall: string }; flagNote?: Record<string, string>;
  sub: (ends: string[]) => ReactNode; source: string; calc: (d: ReturnType<typeof slope>) => ReactNode;
};
// spread labels so neighbours sit ≥ gap apart, staying inside [lo, hi]
export function spread(ys: number[], gap: number, lo: number, hi: number) {
  const o = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < o.length; k++) o[k].y = Math.max(o[k].y, o[k - 1].y + gap);
  if (o.length && o[o.length - 1].y > hi) { o[o.length - 1].y = hi; for (let k = o.length - 2; k >= 0; k--) o[k].y = Math.min(o[k].y, o[k + 1].y - gap); }
  if (o.length && o[0].y < lo) { o[0].y = lo; for (let k = 1; k < o.length; k++) o[k].y = Math.max(o[k].y, o[k - 1].y + gap); }
  const out = new Array(ys.length); o.forEach((x) => (out[x.i] = x.y)); return out as number[];
}

export default function Slope({ file, spec }: { file: unknown; spec: SlopeSpec }) {
  const d = useMemo(() => slope(file, spec.start, spec.change), [file, spec.start, spec.change]);
  const [sel, setSel] = useState<string | null>(null);
  const [ref, w] = useWidth<HTMLDivElement>();
  const narrow = w > 0 && w < 560, H = narrow ? 340 : 420, padT = 28, padB = 16, LH = 16;
  const lw = narrow ? 64 : 150, rw = narrow ? 104 : 190, x0 = lw + 8, x1 = Math.max(x0 + 80, w - rw - 8);
  const ok = d.rows.filter((r) => r.startValue !== null && r.endValue !== null);
  const vs = ok.flatMap((r) => [r.startValue!, r.endValue!]), lo = Math.min(...vs), hi = Math.max(...vs), pad = (hi - lo) * 0.04 || 1;
  const y = (v: number) => padT + (1 - (v - lo + pad) / (hi - lo + 2 * pad)) * (H - padT - padB);
  const ly = spread(ok.map((r) => y(r.startValue!)), LH + 4, padT + 6, H - padB), ry = spread(ok.map((r) => y(r.endValue!)), LH + 4, padT + 6, H - padB);
  const ends = d.ends, mixed = ends.length > 1, latest = ends[ends.length - 1];
  const top = d.rows[0], bot = [...d.rows].reverse().find((r) => r.change !== null)!;
  const shown = (v: number) => Math.round(v * 10 ** spec.dp) / 10 ** spec.dp;
  const unit = spec.change === "pts" ? "pts" : undefined, fmtC = (v: number) => sgn(shown(v), spec.dp, spec.change === "pct" ? "%" : "");
  const r = sel ? d.rows.find((x) => x.code === sel)! : null;
  const flagOf = (code: string) => wholeFlag(file, code);
  return (
    <CardFrame id={`chart-${spec.id}`} eyebrow={spec.eyebrow} title={chartTitle(spec.id)} sub={spec.sub(ends)} tag={srcTag(spec.id, latest)}
      headline={top && bot && <HeadFigs tag={srcTag(spec.id, latest)} figs={[[top, true], [bot, false]].map(([x, f]) => { const q = x as typeof top; return { code: q.code, label: rankLabels(q.change!, f as boolean, shown(q.change!), spec.labels), value: fmtC(q.change!), unit, date: `${d.start} → ${q.end}` }; })} />}
      legend={<>
        <li>Left: {d.start} · right: {mixed ? "each country’s latest year, dated" : latest}</li>
        {spec.flagNote && ok.some((x) => flagOf(x.code) && spec.flagNote![flagOf(x.code)!]) && <li className="deu">{ok.filter((x) => flagOf(x.code) && spec.flagNote![flagOf(x.code)!]).map((x) => `${NAME[x.code]}: ${spec.flagNote![flagOf(x.code)!]}`).join(" · ")}</li>}
      </>}
      source={spec.source} calc={spec.calc(d)}>
      <div className="slope" ref={ref} onPointerDown={() => setSel(null)}>
        {r && <StatBox title={`${NAME[r.code]} · ${spec.unitLabel}`} onClose={() => setSel(null)} rows={[
          { code: r.code, name: d.start, value: r.startValue === null ? "n/a" : spec.valueFmt(r.startValue) },
          { code: r.code, name: r.end ?? "Latest", value: r.endValue === null ? "n/a" : spec.valueFmt(r.endValue), note: flagOf(r.code) && spec.flagNote?.[flagOf(r.code)!] ? spec.flagNote[flagOf(r.code)!] : undefined },
          { code: r.code, name: "Change", value: r.change === null ? "n/a" : `${fmtC(r.change)}${unit ? " pts" : ""}` },
        ]} />}
        {w > 0 && <svg width={w} height={H} role="img" aria-label={`${chartTitle(spec.id)}: ${ok.map((x) => `${NAME[x.code]} ${spec.valueFmt(x.startValue!)} in ${d.start}, ${spec.valueFmt(x.endValue!)} in ${x.end}`).join("; ")}`}>
          <text x={x0} y={14} className="ax" textAnchor="middle">{d.start}</text>
          <text x={x1} y={14} className="ax" textAnchor="middle">{mixed ? "Latest" : latest}</text>
          <line x1={x0} x2={x0} y1={padT - 6} y2={H - padB} className="slax" /><line x1={x1} x2={x1} y1={padT - 6} y2={H - padB} className="slax" />
          {ok.map((row, i) => { const dim = sel && sel !== row.code; return (
            <g key={row.code} className={`slr${dim ? " dim" : ""}`} onPointerDown={(e) => e.stopPropagation()} onClick={() => setSel(sel === row.code ? null : row.code)} style={{ color: `var(--${row.code})` }}>
              <line x1={x0} x2={x1} y1={y(row.startValue!)} y2={y(row.endValue!)} stroke="currentColor" strokeWidth={2} />
              <line x1={x0} x2={x1} y1={y(row.startValue!)} y2={y(row.endValue!)} stroke="transparent" strokeWidth={20} />
              <circle cx={x0} cy={y(row.startValue!)} r={4} fill="currentColor" /><circle cx={x1} cy={y(row.endValue!)} r={4} fill="currentColor" />
              <text x={x0 - 10} y={ly[i] + 4} textAnchor="end" className="sll">{narrow ? "" : `${NAME[row.code]} `}<tspan className="slv">{spec.valueFmt(row.startValue!)}</tspan></text>
              <text x={x1 + 10} y={ry[i] + 4} className="sll">{narrow ? CODE[row.code] : NAME[row.code]} <tspan className="slv">{fmtC(row.change!)}</tspan>{mixed && <tspan className="from"> {row.end}</tspan>}</text>
            </g>); })}
        </svg>}
      </div>
    </CardFrame>
  );
}
