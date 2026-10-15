# unitedstats: do the sources agree, and where are the gaps?

Built 10 Oct 2026, about 06:10 UK time. This is analysis only. No gaps were filled, nothing was pushed and no export file was edited. Scripts, raw pulls and results are in /workspace/skyscraper/unitedstats-warehouse/crosscheck/ (pull.py, compare.py, gaps.py, results.json, raw/MANIFEST.txt).

## TLDR

- Scope (your change): I only compared cards where a second international source was already listed in the inventory. That is 12 of the 25 cards. The other 13 are marked "single source, unchanged". I didn't search for an alternative for those.
- 6 cards agree within tolerance: 2 unemployment, 8 life expectancy, 15 R&D, 17 youth unemployment, 19 current account and 20 household debt. Two of them have one country to watch: Italy on card 19 and Japan on card 20.
- 6 cards differ in a way that matters:
  - 3: the PPP history is rewritten between vintages.
  - 7: the market rate is not the same as the policy target.
  - 10: the UK's debt definition differs (by 48 points).
  - 14: Canada's emissions differ (EDGAR against the national inventories).
  - 22: the change since 2019 differs for Germany and France.
  - 25: the Gini differs (the survey bases are different).
- In every case the current primary source should stay primary. A consensus or blended number makes no sense anywhere (reasons at the end of Part 1).
- 23 gaps are listed. Only one is worth filling: the pre-1999 German, French and Italian policy rates on card 7. These come from the same BIS dataset, so the method doesn't change. Every other gap should stay n/a.
- Job vacancies stays parked (3 of 7 countries). It isn't analysed here.

How to read the numbers: "level diff" means primary minus the second source in the latest year both have. "pp" means percentage points. "Change diff" means the primary's change over the card's window minus the second source's change.

---

## Part 1: cross-source check

### Card 1. The comeback race
- **Compared:** Single source, unchanged. OECD quarterly GDP and population, with no second international quarterly source in the inventory.
- **Latest level diff:** n/a
- **Change diff:** n/a
- **Why they differ:** n/a
- **Primary:** OECD QNA
- **Tolerance:** n/a
- **Verdict:** Single source

### Card 2. Unemployment heat strip
- **Compared:** OECD monthly unemployment, 15+, averaged over the 12 months of each year, against the IMF WEO annual unemployment rate (LUR).
- **Latest level diff (2025, USA 2024):** -0.08 to +0.12 pp in every country. France is largest at 7.72 against 7.6.
- **Change diff (2019 to latest):** 0.10 pp or less everywhere. For example, the UK is +1.00 against +1.10.
- **Why they differ:** The IMF publishes the same national labour force survey rates, rounded to one decimal. The OECD harmonises them to the ILO definition, and the IMF can lag a revision.
- **Primary:** OECD. It is monthly, harmonised, and the source the heatmap needs.
- **Tolerance:** Flag above 0.3 pp on the annual level.
- **Verdict:** Agree

### Card 3. G7 living-standards league table
- **Compared:** OECD GDP per person at current PPPs against IMF WEO PPPPC.
- **Latest level diff (2025):** -3.5% (France) to +3.2% (Germany). The US is -0.01%, the UK -1.3% and Japan -2.4%.
- **Change diff (1990 to 2025, % growth):** Germany +57 points (292% against 235%), Italy +46, the UK +38, France +29, Japan -13, Canada +4 and the US +0.2.
- **Why they differ:** Both use current PPPs, but the IMF uses its own PPP back-casts and WEO vintage, while the OECD uses the latest Eurostat-OECD PPP rounds. 1990 is where they part most, including German unification data. Recent levels are close, but the IMF's long history is not the same history.
- **Primary:** OECD. It is the PPP-programme owner and covers all 7 from 1970, while the IMF only starts in 1980.
- **Tolerance:** Flag above 3% on a year's level. Gaps between neighbours in the ranking are often under 3%, so label ranks within 3% as "close" rather than as a firm order.
- **Verdict:** Differ (history)

