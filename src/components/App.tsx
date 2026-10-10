"use client";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { econDataset, jobsPerCapitaDataset } from "@/lib/series.mjs";
import ThemeToggle from "./ThemeToggle";
import ChartCard, { asOf } from "./ChartCard";

type Tab = "economy" | "labour";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function App({ data, unemp, econ, tab }: { data: any; unemp: any; econ: any; tab: Tab }) {
  const E = tab === "economy";
  const sets = useMemo(() => ({
    gdp: econDataset(econ, "gdp"), pc: econDataset(econ, "pc"),
    jobs: data, jpc: jobsPerCapitaDataset(data, econ), unemp,
  }), [data, econ, unemp]);
  // URL as it arrived, so each card reads its own (and legacy) params before any card rewrites the URL.
  const initialSearch = useRef<string | null>(null);
  if (initialSearch.current === null && typeof window !== "undefined") initialSearch.current = location.search;

  return (
    <div className="page">
      <div className="aura" aria-hidden />
      <header className="hdr">
        <Link href="/labour" className="brand"><span className="mark" aria-hidden />unitedstats</Link>
        <ThemeToggle />
      </header>
      <nav className="tabs" role="tablist" aria-label="Sections">
        <Link role="tab" aria-selected={E} className={E ? "on" : ""} href="/economy">Economy</Link>
        <Link role="tab" aria-selected={!E} className={!E ? "on" : ""} href="/labour">Labour</Link>
      </nav>
      <main className="wrap" role="tabpanel" aria-label={E ? "Economy" : "Labour"}>
        <p className="eyebrow">{E ? "Economy" : "Labour"}</p>
        {E ? <ChartCard kind="econ" sets={{ gdp: sets.gdp, pc: sets.pc }} primary initialSearch={initialSearch} />
          : <>
            <ChartCard kind="unemp" sets={{ unemp: sets.unemp }} primary initialSearch={initialSearch} />
            <ChartCard kind="jobs" sets={{ jobs: sets.jobs, jpc: sets.jpc }} initialSearch={initialSearch} />
          </>}
      </main>
      <footer className="ftr wrap"><span>unitedstats</span><span>Data as of {asOf(E ? econ.data_as_of.snapshot_id : data.data_as_of.snapshot_id)}</span></footer>
    </div>
  );
}
