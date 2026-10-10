"use client";
// Shared card kit: URL params, disclosure, segmented control, card anatomy, lazy mount. Used by every card type.
import { useEffect, useLayoutEffect, useRef, useState, type MutableRefObject, type ReactNode } from "react";

// Merge one card's params into the URL (other cards' params untouched); commas kept readable.
export function writeParams(set: Record<string, string>, drop: string[] = []) {
  const q = new URLSearchParams(location.search);
  for (const d of drop) q.delete(d);
  for (const [k, v] of Object.entries(set)) q.set(k, v);
  const s = [...q.entries()].map(([a, b]) => `${a}=${encodeURIComponent(b).replace(/%2C/g, ",")}`).join("&");
  const next = `${location.pathname}${s ? "?" + s : ""}${location.hash}`;
  if (next !== location.pathname + location.search + location.hash) history.replaceState(null, "", next);
}

// Per-card URL state. spec: key -> [default, allowed values]. Reads once before paint (server renders defaults,
// so no hydration mismatch), falls back to the default for anything invalid, then writes back on change.
export function useParams<T extends Record<string, string>>(initial: MutableRefObject<string | null>, spec: { [K in keyof T]: [T[K], readonly T[K][]] }) {
  const defaults = Object.fromEntries(Object.entries(spec).map(([k, [d]]) => [k, d])) as T;
  const [st, setSt] = useState<T>(defaults);
  const phase = useRef(0);
  useLayoutEffect(() => {
    const q = new URLSearchParams(initial.current ?? location.search);
    const next = Object.fromEntries(Object.entries(spec).map(([k, [d, ok]]) => { const v = q.get(k); return [k, v !== null && (ok as string[]).includes(v) ? v : d]; })) as T;
    setSt(next); writeParams(next); phase.current = 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (phase.current === 1) { phase.current = 2; return; } if (phase.current === 2) writeParams(st); }, [st]);
  return [st, (k: keyof T, v: string) => setSt((s) => ({ ...s, [k]: v }))] as const;
}

// Accessible disclosure: closed by default at every width.
export function CalcDisclosure({ hid, children }: { hid: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pid = `${hid}-panel`;
  return (
    <div className={open ? "calcd open" : "calcd"}>
      <h2 id={hid} className="calch">
        <button type="button" aria-expanded={open} aria-controls={pid} onClick={() => setOpen((o) => !o)}>
          <span>How it’s calculated</span><span className="chev" aria-hidden>▾</span>
        </button>
      </h2>
      <div id={pid} role="region" aria-labelledby={hid} hidden={!open}>
        <p className="sub">Same inputs and maths as the chart above.</p>
        {children}
      </div>
    </div>
  );
}

// Segmented control with sliding highlight; arrows move, roving tabindex.
export function Seg<V extends string>({ label, value, options, onChange, className = "seg" }: { label: string; value: V; options: [V, string][]; onChange: (v: V) => void; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hl, setHl] = useState({ x: 0, w: 0 });
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const m = () => { const b = el.querySelector<HTMLElement>("button.on"); if (b) setHl({ x: b.offsetLeft, w: b.offsetWidth }); };
    m(); const ro = new ResizeObserver(m); ro.observe(el); return () => ro.disconnect();
  }, [value]);
  const key = (e: React.KeyboardEvent) => {
    const i = options.findIndex(([v]) => v === value);
    const n = ["ArrowRight", "ArrowDown"].includes(e.key) ? i + 1 : ["ArrowLeft", "ArrowUp"].includes(e.key) ? i - 1 : null;
    if (n === null) return; e.preventDefault();
    const j = (n + options.length) % options.length; onChange(options[j][0]);
    (ref.current?.querySelectorAll("button")[j] as HTMLElement | undefined)?.focus();
  };
  return (
    <div className={className} role="radiogroup" aria-label={label} ref={ref} onKeyDown={key}>
      <span className="hl" style={{ transform: `translateX(${hl.x}px)`, width: hl.w }} aria-hidden />
      {options.map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={v === value} tabIndex={v === value ? 0 : -1} className={v === value ? "on" : ""} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  );
}

// id = "chart-<registry id>". Shared card anatomy (DESIGN-SYSTEM Round 4): eyebrow · H2 · subtitle · controls · headline · plot · legend · source · calc.
export function TagIn({ tag }: { tag?: string }) { return tag ? <span className="tagin"> · {tag.split(" · ")[0]}</span> : null; }

