# 50Y coverage audit (50Y = same rule as other windows: end month minus 50 years, e.g. Aug 2026 -> Aug 1976 (Jun–Aug 1976 avg); quarterly Q3 1976 – Q2 2026)

Every data file behind a timeframe switch, per country: first non-null reading. Nothing padded or filled.

## Short of 1976 (request longer Warehouse exports)

| File | Series | Country | Freq | First reading |
|---|---|---|---|---|
| c1_labour_series.json | jobs | FRA | Q | 2003-Q1 |
| c1_labour_series.json | jobs | ITA | Q | 1998-Q1 |
| c1_unemployment_rate.json | unemp | ITA | Q | 1998-Q1 |
| c1_unemployment_rate.json | unemp | FRA | Q | 2003-Q1 |
| econ_gdp_series.json | population | CAN | Q | 1981-Q1 |
| econ_gdp_series.json | population | DEU | Q | 1991-Q1 |
| econ_gdp_series.json | population | FRA | Q | 1980-Q1 |
| econ_gdp_series.json | population | GBR | Q | 1995-Q1 |
| econ_gdp_series.json | population | ITA | Q | 1995-Q1 |
| econ_gdp_series.json | population | JPN | Q | 2007-Q3 |
| econ_gdp_series.json | gdp_per_capita | CAN | Q | 1981-Q1 |
| econ_gdp_series.json | gdp_per_capita | DEU | Q | 1991-Q1 |
| econ_gdp_series.json | gdp_per_capita | FRA | Q | 1980-Q1 |
| econ_gdp_series.json | gdp_per_capita | GBR | Q | 1995-Q1 |
| econ_gdp_series.json | gdp_per_capita | ITA | Q | 1995-Q1 |
| econ_gdp_series.json | gdp_per_capita | JPN | Q | 2007-Q3 |
| oecd_unemployment_rate_m_15plus.json | unemp_m | GBR | M | 1983-01 |
| oecd_unemployment_rate_m_15plus.json | unemp_m | DEU | M | 1991-01 |
| oecd_unemployment_rate_m_15plus.json | unemp_m | FRA | M | 1983-01 |
| oecd_unemployment_rate_m_15plus.json | unemp_m | ITA | M | 1983-01 |
| bis_policy_rate_m.json | policy | XM | M | 1999-01 |

## Covered from 1976 or earlier

| File | Series | Country | Freq | First reading |
|---|---|---|---|---|
| c1_labour_series.json | jobs | CAN | M | 1955-01 |
| c1_labour_series.json | jobs | JPN | M | 1955-01 |
| c1_labour_series.json | jobs | USA | M | 1955-01 |
| c1_labour_series.json | jobs | CAN | Q | 1955-Q1 |
| c1_labour_series.json | jobs | DEU | Q | 1962-Q1 |
| c1_labour_series.json | jobs | GBR | Q | 1971-Q1 |
| c1_labour_series.json | jobs | JPN | Q | 1955-Q1 |
| c1_labour_series.json | jobs | USA | Q | 1955-Q1 |
| c1_unemployment_rate.json | unemp | CAN | M | 1955-01 |
| c1_unemployment_rate.json | unemp | USA | M | 1955-01 |
| c1_unemployment_rate.json | unemp | JPN | M | 1955-01 |
| c1_unemployment_rate.json | unemp | CAN | Q | 1955-Q1 |
| c1_unemployment_rate.json | unemp | USA | Q | 1955-Q1 |
| c1_unemployment_rate.json | unemp | GBR | Q | 1971-Q1 |
| c1_unemployment_rate.json | unemp | JPN | Q | 1955-Q1 |
| c1_unemployment_rate.json | unemp | DEU | Q | 1962-Q1 |
| econ_gdp_series.json | gdp | CAN | Q | 1961-Q1 |
| econ_gdp_series.json | gdp | DEU | Q | 1960-Q1 |
| econ_gdp_series.json | gdp | FRA | Q | 1960-Q1 |
| econ_gdp_series.json | gdp | GBR | Q | 1955-Q1 |
| econ_gdp_series.json | gdp | ITA | Q | 1960-Q1 |
| econ_gdp_series.json | gdp | JPN | Q | 1960-Q1 |
| econ_gdp_series.json | gdp | USA | Q | 1947-Q1 |
| econ_gdp_series.json | population | USA | Q | 1947-Q1 |
| econ_gdp_series.json | gdp_per_capita | USA | Q | 1947-Q1 |
| oecd_unemployment_rate_m_15plus.json | unemp_m | CAN | M | 1955-01 |
| oecd_unemployment_rate_m_15plus.json | unemp_m | USA | M | 1955-01 |
| oecd_unemployment_rate_m_15plus.json | unemp_m | JPN | M | 1955-01 |
| bis_policy_rate_m.json | policy | CAN | M | 1960-07 |
| bis_policy_rate_m.json | policy | USA | M | 1954-07 |
| bis_policy_rate_m.json | policy | GBR | M | 1946-01 |
| bis_policy_rate_m.json | policy | JPN | M | 1946-01 |
| bis_policy_rate_m.json | policy | DEU | M | 1948-07 |
| bis_policy_rate_m.json | policy | FRA | M | 1945-01 |
| bis_policy_rate_m.json | policy | ITA | M | 1945-01 |