### Card 4. How fast is each country greying?
- **Compared:** Single source, unchanged. The World Bank carries UN WPP, and the UN's own API needs a token.
- **Latest level diff:** n/a
- **Change diff:** n/a
- **Why they differ:** n/a
- **Primary:** World Bank (UN WPP)
- **Tolerance:** n/a
- **Verdict:** Single source

### Card 5. Getting richer, emitting less?
- **Compared:** Single source, unchanged. OECD GHG per person covers all gases, not CO2 only, so it is not the same series.
- **Latest level diff:** n/a
- **Change diff:** n/a
- **Why they differ:** n/a
- **Primary:** World Bank (ICP and EDGAR)
- **Tolerance:** n/a
- **Verdict:** Single source

### Card 6. Homes vs paychecks
- **Compared:** Single source, unchanged. BIS publishes real house prices, not a price-to-income ratio.
- **Latest level diff:** n/a
- **Change diff:** n/a
- **Why they differ:** n/a
- **Primary:** OECD
- **Tolerance:** n/a
- **Verdict:** Single source

### Card 7. The great rate hike
- **Compared:** BIS policy rate (end of month; the euro-area rate for Germany, France and Italy) against the OECD short-term "immediate" rate (IRSTCI, monthly average).
- **Latest level diff (2026-09):** Canada +0.01, UK +0.02, US +0.13, Japan +0.21, euro area +0.23 pp. The BIS rate is the higher one each time.
- **Change diff (2022-01 to 2026-09):** Canada, the UK and the US are within 0.09 pp. Euro area -0.35 (BIS +2.50 against OECD +2.85) and Japan +0.29.
- **Why they differ:** They measure different things. BIS gives the target the central bank announces, taken at month end. The OECD gives a market overnight rate averaged over the month. In the euro area, the overnight rate trades below the ECB's main rate, and its move since 2022 includes the old negative deposit rate.
- **Primary:** BIS. The card is about decisions made in steps, and only BIS shows the steps.
- **Tolerance:** Don't flag these on the chart, because the difference is one of concept. If a check is wanted, flag above 0.25 pp.
- **Verdict:** Differ (concept)

### Card 8. Does spending more buy longer lives?
- **Compared:** OECD life expectancy against World Bank life expectancy (UN WPP). The health spending axis has a second source (OECD SHA), but its query isn't finalised in the inventory, so I didn't compare it.
- **Latest level diff (2024):** -0.25 (Italy) to +0.41 years (Germany). The rest are within 0.11.
- **Change diff (2000 to 2024):** Italy -0.37 years, the UK -0.15, and the rest within 0.12.
- **Why they differ:** The OECD uses national life tables from death records. UN WPP is a modelled estimate smoothed across years.
- **Primary:** OECD. It is the observed data, not modelled.
- **Tolerance:** Flag above 0.5 years.
- **Verdict:** Agree

### Card 9. How each country makes its electricity
- **Compared:** Single source, unchanged.
- **Latest level diff:** n/a
- **Change diff:** n/a
- **Why they differ:** n/a
- **Primary:** World Bank
- **Tolerance:** n/a
- **Verdict:** Single source

### Card 10. Public debt: before the crash vs now
- **Compared:** IMF WEO gross debt against OECD quarterly government debt, Q4 value.
- **Latest level diff (2025; Canada, France and Japan 2024):** UK -48.4 pp (102.3 against 150.7), US -12.4, Canada -10.0, France -7.7. Germany, Italy and Japan are within 0.4.
- **Change diff (2007 to latest):** UK +10.9, US +9.0, Canada +4.4, France +2.5 pp. The rest are within 0.4.
- **Why they differ:** The debt definition differs. The OECD quarterly table counts more liabilities and values them differently, for example other accounts payable, and for the UK and US possibly pension-related liabilities. I haven't confirmed this item by item. The IMF uses each country's headline gross debt. Germany, Italy and Japan already report almost the same thing, which supports this reading.
- **Primary:** IMF WEO. It is the measure people quote, and it is consistent with the card's 2007 framing.
- **Tolerance:** Flag above 5 pp. Do not mix the two sources on the chart.
- **Verdict:** Differ (definition)