export function CardFrame({ id, eyebrow, title, sub, controls, headline, tag, legend, source, calc, children }: {
  id: string; eyebrow: string; title: string; sub: ReactNode; controls?: ReactNode; headline?: ReactNode; tag?: string; legend?: ReactNode; source: string; calc: ReactNode; children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useDocTitle(ref, title);
  return (
    <section className="cardsec" id={id} aria-labelledby={`h-${id}`} ref={ref}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={`h-${id}`} className="h1">{title}</h2>
      <p className="sub">{sub}</p>
      {headline ? <div className="toprow">
        {controls && <div className="ctrls ctrls2">{controls}</div>}
        <div className="figwrap">{headline}{tag && <p className="srctag">{tag}</p>}</div>
      </div> : <div className="toprow nohead">
        {/* no ranked headline: controls sit directly under the description, source tag to their left (below at 390) */}
        {controls && <div className="ctrls ctrls2">{controls}</div>}
        {tag && <p className="srctag">{tag}</p>}
      </div>}
      <div className="card chartcard plotcard">{children}</div>
      {legend && <ul className="notes">{legend}</ul>}
      <p className="source">{source}</p>
      <section className="calc"><CalcDisclosure hid={`calc-h-${id}`}><div className="card panel">{calc}</div></CalcDisclosure></section>
    </section>
  );
}

// Lazy mount below the fold with a reserved height so nothing jumps. Mounts at once if the URL hash targets it.
export function Lazy({ id, minHeight, eager = false, children }: { id: string; minHeight: number; eager?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(eager);
  useEffect(() => {
    if (show) return;
    if (location.hash === `#${id}`) { setShow(true); return; }
    const all = () => setShow(true); addEventListener("us-mount-all", all);
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setShow(true); io.disconnect(); } }, { rootMargin: "600px 0px" });
    io.observe(el); return () => { io.disconnect(); removeEventListener("us-mount-all", all); };
  }, [show, id]);
  return <div ref={ref} className="lazy" data-card={id} data-mounted={show ? "1" : "0"} style={show ? undefined : { minHeight }}>{show ? children : <div id={id} aria-busy="true" className="lazyph" />}</div>;
}

// Element width (for SVGs drawn at true pixel size, so strokes stay 2px).
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => { const el = ref.current; if (!el) return; const m = () => setW(el.clientWidth); m(); const ro = new ResizeObserver(m); ro.observe(el); return () => ro.disconnect(); }, []);
  return [ref, w] as const;
}

// Stats box shared by the new chart types: hidden until a mark is tapped/hovered; ✕, Esc and outside tap close it.
// at: anchor beside the tapped item (y/h inside a container of height H): below it when the item is in the top half,
// above it otherwise, so the tapped bar or line stays visible.
export function StatBox({ title, rows, onClose, bottom = false, at }: { title: string; rows: { code: string; name: string; value: string; note?: string }[]; onClose: () => void; bottom?: boolean; at?: { y: number; h: number; H: number } }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className={`tip statbox ${at ? (at.y + at.h / 2 < at.H / 2 ? "below" : "above") : bottom ? "bot" : "top"}`} role="status" onPointerDown={(e) => e.stopPropagation()}
      style={at ? (at.y + at.h / 2 < at.H / 2 ? { top: at.y + at.h + 6, bottom: "auto" } : { bottom: at.H - at.y + 6, top: "auto" }) : undefined}>
      <div className="tiph"><span className="mo">{title}</span><button type="button" className="tipx" aria-label="Close" onClick={onClose}>✕</button></div>
      {rows.map((r, i) => <div key={`${r.code}${i}`} className="tipr"><i style={{ background: `var(--${r.code})` }} /><span>{r.name}</span><b>{r.value}</b>{r.note && <em>{r.note}</em>}</div>)}
    </div>
  );
}

// Jump-list navigation: mount every lazy card first (so heights are real), then scroll to the target.
export function jumpTo(id: string) {
  dispatchEvent(new Event("us-mount-all"));
  history.replaceState(null, "", `${location.pathname}${location.search}#${id}`);
  requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })));
}

// One hero chart per page (Round 4b): the tab title is the shown chart's title, per view.
// Re-applied briefly after mount because Next's static metadata can land after hydration.
export function useDocTitle(_ref: React.RefObject<Element | null>, title: string) {
  useEffect(() => {
    const t = `${title} · unitedstats`, set = () => { if (document.title !== t) document.title = t; };
    set(); const ids = [50, 300, 1000].map((ms) => setTimeout(set, ms));
    return () => ids.forEach(clearTimeout);
  }, [title]);
}
export type Init = { initial: MutableRefObject<string | null> };

// anchor for StatBox `at` from a tapped row/button inside a positioned container (.sc)
export const anchorOf = (b: HTMLElement) => { const box = b.closest(".sc") as HTMLElement; return { y: b.getBoundingClientRect().top - box.getBoundingClientRect().top, h: b.offsetHeight, H: box.offsetHeight }; };

// Year picker for long year lists (more than fit as a segmented control at 390): ‹ year › with a native select in the middle.
export function YearPick({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const i = options.indexOf(value);
  return (
    <div className="ypick" role="group" aria-label={label}>
      <button type="button" aria-label={`Previous ${label.toLowerCase()}`} disabled={i <= 0} onClick={() => onChange(options[i - 1])}>‹</button>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
      <button type="button" aria-label={`Next ${label.toLowerCase()}`} disabled={i >= options.length - 1} onClick={() => onChange(options[i + 1])}>›</button>
    </div>
  );
}
