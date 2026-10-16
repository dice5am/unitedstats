"use client";
// Stacked mix (#9, Ember; Round 4c): one country at a time (single-select), six bands bottom to top darkest to lightest on the
// neutral one-colour scale: coal; gas; other fossil; nuclear; hydro; wind, solar, bioenergy and other renewables. 1px card gap
// between bands, 100% scale. Band = sum of its available fuels (n/a never 0). Stats box: six band rows with their Ember sources.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { PEERS, SHORT_CODE } from "@/lib/series.mjs";
import { mix, MIX_BANDS, bandParts } from "@/lib/waves.mjs";
import { chartTitle, srcTag } from "@/src/charts/meta";
import { CardFrame, YearPick, useParams, useWidth, type Init } from "./kit";

const NAME = Object.fromEntries(PEERS.map((c) => [c.code, c.short]));
const CODE: Record<string, string> = SHORT_CODE;
export default function MixArea({ ember, initial }: { ember: any } & Init) {
  // single-select (unchanged rule); the list grows to every country Ember covers, G20 roster order
  const ORDER = useMemo(() => PEERS.map((p) => p.code).filter((k) => ember.series[k]), [ember]);
  const [st, set] = useParams(initial, { em_c: ["CAN", ORDER] } as any) as unknown as [Record<string, string>, (k: string, v: string) => void];
  const c = st.em_c, m = useMemo(() => mix(ember, c), [ember, c]);
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const narrow = w > 0 && w < 560, H = narrow ? 300 : 400, pl = 44, pr = narrow ? 8 : 190, pt = 14, pb = 24, n = m.length;
  const x = (i: number) => pl + (i / (n - 1)) * (w - pl - pr), y = (v: number) => pt + (1 - v / 100) * (H - pt - pb);
  const last = m[n - 1], clean = last.bands.slice(3).reduce((a, b) => a + (b.value ?? 0), 0);
  const areas = MIX_BANDS.map((_, k) => { const lo = m.map((r) => r.bands.slice(0, k).reduce((a, b) => a + (b.value ?? 0), 0)), hi = lo.map((v, i) => v + (m[i].bands[k].value ?? 0));
    return `M${m.map((_, i) => `${x(i).toFixed(1)},${y(hi[i]).toFixed(1)}`).join("L")}L${m.map((_, i) => `${x(n - 1 - i).toFixed(1)},${y(lo[n - 1 - i]).toFixed(1)}`).join("L")}Z`; });
  const mids = MIX_BANDS.map((_, k) => { const lo = last.bands.slice(0, k).reduce((a, b) => a + (b.value ?? 0), 0); return { k, v: last.bands[k].value ?? 0, mid: y(lo + (last.bands[k].value ?? 0) / 2) }; });
  const pick = (cx: number) => { const r = svg.current!.getBoundingClientRect(); setHover(Math.max(0, Math.min(n - 1, Math.round(((cx - r.left - pl) / (w - pl - pr)) * (n - 1))))); };
  const h = hover === null ? null : m[hover];
  return (
    <CardFrame id="chart-9" eyebrow="Environment" title={chartTitle("9")} sub={<>Share of electricity from coal, gas, other fossil, nuclear, hydro, and wind, solar, bioenergy and other renewables, % · {NAME[c]} · {m[0].year}–{last.year}</>} tag={srcTag("9", last.year)}
      controls={<div className="bar solo"><YearPick label="Country" value={c} options={[...ORDER]} labels={NAME} onChange={(v) => { setHover(null); set("em_c", v); }} /></div>}
      headline={<div className="figs"><div className="fig"><div className="figl">Low-carbon share</div><div className="figc"><span><i style={{ background: `var(--${c})` }} />{NAME[c]}</span></div><div className="figv">{clean.toFixed(1)}%</div><div className="figp">{last.year} · nuclear, hydro, wind, solar, bioenergy, other renewables<span className="tagin"> · Ember</span></div></div>
        <div className="fig"><div className="figl">Fossil share</div><div className="figc"><span><i style={{ background: `var(--${c})` }} />{NAME[c]}</span></div><div className="figv">{(100 - clean).toFixed(1)}%</div><div className="figp">{last.year} · coal, gas, other fossil</div></div></div>}
      legend={<>{MIX_BANDS.map(([nm], k) => <li key={nm}><i className={`mxk m${k}`} />{nm}</li>)}{c === "GBR" && <li>UK other renewables: n/a for 2020–2025 (not 0)</li>}{(c === "CAN" || c === "JPN") && <li>No “other renewables” published for {NAME[c]} (not 0)</li>}</>}
      source="Source: Ember, Yearly Electricity Data (CC BY 4.0) · share of generation by fuel · one-chart exception to the international-sources rule"
      calc={<>
        <div className="grp"><h3>Measures</h3><dl><dt>Mix</dt><dd>Each fuel’s share of electricity generated, %. Already a share, so no per-capita toggle. Shares sum to 100%; rounded figures may differ by 0.1–0.2.</dd></dl></div>
        <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">Ember yearly electricity data · 9 fuels (aggregates never added)</dd><dt>Bands</dt><dd>{MIX_BANDS.map(([nm, fs]) => `${nm} = ${fs.join(" + ")}`).join("; ")}.</dd></dl></div>
        <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Band</span><code>sum of its published fuels; n/a never counted as 0</code></div>
          <p className="ex">{NAME[c]}, {last.year}: <b>{last.bands.map((b) => `${b.name.split(",")[0]} ${b.value === null ? "n/a" : b.value.toFixed(1)}`).join(" · ")}</b></p></div></div>
        <div className="grp"><h3>Source</h3><p>Ember is a think tank; this chart is an approved one-off exception to using official international sources.</p></div>
        <div className="grp"><h3>Rules</h3><ul className="rules"><li><span className="ic">n/a</span>A fuel not published is left out of its band, never 0</li></ul></div>
      </>}>
      <div className="mixa" ref={ref} onPointerDown={() => setHover(null)} onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}>
        {h && !narrow && <MixBox key="f" h={h} c={c} onClose={() => setHover(null)} float={{ x: x(hover!), W: w }} />}
        {w > 0 && <svg ref={svg} width={w} height={H} role="img" style={{ touchAction: "pan-y" }} aria-label={`${NAME[c]} electricity mix ${last.year}: ${last.bands.map((b) => `${b.name} ${b.value === null ? "n/a" : b.value.toFixed(1) + "%"}`).join(", ")}`}
          onPointerDown={(e) => { e.stopPropagation(); pick(e.clientX); }} onPointerMove={(e) => (e.pointerType === "mouse" || e.buttons) && pick(e.clientX)}>
          {areas.map((d, k) => <path key={k} d={d} className={`mx m${k}`} />)}
          {[0, 25, 50, 75, 100].map((t) => <g key={t}><line x1={pl} x2={w - pr} y1={y(t)} y2={y(t)} className="gl" /><text x={pl - 6} y={y(t) + 4} className="ax" textAnchor="end">{t}%</text></g>)}
          {[0, n - 1, ...m.map((r, i) => (+r.year % 5 === 0 && i > 1 && i < n - 2 ? i : -1)).filter((i) => i > 0)].map((i) => <text key={i} x={x(i)} y={H - 6} className="ax" textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>{m[i].year}</text>)}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pt} y2={H - pb} className="bxh" />}
          {!narrow && (() => { const ys: number[] = []; return mids.filter((q) => q.v >= 0.5).map((q) => { let yy = q.mid; for (const p of ys) if (Math.abs(yy - p) < 14) yy = p - 14; ys.push(yy); return <text key={q.k} x={w - pr + 8} y={yy + 4} className="mxl">{MIX_BANDS[q.k][0].replace(", bioenergy and other renewables", ", bio, other")} {q.v.toFixed(1)}%</text>; }); })()}
        </svg>}
        {h && narrow && <MixBox key="d" h={h} c={c} onClose={() => setHover(null)} />}
      </div>
    </CardFrame>
  );
}