### Card 11. The baby gap
- **Compared:** Single source, unchanged.
- **Latest level diff:** n/a
- **Change diff:** n/a
- **Why they differ:** n/a
- **Primary:** World Bank (UN WPP)
- **Tolerance:** n/a
- **Verdict:** Single source

### Card 12. Whose pay really grew?
- **Compared:** Single source, unchanged.
- **Latest level diff:** n/a
- **Change diff:** n/a
- **Why they differ:** n/a
- **Primary:** OECD
- **Tolerance:** n/a
- **Verdict:** Single source

### Card 13. The inflation wave
- **Compared:** Single source, unchanged. It is two OECD flows stitched together, with no second international source in the inventory.
- **Latest level diff:** n/a
- **Change diff:** n/a
- **Why they differ:** n/a
- **Primary:** OECD
- **Tolerance:** n/a
- **Verdict:** Single source

### Card 14. G7 emissions map
- **Compared:** OECD total GHG (countries' own UN inventories, converted to Mt) against World Bank EN.GHG.ALL.MT.CE.AR5 (EDGAR, modelled by the EU's JRC).
- **Latest level diff (2024; US 2022):** Canada -10.9% (685 against 768 Mt), US +4.4%, Germany -3.7%, UK -3.0%. France, Italy and Japan are about -2%.
- **Change diff (1990 to latest):** Canada -17.4 points (+12.6% against +30.1%). Italy -3.7, France -3.6, Germany -2.7 and the UK -1.8. The US and Japan are within 0.7.
- **Why they differ:** The national inventories use country-specific emission factors and recalculate history every year. EDGAR applies one modelling method to everyone. Canada's oil-and-gas methane and fugitive emissions are the classic point of disagreement. The scope on land use and forestry also differs slightly.
- **Primary:** OECD. These are the official inventories the countries' targets are judged against. EDGAR is also the source card 5 uses, so its note must say the two cards differ by method.
- **Tolerance:** Flag above 5% on level or 5 points on change since 1990. On that rule, Canada is flagged.
- **Verdict:** Differ (Canada)

### Card 15. Who pays for research?
- **Compared:** OECD MSTI GERD against World Bank GB.XPD.RSDV.GD.ZS (UNESCO UIS).
- **Latest level diff (2023; Canada 2024):** The UK is +0.08 pp. All others are within 0.03 pp.
- **Change diff (2000 to latest):** The UK is +0.08 pp. All others are within 0.03.
- **Why they differ:** UNESCO largely copies OECD for OECD members. The UK gap is a later UK revision that UIS hasn't picked up yet.
- **Primary:** OECD. It is the original source, and BERD is available only from it.
- **Tolerance:** Flag above 0.1 pp.
- **Verdict:** Agree

### Card 16. The degree generation gap
- **Compared:** Single source, unchanged.
- **Latest level diff:** n/a
- **Change diff:** n/a
- **Why they differ:** n/a
- **Primary:** OECD EAG
- **Tolerance:** n/a
- **Verdict:** Single source

### Card 17. Hardest place to be young and job-hunting
- **Compared:** OECD monthly youth unemployment, 15-24 (annual mean), against World Bank SL.UEM.1524.ZS (ILO modelled).
- **Latest level diff (2025; US 2024):** France +0.91 pp (19.8 against 18.9), UK +0.35, Italy -0.32. The rest are within 0.1.
- **Change diff (2019 to latest):** UK -0.43, Italy -0.36, Germany -0.25. The rest are within 0.07.
- **Why they differ:** The ILO figures are modelled and partly harmonised for consistency across countries. The OECD figures are the published survey rates.
- **Primary:** OECD. It is monthly, which the card needs.
- **Tolerance:** Flag above 1 pp. France is close to the limit.
- **Verdict:** Agree

### Card 18. Working less, everywhere?
- **Compared:** Single source, unchanged.
- **Latest level diff:** n/a
- **Change diff:** n/a
- **Why they differ:** n/a
- **Primary:** OECD
- **Tolerance:** n/a
- **Verdict:** Single source

