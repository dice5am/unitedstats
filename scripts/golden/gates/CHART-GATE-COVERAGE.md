# Gate coverage for the 25 charts

Checked 10 Oct 2026, about 07:05 UK time. No existing files were changed, and nothing was pushed. Scripts and output are in crosscheck/chart_gate/ (gate_1_22.py, gate_1_22.out, export_shas.txt).

## TLDR
- The app (/workspace/unitedstats/data, MANIFEST.json, src/charts/registry.tsx) has data files for only 4 of the 25 charts: 1, 2, 7 and 22. The other 21 have no app file yet. They exist only as Warehouse exports, so nothing in the app is ungated.
- Two app files were not covered by any gate note, so I gated them now. Both pass:
  - econ_gdp_series.json (chart 1)
  - c1_employment_rate.json (chart 22)
- Every export the other 21 charts will use is one of the files covered by PULL-GATE-2026-10-10.md. Charts 16 and 21 are also covered by PULL-GATE-2026-10-10-card21-16.md.
- All these exports were last written between 05:36 and 05:43 UK time, before the gates at 05:45 and 05:46, so they haven't changed since. Their current sha256 prefixes are in export_shas.txt, which gives a fixed reference from now on.
- When Web adds an app file for a chart, it must be byte-identical to the export, or derived from it and gated then.

---

### Chart 1. The comeback race
- **App file:** data/econ_gdp_series.json, sha 228d4521…dbec
- **Built from:** canada-factcheck/warehouse/export/econ_gdp_series.json. The sha is identical. That file was built from raw/snapshot_econ_20261010T024211Z/oecd_qna_gdp_pop.csv (OECD DF_QNA).
- **Gate:** none before. Newly gated: PASS.
  - GDP and population: every value matches the raw OECD file exactly (0 mismatches), and no published raw value is missing.
  - GDP per person: equal to GDP ÷ population for every quarter (0 mismatches).
  - No duplicate rows, no zeros. The only null is France's 2026-Q2 GDP per person, which is null because France's population isn't published yet.
  - Coverage, GDP: CAN from 1961-Q1, DEU, FRA, ITA and JPN from 1960-Q1, GBR from 1955-Q1, USA from 1947-Q1. All end 2026-Q2.
  - Coverage, population: CAN from 1981-Q1, DEU 1991-Q1, FRA 1980-Q1 (ends 2026-Q1), GBR and ITA 1995-Q1, JPN 2007-Q3, USA 1947-Q1.
  - Every country covers 2019-Q4, which the chart rebases on.

### Chart 2. The unemployment heat strip
- **App file:** data/oecd_unemployment_rate_m_15plus.json, sha 3b47f4f6…2e15
- **Built from:** export/oecd_unemployment_rate_m_15plus.json. The sha is identical.
- **Gate:** covered by PULL-GATE-2026-10-10.md and UNEMPLOYMENT-LONG-GATE.md (PASS).

### Chart 3. G7 living-standards league table
- **App file:** none yet
- **Export:** oecd_gdp_per_capita_ppp_current.json
- **Gate:** covered by PULL-GATE-2026-10-10.md

### Chart 4. How fast is each country greying?
- **App file:** none yet
- **Export:** wb_SP.POP.65UP.TO.ZS.json
- **Gate:** covered by PULL-GATE-2026-10-10.md

### Chart 5. Getting richer, emitting less?
- **App file:** none yet
- **Export:** wb_NY.GDP.PCAP.PP.KD.json and wb_EN.GHG.CO2.PC.CE.AR5.json
- **Gate:** covered by PULL-GATE-2026-10-10.md

### Chart 6. Homes vs paychecks
- **App file:** none yet
- **Export:** oecd_house_price_to_income.json
- **Gate:** covered by PULL-GATE-2026-10-10.md

### Chart 7. The great rate hike
- **App file:** data/bis_policy_rate_m.json, sha 1731dce2…d520a9 (matches the export)
- **Gate:** covered by the card 7 fill gate (crosscheck/gate_card7.out, PASS) and PULL-GATE-2026-10-10.md

### Chart 8. Does spending more buy longer lives?
- **App file:** none yet
- **Export:** wb_SH.XPD.CHEX.GD.ZS.json and oecd_life_expectancy_birth.json
- **Gate:** covered by PULL-GATE-2026-10-10.md

### Chart 9. How each country makes its electricity
- **App file:** none yet
- **Export:** wb_EG.ELC.COAL.ZS.json, wb_EG.ELC.FOSL.ZS.json and wb_EG.ELC.NUCL.ZS.json
- **Gate:** covered by PULL-GATE-2026-10-10.md. See ELECTRICITY-MIX-OPTIONS.md for a fuller split.

