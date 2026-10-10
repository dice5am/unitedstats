"use client";
import { useEffect, useRef, useState } from "react";
import { COUNTRIES } from "@/lib/series.mjs";

const ORDER = ["CAN", "USA", "JPN", "FRA", "GBR", "DEU", "ITA"];
const NAME: Record<string, string> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.name]));
const QUICK: { label: string; codes: string[] }[] = [
  { label: "All G7", codes: ORDER },
  { label: "Canada + US", codes: ["CAN", "USA"] },
  { label: "Canada only", codes: ["CAN"] },
];

export default function Picker({ on, setOn, na = {} }: { on: Record<string, boolean>; setOn: (o: Record<string, boolean>) => void; na?: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [focus, setFocus] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sel = ORDER.filter((c) => on[c]);
  const label = sel.length === 7 ? "All G7" : sel.length === 1 ? NAME[sel[0]] : `${sel.length} countries`;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const f = () => setMobile(mq.matches); f(); mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (!mobile && root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    document.addEventListener("pointerdown", down); document.addEventListener("keydown", key);
    requestAnimationFrame(() => (listRef.current?.querySelectorAll<HTMLElement>("[role=checkbox]")[0])?.focus());
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }, [open, mobile]);

  const toggle = (c: string) => { if (on[c] && sel.length === 1) return; setOn({ ...on, [c]: !on[c] }); };
  const quick = (codes: string[]) => setOn(Object.fromEntries(ORDER.map((c) => [c, codes.includes(c)])));
  const rowKey = (e: React.KeyboardEvent, i: number) => {
    let n: number | null = null;
    if (e.key === "ArrowDown") n = (i + 1) % 7; else if (e.key === "ArrowUp") n = (i + 6) % 7;
    else if (e.key === "Home") n = 0; else if (e.key === "End") n = 6;
    else if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(ORDER[i]); return; }
    if (n === null) return;
    e.preventDefault(); setFocus(n);
    listRef.current?.querySelectorAll<HTMLElement>("[role=checkbox]")[n]?.focus();
  };

  return (
    <div className="picker" ref={root}>
      <button ref={btn} className="pbtn" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="pdots" aria-hidden>{sel.map((c) => <i key={c} style={{ background: `var(--${c})` }} />)}</span>
        <span className="plabel">{label}</span><span className="caret" aria-hidden>▾</span>
      </button>
      {open && mobile && <div className="backdrop" onClick={() => setOpen(false)} aria-hidden />}
      {open && (
        <div className={`ppanel ${mobile ? "sheet" : "pop"}`} role={mobile ? "dialog" : undefined} aria-label={mobile ? "Choose countries" : undefined}>
          {mobile && <div className="grab" aria-hidden />}
          <div className="quick">
            {QUICK.map((q) => {
              const act = q.codes.length === sel.length && q.codes.every((c) => on[c]);
              return <button key={q.label} className={act ? "on" : ""} aria-pressed={act} onClick={() => quick(q.codes)}>{q.label}</button>;
            })}
          </div>
          <div className="plist" role="group" aria-label="Countries" ref={listRef}>
            {ORDER.map((c, i) => {
              const chk = !!on[c], locked = chk && sel.length === 1;
              return (
                <div key={c} role="checkbox" aria-checked={chk} aria-disabled={locked || undefined} tabIndex={i === focus ? 0 : -1}
                  className={`prow ${chk ? "on" : ""} ${na[c] ? "na" : ""}`} onClick={() => { setFocus(i); toggle(c); }} onKeyDown={(e) => rowKey(e, i)}>
                  <span className="box" aria-hidden>{chk && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
                  <i style={{ background: `var(--${c})` }} aria-hidden />
                  <span>{NAME[c]}</span>{na[c] && <span className="nanote">{na[c]}</span>}
                </div>
              );
            })}
          </div>
          {mobile && <button className="done" onClick={() => setOpen(false)}>Done</button>}
        </div>
      )}
    </div>
  );
}
