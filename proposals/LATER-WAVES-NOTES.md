# Notes for later waves (not built in Wave 1)

Gate note: /workspace/skyscraper/unitedstats-warehouse/gates/PULL-GATE-2026-10-10-card21-16.md

## #21 How open is each economy? (unblocked)
- Exports/imports files cover all G7 to 2025, except the US and Japan, which end in 2024.
- Default year 2024 for all seven, with a year selector. The default view never mixes years.
- Picking 2025 shows the US and Japan as n/a with a "2024 latest" tag (text-2).
- (Supersedes the earlier "Latest year: 2025 (US, Japan 2024)" subtitle idea.)

## Same pattern: #15 Who pays for research? (default 2023) and #8 Spending vs lifespan (default 2023)
- Default to the latest year all seven share, year selector, n/a + "<year> latest" tag for countries missing a later year.

## #16 The degree generation gap (tertiary attainment)
- Plot only published years. Nulls are real gaps.
- Japan and the UK start in 1997.
- Never join the line across nulls.

## Standing rules
- data/MANIFEST.json: every data file with its sha256 and card ids; golden test fails otherwise.
- Data-quality marks (DESIGN-SYSTEM.md, Round 4): imputed = dashed 2px + legend + stats-box note; gaps = break + "No data" pill;
  euro-area shared rate = one neutral line "Euro area (DE · FR · IT)" from 1999; sparse points = straight segments + dot on every point.
- Golden checks compare each card against Warehouse REFERENCE-FIGURES.md for every country; convention differences printed as DIFF, never forced.

## Chart titles (plain, direct; Cavin). Ids are link keys (?chart=<n>), never titles. Toggle charts: title follows the view.
- #1 Real GDP vs 2019 (per-capita view: Real GDP per capita vs 2019)
- #2 Unemployment rate by month
- #22 Employment rate change since 2019
- #3 GDP per capita ranking
- #25 Income inequality (Gini)
- #17 Youth vs overall unemployment
- #12 Real average wages
- #18 Annual hours worked per worker
- #24 Labour share of income
- #13 Inflation (headline and core)
- #7 Central bank policy rates
- #10 Government debt, % of GDP
- #6 House prices vs incomes
- #20 Household debt, % of GDP
- #19 Current account balance, % of GDP
- #21 Exports and imports, % of GDP
- #4 Population aged 65+
- #11 Fertility rate
- #23 Foreign-born population share
- #8 Health spending vs life expectancy
- #16 Share with a university degree, by age
- #5 GDP per capita vs CO2 per capita
- #9 Electricity generation by source
- #14 Greenhouse gas emissions since 1990
- #15 R&D spending, % of GDP
- Existing: GDP / GDP per capita; Unemployment rate; Jobs / Jobs per capita
- Toggles everywhere: total first (default), per capita second.

## Tabs (pending Cavin; shell on hold): Economy, Labour, Money, Demographics, Planet — 4–5 tabs, one hero chart at a time with a chart switcher (?chart=<id>).
