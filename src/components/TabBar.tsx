"use client";
// Nine-tab bar. <768: Economy · Labour · Demographics · Housing · More ▾ (bottom sheet with the other five).
// ≥768: all nine inline; whatever doesn't fit folds into More from the right. A selected overflow tab replaces "More".
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TABS, MOBILE_INLINE, type TabId } from "./tabs";

export default function TabBar({ tab }: { tab: TabId }) {
  const navRef = useRef<HTMLElement>(null), measRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(MOBILE_INLINE); // SSR default = mobile layout
  const [open, setOpen] = useState(false);
  useLayoutEffect(() => {
    const nav = navRef.current, meas = measRef.current; if (!nav || !meas) return;
    const m = () => {
      if (innerWidth < 768) { setFit(MOBILE_INLINE); return; }
      const ws = [...meas.children].map((c) => (c as HTMLElement).getBoundingClientRect().width);
      const more = ws[ws.length - 1], avail = nav.clientWidth; let n = TABS.length;
      const sum = (k: number) => ws.slice(0, k).reduce((a, b) => a + b, 0);
      if (sum(TABS.length) > avail) { n = TABS.length - 1; while (n > 1 && sum(n) + more > avail) n--; }
      setFit(n);
    };
    m(); const ro = new ResizeObserver(m); ro.observe(nav); return () => ro.disconnect();
  }, []);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [open]);
  const inline = TABS.slice(0, fit), rest = TABS.slice(fit);
  const restSel = rest.find((t) => t.id === tab);
  return (
    <>
      <nav className="tabs9" ref={navRef} aria-label="Sections" data-fit={fit}>
        {inline.map((t) => <Link key={t.id} href={`/${t.id}`} className={t.id === tab ? "on" : ""} aria-current={t.id === tab ? "page" : undefined}>{t.label}</Link>)}
        {rest.length > 0 && (
          <button type="button" className={`more${restSel ? " on" : ""}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)} aria-current={restSel ? "page" : undefined}>
            {restSel ? restSel.label : "More"} <span aria-hidden>▾</span>
          </button>
        )}
        <div className="tabsmeas" ref={measRef} aria-hidden>{TABS.map((t) => <span key={t.id}>{t.label}</span>)}<span>Environment & energy ▾</span></div>
      </nav>
      {open && (
        <div className="sheetwrap" onPointerDown={() => setOpen(false)}>
          <div className="sheet moresheet" role="dialog" aria-modal="true" aria-label="More sections" onPointerDown={(e) => e.stopPropagation()}>
            <div className="grab" aria-hidden />
            <ul>
              {rest.map((t) => (
                <li key={t.id}><Link href={`/${t.id}`} className={t.id === tab ? "on" : ""} aria-current={t.id === tab ? "page" : undefined} onClick={() => setOpen(false)} autoFocus={t === rest[0]}>
                  <b>{t.label}</b><span>{t.desc}</span></Link></li>
              ))}
            </ul>
            <button type="button" className="done" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </>
  );
}
