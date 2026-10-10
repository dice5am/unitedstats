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
  // ---- Finance wave ----
  "13": {
    load: async () => { const [{ default: hl }, { default: core }, F, { default: H }] = await Promise.all([import("@/data/oecd_cpi_headline_yoy.json"), import("@/data/oecd_cpi_core_yoy.json"), import("./finance"), import("@/src/components/HeatStrip")]);
      const cfg = F.cpiCfg(hl, core); return { default: ({ initial }: Init) => <H cfg={cfg} initial={initial} /> }; } },
  "3": {
    load: async () => { const [{ default: f }, { default: B }] = await Promise.all([import("@/data/oecd_gdp_per_capita_ppp_current.json"), import("@/src/components/Bump")]);
      return { default: ({ initial }: Init) => <B file={f} initial={initial} /> }; } },
  "25": {
    load: async () => { const [{ default: f }, E, { default: R }] = await Promise.all([import("@/data/oecd_idd_gini_disposable.json"), import("./economy"), import("@/src/components/RankBar")]);
      return { default: () => <R file={f} spec={E.giniSpec} /> }; } },
  "15": {
    load: async () => { const [{ default: g }, { default: b }, E, { default: S }] = await Promise.all([import("@/data/oecd_msti_gerd_pct_gdp.json"), import("@/data/oecd_msti_berd_pct_gdp.json"), import("./economy"), import("@/src/components/StackRank")]);
      const spec = E.rdSpec(g, b); return { default: ({ initial }: Init) => <S spec={spec} initial={initial} /> }; } },
  // ---- Society wave ----
  "4": {
    load: async () => { const [{ default: f }, S, { default: C }] = await Promise.all([import("@/data/wb_SP.POP.65UP.TO.ZS.json"), import("./society"), import("@/src/components/Slope")]);
      return { default: ({ initial }: Init) => <C file={f} spec={S.greySpec} initial={initial} /> }; } },
  "11": {
    load: async () => { const [{ default: f }, S, { default: C }] = await Promise.all([import("@/data/wb_SP.DYN.TFRT.IN.json"), import("./society"), import("@/src/components/YearMultiples")]);
      return { default: ({ initial }: Init) => <C file={f} spec={S.fertSpec} initial={initial} /> }; } },
  "23": {
    load: async () => { const [{ default: f }, S, { default: C }] = await Promise.all([import("@/data/wb_SM.POP.TOTL.ZS.json"), import("./society"), import("@/src/components/Waffle")]);
      return { default: ({ initial }: Init) => <C file={f} spec={S.migSpec} initial={initial} /> }; } },
  "8": {
    load: async () => { const [{ default: hx }, { default: le }, S, { default: C }] = await Promise.all([import("@/data/wb_SH.XPD.CHEX.GD.ZS.json"), import("@/data/oecd_life_expectancy_birth.json"), import("./society"), import("@/src/components/Scatter")]);
      const spec = S.healthSpec(hx, le); return { default: ({ initial }: Init) => <C spec={spec} initial={initial} /> }; } },
  "16": {
    load: async () => { const [{ default: older }, { default: younger }, S, { default: D }] = await Promise.all([import("@/data/oecd_eag_tertiary_attainment_25_64.json"), import("@/data/oecd_eag_tertiary_attainment_25_34.json"), import("./society"), import("@/src/components/Dumbbell")]);
      return { default: () => <D file={{ older, younger }} spec={S.degreeSpec} /> }; } },
  // ---- Environment wave ----
  "5": {
    load: async () => { const [{ default: g }, { default: c }, E, { default: C }] = await Promise.all([import("@/data/wb_NY.GDP.PCAP.PP.KD.json"), import("@/data/wb_EN.GHG.CO2.PC.CE.AR5.json"), import("./environment"), import("@/src/components/Scatter")]);
      const spec = E.richerSpec(g, c); return { default: ({ initial }: Init) => <C spec={spec} initial={initial} /> }; } },
  "14": {
    load: async () => { const [{ default: g }, { default: p }, { default: T }] = await Promise.all([import("@/data/oecd_ghg_total.json"), import("@/data/econ_population_joined.json"), import("@/src/components/TileMap")]);
      return { default: ({ initial }: Init) => <T ghg={g} pop={p} initial={initial} /> }; } },
  "9": {
    load: async () => { const [{ default: e }, { default: M }] = await Promise.all([import("@/data/ember_electricity_mix_share.json"), import("@/src/components/MixArea")]);
      return { default: ({ initial }: Init) => <M ember={e} initial={initial} /> }; } },
  "17": {
    load: async () => { const [{ default: y }, { default: a }, L, { default: R }] = await Promise.all([import("@/data/oecd_unemployment_rate_m_15_24.json"), import("@/data/oecd_unemployment_rate_m_15plus.json"), import("./labour"), import("@/src/components/RankBar")]);
      const spec = L.youthSpec(y); return { default: () => <R file={a} spec={spec} /> }; } },
  "18": {
    load: async () => { const [{ default: f }, L, { default: R }] = await Promise.all([import("@/data/oecd_avg_annual_hours_worked.json"), import("./labour"), import("@/src/components/RankBar")]);
      return { default: () => <R file={f} spec={L.hoursSpec} /> }; } },
  "12": {
    load: async () => { const [{ default: f }, L, { default: S }] = await Promise.all([import("@/data/oecd_avg_annual_wage_usd_ppp.json"), import("./labour"), import("@/src/components/Slope")]);
      return { default: () => <S file={f} spec={L.wageSpec} /> }; } },
  "24": {
    load: async () => { const [{ default: f }, L, { default: S }] = await Promise.all([import("@/data/ilo_labour_share_gdp.json"), import("./labour"), import("@/src/components/Slope")]);
      return { default: () => <S file={f} spec={L.shareSpec} /> }; } },
  "10": {
    load: async () => { const [{ default: f }, F, { default: D }] = await Promise.all([import("@/data/imf_weo_GGXWDG_NGDP.json"), import("./finance"), import("@/src/components/Dumbbell")]);
      return { default: () => <D file={f} spec={F.debtSpec} /> }; } },
  "6": {
    load: async () => { const [{ default: f }, F, { default: D }] = await Promise.all([import("@/data/oecd_house_price_to_income.json"), import("./finance"), import("@/src/components/Dumbbell")]);
      return { default: () => <D file={f} spec={F.houseSpec} /> }; } },
  "20": {
    load: async () => { const [{ default: f }, F, { default: M }] = await Promise.all([import("@/data/bis_household_credit_pct_gdp.json"), import("./finance"), import("@/src/components/Multiples")]);
      return { default: ({ initial }: Init) => <M file={f} spec={F.creditSpec} initial={initial} /> }; } },
  "19": {
    load: async () => { const [{ default: f }, F, { default: M }] = await Promise.all([import("@/data/oecd_bop_current_account_pct_gdp_q.json"), import("./finance"), import("@/src/components/Multiples")]);
      return { default: ({ initial }: Init) => <M file={f} spec={F.bopSpec} initial={initial} /> }; } },
  "21": {
    load: async () => { const [{ default: e }, { default: i }, { default: S }] = await Promise.all([import("@/data/wb_NE.EXP.GNFS.ZS.json"), import("@/data/wb_NE.IMP.GNFS.ZS.json"), import("@/src/components/StackBar")]);
      return { default: ({ initial }: Init) => <S exp={e} imp={i} initial={initial} /> }; } },
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
