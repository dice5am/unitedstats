"use client";
// App-wide country selection (?c=) for every chart. A chart gets the selected countries' series only (pickCodes), the
// menu greys countries with no data from any source for that chart, and new countries' citations go to
// "How it's calculated". China rule: a country greyed on one chart stays selected and draws again on other charts.
import { Fragment, createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { parseOn, fmtOn, PEERS, PEER_CODES, DEFAULT_ON, G7 } from "@/lib/series.mjs";
import { pickCodes, present, citeLines, freqOf, euLabel, NEW } from "@/lib/g20.mjs";
import { readSel, writeSel, SEL_EVENT } from "./kit";
import Picker from "./Picker";

export const NO_DATA_NOTE = "no data from any source";
type Ctx = { on: Record<string, boolean>; setOn: (o: Record<string, boolean>) => void; na: Record<string, string>; cites: { code: string; freq?: string | null; lines: string[]; notes?: string[] }[]; splice?: Record<string, string[]>; names: Record<string, string>; drawn: string[]; sel?: string[]; setNeedIdx?: (i: number[] | null) => void };
const SelCtx = createContext<Ctx | null>(null);

export function useSelection() {
  const [codes, setCodes] = useState<string[]>(DEFAULT_ON);
  useEffect(() => {
    const f = () => setCodes(parseOn(readSel(location.search)));
    f(); writeSel(fmtOn(parseOn(readSel(location.search))));
    addEventListener(SEL_EVENT, f); addEventListener("popstate", f);
    return () => { removeEventListener(SEL_EVENT, f); removeEventListener("popstate", f); };
  }, []);
  const on = useMemo(() => Object.fromEntries(PEER_CODES.map((c) => [c, codes.includes(c)])), [codes]);
  const setOn = (o: Record<string, boolean>) => { const next = PEER_CODES.filter((c) => o[c]); if (!next.length) return; setCodes(next); writeSel(fmtOn(next)); };
  return { codes, on, setOn };
}
// codes with no data from any source: missing from ANY of the chart's required files
export function noDataCodes(files: any[]) { return PEER_CODES.filter((c) => files.some((f) => !present(f, c))); }
export function citesFor(files: any[], codes: string[]) {
  // locked copy (PM 2026-10-16): per-file notes (Euro area, EU debt, China GDP, Saudi population) and the splice line
  // "OECD to 2021-Q3 | IMF from 2021-Q4" for every spliced country, on every chart that uses the file
  return codes.filter((c) => NEW.includes(c)).map((c) => ({ code: c, freq: freqOf(files, c), lines: [...new Set(files.flatMap((f) => (f && f.g20_sources && f.g20_sources[c] ? citeLines(f.g20_sources[c]) : [])))],
    notes: [...new Set(files.flatMap((f) => [...((f && f.g20_notes && f.g20_notes[c]) || []), ...((f && f.g20_splice && f.g20_splice[c]) || []).map((x: any) => x.label).filter(Boolean)]))] })).filter((x) => x.lines.length);
}
export function spliceLabels(files: any[], code: string): string[] { return [...new Set(files.flatMap((f) => ((f && f.g20_splice && f.g20_splice[code]) || []).map((x: any) => x.label).filter(Boolean)))] as string[];
}

export function SelGate({ files, need, children }: { files: any[]; need?: any[]; children: (picked: any[], codes: string[]) => ReactNode }) {
  const { codes, on, setOn } = useSelection();
  // per-view gate: a card with views over different files (#13 Headline / Core) tells the gate which files its current
  // view needs (by index), so Headline never greys the countries only Core lacks
  const [needIdx, setNeedIdx] = useState<number[] | null>(null);
  const req = needIdx ? needIdx.map((i) => files[i]) : need ?? files;
  const nd = useMemo(() => noDataCodes(req), [req.map((f) => files.indexOf(f)).join(), files]); // eslint-disable-line react-hooks/exhaustive-deps
  const drawn = codes.filter((c) => !nd.includes(c));
  const picked = useMemo(() => files.map((f) => pickCodes(f, drawn)), [files, drawn.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const na = Object.fromEntries(nd.map((c) => [c, NO_DATA_NOTE]));
  const eu = euLabel(files), names: Record<string, string> = eu ? { EU: eu } : {};
  const ctx = { on, setOn, na, cites: citesFor(req, drawn), names, drawn, setNeedIdx, sel: codes, splice: Object.fromEntries(drawn.map((c) => [c, spliceLabels(req, c)]).filter(([, v]) => v.length)) };
  return <SelCtx.Provider value={ctx}>{drawn.length ? children(picked, drawn) : <EmptySel />}</SelCtx.Provider>;
}
function EmptySel() {
  const c = useContext(SelCtx)!;
  const names = PEER_CODES.filter((k) => c.on[k]).map((k) => PEERS.find((p) => p.code === k)!.name).join(", ");
  return <section className="cardsec"><div className="toprow nohead"><div className="ctrls ctrls2"><SelPicker /></div></div><div className="card chartcard plotcard"><div className="chart empty" style={{ height: 320 }} role="status"><div className="emptycard">No data from any source for {names} on this chart</div></div></div></section>;
}
export function SelPicker() { const c = useContext(SelCtx); return c ? <Picker on={c.on} setOn={c.setOn} na={c.na} names={c.names} /> : null; }
export function useSelCtx() { return useContext(SelCtx); }
// Per-chart display names (EU slot -> "Euro area" where the source is the euro area); components merge over their NAME map
export function useSelNames<T extends Record<string, string>>(base: T): T { const c = useContext(SelCtx); return useMemo(() => (c && Object.keys(c.names).length ? { ...base, ...c.names } : base), [base, c]); }
// Count text (PM lock 2026-10-16): "all seven" only for exactly the G7; otherwise "all N selected", and
// "all N selected with data" when some selected countries are greyed on this chart (N = countries drawn).
export const allText = (codes: string[], greyed = false) => (!greyed && codes.length === 7 && G7.every((c) => codes.includes(c)) ? "all seven" : `all ${codes.length} selected${greyed ? " with data" : ""}`);
export function useAllText() { const c = useContext(SelCtx); return c ? allText(c.drawn, (c.sel ?? c.drawn).length > c.drawn.length) : "all seven"; }
// count text for non-component callers (spec calc functions): the codes they list, greyed flag from the selection context
export function AllText({ codes }: { codes: string[] }) { const c = useContext(SelCtx); return <>{allText(codes, !!c && (c.sel ?? c.drawn).length > c.drawn.length)}</>; }
export function useSelNeed(idx: number[] | null) { const c = useContext(SelCtx); const k = idx ? idx.join() : ""; useEffect(() => { c?.setNeedIdx?.(idx); }, [k]); } // eslint-disable-line react-hooks/exhaustive-deps
export function SelCites({ cites }: { cites?: { code: string; freq?: string | null; lines: string[]; notes?: string[] }[] }) {
  const c = useContext(SelCtx); const list = cites ?? c?.cites ?? [];
  if (!list.length) return null;
  return <div className="grp g20src"><h3>Sources by country</h3><dl>{list.map((x) => <Fragment key={x.code}><dt>{c?.names?.[x.code] ?? PEERS.find((p) => p.code === x.code)!.name}</dt><dd>{x.freq ? `Drawn ${x.freq} · ` : ""}{x.lines.join("; ")}{(x.notes ?? []).map((n) => <span key={n} className="g20note"><br />{n}</span>)}</dd></Fragment>)}</dl></div>;
}
