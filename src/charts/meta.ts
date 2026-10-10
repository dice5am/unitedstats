// Central chart registry metadata. The id is the stable link key (?chart=<id>), never the title.
// Titles are plain and follow the selected view. One factual description line per chart.
export type BuiltId = "gdp" | "1" | "unemp" | "2" | "jobs" | "22" | "7" | "13" | "10" | "6" | "20" | "19" | "21";
export type ChartId = BuiltId | "3" | "25" | "15" | "17" | "12" | "18" | "24" | "4" | "11" | "23" | "8" | "16" | "5" | "9" | "14";
export type TabId = "economy" | "labour" | "finance" | "society" | "environment";
export type ChartMeta = { id: ChartId; brief: string | null; tab: TabId; titles: Record<string, string>; desc: string; params: string[]; data: string[]; built?: boolean; src?: string[] };
// src: short source names for the headline tag ("BIS · Aug 2026"); must match the names in the chart's full source line.
export const CHART_META: Record<ChartId, ChartMeta> = {
  gdp: { id: "gdp", src: ["OECD"], built: true, brief: null, tab: "economy", titles: { gdp: "GDP", pc: "GDP per capita" }, desc: "Real GDP, inflation-adjusted, indexed to 100 at the window start", params: ["g_view", "g_win", "g_on"], data: ["econ_gdp_series.json"] },
  "1": { id: "1", src: ["OECD"], built: true, brief: "#1", tab: "economy", titles: { gdp: "Real GDP vs 2019", pc: "Real GDP per capita vs 2019" }, desc: "Real GDP indexed to Q4 2019 = 100, quarterly", params: ["cr_view"], data: ["econ_gdp_series.json"] },
  unemp: { id: "unemp", src: ["OECD"], built: true, brief: null, tab: "labour", titles: { unemp: "Unemployment rate" }, desc: "Unemployed as % of the labour force, ages 15+", params: ["u_win", "u_on"], data: ["c1_unemployment_rate_long.json"] },
  "2": { id: "2", src: ["OECD"], built: true, brief: "#2", tab: "labour", titles: { _: "Unemployment rate by month" }, desc: "Unemployed as % of the labour force, monthly", params: ["uh_win"], data: ["oecd_unemployment_rate_m_15plus.json"] },
  jobs: { id: "jobs", src: ["OECD"], built: true, brief: null, tab: "labour", titles: { jobs: "Jobs", jpc: "Jobs per capita" }, desc: "People employed, ages 15+, indexed to 100 at the window start", params: ["j_view", "j_win", "j_on"], data: ["c1_labour_series.json", "econ_gdp_series.json"] },
  "22": { id: "22", src: ["OECD"], built: true, brief: "#22", tab: "labour", titles: { _: "Employment rate change since 2019" }, desc: "Employment rate, ages 15–64, change since Q4 2019 in percentage points", params: [], data: ["c1_employment_rate.json"] },
  "3": { id: "3", brief: "#3", tab: "economy", titles: { _: "GDP per capita ranking" }, desc: "GDP per person at current PPPs, rank 1–7 each year", params: [], data: [] },
  "25": { id: "25", brief: "#25", tab: "economy", titles: { _: "Income inequality (Gini)" }, desc: "Gini coefficient of disposable income, latest year per country", params: [], data: [] },
  "15": { id: "15", brief: "#15", tab: "economy", titles: { _: "R&D spending, % of GDP" }, desc: "Gross domestic spending on R&D, business and other, % of GDP", params: [], data: [] },
  "17": { id: "17", brief: "#17", tab: "labour", titles: { _: "Youth vs overall unemployment" }, desc: "Unemployment rate ages 15–24 divided by the rate for ages 15+", params: [], data: [] },
  "12": { id: "12", brief: "#12", tab: "labour", titles: { _: "Real average wages" }, desc: "Average annual wages, constant prices, USD at PPP", params: [], data: [] },
  "18": { id: "18", brief: "#18", tab: "labour", titles: { _: "Annual hours worked per worker" }, desc: "Average annual hours actually worked per worker", params: [], data: [] },
  "24": { id: "24", brief: "#24", tab: "labour", titles: { _: "Labour share of income" }, desc: "Labour income as % of GDP", params: [], data: [] },
  "13": { id: "13", src: ["OECD"], built: true, brief: "#13", tab: "finance", titles: { headline: "Inflation", core: "Core inflation" }, desc: "Consumer prices, % change on a year earlier, monthly", params: ["in_view", "in_win"], data: ["oecd_cpi_headline_yoy.json", "oecd_cpi_core_yoy.json"] },
  "7": { id: "7", src: ["BIS"], built: true, brief: "#7", tab: "finance", titles: { policy: "Central bank policy rates" }, desc: "Central bank policy rate, %, end of month; euro area from 1999", params: ["pr_win", "pr_on"], data: ["bis_policy_rate_m.json"] },
  "10": { id: "10", src: ["IMF"], built: true, brief: "#10", tab: "finance", titles: { _: "Government debt, 2007 vs now" }, desc: "General government gross debt, % of GDP", params: [], data: ["imf_weo_GGXWDG_NGDP.json"] },
  "6": { id: "6", src: ["OECD"], built: true, brief: "#6", tab: "finance", titles: { _: "House prices vs incomes since 2010" }, desc: "House prices ÷ disposable income per person, index", params: [], data: ["oecd_house_price_to_income.json"] },
  "20": { id: "20", src: ["BIS"], built: true, brief: "#20", tab: "finance", titles: { _: "Household debt since 2007" }, desc: "Credit to households, % of GDP", params: ["hd_win"], data: ["bis_household_credit_pct_gdp.json"] },
  "19": { id: "19", src: ["OECD"], built: true, brief: "#19", tab: "finance", titles: { _: "Current account balance, % of GDP" }, desc: "Current account balance, % of GDP, quarterly", params: ["ca_win"], data: ["oecd_bop_current_account_pct_gdp_q.json"] },
  "21": { id: "21", src: ["World Bank"], built: true, brief: "#21", tab: "finance", titles: { _: "Trade, % of GDP" }, desc: "Exports and imports of goods and services, % of GDP", params: ["tr_year"], data: ["wb_NE.EXP.GNFS.ZS.json", "wb_NE.IMP.GNFS.ZS.json"] },
  "4": { id: "4", brief: "#4", tab: "society", titles: { _: "Population aged 65+" }, desc: "People aged 65 and over, % of population", params: [], data: [] },
  "11": { id: "11", brief: "#11", tab: "society", titles: { _: "Fertility rate" }, desc: "Births per woman", params: [], data: [] },
  "23": { id: "23", brief: "#23", tab: "society", titles: { _: "Foreign-born population share" }, desc: "International migrant stock, % of population", params: [], data: [] },
  "8": { id: "8", brief: "#8", tab: "society", titles: { _: "Health spending vs life expectancy" }, desc: "Health spending, % of GDP, against life expectancy at birth", params: [], data: [] },
  "16": { id: "16", brief: "#16", tab: "society", titles: { _: "Share with a university degree, by age" }, desc: "Tertiary attainment, ages 25–34 and 25–64, %", params: [], data: [] },
  "5": { id: "5", brief: "#5", tab: "environment", titles: { _: "GDP per capita vs CO2 per capita" }, desc: "GDP per person at PPP against CO2 per person", params: [], data: [] },
  "9": { id: "9", brief: "#9", tab: "environment", titles: { _: "Electricity generation by source" }, desc: "Share of electricity from coal, oil and gas, nuclear and other", params: [], data: [] },
  "14": { id: "14", brief: "#14", tab: "environment", titles: { _: "Greenhouse gas emissions since 1990" }, desc: "Total greenhouse gas emissions, change since 1990", params: [], data: [] },
};
export const chartTitle = (id: ChartId, view?: string) => { const t = CHART_META[id].titles; return (view && t[view]) || Object.values(t)[0]; };

// Tab order (Cavin, Round 4b) and each tab's chart order (first = default hero chart).
export const TABS: { id: TabId; label: string }[] = [
  { id: "economy", label: "Economy" }, { id: "labour", label: "Labour" }, { id: "finance", label: "Finance" },
  { id: "society", label: "Society" }, { id: "environment", label: "Environment" },
];
export const TAB_CHARTS: Record<TabId, ChartId[]> = {
  economy: ["gdp", "1", "3", "25", "15"],
  labour: ["unemp", "jobs", "2", "17", "22", "12", "18", "24"],
  finance: ["13", "7", "10", "6", "20", "19", "21"],
  society: ["4", "11", "23", "8", "16"],
  environment: ["5", "9", "14"],
};

export const srcTag = (id: ChartId, end: string) => `${(CHART_META[id].src || []).join(", ")} · ${end}`;