### Card 19. Surplus or deficit with the world
- **Compared:** OECD quarterly current account (the mean of the 4 quarter ratios, which is an approximation) against IMF WEO BCA_NGDPD.
- **Latest level diff (2025):** Italy -0.54 pp (0.66 against 1.2), US -0.23, France -0.14. The rest are within 0.1.
- **Change diff (2007 to 2025):** Italy -0.54, US -0.34, Germany +0.20. The rest are within 0.08.
- **Why they differ:** Averaging quarterly ratios is not the same as an annual ratio. The IMF's annual figure also uses a different vintage of balance-of-payments and GDP data. Italy's recent figures were revised.
- **Primary:** OECD. It is quarterly and is what the card plots.
- **Tolerance:** Flag above 0.5 pp. Italy is at the limit, so recheck it at the next pull.
- **Verdict:** Agree (Italy borderline)

### Card 20. Household borrowing since 2007
- **Compared:** BIS household credit (Q4) against IMF Global Debt Database HH_LS.
- **Latest level diff (2024):** Japan -3.3 pp (61.8 against 65.1), UK -1.3, Germany -0.9. The rest are within 0.5.
- **Change diff (2007 to 2024):** Japan -2.75 pp. The rest are within 0.9.
- **Why they differ:** BIS uses Q4 stock over GDP for the 4 quarters to Q4. The IMF uses an annual figure and can include slightly different instruments. Japan's gap looks like an instrument-coverage difference (not confirmed).
- **Primary:** BIS. It is quarterly, carries a break-adjusted credit series, and is the source the card names.
- **Tolerance:** Flag above 2 pp. Japan is flagged.
- **Verdict:** Agree (Japan flagged)

### Card 21. How open is each economy?
- **Compared:** Single source, unchanged. The World Bank carries OECD/national accounts, and the inventory lists no second source.
- **Latest level diff:** n/a
- **Change diff:** n/a
- **Why they differ:** n/a
- **Primary:** World Bank
- **Tolerance:** n/a
- **Verdict:** Single source

### Card 22. Jobs recovery scorecard
- **Compared:** OECD quarterly employment rate, 15-64 (held file), against the ILOSTAT quarterly rate, 15-64 (DF_EMP_DWAP_SEX_AGE_RT).
- **Latest level diff (2026-Q2; US Q3, UK Q1):** UK +0.78, Canada -0.54, Italy -0.26, France -0.24 pp. The rest are within 0.13.
- **Change diff (2019-Q4 to latest):** Germany +2.40 pp (OECD +2.58 against ILO +0.18), France -1.01, UK -0.53, Canada -0.49. The rest are within 0.2.
- **Why they differ:** Germany: the labour force survey was redesigned in 2020, and the two bodies bridge that break differently (OECD quarters are flagged E). France and the UK: the ILO reprocesses the survey microdata itself, with different seasonal adjustment and weighting.
- **Primary:** OECD. It is the held source and is seasonally adjusted for all seven. The chart's main number is the change since 2019, so Germany's figure needs a "survey break in 2020" note.
- **Tolerance:** Flag above 0.5 pp on the change. Germany and France are flagged, and the UK and Canada are at the limit.
- **Verdict:** Differ (change since 2019)

### Card 23. Migrants in each country
- **Compared:** Single source, unchanged. The OECD foreign-born series is in the inventory but marked unverified and not finalised.
- **Latest level diff:** n/a
- **Change diff:** n/a
- **Why they differ:** n/a
- **Primary:** World Bank (UN DESA)
- **Tolerance:** n/a
- **Verdict:** Single source

### Card 24. Workers' slice of the pie
- **Compared:** Single source, unchanged.
- **Latest level diff:** n/a
- **Change diff:** n/a
- **Why they differ:** n/a
- **Primary:** ILOSTAT
- **Tolerance:** n/a
- **Verdict:** Single source

