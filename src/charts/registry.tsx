"use client";
// Chart registry: every chart renders standalone from its id, loading only its own component and data file(s).
// All chart state lives in prefixed URL params (listed per chart), so a future switcher (?chart=<id>) can
// mount exactly one chart. The switcher itself is not built yet.
import { lazy, Suspense, useRef, type ComponentType, type MutableRefObject } from "react";

import { CHART_META, type ChartId } from "./meta";
export { CHART_META, type ChartId };
type Init = { initial: MutableRefObject<string | null> };
// Loaders only; id, titles, description, tab, params and data files live in ./meta (CHART_META).
export const CHARTS: Record<ChartId, { load: () => Promise<{ default: ComponentType<Init> }> }> = {
  gdp: {
    load: async () => { const [{ default: econ }, { econDataset }, { default: ChartCard }] = await Promise.all([import("@/data/econ_gdp_series.json"), import("@/lib/series.mjs"), import("@/src/components/ChartCard")]);
      const sets = { gdp: econDataset(econ, "gdp"), pc: econDataset(econ, "pc") }; return { default: ({ initial }: Init) => <ChartCard kind="econ" sets={sets} primary initialSearch={initial} /> }; } },
  "1": {
    load: async () => { const [{ default: econ }, { default: C }] = await Promise.all([import("@/data/econ_gdp_series.json"), import("@/src/components/Comeback")]);
      return { default: ({ initial }: Init) => <C econ={econ} initial={initial} /> }; } },
  unemp: {
    load: async () => { const [{ default: un }, { default: ChartCard }] = await Promise.all([import("@/data/c1_unemployment_rate.json"), import("@/src/components/ChartCard")]);
      return { default: ({ initial }: Init) => <ChartCard kind="unemp" sets={{ unemp: un }} primary initialSearch={initial} /> }; } },
  "2": {
    load: async () => { const [{ default: um }, { default: H }] = await Promise.all([import("@/data/oecd_unemployment_rate_m_15plus.json"), import("@/src/components/HeatStrip")]);
      return { default: ({ initial }: Init) => <H um={um} initial={initial} /> }; } },
  jobs: {
    load: async () => { const [{ default: data }, { default: econ }, { jobsPerCapitaDataset }, { default: ChartCard }] = await Promise.all([import("@/data/c1_labour_series.json"), import("@/data/econ_gdp_series.json"), import("@/lib/series.mjs"), import("@/src/components/ChartCard")]);
      const sets = { jobs: data, jpc: jobsPerCapitaDataset(data, econ) }; return { default: ({ initial }: Init) => <ChartCard kind="jobs" sets={sets} initialSearch={initial} /> }; } },
  "22": {
    load: async () => { const [{ default: rate }, { default: S }] = await Promise.all([import("@/data/c1_employment_rate.json"), import("@/src/components/Scorecard")]);
      return { default: () => <S rate={rate} /> }; } },
};

const cache: Partial<Record<ChartId, ComponentType<Init>>> = {};
// Render one chart by id, standalone. Reads its own prefixed params from the URL on mount.
export function ChartById({ id }: { id: ChartId }) {
  const initial = useRef<string | null>(null);
  if (initial.current === null && typeof window !== "undefined") initial.current = location.search;
  const C = (cache[id] ??= lazy(CHARTS[id].load));
  return <Suspense fallback={<div className="lazyph" style={{ minHeight: 600 }} aria-busy="true" />}><C initial={initial} /></Suspense>;
}