## Gaps inside the 50Y span (stay as gaps)

- labour USA M 1 2025-10
- labour USA Q 1 2025-Q4
- unemp USA M 1 2025-10
- unemp USA Q 1 2025-Q4
- unemp_m USA M 1 2025-10
- bis JPN M 116 1999-03,1999-04,1999-05

## Derived series (inherit the shortfalls above)
- Jobs per capita (jobs ÷ OECD population): CAN from 1981, DEU 1991, FRA 2003 (jobs), GBR 1995, ITA 1998 (jobs), JPN 2007-Q3 (population); only USA covers 1976.
- GDP per capita: as gdp_per_capita above (population-limited).
- #7 policy rates: XM (euro area) starts 1999-01 by construction; DEU/FRA/ITA national rates cover before 1999 (national lines to Dec 1998). JPN has 116 missing months from 1999-03 (stay as gaps).

## Data rule (2026-10-10)
Only extend a series with earlier data from the SAME dataset. Never splice a different source onto the front
(e.g. World Bank or annual population in front of the OECD quarterly series). If Warehouse returns no earlier data,
the country stays a late starter. Re-run: `node scripts/coverage-audit.cjs`.

Status 2026-10-10 06:30 UK: no longer exports yet. Warehouse export shas unchanged (labour fa432222, unemployment
7c77ec1f, econ 228d4521, monthly unemployment 3b47f4f6, BIS 1731dce2). `econ_population_annual.json` exists in the
Warehouse but is a different dataset (annual), so it is NOT used to extend the quarterly population.

## Re-audit 2026-10-10 ~06:50 UK, after the gated files landed (`node scripts/coverage-audit.cjs`)
50Y start = each chart's own shared end minus 50 years: GDP Q2 1976, GDP per capita Q1 1976, jobs per capita Mar 1976 (quarterly: Q1 1976), unemployment Aug 1976, jobs Aug 1976.
- Population and GDP per capita: now cover 1976 for all seven (joined files, OECD annual population before each quarterly start, flag Y, from 1975-Q1). Gated: econ_population_joined 36a710cf…5ba4, econ_gdp_per_capita_joined c47c563e…62bf.
- Jobs per capita 50Y: CAN, USA, JPN, GBR, DEU full and ranked; FRA (2003) and ITA (1998) are late starters (jobs-limited).
- Unemployment (c1_unemployment_rate_long.json, gated ccf0417e…56b1): UK, France, Italy from 1983 and Germany from 1991 are late starters. There is no earlier OECD monthly data.
- Still short: jobs FRA 2003-Q1, ITA 1998-Q1; unemployment monthly GBR/FRA/ITA 1983, DEU 1991; BIS XM 1999 (by construction).
- Germany territory: the jobs series shows no jump from Q4 1990 (37,302k) to Q1 1991 (37,183k), −0.3%, and 1976-Q1 is 32,397k, which is on a unified scale. So there is no per-capita start override.
