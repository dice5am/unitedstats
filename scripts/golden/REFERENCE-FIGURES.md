# Reference figures (computed 2026-10-10 from warehouse export JSON, own Python: reffig.py)

Wave order as instructed. Vacancies: no card among the 25 in decision-brief.md is a vacancies card, so nothing skipped on that ground (vacancies export exists but is unused).

## Card 1 The comeback race  
method: real GDP per capita latest/2019-Q4×100; back to 100 at 2021-Q4  
unit: index 2019-Q4=100  
source: canada-factcheck econ_gdp_series.json gdp_per_capita
- CAN | 2026-Q2 | 102.2 | real GDP per capita latest/2019-Q4×100; back to 100 at 2021-Q4
- USA | 2026-Q2 | 112.4 | real GDP per capita latest/2019-Q4×100; back to 100 at 2021-Q1
- JPN | 2026-Q2 | 108.2 | real GDP per capita latest/2019-Q4×100; back to 100 at 2021-Q1
- GBR | 2026-Q2 | 101.7 | real GDP per capita latest/2019-Q4×100; back to 100 at 2022-Q1
- DEU | 2026-Q2 | 100.4 | real GDP per capita latest/2019-Q4×100; back to 100 at 2021-Q3
- FRA | 2026-Q1 | 103.8 | real GDP per capita latest/2019-Q4×100; back to 100 at 2021-Q4
- ITA | 2026-Q2 | 110.1 | real GDP per capita latest/2019-Q4×100; back to 100 at 2021-Q3

## Card 22 Jobs recovery scorecard  
method: employment rate 15-64 latest quarter − 2019-Q4  
unit: pp  
source: canada-factcheck c1_employment_rate.json quarterly
- CAN | 2019-Q4→2026-Q2 | 0.03
- USA | 2019-Q4→2026-Q3 | 0.27
- JPN | 2019-Q4→2026-Q2 | 2.39
- GBR | 2019-Q4→2026-Q2 | -1.28
- DEU | 2019-Q4→2026-Q2 | 2.58
- FRA | 2019-Q4→2026-Q2 | 2.3
- ITA | 2019-Q4→2026-Q2 | 3.95

## Card 2 Unemployment heat strip  
method: latest monthly value  
unit: % of labour force  
source: export/oecd_unemployment_rate_m_15plus.json
- CAN | 2026-08 | 6.4
- USA | 2026-09 | 4.2
- JPN | 2026-08 | 2.5
- GBR | 2026-06 | 4.9
- DEU | 2026-08 | 4.0
- FRA | 2026-08 | 8.2
- ITA | 2026-08 | 6.2

## Card 3 Living-standards league  
method: rank by value, 1=highest  
unit: USD current PPP per person  
source: export/oecd_gdp_per_capita_ppp_current.json
- CAN | 2025 | rank 3 (66,783)
- USA | 2025 | rank 1 (89,985)
- JPN | 2025 | rank 7 (55,488)
- GBR | 2025 | rank 4 (64,707)
- DEU | 2025 | rank 2 (76,396)
- FRA | 2025 | rank 5 (63,974)
- ITA | 2025 | rank 6 (62,967)

## Card 7 Rate hike  
method: latest  
unit: % (end of month)  
source: export/bis_policy_rate_m.json
- CAN | 2026-09 | 2.25
- USA | 2026-09 | 3.875
- GBR | 2026-09 | 3.75
- JPN | 2026-09 | 1.25
- XM | 2026-09 | 2.5

## Card 10 Public debt  
method: latest actual − 2007  
unit: % GDP  
source: export/imf_weo_GGXWDG_NGDP.json
- CAN | 2007→2024 | 67.2→110.0 (Δ 42.8)
- USA | 2007→2025 | 64.9→123.9 (Δ 58.9)
- JPN | 2007→2024 | 150.4→214.5 (Δ 64.0)
- GBR | 2007→2025 | 43.0→102.3 (Δ 59.3)
- DEU | 2007→2025 | 63.7→62.9 (Δ -0.8)
- FRA | 2007→2024 | 65.5→113.2 (Δ 47.7)
- ITA | 2007→2025 | 103.5→137.1 (Δ 33.6)

