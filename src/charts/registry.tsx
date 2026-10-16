"use client";
// Chart registry: every chart renders standalone from its id, loading only its own component and data file(s).
// All chart state lives in prefixed URL params (listed per chart), so a future switcher (?chart=<id>) can
// mount exactly one chart. The switcher itself is not built yet.
import { lazy, Suspense, useRef, type ComponentType, type MutableRefObject } from "react";

import { CHART_META, type ChartId, type BuiltId } from "./meta";
import { g20 } from "@/lib/g20.mjs";
import { SelGate } from "@/src/components/Sel";
export { CHART_META, type ChartId };
type Init = { initial: MutableRefObject<string | null> };
// G7 file + its G20 sidecar (data-g20/<same name>) -> one file; G7 entries never touched (lib/g20.mjs).
const G2 = async (a: Promise<{ default: any }>, b: Promise<{ default: any }>) => { const [x, y] = await Promise.all([a, b]); return { default: g20(x.default, y.default) }; };
// Loaders only; id, titles, description, tab, params and data files live in ./meta (CHART_META).
export const CHARTS: Record<BuiltId, { load: () => Promise<{ default: ComponentType<Init> }> }> = {
  gdp: {
    load: async () => { const [{ default: econ0 }, { default: popJ }, { default: pcJ }, { econDataset, econWithJoinedPopulation, applyStarts }, { default: ChartCard }] = await Promise.all([G2(import("@/data/econ_gdp_series.json"), import("@/data-g20/econ_gdp_series.json")), G2(import("@/data/econ_population_joined.json"), import("@/data-g20/econ_population_joined.json")), G2(import("@/data/econ_gdp_per_capita_joined.json"), import("@/data-g20/econ_gdp_per_capita_joined.json")), import("@/lib/series.mjs"), import("@/src/components/ChartCard")]);
      const econ = econWithJoinedPopulation(econ0, popJ, pcJ); const sets = { gdp: applyStarts(econDataset(econ, "gdp")), pc: applyStarts(econDataset(econ, "pc")) }; return { default: ({ initial }: Init) => <ChartCard kind="econ" sets={sets} primary initialSearch={initial} /> }; } },
  "1": {
    load: async () => { const [{ default: econ }, { default: C }] = await Promise.all([G2(import("@/data/econ_gdp_series.json"), import("@/data-g20/econ_gdp_series.json")), import("@/src/components/Comeback")]);
      return { default: ({ initial }: Init) => <SelGate files={[econ]}>{([econ]) => <C econ={econ} initial={initial} />}</SelGate> }; } },
  unemp: {
    // UNEMP_MONTHLY_GATED switches this chart to the OECD monthly file (same file as #2) once the Data Lead gates it.
    load: async () => { const [L, { default: ChartCard }] = await Promise.all([import("@/lib/series.mjs"), import("@/src/components/ChartCard")]);
      // gated 2026-10-10: OECD monthly long file (c1_unemployment_rate_long.json)
      const ds = L.unempLongDataset((await G2(import("@/data/c1_unemployment_rate_long.json"), import("@/data-g20/c1_unemployment_rate_long.json"))).default);
      return { default: ({ initial }: Init) => <ChartCard kind="unemp" sets={{ unemp: ds }} primary initialSearch={initial} /> }; } },
  "2": {
    load: async () => { const [{ default: um }, { default: H }] = await Promise.all([G2(import("@/data/oecd_unemployment_rate_m_15plus.json"), import("@/data-g20/oecd_unemployment_rate_m_15plus.json")), import("@/src/components/HeatStrip")]);
      return { default: ({ initial }: Init) => <SelGate files={[um]}>{([um]) => <H um={um} initial={initial} />}</SelGate> }; } },
  jobs: {
    load: async () => { const [{ default: data }, { default: popJ }, { jobsPerCapitaDataset, jobsDataset, applyStarts }, { default: ChartCard }] = await Promise.all([G2(import("@/data/c1_labour_series.json"), import("@/data-g20/c1_labour_series.json")), G2(import("@/data/econ_population_joined.json"), import("@/data-g20/econ_population_joined.json")), import("@/lib/series.mjs"), import("@/src/components/ChartCard")]);
      const sets = { jobs: jobsDataset(data), jpc: applyStarts(jobsPerCapitaDataset(data, popJ)) }; return { default: ({ initial }: Init) => <ChartCard kind="jobs" sets={sets} initialSearch={initial} /> }; } },
  "22": {
    load: async () => { const [{ default: rate }, { default: S }] = await Promise.all([G2(import("@/data/c1_employment_rate.json"), import("@/data-g20/c1_employment_rate.json")), import("@/src/components/Scorecard")]);
      return { default: ({ initial }: Init) => <SelGate files={[rate]}>{([rate]) => <S rate={rate} />}</SelGate> }; } },
  "7": {
    load: async () => { const [{ default: bis }, { policyDataset }, { default: ChartCard }] = await Promise.all([G2(import("@/data/bis_policy_rate_m.json"), import("@/data-g20/bis_policy_rate_m.json")), import("@/lib/series.mjs"), import("@/src/components/ChartCard")]);
      const sets = { policy: policyDataset(bis) }; return { default: ({ initial }: Init) => <ChartCard kind="policy" sets={sets} primary initialSearch={initial} /> }; } },
  // ---- Finance wave ----
  "13": {
    load: async () => { const [{ default: hl }, { default: core }, F, { default: H }] = await Promise.all([G2(import("@/data/oecd_cpi_headline_yoy.json"), import("@/data-g20/oecd_cpi_headline_yoy.json")), G2(import("@/data/oecd_cpi_core_yoy.json"), import("@/data-g20/oecd_cpi_core_yoy.json")), import("./finance"), import("@/src/components/HeatStrip")]);
      return { default: ({ initial }: Init) => <SelGate files={[hl, core]}>{([hl, core]) => <H cfg={F.cpiCfg(hl, core)} initial={initial} />}</SelGate> }; } },
  "3": {
    load: async () => { const [{ default: f }, { default: B }] = await Promise.all([G2(import("@/data/oecd_gdp_per_capita_ppp_current.json"), import("@/data-g20/oecd_gdp_per_capita_ppp_current.json")), import("@/src/components/Bump")]);
      return { default: ({ initial }: Init) => <SelGate files={[f]}>{([f]) => <B file={f} initial={initial} />}</SelGate> }; } },
  "25": {
    load: async () => { const [{ default: f }, E, { default: R }] = await Promise.all([G2(import("@/data/oecd_idd_gini_disposable.json"), import("@/data-g20/oecd_idd_gini_disposable.json")), import("./economy"), import("@/src/components/RankBar")]);
      return { default: ({ initial }: Init) => <SelGate files={[f]}>{([f]) => <R file={f} spec={E.giniSpec} />}</SelGate> }; } },
  "15": {
    load: async () => { const [{ default: g }, { default: b }, E, { default: S }] = await Promise.all([G2(import("@/data/oecd_msti_gerd_pct_gdp.json"), import("@/data-g20/oecd_msti_gerd_pct_gdp.json")), G2(import("@/data/oecd_msti_berd_pct_gdp.json"), import("@/data-g20/oecd_msti_berd_pct_gdp.json")), import("./economy"), import("@/src/components/StackRank")]);
      return { default: ({ initial }: Init) => <SelGate files={[g, b]}>{([g, b]) => <S spec={E.rdSpec(g, b)} initial={initial} />}</SelGate> }; } },
  // ---- Society wave ----
  "4": {
    load: async () => { const [{ default: f }, S, { default: C }] = await Promise.all([G2(import("@/data/wb_SP.POP.65UP.TO.ZS.json"), import("@/data-g20/wb_SP.POP.65UP.TO.ZS.json")), import("./society"), import("@/src/components/Slope")]);
      return { default: ({ initial }: Init) => <SelGate files={[f]}>{([f]) => <C file={f} spec={S.greySpec} initial={initial} />}</SelGate> }; } },
  "11": {
    load: async () => { const [{ default: f }, S, { default: C }] = await Promise.all([G2(import("@/data/wb_SP.DYN.TFRT.IN.json"), import("@/data-g20/wb_SP.DYN.TFRT.IN.json")), import("./society"), import("@/src/components/YearMultiples")]);
      return { default: ({ initial }: Init) => <SelGate files={[f]}>{([f]) => <C file={f} spec={S.fertSpec} initial={initial} />}</SelGate> }; } },
  "23": {
    load: async () => { const [{ default: f }, S, { default: C }] = await Promise.all([G2(import("@/data/wb_SM.POP.TOTL.ZS.json"), import("@/data-g20/wb_SM.POP.TOTL.ZS.json")), import("./society"), import("@/src/components/Waffle")]);
      return { default: ({ initial }: Init) => <SelGate files={[f]}>{([f]) => <C file={f} spec={S.migSpec} initial={initial} />}</SelGate> }; } },
  "8": {
    load: async () => { const [{ default: hx }, { default: le }, S, { default: C }] = await Promise.all([G2(import("@/data/wb_SH.XPD.CHEX.GD.ZS.json"), import("@/data-g20/wb_SH.XPD.CHEX.GD.ZS.json")), G2(import("@/data/oecd_life_expectancy_birth.json"), import("@/data-g20/oecd_life_expectancy_birth.json")), import("./society"), import("@/src/components/Scatter")]);
      return { default: ({ initial }: Init) => <SelGate files={[hx, le]}>{([hx, le]) => <C spec={S.healthSpec(hx, le)} initial={initial} />}</SelGate> }; } },
  "16": {
    load: async () => { const [{ default: older }, { default: younger }, S, { default: D }] = await Promise.all([G2(import("@/data/oecd_eag_tertiary_attainment_25_64.json"), import("@/data-g20/oecd_eag_tertiary_attainment_25_64.json")), G2(import("@/data/oecd_eag_tertiary_attainment_25_34.json"), import("@/data-g20/oecd_eag_tertiary_attainment_25_34.json")), import("./society"), import("@/src/components/Dumbbell")]);
      return { default: ({ initial }: Init) => <SelGate files={[older, younger]}>{([older, younger]) => <D file={{ older, younger }} spec={S.degreeSpec} />}</SelGate> }; } },
  // ---- Environment wave ----
  "5": {
    load: async () => { const [{ default: g }, { default: c }, E, { default: C }] = await Promise.all([G2(import("@/data/wb_NY.GDP.PCAP.PP.KD.json"), import("@/data-g20/wb_NY.GDP.PCAP.PP.KD.json")), G2(import("@/data/wb_EN.GHG.CO2.PC.CE.AR5.json"), import("@/data-g20/wb_EN.GHG.CO2.PC.CE.AR5.json")), import("./environment"), import("@/src/components/Scatter")]);
      return { default: ({ initial }: Init) => <SelGate files={[g, c]}>{([g, c]) => <C spec={E.richerSpec(g, c)} initial={initial} />}</SelGate> }; } },
  "14": {
    load: async () => { const [{ default: g }, { default: p }, { default: T }] = await Promise.all([G2(import("@/data/oecd_ghg_total.json"), import("@/data-g20/oecd_ghg_total.json")), G2(import("@/data/econ_population_joined.json"), import("@/data-g20/econ_population_joined.json")), import("@/src/components/TileMap")]);
      return { default: ({ initial }: Init) => <SelGate files={[g, p]} need={[g]}>{([g, p]) => <T ghg={g} pop={p} initial={initial} />}</SelGate> }; } },
  "9": {
    load: async () => { const [{ default: e }, { default: M }] = await Promise.all([G2(import("@/data/ember_electricity_mix_share.json"), import("@/data-g20/ember_electricity_mix_share.json")), import("@/src/components/MixArea")]);
      return { default: ({ initial }: Init) => <M ember={e} initial={initial} /> }; } },
  "17": {
    load: async () => { const [{ default: y }, { default: a }, L, { default: R }] = await Promise.all([G2(import("@/data/oecd_unemployment_rate_m_15_24.json"), import("@/data-g20/oecd_unemployment_rate_m_15_24.json")), G2(import("@/data/oecd_unemployment_rate_m_15plus.json"), import("@/data-g20/oecd_unemployment_rate_m_15plus.json")), import("./labour"), import("@/src/components/RankBar")]);
      return { default: ({ initial }: Init) => <SelGate files={[y, a]}>{([y, a]) => <R file={a} spec={L.youthSpec(y)} />}</SelGate> }; } },
  "18": {
    load: async () => { const [{ default: f }, L, { default: R }] = await Promise.all([G2(import("@/data/oecd_avg_annual_hours_worked.json"), import("@/data-g20/oecd_avg_annual_hours_worked.json")), import("./labour"), import("@/src/components/RankBar")]);
      return { default: ({ initial }: Init) => <SelGate files={[f]}>{([f]) => <R file={f} spec={L.hoursSpec} />}</SelGate> }; } },
  "12": {
    load: async () => { const [{ default: f }, L, { default: S }] = await Promise.all([G2(import("@/data/oecd_avg_annual_wage_usd_ppp.json"), import("@/data-g20/oecd_avg_annual_wage_usd_ppp.json")), import("./labour"), import("@/src/components/Slope")]);
      return { default: ({ initial }: Init) => <SelGate files={[f]}>{([f]) => <S file={f} spec={L.wageSpec} />}</SelGate> }; } },
  "24": {
    load: async () => { const [{ default: f }, L, { default: S }] = await Promise.all([G2(import("@/data/ilo_labour_share_gdp.json"), import("@/data-g20/ilo_labour_share_gdp.json")), import("./labour"), import("@/src/components/Slope")]);
      return { default: ({ initial }: Init) => <SelGate files={[f]}>{([f]) => <S file={f} spec={L.shareSpec} />}</SelGate> }; } },
  "10": {
    load: async () => { const [{ default: f }, F, { default: D }] = await Promise.all([G2(import("@/data/imf_weo_GGXWDG_NGDP.json"), import("@/data-g20/imf_weo_GGXWDG_NGDP.json")), import("./finance"), import("@/src/components/Dumbbell")]);
      return { default: ({ initial }: Init) => <SelGate files={[f]}>{([f]) => <D file={f} spec={F.debtSpec} />}</SelGate> }; } },
  "6": {
    load: async () => { const [{ default: f }, F, { default: D }] = await Promise.all([G2(import("@/data/oecd_house_price_to_income.json"), import("@/data-g20/oecd_house_price_to_income.json")), import("./finance"), import("@/src/components/Dumbbell")]);
      return { default: ({ initial }: Init) => <SelGate files={[f]}>{([f]) => <D file={f} spec={F.houseSpec} />}</SelGate> }; } },
  "20": {
    load: async () => { const [{ default: f }, F, { default: M }] = await Promise.all([G2(import("@/data/bis_household_credit_pct_gdp.json"), import("@/data-g20/bis_household_credit_pct_gdp.json")), import("./finance"), import("@/src/components/Multiples")]);
      return { default: ({ initial }: Init) => <SelGate files={[f]}>{([f]) => <M file={f} spec={F.creditSpec} initial={initial} />}</SelGate> }; } },
  "19": {
    load: async () => { const [{ default: f }, F, { default: M }] = await Promise.all([G2(import("@/data/oecd_bop_current_account_pct_gdp_q.json"), import("@/data-g20/oecd_bop_current_account_pct_gdp_q.json")), import("./finance"), import("@/src/components/Multiples")]);
      return { default: ({ initial }: Init) => <SelGate files={[f]}>{([f]) => <M file={f} spec={F.bopSpec} initial={initial} />}</SelGate> }; } },
  "21": {
    load: async () => { const [{ default: e }, { default: i }, { default: S }] = await Promise.all([G2(import("@/data/wb_NE.EXP.GNFS.ZS.json"), import("@/data-g20/wb_NE.EXP.GNFS.ZS.json")), G2(import("@/data/wb_NE.IMP.GNFS.ZS.json"), import("@/data-g20/wb_NE.IMP.GNFS.ZS.json")), import("@/src/components/StackBar")]);
      return { default: ({ initial }: Init) => <SelGate files={[e, i]}>{([e, i]) => <S exp={e} imp={i} initial={initial} />}</SelGate> }; } },
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