### Card 25. How unequal are incomes?
- **Compared:** OECD IDD Gini (×100) against World Bank PIP Gini.
- **Latest level diff (latest common year):** UK +3.0 points in 2021 (35.4 against 32.4), Germany -2.8 (2022), US -2.4 (2023), France -1.9, Italy -1.8, Canada -1.5. Japan is +0.5 (2018).
- **Change diff (2012 to latest, where both have 2012):** UK +0.96, Germany -0.76, Italy +0.38, Canada +0.30 points. The US, France and Japan have no common 2012.
- **Why they differ:** The underlying data differ. OECD IDD uses national surveys collected to the OECD's own income definition and equivalence scale. PIP for rich countries uses LIS microdata with a different income concept, and the years are not the same.
- **Primary:** OECD. It is consistent across the G7 and is what the card names.
- **Tolerance:** Never mix the sources. If checking, flag above 2 Gini points.
- **Verdict:** Differ (survey base)

### Blended or consensus number?
- **Answer:** No, on any card.
- **Why:** Where the sources agree (cards 2, 8, 15, 17, 19 and 20), the second source is mostly a copy or a model of the first, so averaging adds nothing. Where they differ (cards 3, 7, 10, 14, 22 and 25), they measure different things: a target against a market rate, two debt definitions, inventory against modelled emissions, and two survey bases. An average of two definitions is a third definition that no institution publishes, and nobody could check it. It would also break the "international sources, as published" rule. Better to keep one primary per card, state the definition, and show the tolerance flag where it applies.

---

## Part 2: gaps

The figures below come from the exports, plus the held files for cards 1 and 22. "Changes method" means filling the gap would bring in a different source or definition.