### Chart 10. Public debt: before the crash vs now
- **App file:** none yet
- **Export:** imf_weo_GGXWDG_NGDP.json
- **Gate:** covered by PULL-GATE-2026-10-10.md (cut at each country's last actual year)

### Chart 11. The baby gap
- **App file:** none yet
- **Export:** wb_SP.DYN.TFRT.IN.json
- **Gate:** covered by PULL-GATE-2026-10-10.md

### Chart 12. Whose pay really grew?
- **App file:** none yet
- **Export:** oecd_avg_annual_wage_usd_ppp.json
- **Gate:** covered by PULL-GATE-2026-10-10.md

### Chart 13. The inflation wave
- **App file:** none yet
- **Export:** oecd_cpi_headline_yoy.json and oecd_cpi_core_yoy.json
- **Gate:** covered by PULL-GATE-2026-10-10.md

### Chart 14. G7 emissions map
- **App file:** none yet
- **Export:** oecd_ghg_total.json
- **Gate:** covered by PULL-GATE-2026-10-10.md

### Chart 15. Who pays for research?
- **App file:** none yet
- **Export:** oecd_msti_gerd_pct_gdp.json and oecd_msti_berd_pct_gdp.json
- **Gate:** covered by PULL-GATE-2026-10-10.md

### Chart 16. The degree generation gap
- **App file:** none yet
- **Export:** oecd_eag_tertiary_attainment_25_64.json and oecd_eag_tertiary_attainment_25_34.json
- **Gate:** covered by PULL-GATE-2026-10-10.md (ages 25-64) and PULL-GATE-2026-10-10-card21-16.md (ages 25-34)

### Chart 17. Hardest place to be young and job-hunting
- **App file:** none yet
- **Export:** oecd_unemployment_rate_m_15_24.json and oecd_unemployment_rate_m_15plus.json
- **Gate:** covered by PULL-GATE-2026-10-10.md (and UNEMPLOYMENT-LONG-GATE.md for ages 15+)

### Chart 18. Working less, everywhere?
- **App file:** none yet
- **Export:** oecd_avg_annual_hours_worked.json
- **Gate:** covered by PULL-GATE-2026-10-10.md

### Chart 19. Surplus or deficit with the world
- **App file:** none yet
- **Export:** oecd_bop_current_account_pct_gdp_q.json
- **Gate:** covered by PULL-GATE-2026-10-10.md

### Chart 20. Household borrowing since 2007
- **App file:** none yet
- **Export:** bis_household_credit_pct_gdp.json
- **Gate:** covered by PULL-GATE-2026-10-10.md (unit code 770 confirmed as % of GDP)

### Chart 21. How open is each economy?
- **App file:** none yet
- **Export:** wb_NE.EXP.GNFS.ZS.json and wb_NE.IMP.GNFS.ZS.json
- **Gate:** covered by PULL-GATE-2026-10-10-card21-16.md

### Chart 22. Jobs recovery scorecard
- **App file:** data/c1_employment_rate.json, sha 30bbdc9f…eac
- **Built from:** canada-factcheck/warehouse/export/c1_employment_rate.json. The sha is identical. That file was built from raw/addendum_20261010T022251Z_emp_rate/oecd_emprate_Q.csv (OECD DF_IALFS_INDIC, EMP_WAP, ages 15-64).
- **Gate:** none before. Newly gated: PASS.
  - Quarterly values for ages 15-64 match the raw file exactly for all 7 countries (0 mismatches), and no published raw value is missing.
  - No duplicate rows, no zeros. The only null is the US 2025-Q4, which isn't in the raw file.
  - Flags as published: all 86 German quarters are flagged E (estimated), and Italy has one break (B).
  - Coverage: CAN from 1976-Q1, USA 1977-Q1 (to 2026-Q3), JPN 1970-Q1, GBR 1971-Q1, DEU 2005-Q1, FRA 2003-Q1, ITA 1998-Q1. All others end 2026-Q2.
  - Every country covers 2019-Q4, the chart's baseline.

### Chart 23. Migrants in each country
- **App file:** none yet
- **Export:** wb_SM.POP.TOTL.ZS.json
- **Gate:** covered by PULL-GATE-2026-10-10.md (published five-year points only)

### Chart 24. Workers' slice of the pie
- **App file:** none yet
- **Export:** ilo_labour_share_gdp.json
- **Gate:** covered by PULL-GATE-2026-10-10.md (US years imputed; cut before ILO's projected years)

### Chart 25. How unequal are incomes?
- **App file:** none yet
- **Export:** oecd_idd_gini_disposable.json
- **Gate:** covered by PULL-GATE-2026-10-10.md (current income definition only; Japan is thin)
