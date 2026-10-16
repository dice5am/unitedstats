"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { PEERS, PEER_CODES, PRESETS, G7, DEFAULT_ON } from "@/lib/series.mjs";

// Country menu for the G20 roster: multi-select, internal scroll, type-to-filter, presets Default / G7.
// Same control on the desktop popover and the 390 bottom sheet. At least one country always stays on.
const NAME: Record<string, string> = Object.fromEntries(PEERS.map((c) => [c.code, c.name === "United States" ? "US" : c.name === "United Kingdom" ? "UK" : c.name === "European Union" ? "EU" : c.name]));
const MAX_DOTS = 8;
const same = (a: string[], b: string[]) => a.length === b.length && a.every((c) => b.includes(c));

export function pickerLabel(sel: string[]) {
  if (same(sel, DEFAULT_ON)) return `Default (${DEFAULT_ON.length})`;
  if (same(sel, G7)) return "G7";
  return sel.length === 1 ? NAME[sel[0]] : `${sel.length} countries`;
}

export default function Picker({ on, setOn, na = {}, names = {} }: { on: Record<string, boolean>; setOn: (o: Record<string, boolean>) => void; na?: Record<string, string>; names?: Record<string, string> }) {
  const NM = (c: string) => names[c] ?? NAME[c];
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [focus, setFocus] = useState(0);
  const [q, setQ] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // desktop popover: if it would run past the bottom of a short window (1366x657), scroll just enough to show it
  useEffect(() => { if (!open || mobile) return; const id = requestAnimationFrame(() => panelRef.current?.scrollIntoView({ block: "nearest", behavior: "instant" as ScrollBehavior })); return () => cancelAnimationFrame(id); }, [open, mobile]);
  const sel = PEER_CODES.filter((c) => on[c]);
  const label = sel.length === 1 ? NM(sel[0]) : pickerLabel(sel);
  const shown = useMemo(() => { const t = q.trim().toLowerCase(); return t ? PEERS.filter((c) => c.name.toLowerCase().includes(t) || NM(c.code).toLowerCase().includes(t) || c.code.toLowerCase().startsWith(t)).map((c) => c.code) : PEER_CODES; }, [q]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const f = () => setMobile(mq.matches); f(); mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  useEffect(() => {
    if (!open) { setQ(""); return; }
    const down = (e: PointerEvent) => { if (!mobile && root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    document.addEventListener("pointerdown", down); document.addEventListener("keydown", key);
    if (!mobile) requestAnimationFrame(() => searchRef.current?.focus()); // phones: no keyboard pop-up until the search is tapped
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }, [open, mobile]);

  const toggle = (c: string) => { if (on[c] && sel.length === 1) return; setOn({ ...on, [c]: !on[c] }); };
  const preset = (codes: string[]) => setOn(Object.fromEntries(PEER_CODES.map((c) => [c, codes.includes(c)])));
  const rows = () => listRef.current?.querySelectorAll<HTMLElement>("[role=checkbox]");
  const rowKey = (e: React.KeyboardEvent, i: number) => {
    const n0 = shown.length; let n: number | null = null;
    if (e.key === "ArrowDown") n = (i + 1) % n0; else if (e.key === "ArrowUp") { if (i === 0) { e.preventDefault(); searchRef.current?.focus(); return; } n = i - 1; }
    else if (e.key === "Home") n = 0; else if (e.key === "End") n = n0 - 1;
    else if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(shown[i]); return; }
    if (n === null) return;
    e.preventDefault(); setFocus(n); rows()?.[n]?.focus();
  };

  return (
    <div className="picker" ref={root}>
      <button ref={btn} className="pbtn" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)} data-testid="picker-btn">
        <span className="pdots" aria-hidden>{sel.slice(0, MAX_DOTS).map((c) => <i key={c} style={{ background: `var(--${c})` }} />)}</span>
        {sel.length > MAX_DOTS && <span className="pmore" data-testid="picker-more">+{sel.length - MAX_DOTS}</span>}
        <span className="plabel">{label}</span><span className="caret" aria-hidden>▾</span>
      </button>
      {open && mobile && <div className="backdrop" onClick={() => setOpen(false)} aria-hidden />}
      {open && (
        <div ref={panelRef} className={`ppanel ${mobile ? "sheet" : "pop"}`} role={mobile ? "dialog" : undefined} aria-label={mobile ? "Choose countries" : undefined}>
          {mobile && <div className="grab" aria-hidden />}
          <div className="quick" role="group" aria-label="Presets">
            {PRESETS.map((p) => { const act = same(sel, p.codes);
              return <button key={p.label} className={act ? "on" : ""} aria-pressed={act} onClick={() => preset(p.codes)}>{p.label}</button>; })}
          </div>
          <input ref={searchRef} className="psearch" type="search" placeholder="Search countries" aria-label="Search countries" value={q} autoComplete="off"
            onChange={(e) => { setQ(e.target.value); setFocus(0); }}
            onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); rows()?.[0]?.focus(); setFocus(0); } else if (e.key === "Enter" && shown.length) { e.preventDefault(); toggle(shown[0]); } }} />
          <div className="plist" role="group" aria-label="Countries" ref={listRef} data-testid="picker-list">
            {shown.map((c, i) => {
              const chk = !!on[c], locked = chk && sel.length === 1;
              return (
                <div key={c} role="checkbox" aria-checked={chk} aria-disabled={locked || undefined} tabIndex={i === focus ? 0 : -1} data-code={c}
                  className={`prow ${chk ? "on" : ""} ${na[c] ? "na" : ""}`} onClick={() => { setFocus(i); toggle(c); }} onKeyDown={(e) => rowKey(e, i)}>
                  <span className="box" aria-hidden>{chk && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
                  <i style={{ background: `var(--${c})` }} aria-hidden />
                  <span>{NM(c)}</span>{na[c] && <span className="nanote">{na[c]}</span>}
                </div>
              );
            })}
            {!shown.length && <p className="pnone" role="status">No match</p>}
          </div>
          {mobile && <button className="done" onClick={() => setOpen(false)}>Done</button>}
        </div>
      )}
    </div>
  );
}