## Card 12 Whose pay grew  
method: 2025/1990−1  
unit: % growth  
source: export/oecd_avg_annual_wage_usd_ppp.json
- CAN | 1990→2025 | 37.9
- USA | 1990→2025 | 53.4
- JPN | 1990→2025 | -1.2
- GBR | 1990→2025 | 47.2
- DEU | 1990→2025 | 35.0
- FRA | 1990→2025 | 34.6
- ITA | 1990→2025 | -2.1

## Card 17 Young job-hunting  
method: youth 15-24 / 15+, latest common month  
unit: ratio  
source: export/oecd_unemployment_rate_m_15_24.json, _15plus.json
- CAN | 2026-08 | 2.02
- USA | 2026-09 | 2.36
- JPN | 2026-08 | 1.4
- GBR | 2026-06 | 3.35
- DEU | 2026-08 | 1.85
- FRA | 2026-08 | 2.51
- ITA | 2026-08 | 3.27

## Card 18 Working less  
method: latest − 2000  
unit: hours/worker/yr  
source: export/oecd_avg_annual_hours_worked.json
- CAN | 2000→2025 | -102.0 h (-5.7%)
- USA | 2000→2025 | -80.0 h (-4.2%)
- JPN | 2000→2025 | -223.0 h (-12.3%)
- GBR | 2000→2025 | -25.0 h (-1.6%)
- DEU | 2000→2025 | -132.0 h (-9.0%)
- FRA | 2000→2025 | -44.0 h (-2.8%)
- ITA | 2000→2025 | -112.0 h (-6.1%)

## Card 24 Labour share  
method: latest actual − 2004  
unit: % GDP  
source: export/ilo_labour_share_gdp.json
- CAN | 2004→2024 | 60.1→59.0 (Δ -1.1)
- USA | 2004→2024 | 62.0→55.5 (Δ -6.6)
- JPN | 2004→2023 | 53.7→54.4 (Δ 0.6)
- GBR | 2004→2023 | 58.6→55.9 (Δ -2.8)
- DEU | 2004→2024 | 62.0→62.0 (Δ 0.0)
- FRA | 2004→2023 | 60.0→59.7 (Δ -0.3)
- ITA | 2004→2024 | 57.3→57.8 (Δ 0.5)

## Card 25 Inequality  
method: latest year (D_CUR)  
unit: Gini 0-1  
source: export/oecd_idd_gini_disposable.json
- CAN | 2023 | 0.306
- USA | 2023 | 0.394
- JPN | 2021 | 0.338
- GBR | 2023 | 0.367
- DEU | 2023 | 0.307
- FRA | 2023 | 0.299
- ITA | 2023 | 0.325

## Card 4 Greying  
method: 2025 − 1990  
unit: % of pop 65+  
source: export/wb_SP.POP.65UP.TO.ZS.json
- CAN | 1990→2025 | 11.2→20.3 (Δ 9.0)
- USA | 1990→2025 | 12.3→18.4 (Δ 6.1)
- JPN | 1990→2025 | 12.2→30.0 (Δ 17.8)
- GBR | 1990→2025 | 15.9→19.7 (Δ 3.8)
- DEU | 1990→2025 | 14.9→23.7 (Δ 8.8)
- FRA | 1990→2025 | 14.0→22.5 (Δ 8.6)
- ITA | 1990→2025 | 15.0→25.1 (Δ 10.1)

## Card 11 Baby gap  
method: latest  
unit: births per woman  
source: export/wb_SP.DYN.TFRT.IN.json
- CAN | 2024 | 1.25
- USA | 2024 | 1.63
- JPN | 2024 | 1.15
- GBR | 2024 | 1.55
- DEU | 2024 | 1.36
- FRA | 2024 | 1.61
- ITA | 2024 | 1.18

## Card 23 Migrants  
method: latest year (1990 value shown per row)  
unit: % of population  
source: export/wb_SM.POP.TOTL.ZS.json
- CAN | 2024 | 22.2 | latest (1990: 15.3)
- USA | 2024 | 15.2 | latest (1990: 9.2)
- JPN | 2024 | 2.8 | latest (1990: 0.9)
- GBR | 2024 | 17.1 | latest (1990: 6.4)
- DEU | 2024 | 19.8 | latest (1990: 8.7)
- FRA | 2024 | 13.8 | latest (1990: 10.3)
- ITA | 2024 | 11 | latest (1990: 2.7)