### Gap 1. Card 1, France population
- **Countries and years:** FRA, 2026-Q2
- **Why missing:** Publication lag (OECD hasn't released it yet)
- **Other international source:** None quarterly
- **National office:** INSEE could, but that breaks the rule
- **Changes method:** Yes, if INSEE is used
- **Recommend:** Leave as n/a. It fills at the next OECD pull.

### Gap 2. Card 1, early quarters
- **Countries and years:** JPN before 2007-Q3; GBR and ITA before 1995
- **Why missing:** The series starts later (OECD quarterly population)
- **Other international source:** Not checked. Not needed, because the card is indexed to 2019-Q4.
- **National office:** n/a
- **Changes method:** n/a
- **Recommend:** Leave as n/a

### Gap 3. Cards 2, 13 and 17, US October 2025
- **Countries and years:** USA, 2025-10 (unemployment 15+, youth, headline and core CPI)
- **Why missing:** Never published by OECD for that month. This fits the US federal shutdown, when the survey wasn't collected (my reading; not confirmed from source text).
- **Other international source:** No. They all copy the same US survey.
- **National office:** Only if BLS later published it, and that breaks the rule
- **Changes method:** Yes
- **Recommend:** Leave as n/a

### Gap 4. Cards 2 and 17, UK latest months
- **Countries and years:** GBR, 2026-07 to 2026-09
- **Why missing:** Publication lag. The UK series ends 2026-06.
- **Other international source:** ILOSTAT UK youth stops in 2020-09, so it can't fill this.
- **National office:** ONS publishes rolling 3-month averages, which is a different method
- **Changes method:** Yes
- **Recommend:** Leave as n/a. Show the UK's latest month.

### Gap 5. Card 3, before 1970
- **Countries and years:** CAN, USA, JPN, DEU, ITA, 1960-1969
- **Why missing:** The OECD series starts later
- **Other international source:** IMF PPPPC starts 1980, so no
- **National office:** No PPPs
- **Changes method:** n/a
- **Recommend:** Leave as n/a. Rank from 1970.

### Gap 6. Card 6, Japan latest quarter
- **Countries and years:** JPN, 2026-Q1 to Q2
- **Why missing:** Publication lag. Japan ends 2025-Q4.
- **Other international source:** BIS real house prices also end 2025-Q4, and they aren't a ratio
- **National office:** No
- **Changes method:** Yes
- **Recommend:** Leave as n/a

### Gap 7. Card 7, national rates before 1999
- **Countries and years:** DEU, FRA, ITA, before 1999-01
- **Why missing:** The rates weren't pulled. The earlier note's "not held" was correct.
- **Other international source:** Yes. Same BIS WS_CBPOL dataset, pulled live today: DE 1948-07 to 1998-12, FR and IT 1945-01 to 1998-12.
- **National office:** Not needed
- **Changes method:** No. Same source and same measure.
- **Recommend:** Fill. Show three national lines up to 1998, then one euro-area line.

### Gap 8. Card 7, Japan without a policy rate
- **Countries and years:** JPN, 1999-03 to 2000-07, 2001-04 to 2006-02 and 2013-05 to 2016-08 (116 months)
- **Why missing:** No policy rate existed. The Bank of Japan targeted money quantities instead.
- **Other international source:** OECD IRSTCI has a market call rate, but that isn't a policy rate
- **National office:** No
- **Changes method:** Yes
- **Recommend:** Leave as n/a, with the label already agreed

### Gap 9. Card 8, health spending
- **Countries and years:** USA and JPN, 2024
- **Why missing:** Publication lag (WHO via the World Bank)
- **Other international source:** OECD SHA might have 2024 (not checked, because its query isn't finalised). It is a different compiler.
- **National office:** No
- **Changes method:** Yes
- **Recommend:** Leave as n/a. Default the chart to 2023.

### Gap 10. Card 8, early life expectancy
- **Countries and years:** GBR 1962-69 and 1972-79; ITA 1962-70 and 1972-73
- **Why missing:** Never published annually by OECD
- **Other international source:** The World Bank (UN WPP) has these years, but they are modelled
- **National office:** No
- **Changes method:** Yes
- **Recommend:** Leave as n/a. The card's scatter starts in 2000, so it's unaffected.

### Gap 11. Card 9, nuclear
- **Countries and years:** DEU 2024-25; ITA 2022-25
- **Why missing:** The series stops after the phase-out. Italy had been publishing zeros.
- **Other international source:** No
- **National office:** Not needed
- **Changes method:** Writing in 0 would be an inference, not a value anyone published
- **Recommend:** Leave as n/a, as the brief says

### Gap 12. Card 10, IMF last actual year
- **Countries and years:** CAN, FRA, JPN, 2025
- **Why missing:** The IMF still counts 2025 as an estimate for these countries
- **Other international source:** The OECD quarterly table has 2025, but it uses a different debt definition (see card 10 above)
- **National office:** No
- **Changes method:** Yes
- **Recommend:** Leave as n/a. Label each country's latest year.

### Gap 13. Card 10, US before 2001
- **Countries and years:** USA, 1980-2000
- **Why missing:** The DataMapper series starts later
- **Other international source:** The IMF Historical Public Debt database (a different dataset, not pulled)
- **National office:** No
- **Changes method:** Yes
- **Recommend:** Leave as n/a. The card starts in 2007.

### Gap 14. Card 14, US emissions
- **Countries and years:** USA, 2023-24
- **Why missing:** Publication lag in the US inventory submission
- **Other international source:** World Bank EDGAR has 2024, but it is modelled and differs by 4% (card 14 above)
- **National office:** No
- **Changes method:** Yes
- **Recommend:** Leave as n/a. Tile says "to 2022".

### Gap 15. Card 15, latest R&D
- **Countries and years:** GERD: GBR 2024-25, others 2025 (all except CAN). BERD: all except CAN, 2025.
- **Why missing:** Publication lag
- **Other international source:** UNESCO via the World Bank is no newer
- **National office:** No
- **Changes method:** n/a
- **Recommend:** Leave as n/a. Default to 2023.

### Gap 16. Card 15, early UK years
- **Countries and years:** GBR 1982 and 1984 (GERD and BERD)
- **Why missing:** Never published (surveyed every two years at that time)
- **Other international source:** No
- **National office:** No
- **Changes method:** Interpolating would be a fill
- **Recommend:** Leave as n/a

### Gap 17. Card 16, degree attainment, early years
- **Countries and years:** CAN 1982-89; FRA 1982-88, 1990, 1993 and 1996; DEU 1990, 1993 and 1996; ITA 1990, 1993 and 1996-97 (both age bands)
- **Why missing:** Never published (early Education at a Glance editions were irregular)
- **Other international source:** No
- **National office:** No
- **Changes method:** n/a
- **Recommend:** Leave as n/a. The card uses the latest year.

### Gap 18. Card 16, US 2024
- **Countries and years:** USA, 2024 (both age bands)
- **Why missing:** Not published for that year
- **Other international source:** No
- **National office:** The US Census survey uses a different method
- **Changes method:** Yes
- **Recommend:** Leave as n/a. 2025 is present.

### Gap 19. Card 19, early current account
- **Countries and years:** FRA before 1999; ITA before 1995; JPN before 1996; DEU before 1991; CAN before 1981
- **Why missing:** The series starts later (and Germany before unification)
- **Other international source:** IMF WEO annual from 1980, but it is annual, not quarterly
- **National office:** No
- **Changes method:** Yes
- **Recommend:** Leave as n/a. The all-7 chart starts in 1999.

### Gap 20. Card 21, US and Japan 2025
- **Countries and years:** USA and JPN, 2025 (exports and imports)
- **Why missing:** Publication lag
- **Other international source:** OECD national accounts might have it, but that is a different carrier
- **National office:** No
- **Changes method:** Yes (mixing carriers)
- **Recommend:** Leave as n/a. Default to 2024.

### Gap 21. Card 22, employment rate
- **Countries and years:** USA 2025-Q4; DEU before 2005-Q1, FRA before 2003-Q1, ITA before 1998-Q1. ITA break at 2008-Q4.
- **Why missing:** Never published (US shutdown quarter); the series start later; a break
- **Other international source:** ILOSTAT. It differs by up to 2.4 pp on the change since 2019, so mixing it in would be a method change.
- **National office:** No
- **Changes method:** Yes
- **Recommend:** Leave as n/a. Keep the break flag.

### Gap 22. Card 23, migrant stock between years
- **Countries and years:** All 7, the years between 1990, 1995, 2000, 2005, 2010, 2015, 2020 and 2024 (27 per country)
- **Why missing:** Never published. UN DESA publishes every 5 years.
- **Other international source:** No
- **National office:** No
- **Changes method:** Interpolating would be a fill
- **Recommend:** Leave as n/a

### Gap 23. Cards 24 and 25, latest years and thin Japan
- **Countries and years:** Labour share: JPN, GBR and FRA, 2024 (the others end 2024). Gini: JPN only 2018 and 2021 (2019-20 missing, nothing after 2021); DEU 2009-10.
- **Why missing:** Labour share was cut before ILO's model-extrapolated years. Gini: not published.
- **Other international source:** World Bank PIP Gini has Japan only to 2018, and it uses a different base (card 25 above)
- **National office:** Japan's national survey uses a different method
- **Changes method:** Yes
- **Recommend:** Leave as n/a

Cards 4, 5, 11, 12 and 18 have no gaps in their exports. Card 5's CO2 series ends in 2024 against 2025 for GDP. That is a normal lag, so the scatter ends in 2024.

Job vacancies: parked as before. Only the US, the UK (to mid-2023) and Germany have it, which is 3 of 7. Not analysed.

---

## Honesty

- **self_sourceable:** Yes. Every comparison is from open APIs with no keys: IMF DataMapper, World Bank v2, OECD SDMX, ILOSTAT SDMX and BIS SDMX. The UN WPP API needs a free token, so it wasn't used.
- **history_depth:** Each comparison uses the card's window: 1990 (card 3), 2000 (cards 8 and 15), 2007 (cards 10, 19 and 20), 2012 (card 25), 2019 or 2019-Q4 (cards 2, 17 and 22), 2022-01 (card 7) and 1990 (card 14). The OECD policy-rate pull starts in 2015-01, and ILOSTAT starts in 2019.
- **refresh_path:** Run crosscheck/pull.py, then compare.py and gaps.py. The URLs are in crosscheck/raw/MANIFEST.txt.
- **auth_blockers:** None. One ILOSTAT URL returned 404 on an age-specific key; I re-pulled with a wildcard and filtered to ages 15-64.
- **ready_status:** Analysis complete for the 12 cards with two sources. The 13 single-source cards weren't checked, by your scope change. Some "why they differ" reasons are reasoned from the definitions and not confirmed line by line: the UK and US debt items on card 10, Japan's instruments on card 20, the US shutdown months, and Germany's 2020 survey break. Every figure above comes from today's pulls or the existing exports.
