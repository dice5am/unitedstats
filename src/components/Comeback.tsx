"use client";
// #1 The comeback race — small multiples, real GDP per person (or total) indexed to 2019-Q4 = 100.
import { useMemo, useState, type MutableRefObject } from "react";
import { monotonePath, qLabel, PEERS } from "@/lib/series.mjs";
import { comeback, qi } from "@/lib/charts.mjs";
import { chartTitle, srcTag } from "@/src/charts/meta";
import { CardFrame, Seg, StatBox, useParams, useWidth, TagIn } from "./kit";

const NAME = Object.fromEntries(PEERS.map((c) => [c.code, c.short]));
const pct = (v: number) => `${v - 100 >= 0.005 ? "+" : v - 100 <= -0.005 ? "−" : ""}${Math.abs(v - 100).toFixed(1)}%`;

function Panel({ p, lo, hi, first, onOpen }: { p: ReturnType<typeof comeback>["panels"][number]; lo: number; hi: number; first: boolean; onOpen: () => void }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hv, setHv] = useState<number | null>(null);
  const H = 96, pt = 6, pb = 6;
  const n = p.points.length, x = (i: number) => 1 + (i / (n - 1)) * (w - 2 - 4), y = (v: number) => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
  const d = w ? monotonePath(p.points.map((q, i) => ({ x: x(i), y: q.value === null ? null : y(q.value) }))) : "";
  const li = p.points.map((q) => q.value !== null).lastIndexOf(true);
  const bi = p.back ? p.points.findIndex((q) => q.period === p.back) : -1;
  const cur = hv !== null ? p.points[hv] : p.points[li];
  const pick = (cx: number) => { const i = Math.max(0, Math.min(n - 1, Math.round(((cx - 1) / (w - 6)) * (n - 1)))); setHv(i); };
  return (
    <figure className={`smp${first ? " lead" : ""}`} style={{ ["--c" as string]: `var(--${p.code})` }}>
      <figcaption>
        <span className="smt">{NAME[p.code]}</span>
        <span className="smv">{cur && cur.value !== null ? <>{cur.value.toFixed(1)}<em>{hv !== null ? qLabel(cur.period) : "now"}</em></> : <>n/a<em>{cur ? qLabel(cur.period) : ""}</em></>}</span>
      </figcaption>
      <div ref={ref} className="smplot" onPointerMove={(e) => pick(e.clientX - e.currentTarget.getBoundingClientRect().left)} onPointerLeave={(e) => e.pointerType === "mouse" && setHv(null)}
        onPointerDown={(e) => { e.stopPropagation(); pick(e.clientX - e.currentTarget.getBoundingClientRect().left); onOpen(); }}>
        {w > 0 && (
          <svg width={w} height={H} role="img" aria-label={`${NAME[p.code]}: ${p.back ? `back to 100 in ${qLabel(p.back)}` : "not yet back to 100"}, now ${p.last === null ? "n/a" : p.last.toFixed(1)}`}>
            <line x1={0} x2={w} y1={y(100)} y2={y(100)} className="ref100" />
            {bi >= 0 && <line x1={x(bi)} x2={x(bi)} y1={pt} y2={H - pb} className="backrule" />}
            <path d={d} fill="none" stroke="var(--c)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {li >= 0 && <circle cx={x(li)} cy={y(p.points[li].value!)} r={3} fill="var(--c)" />}
            {hv !== null && p.points[hv].value !== null && <><line x1={x(hv)} x2={x(hv)} y1={pt} y2={H - pb} className="xh" /><circle cx={x(hv)} cy={y(p.points[hv].value!)} r={3.5} fill="var(--c)" stroke="var(--card-solid)" strokeWidth={1.5} /></>}
          </svg>
        )}
      </div>
      <button type="button" className="smbtn" onClick={onOpen} aria-label={`${NAME[p.code]} details`}>Details</button>
      <p className={`back${p.back ? "" : " not"}`}>{p.back ? <>Back to 100 · <b>{qLabel(p.back)}</b></> : <>Not yet back to 100</>}</p>
    </figure>
  );
}

