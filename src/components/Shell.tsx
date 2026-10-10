"use client";
// Page shell shared by all nine tabs: header, tab bar, jump list of the tab's cards, footer.
import Link from "next/link";
import type { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";
import TabBar from "./TabBar";
import { jumpTo } from "./kit";
import { TABS, type TabId } from "./tabs";

export default function Shell({ tab, cards, asOf, children }: { tab: TabId; cards: { id: string; title: string }[]; asOf?: string; children: ReactNode }) {
  const t = TABS.find((x) => x.id === tab)!;
  return (
    <div className="page">
      <div className="aura" aria-hidden />
      <header className="hdr">
        <Link href="/economy" className="brand"><span className="mark" aria-hidden />unitedstats</Link>
        <ThemeToggle />
      </header>
      <TabBar tab={tab} />
      {cards.length > 1 && (
        <nav className="jump wrap" aria-label={`${t.label} charts`}>
          {cards.map((c) => <a key={c.id} href={`#${c.id}`} onClick={(e) => { e.preventDefault(); jumpTo(c.id); }}>{c.title}</a>)}
        </nav>
      )}
      <main className="wrap" aria-label={t.label}>{children}</main>
      <footer className="ftr wrap"><span>unitedstats</span>{asOf && <span>Data as of {asOf}</span>}</footer>
    </div>
  );
}

export function InProgress({ tab }: { tab: TabId }) {
  const t = TABS.find((x) => x.id === tab)!;
  return (
    <section className="wip" aria-labelledby="wip-h">
      <p className="eyebrow">{t.label}</p>
      <h1 id="wip-h" className="h1">In progress</h1>
      <p className="sub">{t.desc}. Charts for this section are being built.</p>
    </section>
  );
}
