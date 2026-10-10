# 50Y coverage audit (need data from mid-1976: 1976-07 monthly, 1976-Q3 quarterly)

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
