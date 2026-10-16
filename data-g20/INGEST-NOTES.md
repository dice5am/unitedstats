# G20 ingest notes (unitedstats) — 16 Oct 2026

**Where things are**
- Branch `g20` in /workspace/unitedstats. Commit 67d67fefa86f16f63fac90df3d22e650b225b4b5. Local only, not pushed.
- Data is in `data-g20/`: 35 sidecar files plus `SOURCES.json`.
- Builder: /workspace/g20-plan/build/build_g20.py.
- Raw pulls, read-only, each with a MANIFEST: skyscraper/unitedstats-warehouse/raw/{oecd,worldbank,bis,imf,ilo}_g20_20261015T22*Z. Ember data comes from the existing raw/ember_20261010T060005Z.

**Design decisions**
- The G7/Canada files in `data/` are byte-for-byte unchanged.
- Each sidecar uses the same name as the G7 file it extends and holds the new areas only.
- Every file carries:
  - `country_sources`: source, flow or indicator, dims, frequency, period range, raw path, sha256 and URL;
  - `areas_without_data`;
  - `g20_note`;
  - `eu_handling`.
- Nulls are used for gaps (never zero). Status flags are kept as published.
- **Why `data-g20/` and not `data/g20/`:** golden-test requires every entry in `data/` to be a file listed in MANIFEST, so a subfolder there fails the "data manifest" check.
- **Wiring is for App Platform:** merging the sidecars into the loaders and the country lists is their job. No UI or config files were touched.

## Per chart: what was added, fills and splices
- **gdp / #1** (econ_gdp_series):
  - OECD QNA, real local-currency SA, for all 13 areas.
  - **CHN:** an index with 2010-Q4 = 100, chained from OECD q/q growth (G1) from 2011-Q1, status D. **FLAG**
  - **RUS:** the OECD series stops at 2021-Q3. An annual World Bank NY.GDP.MKTP.KD continuation follows in `annual_continuation.RUS`. **SPLICE**
  - **Population:** OECD quarterly where published. Otherwise World Bank mid-year values, interpolated and bridged (status W).
  - `join_gap_pct` records the size of each bridge. SAU's is 13.4%, a large jump. **FLAG**
  - World Bank-derived population ends in 2025-Q2, so per capita ends there for those areas.
- **jobs:**
  - OECD SA for AUS, KOR, MEX, TUR, EU and RUS.
  - **RUS:** spliced to ILO NSA from 2022-01 / 2022-Q1. **SPLICE**
  - ILO quarterly NSA for ARG (urban), BRA, IDN, IND, SAU and ZAF.
- **#22 employment rate:**
  - OECD SA for AUS, KOR, MEX, TUR, ZAF, EU and RUS.
  - **RUS:** spliced to ILO from 2022-Q1. **SPLICE**
  - ILO for ARG, BRA, IDN, IND and SAU.
  - **CHN:** World Bank SL.EMP.TOTL.SP.ZS annual, ages 15+ (not 15–64). **FLAG**
- **unemp / #2 / #17:**
  - OECD SA for AUS, KOR, MEX, TUR and EU.
  - **RUS:** ILO monthly for the whole series (never in OECD UNE_M).
  - **CHN:** ILO modelled annual (status M, runs to 2027). **FLAG**
  - Others: ILO quarterly.
- **#3 GDP per capita, PPP:**
  - OECD HCPC.
  - **RUS:** spliced to World Bank PP.CD. **SPLICE**
- **#25 Gini:**
  - OECD IDD.
  - ARG and IDN from World Bank SI.POV.GINI ÷ 100.
  - **RUS:** spliced to the World Bank. **SPLICE**
- **#15 R&D:**
  - GERD filled from the World Bank for BRA, IND, IDN and SAU.
  - **RUS:** GERD spliced. **SPLICE**
  - BERD has no fill.
- **#12 wages:** AUS, KOR, MEX and TUR only.
- **#18 hours:**
  - AUS, MEX, KOR, TUR, and RUS (to 2020).
  - ILO mean weekly hours are in `series_alt_noncomparable` and are NOT comparable to the chart.
- **#24 labour share:**
  - ILO. Each series is cut at the last non-modelled (non-M) year.
  - EU uses ILO code X92.
- **#10 debt:**
  - IMF WEO, cut at the last actual year.
  - IND and ZAF fiscal year 2024/25 is placed at 2024.
  - **EU:** G998 cut at 2025. **FLAG**: confirm.
  - **KOR:** 2007–2011 set to null. **FLAG** (recommendation)
- **#7 policy rate and #20 household credit:**
  - BIS.
  - The EU slot holds XM, labelled **euro area**. **FLAG**
  - **ZAF #20:** the 2007 quarters are null. **FLAG**
- **#6 house prices:**
  - OECD.
  - The EU slot holds EA, labelled **euro area**. **FLAG**
  - RUS stops at 2019.
- **#19 current account:**
  - OECD BOP.
  - **RUS:** an annual IMF BCA continuation for 2022–2025. **SPLICE**
- **#8 health spending and life expectancy:**
  - Health spending from the World Bank.
  - Life expectancy from OECD.
  - SAU and EU life expectancy from World Bank LE.
  - **RUS:** spliced to the World Bank for 2024. **SPLICE**
- **#16 tertiary attainment:** OECD EAG. CHN has only 2010 for ages 25–34.
- **#14 GHG:**
  - OECD AIR_GHG.
  - **RUS:** World Bank EDGAR × 1000, from 1970. **FILL**
- **#13 CPI:**
  - For each area, the latest-ending OECD flow is used. AUS is quarterly.
  - **RUS:** headline gets an annual World Bank continuation from 2023. **SPLICE**
  - RUS core stops in 2022.
- **#4, #5, #11, #21, #23:** World Bank, all 13 areas. EU uses code EUU.
- **#9 electricity mix:** Ember, all 13 areas.

**EU codes by source**
- OECD: EU for QNA/LFS; EU27_2020 for BOP/MSTI/HCPC/CPI/GHG.
- World Bank: EUU. IMF: G998. ILO: X92. Ember: EU.
- BIS and house prices: euro area, as above.

## NO data from any source
| Chart | Countries with no data |
|---|---|
| #12 wages | ARG, BRA, CHN, IND, IDN, RUS, SAU, ZAF, EU |
| #18 hours | ARG, BRA, CHN, IND, IDN, SAU, ZAF, EU (ILO weekly hours as a non-comparable alternative only) |
| #6 house prices | ARG, BRA, CHN, IND, IDN, MEX, SAU, TUR |
| #13 core CPI | ARG, BRA, CHN, IND, IDN, SAU |
| #15 BERD | BRA, IND, IDN, SAU (they do have GERD) |
| #16 tertiary | RUS, SAU, EU |
| #25 Gini | SAU, EU |
| jobs | CHN |

## Blockers
- **ILO earnings flows:** DF_EAR_4MTH_SEX_CUR_NB and _ECO_ returned 404, and OCU_CUR returned 403. So there is no wage fill.
