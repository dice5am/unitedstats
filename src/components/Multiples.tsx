"use client";
// Small multiples over time (DESIGN-SYSTEM Round 4): 2 columns at 390, 4 at ≥1024; shared y-scale (said in the subtitle);
// Canada's panel first (Design: no outline, all countries treated equally); panel titles in the country colour. Generic:
//   kind "area": 2px line + soft area, optional reference quarter marked as a level line (#20 household credit, 2007-Q4)
//   kind "bars": diverging bars around zero, one per quarter (#19 current account)
// Late starters draw from their own first reading with "from YYYY" in the panel title. Gaps stay gaps.
import { useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { qLabel, PEERS } from "@/lib/series.mjs";
import { multiples, winFromQ, lastNN } from "@/lib/finance.mjs";
import { chartTitle, srcTag, type ChartId } from "@/src/charts/meta";
import { CardFrame, Seg, StatBox, useParams, useWidth, useFitH } from "./kit";
import { useSelNames } from "./Sel";

const NAME = Object.fromEntries(PEERS.map((c) => [c.code, c.short]));
const WIN = ["1", "5", "10", "20", "50"] as const;
const qi = (p: string) => { const [y, q] = p.split("-Q").map(Number); return y * 4 + q - 1; };
export type MultiplesSpec = {
  id: ChartId; eyebrow: string; kind: "area" | "bars"; param: string; defWin: (typeof WIN)[number]; ref?: string;
  sub: (from: string, to: string) => ReactNode; source: string; unitLabel: string; fmt: (v: number) => string;
  calc: (m: ReturnType<typeof multiples>) => ReactNode; statusNote?: Record<string, string>;
};

export default function Multiples({ file, spec, initial }: { file: any; spec: MultiplesSpec; initial: MutableRefObject<string | null> }) {
  const NM = useSelNames(NAME);
  const [st, set] = useParams(initial, { [spec.param]: [spec.defWin, WIN] } as any) as unknown as [Record<string, string>, (k: string, v: string) => void];
  const years = Number(st[spec.param]);
  const end = useMemo(() => Object.values(file.series as Record<string, any>).map((s) => s.periods[lastNN(s)]).sort().pop() as string, [file]);
  const m = useMemo(() => multiples(file, winFromQ(end, years), spec.ref ?? null), [file, end, years, spec.ref]);
  const [wrap, w] = useWidth<HTMLDivElement>();
  const phNow = useRef(0), fitT = useFitH(wrap, phNow, 24);
  const [cur, setCur] = useState<{ code: string; i: number } | null>(null);
  // Design rule 2026-10-16: columns 2 at phone, 3 at 1366, 4 at 1440+; never squeeze: min panel height 96 (phone) / 120 (desktop);
  // fit-to-viewport only up to 8 panels, otherwise the card grows and the page scrolls.
  const vw = w && typeof window !== "undefined" ? innerWidth : 0, minPh = vw >= 1024 ? 120 : 96;
  const cols = vw >= 1440 ? 4 : vw >= 1024 ? 3 : 2, gap = 12, pw = w ? Math.floor((w - gap * (cols - 1)) / cols) - 22 : 0, rows = Math.ceil(m.panels.length / cols), ph = Math.max(minPh, fitT && m.panels.length <= 8 ? Math.floor(fitT / rows) : cols >= 3 ? 150 : 120);
  phNow.current = pw > 0 ? rows * ph : 0; // only claim height for panels actually drawn (grid width 0 = nothing drawn, nothing to fit)
  const pl = 6, pr = 6, pt = 16, pb = 18, iw = pw - pl - pr, ih = ph - pt - pb;
  const q0 = qi(m.from), q1 = qi(m.toX ?? m.to), n = q1 - q0 + 1;
  // round ticks with light gridlines (Round 4c): domain snaps to whole steps, never raw extents
  const step = [1, 2, 2.5, 5, 10, 20, 25, 50].find((st) => (m.max - m.min) / st <= 5) ?? 100;
  const lo = Math.floor(m.min / step) * step, hi = Math.ceil(m.max / step) * step;
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => +(lo + i * step).toFixed(2));
  const tf = (v: number) => `${v > 0 && lo < 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)}%`;
  const x = (p: string) => pl + ((qi(p) - q0 + 0.5) / n) * iw, y = (v: number) => pt + ((hi - v) / (hi - lo || 1)) * ih;
  const refIn = spec.ref && qi(spec.ref) >= q0;
  // Design 2026-10-16: the second-source tag sits on its own line under the value; when any panel has one, every header
  // takes the same fixed height so the grid stays aligned
  const anyTag = m.panels.some((p) => p.head.freq === "annual");
  const sel = cur ? m.panels.find((p) => p.code === cur.code)! : null, sp: any = sel ? [...sel.points, ...sel.ext][cur!.i] : null;
  const xa = (y: string) => pl + ((+y * 4 + 2 - q0) / n) * iw; // annual point: mid-year

  return (
    <CardFrame id={`chart-${spec.id}`} eyebrow={spec.eyebrow} title={chartTitle(spec.id)} sub={spec.sub(m.from, m.to)}
      tag={srcTag(spec.id, qLabel(m.to))}
      controls={<div className="bar solo"><Seg label="Timeframe" value={String(years)} options={WIN.map((v) => [v, `${v}Y`])} onChange={(v) => { setCur(null); set(spec.param, v); }} /></div>}
      legend={<>
        {spec.kind === "area" && refIn && <li><i className="refl" />{qLabel(spec.ref!)} level</li>}
        {m.panels.some((p) => p.late) && <li><i className="late" />Starts later: {m.panels.filter((p) => p.late).map((p) => `${NM[p.code]} from ${p.late!.slice(0, 4)}`).join(", ")}</li>}
        <li>Same scale in all panels: {tf(lo)} to {tf(hi)}, gridlines every {step}%</li>
      </>}
      source={spec.source} calc={spec.calc(m)}>
      <div className="smgrid fm" ref={wrap} onPointerDown={() => setCur(null)} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap }}>
        {sp && sel && <StatBox title={`${NM[sel.code]} · ${sp.freq === "annual" ? sp.period : qLabel(sp.period)}`} onClose={() => setCur(null)} rows={[
          { code: sel.code, name: spec.unitLabel, value: sp.value === null ? "n/a" : spec.fmt(sp.value), note: sp.freq === "annual" ? `annual · ${sp.src}` : (sp.status && spec.statusNote?.[sp.status]) || undefined },
          ...(sel.ref && sel.ref.value !== null && refIn ? [{ code: sel.code, name: qLabel(sel.ref.period), value: spec.fmt(sel.ref.value) }] : []),
        ]} />}
        {pw > 0 && m.panels.map((p, i) => {
          const segs: string[] = []; let cur0 = "";
          for (const pt0 of p.points) { if (pt0.value === null) { if (cur0) segs.push(cur0); cur0 = ""; continue; } cur0 += `${cur0 ? "L" : "M"}${x(pt0.period).toFixed(1)},${y(pt0.value).toFixed(1)}`; }
          if (cur0) segs.push(cur0);
          const bw = Math.max(1, iw / n - (n > 60 ? 0.5 : 1.5));
          const pick = (e: React.PointerEvent<SVGSVGElement>) => { const r = e.currentTarget.getBoundingClientRect(); const qq = Math.round(((e.clientX - r.left - pl) / iw) * n - 0.5) + q0; const i = p.points.length ? qq - qi(p.points[0].period) : -1; if (i >= 0 && i < p.points.length) return setCur({ code: p.code, i }); const k = p.ext.findIndex((e) => Math.floor(qq / 4) === +e.period); if (k >= 0) setCur({ code: p.code, i: p.points.length + k }); };
          return (
            <figure key={p.code} className="smp">
              <figcaption className={anyTag ? "tagged" : undefined} style={{ color: `var(--${p.code})` }}><span>{NM[p.code]}{p.late && <span className="from"> · from {p.late.slice(0, 4)}</span>}</span><span className="hv"><b>{p.head.value === null ? "n/a" : spec.fmt(p.head.value)}</b>{p.head.freq === "annual" && <span className="from srct" data-head-src={p.head.src}>{p.head.src} {p.head.period}</span>}</span></figcaption>
              <svg width={pw} height={ph} role="img" aria-label={`${NM[p.code]}: ${spec.unitLabel} ${p.points.length ? qLabel(p.points[0].period) : p.ext.length ? p.ext[0].period : m.from} to ${p.head.freq === "annual" ? p.head.period : qLabel(p.head.period)}, latest ${p.head.value === null ? "n/a" : spec.fmt(p.head.value)}${p.head.src ? ` (${p.head.src})` : ""}`}
                onPointerDown={(e) => { e.stopPropagation(); pick(e); }} onPointerMove={(e) => e.pointerType === "mouse" && pick(e)} style={{ touchAction: "pan-y" }}>
                {ticks.map((t) => <g key={t}><line x1={pl} x2={pw - pr} y1={y(t)} y2={y(t)} className={t === 0 ? "zl" : "gl"} />{(i % cols === 0) && (t === lo || t === hi || t === 0) && <text x={pl + 2} y={y(t) - 3} className="ax fmt">{tf(t)}</text>}</g>)}
                {spec.kind === "area" ? <>
                  {segs.map((d, i) => { const pts = d.slice(1).split("L"); const [fx] = pts[0].split(","), [lx] = pts[pts.length - 1].split(",");
                    return <path key={`a${i}`} d={`${d}L${lx},${y(Math.max(0, m.min))}L${fx},${y(Math.max(0, m.min))}Z`} fill={`var(--${p.code})`} opacity={0.14} />; })}
                  {segs.map((d, i) => <path key={i} d={d} fill="none" stroke={`var(--${p.code})`} strokeWidth={2} strokeLinejoin="round" />)}
                  {refIn && p.ref && p.ref.value !== null && <g className="refg"><line x1={x(spec.ref!)} x2={pw - pr} y1={y(p.ref.value)} y2={y(p.ref.value)} className="refl" /><circle cx={x(spec.ref!)} cy={y(p.ref.value)} r={2.5} className="refd" /></g>}
                  {p.points.length > 0 && p.last.value !== null && qi(p.last.period) >= q0 && <circle cx={x(p.last.period)} cy={y(p.last.value)} r={3} fill={`var(--${p.code})`} />}
                </> : p.points.map((pt0) => pt0.value === null ? null : (
                  <rect key={pt0.period} x={x(pt0.period) - bw / 2} width={bw} y={Math.min(y(0), y(pt0.value))} height={Math.max(0.5, Math.abs(y(pt0.value) - y(0)))} fill={`var(--${p.code})`} opacity={pt0.value < 0 ? 0.55 : 1} />))}
                {p.ext.length > 0 && <g className="ext" data-freq="annual" data-src={p.ext[0].src}><path d={((p.last.value !== null && qi(p.last.period) >= q0) ? `M${x(p.last.period).toFixed(1)},${y(p.last.value).toFixed(1)}` : "") + p.ext.map((e, k) => `${k || (p.last.value !== null && qi(p.last.period) >= q0) ? "L" : "M"}${xa(e.period).toFixed(1)},${y(e.value!).toFixed(1)}`).join("")} fill="none" stroke={`var(--${p.code})`} strokeWidth={1.5} />{p.ext.map((e) => <circle key={e.period} cx={xa(e.period)} cy={y(e.value!)} r={2.75} fill={`var(--${p.code})`} />)}</g>}
                {/* splice rule: a thin vertical rule (grey 40%) inside this country's panel only, between the last reading before the
                    splice and the first after it; only when the splice falls inside the window */}
                {((file.g20_splice?.[p.code] ?? []) as { froms: string[]; label: string }[]).map((sp) => { const f0 = sp.froms[0]; const qq = /Q/.test(f0) ? qi(f0) : +f0 * 4;
                  if (qq <= q0 || qq > q1) return null; const sx = pl + ((qq - q0) / n) * iw;
                  return <line key={sp.label} className="splr" data-code={p.code} data-from={f0} x1={sx} x2={sx} y1={pt} y2={pt + ih}><title>{sp.label}</title></line>; })}
                {p.late && p.points.length > 0 && <circle cx={x(p.points[0].period)} cy={y(p.points.find((q) => q.value !== null)?.value ?? 0)} r={3} fill="var(--card-solid)" stroke={`var(--${p.code})`} strokeWidth={1.5} />}
                {cur && cur.code === p.code && sp && <line x1={sp.freq === "annual" ? xa(sp.period) : x(sp.period)} x2={sp.freq === "annual" ? xa(sp.period) : x(sp.period)} y1={pt} y2={pt + ih} className="xh" />}
                <text x={pl} y={ph - 4} className="ax">{m.from.slice(0, 4)}</text><text x={pw - pr} y={ph - 4} className="ax" textAnchor="end">{(m.toX ?? m.to).slice(0, 4)}</text>
              </svg>
            </figure>
          );
        })}
      </div>
    </CardFrame>
  );
}
