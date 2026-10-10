// Central chart registry metadata. The id is the stable link key (?chart=<id>), never the title.
// Titles are plain and follow the selected view. One factual description line per chart.
export type ChartId = "gdp" | "1" | "unemp" | "2" | "jobs" | "22";
export type ChartMeta = { id: ChartId; brief: string | null; tab: "economy" | "labour"; titles: Record<string, string>; desc: string; params: string[]; data: string[] };
export const CHART_META: Record<ChartId, ChartMeta> = {
  gdp: { id: "gdp", brief: null, tab: "economy", titles: { gdp: "GDP", pc: "GDP per capita" }, desc: "Real GDP, inflation-adjusted, indexed to 100 at the window start", params: ["g_view", "g_win", "g_on"], data: ["econ_gdp_series.json"] },
  "1": { id: "1", brief: "#1", tab: "economy", titles: { gdp: "Real GDP vs 2019", pc: "Real GDP per capita vs 2019" }, desc: "Real GDP indexed to Q4 2019 = 100, quarterly", params: ["cr_view"], data: ["econ_gdp_series.json"] },
  unemp: { id: "unemp", brief: null, tab: "labour", titles: { unemp: "Unemployment rate" }, desc: "Unemployed as % of the labour force, ages 15+", params: ["u_win", "u_on"], data: ["c1_unemployment_rate.json"] },
  "2": { id: "2", brief: "#2", tab: "labour", titles: { _: "Unemployment rate by month" }, desc: "Unemployed as % of the labour force, monthly", params: ["uh_win"], data: ["oecd_unemployment_rate_m_15plus.json"] },
  jobs: { id: "jobs", brief: null, tab: "labour", titles: { jobs: "Jobs", jpc: "Jobs per capita" }, desc: "People employed, ages 15+, indexed to 100 at the window start", params: ["j_view", "j_win", "j_on"], data: ["c1_labour_series.json", "econ_gdp_series.json"] },
  "22": { id: "22", brief: "#22", tab: "labour", titles: { _: "Employment rate change since 2019" }, desc: "Employment rate, ages 15–64, change since Q4 2019 in percentage points", params: [], data: ["c1_employment_rate.json"] },
};
export const chartTitle = (id: ChartId, view?: string) => { const t = CHART_META[id].titles; return (view && t[view]) || Object.values(t)[0]; };