export default function Comeback({ econ, initial }: { econ: unknown; initial: MutableRefObject<string | null> }) {
  const [st, set] = useParams(initial, { cr_view: ["gdp", ["gdp", "pc"] as const] });
  const view = st.cr_view as "pc" | "gdp";
  const c = useMemo(() => comeback(econ, view), [econ, view]);
  const lo = Math.floor(Math.min(c.min, 100) - 1), hi = Math.ceil(Math.max(c.max, 100) + 1);
  const backs = c.panels.filter((p) => p.back);
  const firstQ = backs.length ? Math.min(...backs.map((p) => qi(p.back!))) : null;
  const first = backs.filter((p) => qi(p.back!) === firstQ);
  const notBack = c.panels.filter((p) => !p.back);
  const top = c.panels.filter((p) => p.last !== null).sort((a, b) => b.last! - a.last!)[0];
  const ex = c.panels.find((p: any) => p.code === "CAN") ?? c.panels[0], exEnd = ex.points[ex.points.length - 1];
  const [open, setOpen] = useState<string | null>(null);
  const op = open ? c.panels.find((p) => p.code === open)! : null;
  return (
    <CardFrame id="chart-1" eyebrow="Economy" title={chartTitle("1", view)}
      sub={<>{view === "pc" ? "Real GDP per person" : "Real GDP, total"} · Q4 2019 = 100 · same scale in all panels · to {qLabel(c.end)}, the latest quarter all seven share</>}
      controls={<Seg className="vseg" label="Measure" value={view} options={[["gdp", "Total GDP"], ["pc", "Per person"]]} onChange={(v) => set("cr_view", v)} />}
      tag={srcTag("1", qLabel(c.end))}
      headline={
        <div className="figs">
          <div className="fig"><div className="figl">First back to 100</div><div className="figc">{first.map((p) => <span key={p.code}><i style={{ background: `var(--${p.code})` }} />{NAME[p.code]}</span>)}</div>
            <div className="figv sm">{firstQ !== null ? qLabel(first[0].back!) : "n/a"}</div><div className="figp">{notBack.length ? `Not yet back: ${notBack.map((p) => NAME[p.code]).join(", ")}` : "All seven are back"}</div></div>
          <div className="fig"><div className="figl">Highest now</div><div className="figc"><span><i style={{ background: `var(--${top.code})` }} />{NAME[top.code]}</span></div>
            <div className="figv">{pct(top.last!)}</div><div className="figp">{qLabel(c.end)}<TagIn tag={srcTag("1", qLabel(c.end))} /></div></div>
        </div>}
      source={`Source: OECD quarterly national accounts · real GDP${view === "pc" ? " ÷ population" : ""}, SA`}
      calc={<>
        <div className="grp"><h3>Measures</h3><dl>
          <dt>{view === "pc" ? "Per person" : "Total"}</dt><dd>{view === "pc" ? "Real GDP ÷ population (OECD). Already per person." : "Real GDP, chain-linked volume. Not per person: a country can grow by adding people."}</dd>
          <dt>Index</dt><dd>Each country’s own Q4 2019 = 100. Compares recoveries, not levels.</dd>
        </dl></div>
        <div className="grp"><h3>Formulas</h3><div className="fx">
          <div className="code"><span>Index</span><code>index = value ÷ value(Q4 2019) × 100</code></div>
          <div className="code"><span>Back to 100</span><code>first quarter after Q1 2020 with index ≥ 100</code></div>
          {exEnd.value !== null && <p className="ex">{NAME[ex.code] ?? ex.code}, {qLabel(exEnd.period)}: <b>index {exEnd.value.toFixed(2)}</b>{ex.back ? <> · first back in <b>{qLabel(ex.back)}</b></> : null}</p>}
        </div></div>
        <div className="grp"><h3>Window</h3><dl><dt>Start – end</dt><dd className="strong">Q1 2019 – {qLabel(c.end)} · quarterly</dd>
          <dt>Ends</dt><dd>{view === "pc" ? "Q1 2026, the latest quarter all seven share (France’s population stops there)." : "Q2 2026, the latest quarter all seven share."}</dd></dl></div>
        <div className="grp"><h3>Rules</h3><ul className="rules">
          <li><span className="ic">n/a</span>Gaps (n/a) are never filled</li>
          <li><span className="ic">P</span>Latest quarters may be provisional</li>
          <li><span className="ic">=</span>Shared y-scale across all seven panels</li>
        </ul></div>
      </>}>
      <div className="smwrap" onPointerDown={() => setOpen(null)}>
        {op && <StatBox title={`${NAME[op.code]} · index, Q4 2019 = 100`} onClose={() => setOpen(null)} rows={[
          { code: op.code, name: `${qLabel(c.end)} · shared end`, value: op.last === null ? "n/a" : op.last.toFixed(1) },
          ...(op.own.period !== c.end ? [{ code: op.code, name: `${qLabel(op.own.period)} · own latest`, value: op.own.value === null ? "n/a" : op.own.value.toFixed(1) }] : []),
          { code: op.code, name: "Back to 100", value: op.back ? qLabel(op.back) : "not yet" },
        ]} />}
        <div className="smgrid">{c.panels.map((p, i) => <Panel key={p.code} p={p} lo={lo} hi={hi} first={i === 0} onOpen={() => setOpen(p.code)} />)}</div>
      </div>
      <p className="smaxis"><span>{qLabel("2019-Q1")}</span><span>Dashed line = 100 (Q4 2019) · scale {lo}–{hi}</span><span>{qLabel(c.end)}</span></p>
    </CardFrame>
  );
}