// #9 stats box: six band rows in the chart's stack order (top band first, as drawn), each with its band swatch, value and
// the Ember source categories that make it up (no rounding line; that sits in How it's calculated). 390: docked inside the card under the plot.
// >=768: floats beside the guide (right of it, flipped left past the middle) and is clamped inside the viewport.
function MixBox({ h, c, onClose, float }: { h: { year: string; bands: { name: string; value: number | null }[]; fuels: { name: string; value: number | null }[] }; c: string; onClose: () => void; float?: { x: number; W: number } }) {
  const ref = useRef<HTMLDivElement>(null), [dy, setDy] = useState(0);
  // 390 docked: bring the box into view on tap (smooth unless the user prefers reduced motion)
  useEffect(() => { if (float || !ref.current) return; ref.current.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }, [h.year, c]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [onClose]);
  // clamp inside the viewport: measured once per position (untransformed top), so it can never loop
  useLayoutEffect(() => { if (!float || !ref.current) return; const el = ref.current; el.style.transform = "none"; const r = el.getBoundingClientRect(), pad = 8;
    const want = r.height > innerHeight - 2 * pad ? pad - r.top : r.bottom > innerHeight - pad ? innerHeight - pad - r.bottom : r.top < pad ? pad - r.top : 0;
    el.style.transform = `translateY(${Math.round(want)}px)`; setDy(Math.round(want)); }, [float?.x, float?.W, h.year]); // eslint-disable-line react-hooks/exhaustive-deps
  const bw = float ? Math.min(280, float.W - 24) : undefined;
  const style = float ? { position: "absolute" as const, top: 8, width: bw, transform: `translateY(${dy}px)`, ...(float.x < float.W / 2 ? { left: Math.min(float.x + 24, float.W - bw!), right: "auto" } : { right: Math.min(float.W - float.x + 24, float.W - bw!), left: "auto" }) } : undefined;
  const rows = MIX_BANDS.map(([name], k) => ({ k, name: name as string, sub: bandParts(h, k), v: h.bands[k].value })).reverse();
  return (
    <div ref={ref} className={`tip statbox mixbox ${float ? "float" : "dock"}`} role="status" data-testid="mixbox" style={style} onPointerDown={(e) => e.stopPropagation()}>
      <div className="tiph"><span className="mo">{NAME[c]} · {h.year} · % of electricity</span><button type="button" className="tipx" aria-label="Close" onClick={onClose}>✕</button></div>
      {rows.map((r) => <div key={r.k} className="tipr mxrow" data-band={r.k}><i className={`mxk m${r.k}`} /><span className="nm">{r.name}</span><b>{r.v === null ? "n/a" : `${r.v.toFixed(1)}%`}</b>{r.sub && <span className="tipnote">{r.sub.split(" · ").map((t, i) => <span key={t} className="mxsrc">{i ? " · " : ""}<span>{t}</span></span>)}</span>}</div>)}
    </div>
  );
}
