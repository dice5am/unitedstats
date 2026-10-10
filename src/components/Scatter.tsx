"use client";
// Scatter (#8, year selector) and connected scatter (#5, one trail per country, dot per year, latest year labelled).
// Round ticks with light gridlines on both axes; country colours; labels spread so they never collide. Tap a dot for its stats box.
import { useMemo, useRef, useState, type ReactNode } from "react";
import { COUNTRIES } from "@/lib/series.mjs";
import { chartTitle, srcTag, type ChartId } from "@/src/charts/meta";
import { CardFrame, YearPick, StatBox, useParams, useWidth, useFitH, type Init } from "./kit";
import { HeadFigs, type Fig } from "./HeadFigs";
import { spread } from "./Slope";

const NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.short]));
const CODE: Record<string, string> = { CAN: "CA", USA: "US", JPN: "JP", FRA: "FR", GBR: "UK", DEU: "DE", ITA: "IT" };
export type SPoint = { code: string; x: number | null; y: number | null; note?: string; trail?: { year: string; x: number; y: number }[]; date?: string };
export type ScatterSpec = {
  id: ChartId; eyebrow: string; param?: string; years?: string[]; def?: string; xLabel: string; yLabel: string; xFmt: (v: number) => string; yFmt: (v: number) => string; xTick?: (v: number) => string;
  points: (year: string) => SPoint[]; headline?: (pts: SPoint[], year: string) => Fig[] | null; tagEnd: (year: string) => string;
  sub: (year: string) => ReactNode; source: string; legend?: ReactNode; calc: (pts: SPoint[], year: string) => ReactNode;
};
const nice = (lo: number, hi: number) => { const st = [0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 25000, 50000].find((s) => (hi - lo) / s <= 5) ?? 100000;
  const a = Math.floor(lo / st) * st, b = Math.ceil(hi / st) * st; return { a, b, ticks: Array.from({ length: Math.round((b - a) / st) + 1 }, (_, i) => +(a + i * st).toFixed(2)) }; };