## Card 6 Homes vs paychecks  
method: latest quarter vs 2010-Q1  
unit: index  
source: export/oecd_house_price_to_income.json
- CAN | 2010-Q1→2026-Q2 | 91.0→120.9 (32.9%)
- USA | 2010-Q1→2026-Q2 | 102.9→123.4 (20.0%)
- JPN | 2010-Q1→2025-Q4 | 96.7→114.4 (18.3%)
- GBR | 2010-Q1→2026-Q2 | 100.6→103.5 (2.9%)
- DEU | 2010-Q1→2026-Q2 | 94.8→103.0 (8.6%)
- FRA | 2010-Q1→2026-Q2 | 102.1→92.2 (-9.7%)
- ITA | 2010-Q1→2026-Q2 | 119.1→87.8 (-26.3%)

## Card 20 Household borrowing  
method: latest vs 2007-Q4  
unit: % GDP  
source: export/bis_household_credit_pct_gdp.json
- CAN | 2007-Q4→2026-Q1 | 80.8→100.0
- USA | 2007-Q4→2026-Q1 | 98.4→67.2
- JPN | 2007-Q4→2026-Q1 | 59.5→60.8
- GBR | 2007-Q4→2026-Q1 | 94.3→72.6
- DEU | 2007-Q4→2026-Q1 | 60.4→47.9
- FRA | 2007-Q4→2026-Q1 | 47.1→59.1
- ITA | 2007-Q4→2026-Q1 | 37.9→35.9

## Card 5 Richer, emitting less  
method: 2024/1990−1 each axis  
unit: % change  
source: export/wb_NY.GDP.PCAP.PP.KD.json, wb_EN.GHG.CO2.PC.CE.AR5.json
- CAN | 1990→2024 | GDP pc 42.0%, CO2 pc -12.0%
- USA | 1990→2024 | GDP pc 71.0%, CO2 pc -32.0%
- JPN | 1990→2024 | GDP pc 31.0%, CO2 pc -17.0%
- GBR | 1990→2024 | GDP pc 59.0%, CO2 pc -59.0%
- DEU | 1990→2024 | GDP pc 48.0%, CO2 pc -46.0%
- FRA | 1990→2024 | GDP pc 42.0%, CO2 pc -39.0%
- ITA | 1990→2024 | GDP pc 25.0%, CO2 pc -32.0%

## Card 9 Electricity mix  
method: latest year where all three present; oil+gas=fossil−coal; other=100−fossil−nuclear  
unit: % of output  
source: export/wb_EG.ELC.*.ZS.json
- CAN | 2025 | coal 2.4, oil+gas 19.3, nuclear 13.2, other 65.1 | latest year where all three present; oil+gas=fossil−coal; other=100−fossil−nuclear
- USA | 2025 | coal 17.2, oil+gas 40.4, nuclear 17.4, other 25.0 | latest year where all three present; oil+gas=fossil−coal; other=100−fossil−nuclear
- JPN | 2025 | coal 28.6, oil+gas 31.6, nuclear 10.0, other 29.8 | latest year where all three present; oil+gas=fossil−coal; other=100−fossil−nuclear
- GBR | 2025 | coal 0.1, oil+gas 32.1, nuclear 12.3, other 55.4 | latest year where all three present; oil+gas=fossil−coal; other=100−fossil−nuclear
- DEU | 2023 | coal 25.6, oil+gas 17.2, nuclear 1.4, other 55.9 | latest year where all three present; oil+gas=fossil−coal; other=100−fossil−nuclear
- FRA | 2025 | coal 0.4, oil+gas 3.9, nuclear 67.2, other 28.6 | latest year where all three present; oil+gas=fossil−coal; other=100−fossil−nuclear
- ITA | 2021 | coal 5.5, oil+gas 52.5, nuclear 0, other 42.0 | latest year where all three present; oil+gas=fossil−coal; other=100−fossil−nuclear

## Card 14 Emissions since 1990  
method: latest/1990−1  
unit: % change  
source: export/oecd_ghg_total.json
- CAN | 1990→2024 | 12.6
- USA | 1990→2022 | -3.0
- JPN | 1990→2024 | -17.5
- GBR | 1990→2024 | -52.1
- DEU | 1990→2024 | -48.1
- FRA | 1990→2024 | -32.3
- ITA | 1990→2024 | -30.2

