"use client";
import { useMemo, useRef } from "react";
import { jobsPerCapitaDataset } from "@/lib/series.mjs";
import Shell from "./Shell";
import ChartCard, { asOf } from "./ChartCard";
import HeatStrip from "./HeatStrip";
import Scorecard from "./Scorecard";
import { Lazy } from "./kit";

export const LABOUR_CARDS = [
  { id: "card-unemp", title: "Unemployment rate" }, { id: "heat", title: "Unemployment heat strip" },
  { id: "card-jobs", title: "Jobs" }, { id: "recovery", title: "Jobs recovery scorecard" },
];
// pop: OECD population (quarterly) from the economy file, used only for jobs per capita.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function LabourTab({ data, unemp, pop, rate }: { data: any; unemp: any; pop: any; rate: any }) {
  const sets = useMemo(() => ({ unemp, jobs: data, jpc: jobsPerCapitaDataset(data, pop) }), [data, unemp, pop]);
  const initial = useRef<string | null>(null);
  if (initial.current === null && typeof window !== "undefined") initial.current = location.search;
  return (
    <Shell tab="labour" cards={LABOUR_CARDS} asOf={asOf(data.data_as_of.snapshot_id)}>
      <ChartCard kind="unemp" sets={{ unemp: sets.unemp }} primary initialSearch={initial} />
      <Lazy id="heat" minHeight={760}><HeatStrip un={unemp} initial={initial} /></Lazy>
      <Lazy id="card-jobs" minHeight={1500}><ChartCard kind="jobs" sets={{ jobs: sets.jobs, jpc: sets.jpc }} initialSearch={initial} /></Lazy>
      <Lazy id="recovery" minHeight={900}><Scorecard rate={rate} /></Lazy>
    </Shell>
  );
}
