"use client";
// #22 Jobs recovery scorecard — ranked diverging bars: employment rate 15–64, latest shared quarter − Q4 2019.
import { useMemo, useState } from "react";
import { COUNTRIES, qLabel } from "@/lib/series.mjs";
import { scorecard } from "@/lib/charts.mjs";
import { chartTitle, srcTag } from "@/src/charts/meta";
import { DIFFERENCE_NOTES } from "@/lib/differenceNotes.mjs";
import { CardFrame, StatBox } from "./kit";

const NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.short]));
const pts = (v: number) => `${v >= 0.005 ? "+" : v <= -0.005 ? "−" : ""}${Math.abs(v).toFixed(2)}`;

export default function Scorecard({ rate }: { rate: unknown }) {
  const s = useMemo(() => scorecard(rate), [rate]);
  const [sel, setSel] = useState<string | null>(null);
  const vals = s.rows.map((r) => r.change).filter((v): v is number => v !== null);
  const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals), span = hi - lo || 1;
  const z = (-lo / span) * 100;
  const best = s.rows[0], worst = s.rows[s.rows.length - 1];
  const r = sel ? s.rows.find((x) => x.code === sel)! : null;
  const ca = s.rows.find((x) => x.code === "CAN")!;
  return (
    <CardFrame id="chart-22" eyebrow="Labour" title={chartTitle("22")}
      sub={<>Employment rate, ages 15–64 · change since Q4 2019, in points · to {qLabel(s.end)}, the latest quarter all seven share</>}
      tag={srcTag("22", qLabel(s.end))}
      headline={
        <div className="figs">
          <div className="fig"><div className="figl">Biggest gain</div><div className="figc"><span><i style={{ background: `var(--${best.code})` }} />{NAME[best.code]}</span></div><div className="figv">{pts(best.change!)}<span>pts</span></div><div className="figp">{qLabel(s.base)} → {qLabel(s.end)}</div></div>
          <div className="fig"><div className="figl">{worst.change! < 0 ? "Still below" : "Smallest gain"}</div><div className="figc"><span><i style={{ background: `var(--${worst.code})` }} />{NAME[worst.code]}</span></div><div className="figv">{pts(worst.change!)}<span>pts</span></div><div className="figp">{qLabel(s.base)} → {qLabel(s.end)}</div></div>
        </div>}
      legend={s.rows.some((x) => x.est) ? <li><span className="estk">est.</span>Germany’s quarters are published as estimates</li> : null}
      source="Source: OECD · employment rate 15–64, quarterly, SA"
      calc={<>
        <div className="grp"><h3>Measures</h3><dl><dt>Rate</dt><dd>Employed ÷ population, ages 15–64. Already adjusted for population, so no per-capita view.</dd></dl></div>
        <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">OECD DF_IALFS_INDIC · EMP_WAP</dd><dt>Frequency</dt><dd>Quarterly, all seven (monthly countries use their published quarters)</dd></dl></div>
        <div className="grp"><h3>Window</h3><dl><dt>Start – end</dt><dd className="strong">{qLabel(s.base)} → {qLabel(s.end)}</dd><dt>Ends</dt><dd>{qLabel(s.end)}, the latest quarter all seven share.</dd></dl></div>
        <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Change</span><code>change = rate(end) − rate(Q4 2019), in points</code></div>
          {ca.change !== null && <p className="ex">Canada: <b>{ca.end!.toFixed(2)}% − {ca.start!.toFixed(2)}% = {pts(ca.change)} pts</b></p>}</div></div>
        <div className="grp"><h3>Source differences</h3><p className="diffnote">{DIFFERENCE_NOTES["22"]}</p></div>
        <div className="grp"><h3>Rules</h3><ul className="rules"><li><span className="ic">n/a</span>Gaps (n/a) are never filled</li><li><span className="ic">E</span>Estimated quarters are marked est.</li></ul></div>
      </>}>
      <div className="sc" onPointerDown={() => setSel(null)}>
        {r && <StatBox title={`${NAME[r.code]} · employment rate 15–64`} onClose={() => setSel(null)} rows={[
          { code: r.code, name: qLabel(s.base), value: r.start === null ? "n/a" : `${r.start.toFixed(2)}%` },
          { code: r.code, name: `${qLabel(s.end)} · shared end`, value: r.end === null ? "n/a" : `${r.end.toFixed(2)}% (${pts(r.change!)} pts)`, note: r.est ? "est." : undefined },
          ...(r.own.period !== s.end ? [{ code: r.code, name: `${qLabel(r.own.period)} · own latest`, value: r.own.value === null ? "n/a" : `${r.own.value.toFixed(2)}% (${pts(r.own.change!)} pts)`, note: r.own.est ? "est." : undefined }] : []),
        ]} />}
        <ol className="scl">
          {s.rows.map((x) => {
            const v = x.change, w = v === null ? 0 : (Math.abs(v) / span) * 100, l = v === null ? z : v >= 0 ? z : z - w;
            return (
              <li key={x.code}>
                <button type="button" className={`scr${sel === x.code ? " on" : ""}`} onPointerDown={(e) => e.stopPropagation()} onClick={() => setSel(sel === x.code ? null : x.code)} aria-label={`${NAME[x.code]}: ${v === null ? "n/a" : `${pts(v)} points`}`}>
                  <span className="scn"><i style={{ background: `var(--${x.code})` }} />{NAME[x.code]}</span>
                  <span className="sct"><span className="scz" style={{ left: `${z}%` }} />
                    {v === null ? <span className="na">n/a</span> : <span className="scb" style={{ left: `${l}%`, width: `${Math.max(w, 0.6)}%`, background: `var(--${x.code})` }} />}</span>
                  <span className="scv">{v === null ? "n/a" : pts(v)}{x.est && <em>est.</em>}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="scaxis"><span>{lo < 0 ? `${pts(lo)} pts` : ""}</span><span style={{ left: `${z}%` }} className="z0">0</span><span>{pts(hi)} pts</span></p>
      </div>
    </CardFrame>
  );
}