## Card 8 Spending vs lifespan  
method: latest common year  
unit: % GDP; years  
source: export/wb_SH.XPD.CHEX.GD.ZS.json, oecd_life_expectancy_birth.json
- CAN | 2024 | 11.3% GDP, 82.2 yrs
- USA | 2023 | 16.7% GDP, 78.4 yrs
- JPN | 2023 | 10.7% GDP, 84.1 yrs
- GBR | 2024 | 11.1% GDP, 81.3 yrs
- DEU | 2024 | 12.3% GDP, 81.2 yrs
- FRA | 2024 | 11.5% GDP, 83.0 yrs
- ITA | 2024 | 8.4% GDP, 83.7 yrs

## Card 19 Current account  
method: latest quarter  
unit: % GDP  
source: export/oecd_bop_current_account_pct_gdp_q.json
- CAN | 2026-Q2 | 1.0
- USA | 2026-Q2 | -3.0
- JPN | 2026-Q2 | 5.0
- GBR | 2026-Q2 | -2.5
- DEU | 2026-Q2 | 4.9
- FRA | 2026-Q2 | -0.2
- ITA | 2026-Q2 | -0.6

## Card 21 How open  
method: latest year, exports+imports  
unit: % GDP  
source: export/wb_NE.EXP.GNFS.ZS.json, wb_NE.IMP.GNFS.ZS.json
- CAN | 2025 | exp 31.3 + imp 32.2 = 63.5
- USA | 2024 | exp 11.0 + imp 14.0 = 25.0
- JPN | 2024 | exp 22.0 + imp 22.9 = 44.9
- GBR | 2025 | exp 30.6 + imp 31.9 = 62.5
- DEU | 2025 | exp 40.4 + imp 38.1 = 78.5
- FRA | 2025 | exp 33.4 + imp 33.8 = 67.2
- ITA | 2025 | exp 32.2 + imp 30.3 = 62.5

## Card 15 Who pays for research  
method: latest common year; rest=GERD−BERD  
unit: % GDP  
source: export/oecd_msti_*_pct_gdp.json
- CAN | 2025 | GERD 1.81, BERD 1.09, rest 0.71
- USA | 2024 | GERD 3.44, BERD 2.67, rest 0.78
- JPN | 2024 | GERD 3.62, BERD 2.86, rest 0.76
- GBR | 2023 | GERD 2.75, BERD 1.93, rest 0.82
- DEU | 2024 | GERD 3.13, BERD 2.14, rest 0.99
- FRA | 2024 | GERD 2.18, BERD 1.44, rest 0.74
- ITA | 2024 | GERD 1.38, BERD 0.79, rest 0.59

## Card 16 Degree gap  
method: latest common year; gap=25-34 − 25-64  
unit: % / pp  
source: export/oecd_eag_tertiary_attainment_25_64/25_34.json
- CAN | 2025 | 25-34 67.7 vs 25-64 63.9 (gap 3.7)
- USA | 2025 | 25-34 52.8 vs 25-64 52.2 (gap 0.6)
- JPN | 2025 | 25-34 67.5 vs 25-64 57.9 (gap 9.6)
- GBR | 2025 | 25-34 61.2 vs 25-64 54.8 (gap 6.4)
- DEU | 2025 | 25-34 40.9 vs 25-64 35.5 (gap 5.4)
- FRA | 2025 | 25-34 55.8 vs 25-64 44.8 (gap 10.9)
- ITA | 2025 | 25-34 31.1 vs 25-64 22.3 (gap 8.8)

## Card 13 Inflation wave  
method: latest month  
unit: % y/y  
source: export/oecd_cpi_headline_yoy.json, oecd_cpi_core_yoy.json
- CAN | 2026-08 | headline 3.033981, core 1.895633
- USA | 2026-08 | headline 3.396548, core 2.44598
- JPN | 2026-08 | headline 1.9, core 1.7
- GBR | 2026-08 | headline 3.3, core 2.9
- DEU | 2026-08 | headline 2.861815, core 2.509689
- FRA | 2026-08 | headline 2.357136, core 1.155111
- ITA | 2026-08 | headline 3.310138, core 1.796076