export default function Scatter({ spec, initial }: { spec: ScatterSpec } & Init) {
  const [st, set] = useParams(initial, (spec.param ? { [spec.param]: [spec.def!, spec.years!] } : {}) as any) as unknown as [Record<string, string>, (k: string, v: string) => void];
  const year = spec.param ? st[spec.param] : "";
  const pts = useMemo(() => spec.points(year), [spec, year]);
  const [ref, w] = useWidth<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null), hNow = useRef(0), fitH = useFitH(svgRef, hNow);
  const [sel, setSel] = useState<string | null>(null);
  const ok = pts.filter((p) => p.x !== null && p.y !== null), na = pts.filter((p) => p.x === null || p.y === null);
  const xs = ok.flatMap((p) => (p.trail ? p.trail.map((q) => q.x) : [p.x!])), ys = ok.flatMap((p) => (p.trail ? p.trail.map((q) => q.y) : [p.y!]));
  const X = nice(Math.min(...xs), Math.max(...xs)), Y = nice(Math.min(...ys), Math.max(...ys));
  const narrow = w > 0 && w < 560, H0 = narrow ? 340 : 440, H = fitH ?? H0, pl = narrow ? 40 : 56, pr = narrow ? 36 : 110, pt = 24, pb = 40;
  hNow.current = H;
  const x = (v: number) => pl + ((v - X.a) / (X.b - X.a)) * (w - pl - pr), y = (v: number) => pt + ((Y.b - v) / (Y.b - Y.a)) * (H - pt - pb);
  const ly = spread(ok.map((p) => y(p.y!)), 16, pt, H - pb);
  const p0 = sel ? pts.find((p) => p.code === sel)! : null, figs = spec.headline?.(pts, year) ?? null;
  return (
    <CardFrame id={`chart-${spec.id}`} eyebrow={spec.eyebrow} title={chartTitle(spec.id)} sub={spec.sub(year)} tag={srcTag(spec.id, spec.tagEnd(year))}
      controls={spec.param ? <div className="bar solo"><YearPick label="Year" value={year} options={spec.years!} onChange={(v) => { setSel(null); set(spec.param!, v); }} /></div> : undefined}
      headline={figs ? <HeadFigs tag={srcTag(spec.id, spec.tagEnd(year))} figs={figs} /> : undefined}
      legend={<>{spec.legend}{na.length > 0 && <li>n/a for {year}: {na.map((p) => NAME[p.code]).join(", ")}</li>}</>}
      source={spec.source} calc={spec.calc(pts, year)}>
      <div className="scat sc" ref={ref} onPointerDown={() => setSel(null)}>
        {p0 && <StatBox title={`${NAME[p0.code]}${p0.date ? ` · ${p0.date}` : year ? ` · ${year}` : ""}`} onClose={() => setSel(null)} bottom={p0.y !== null && y(p0.y) < H / 2}
          rows={[{ code: p0.code, name: spec.xLabel, value: p0.x === null ? "n/a" : spec.xFmt(p0.x) }, { code: p0.code, name: spec.yLabel, value: p0.y === null ? "n/a" : spec.yFmt(p0.y), note: p0.note }]} />}
        {w > 0 && <svg ref={svgRef} width={w} height={H} role="img" aria-label={`${chartTitle(spec.id)}: ${ok.map((p) => `${NAME[p.code]} ${spec.xFmt(p.x!)}, ${spec.yFmt(p.y!)}`).join("; ")}`}>
          {X.ticks.map((t) => <g key={`x${t}`}><line x1={x(t)} x2={x(t)} y1={pt} y2={H - pb} className="gl" /><text x={x(t)} y={H - pb + 16} className="ax" textAnchor="middle">{(spec.xTick ?? String)(t)}</text></g>)}
          {Y.ticks.map((t) => <g key={`y${t}`}><line x1={pl} x2={w - pr} y1={y(t)} y2={y(t)} className="gl" /><text x={pl - 8} y={y(t) + 4} className="ax" textAnchor="end">{t}</text></g>)}
          <text x={w - pr} y={H - 6} className="ax axt" textAnchor="end">{spec.xLabel} →</text>
          <text x={pl - 8} y={12} className="ax axt">↑ {spec.yLabel}</text>
          {ok.map((p, i) => { const dim = sel && sel !== p.code; return (
            <g key={p.code} className={`scp${dim ? " dim" : ""}`} style={{ color: `var(--${p.code})` }} onPointerDown={(e) => e.stopPropagation()} onClick={() => setSel(sel === p.code ? null : p.code)}>
              {p.trail && <path d={p.trail.map((q, j) => `${j ? "L" : "M"}${x(q.x).toFixed(1)},${y(q.y).toFixed(1)}`).join("")} fill="none" stroke="currentColor" strokeWidth={1.5} opacity={0.4} />}
              {p.trail && p.trail.map((q, j) => <circle key={j} cx={x(q.x)} cy={y(q.y)} r={1.8} fill="currentColor" opacity={0.4} />)}
              {p.trail && <circle cx={x(p.trail[0].x)} cy={y(p.trail[0].y)} r={3.5} fill="var(--card-solid)" stroke="currentColor" strokeWidth={1.5} />}
              <circle cx={x(p.x!)} cy={y(p.y!)} r={5} fill="currentColor" stroke="var(--card-solid)" strokeWidth={2} />
              <circle cx={x(p.x!)} cy={y(p.y!)} r={18} fill="transparent" />
              <line x1={x(p.x!) + 8} x2={x(p.x!) + 14} y1={y(p.y!)} y2={ly[i]} stroke="currentColor" strokeWidth={1} opacity={0.4} />
              <text x={x(p.x!) + 16} y={ly[i] + 4} className="scl2">{narrow ? CODE[p.code] : NAME[p.code]}{p.date && !narrow ? ` ${p.date}` : ""}</text>
            </g>); })}
        </svg>}
      </div>
    </CardFrame>
  );
}
