"use client";
// Chart registry: every chart renders standalone from its id, loading only its own component and data file(s).
// All chart state lives in prefixed URL params (listed per chart), so a future switcher (?chart=<id>) can
// mount exactly one chart. The switcher itself is not built yet.
import { lazy, Suspense, useRef, type ComponentType, type MutableRefObject } from "react";

import { CHART_META, type ChartId, type BuiltId } from "./meta";
export { CHART_META, type ChartId };
type Init = { initial: MutableRefObject<string | null> };
// Loaders only; id, titles, description, tab, params and data files live in ./meta (CHART_META).
export const CHARTS: Record<BuiltId, { load: () => Promise<{ default: ComponentType<Init> }> }> = {
  gdp: {
    load: async () => { const [{ default: econ0 }, { default: popJ }, { default: pcJ }, { econDataset, econWithJoinedPopulation, applyStarts }, { default: ChartCard }] = await Promise.all([import("@/data/econ_gdp_series.json"), import("@/data/econ_population_joined.json"), import("@/data/econ_gdp_per_capita_joined.json"), import("@/lib/series.mjs"), import("@/src/components/ChartCard")]);
      const econ = econWithJoinedPopulation(econ0, popJ, pcJ); const sets = { gdp: applyStarts(econDataset(econ, "gdp")), pc: applyStarts(econDataset(econ, "pc")) }; return { default: ({ initial }: Init) => <ChartCard kind="econ" sets={sets} primary initialSearch={initial} /> }; } },
  "1": {
    load: async () => { const [{ default: econ }, { default: C }] = await Promise.all([import("@/data/econ_gdp_series.json"), import("@/src/components/Comeback")]);
      return { default: ({ initial }: Init) => <C econ={econ} initial={initial} /> }; } },
  unemp: {
    // UNEMP_MONTHLY_GATED switches this chart to the OECD monthly file (same file as #2) once the Data Lead gates it.
    load: async () => { const [L, { default: ChartCard }] = await Promise.all([import("@/lib/series.mjs"), import("@/src/components/ChartCard")]);
      // gated 2026-10-10: OECD monthly long file (c1_unemployment_rate_long.json)
      const ds = L.unempLongDataset((await import("@/data/c1_unemployment_rate_long.json")).default);
      return { default: ({ initial }: Init) => <ChartCard kind="unemp" sets={{ unemp: ds }} primary initialSearch={initial} /> }; } },
  "2": {
    load: async () => { const [{ default: um }, { default: H }] = await Promise.all([import("@/data/oecd_unemployment_rate_m_15plus.json"), import("@/src/components/HeatStrip")]);
      return { default: ({ initial }: Init) => <H um={um} initial={initial} /> }; } },
  jobs: {
    load: async () => { const [{ default: data }, { default: popJ }, { jobsPerCapitaDataset, jobsDataset, applyStarts }, { default: ChartCard }] = await Promise.all([import("@/data/c1_labour_series.json"), import("@/data/econ_population_joined.json"), import("@/lib/series.mjs"), import("@/src/components/ChartCard")]);
      const sets = { jobs: jobsDataset(data), jpc: applyStarts(jobsPerCapitaDataset(data, popJ)) }; return { default: ({ initial }: Init) => <ChartCard kind="jobs" sets={sets} initialSearch={initial} /> }; } },
  "22": {
    load: async () => { const [{ default: rate }, { default: S }] = await Promise.all([import("@/data/c1_employment_rate.json"), import("@/src/components/Scorecard")]);
      return { default: () => <S rate={rate} /> }; } },
  "7": {
    load: async () => { const [{ default: bis }, { policyDataset }, { default: ChartCard }] = await Promise.all([import("@/data/bis_policy_rate_m.json"), import("@/lib/series.mjs"), import("@/src/components/ChartCard")]);
      const sets = { policy: policyDataset(bis) }; return { default: ({ initial }: Init) => <ChartCard kind="policy" sets={sets} primary initialSearch={initial} /> }; } },
};

const cache: Partial<Record<BuiltId, ComponentType<Init>>> = {};
export const isBuilt = (id: ChartId): id is BuiltId => id in CHARTS;
// Warm a chart's code and data in the background (idle preload of the next chart).
export function preload(id: ChartId) { if (isBuilt(id)) CHARTS[id].load().catch(() => {}); }
// Render one chart by id, standalone. Reads its own prefixed params from the URL on mount.
export function ChartById({ id }: { id: BuiltId }) {
  const initial = useRef<string | null>(null);
  if (initial.current === null && typeof window !== "undefined") initial.current = location.search;
  const C = (cache[id] ??= lazy(CHARTS[id].load));
  return <Suspense fallback={<div className="lazyph" style={{ minHeight: 600 }} aria-busy="true" />}><C initial={initial} /></Suspense>;
}
