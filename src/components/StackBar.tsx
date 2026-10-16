"use client";
// Stacked ranked bar (DESIGN-SYSTEM Round 4): components on the neutral one-hue ramp (never country colours), totals labelled.
// #21 How open is each economy: exports + imports, % of GDP, one year at a time. Default 2024, so the default never mixes years;
// a year a country hasn't published shows n/a with its own latest year tagged ("2024 latest").
import { useMemo, useState, type MutableRefObject } from "react";
import { PEERS } from "@/lib/series.mjs";
import { openness, OPEN_YEARS, OPEN_DEFAULT } from "@/lib/finance.mjs";
import { chartTitle, srcTag } from "@/src/charts/meta";
import { CardFrame, Seg, StatBox, useParams, TagIn, anchorOf } from "./kit";

const NAME = Object.fromEntries(PEERS.map((c) => [c.code, c.short]));
const f1 = (v: number) => `${v.toFixed(1)}%`;

export default function StackBar({ exp, imp, initial }: { exp: any; imp: any; initial: MutableRefObject<string | null> }) {
  const [st, set] = useParams(initial, { tr_year: [OPEN_DEFAULT, OPEN_YEARS] } as any) as unknown as [Record<string, string>, (k: string, v: string) => void];
  const o = useMemo(() => openness(exp, imp, st.tr_year), [exp, imp, st.tr_year]);
  const [sel, setSel] = useState<string | null>(null);
  const [at, setAt] = useState<{ y: number; h: number; H: number } | undefined>();
  const ok = o.rows.filter((r) => r.total !== null), max = Math.max(...ok.map((r) => r.total!));
  const top = ok[0], bot = ok[ok.length - 1], r = sel ? o.rows.find((x) => x.code === sel)! : null;
  const na = o.rows.filter((x) => x.total === null);
  return (
    <CardFrame id="chart-21" eyebrow="Finance" title={chartTitle("21")}
      sub={<>Exports + imports of goods and services, % of GDP · {o.year} · ranked by total</>}
      tag={srcTag("21", o.year)}
      controls={<div className="bar solo"><Seg label="Year" value={o.year} options={OPEN_YEARS.map((v) => [v, v])} onChange={(v) => { setSel(null); set("tr_year", v); }} /></div>}
      headline={top && bot ? <div className="figs">
        <div className="fig"><div className="figl">Most open</div><div className="figc"><span><i style={{ background: `var(--${top.code})` }} />{NAME[top.code]}</span></div><div className="figv">{f1(top.total!)}</div><div className="figp">of GDP · {o.year}<TagIn tag={srcTag("21", o.year)} /></div></div>
        <div className="fig"><div className="figl">Least open</div><div className="figc"><span><i style={{ background: `var(--${bot.code})` }} />{NAME[bot.code]}</span></div><div className="figv">{f1(bot.total!)}</div><div className="figp">of GDP · {o.year}</div></div>
      </div> : undefined}
      legend={<>
        <li><i className="stk s0" />Exports</li><li><i className="stk s1" />Imports</li>
        {na.length > 0 && <li>n/a: {na.map((x) => `${NAME[x.code]} (${x.latestYear} latest)`).join(", ")}</li>}
      </>}
      source="Source: World Bank WDI · exports (NE.EXP.GNFS.ZS) and imports (NE.IMP.GNFS.ZS) of goods and services, % of GDP"
      calc={<>
        <div className="grp"><h3>Measures</h3><dl><dt>Openness</dt><dd>Exports + imports of goods and services, each as % of GDP. Already a share of GDP, so no per-capita view.</dd></dl></div>
        <div className="grp"><h3>Inputs</h3><dl><dt>Dataset</dt><dd className="mono">World Bank WDI · NE.EXP.GNFS.ZS + NE.IMP.GNFS.ZS</dd><dt>Frequency</dt><dd>Yearly. Canada, Germany, France, UK and Italy to 2025; the US and Japan to 2024.</dd></dl></div>
        <div className="grp"><h3>Window</h3><dl><dt>Year</dt><dd className="strong">{o.year}</dd><dt>Default</dt><dd>2024, the latest year all seven share, so the default never mixes years.</dd></dl></div>
        <div className="grp"><h3>Formulas</h3><div className="fx"><div className="code"><span>Total</span><code>exports % GDP + imports % GDP</code></div>
          {(() => { const c = o.rows.find((x) => x.code === "CAN"); return c && c.total !== null && <p className="ex">Canada, {o.year}: <b>{c.exports!.toFixed(1)} + {c.imports!.toFixed(1)} = {c.total.toFixed(1)}% of GDP</b></p>; })()}</div></div>
        <div className="grp"><h3>Rules</h3><ul className="rules"><li><span className="ic">n/a</span>A year a country hasn’t published is n/a, tagged with its latest year; never filled</li></ul></div>
      </>}>
      <div className="sc stb" onPointerDown={() => setSel(null)}>
        {r && <StatBox title={`${NAME[r.code]} · ${o.year}`} onClose={() => setSel(null)} at={at} rows={[
          { code: r.code, name: "Exports", value: r.exports === null ? "n/a" : f1(r.exports) },
          { code: r.code, name: "Imports", value: r.imports === null ? "n/a" : f1(r.imports) },
          { code: r.code, name: "Total", value: r.total === null ? "n/a" : f1(r.total), note: r.total === null ? `${r.latestYear} latest` : undefined },
        ]} />}
        <ol className="scl">
          {o.rows.map((x) => (
            <li key={x.code}>
              <button type="button" className={`scr${sel === x.code ? " on" : ""}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { setAt(anchorOf(e.currentTarget)); setSel(sel === x.code ? null : x.code); }}
                aria-label={`${NAME[x.code]}: ${x.total === null ? `n/a, ${x.latestYear} latest` : `exports ${f1(x.exports!)}, imports ${f1(x.imports!)}, total ${f1(x.total)} of GDP`}`}>
                <span className="scn"><i style={{ background: `var(--${x.code})` }} />{NAME[x.code]}</span>
                <span className="sct">{x.total === null ? <span className="na">n/a · {x.latestYear} latest</span> : <>
                  <span className="stk s0" style={{ left: 0, width: `${(x.exports! / max) * 100}%` }} />
                  <span className="stk s1" style={{ left: `${(x.exports! / max) * 100}%`, width: `${(x.imports! / max) * 100}%` }} />
                </>}</span>
                <span className="scv">{x.total === null ? "n/a" : f1(x.total)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </CardFrame>
  );
}
