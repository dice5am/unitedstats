# unitedstats: new G7 chart ideas (decision brief)

Built 10 Oct 2026 from the G7 data inventory only (124 series). Countries: Canada (CAN), US (USA), UK (GBR), Germany (DEU), France (FRA), Italy (ITA), Japan (JPN).

## TLDR

- 25 chart ideas, ranked best first. Every one uses a series in the inventory, from OECD, ILOSTAT, IMF, World Bank or BIS only.
- Two ideas ship on data we already hold (cards 1 and 22), and card 2 can launch in a quarterly version on held data. The rest need a pull from a live, checked source. No idea rests on an unverified card.
- Mix of chart types: heatmap, bump, slope, dumbbell, scatter, stacked, waffle, tile map, small multiples, step and diverging bars. No plain multi-line charts.
- Proposed new tabs: Demographics, Environment & energy, Health, Housing, Trade, Innovation, Education. Economy and Labour stay.

Short words used below: "index" means a series rebased so one chosen date = 100. "Per capita" means divided by population. "n/a" means no data; gaps are never filled in.

## Proposed tabs

- **Economy** (keep): growth, living standards, prices, interest rates, public debt, inequality. 6 cards (1, 3, 7, 10, 13, 25).
- **Labour** (keep): jobs, unemployment, pay, hours, the workers' share of income. 6 cards (2, 12, 17, 18, 22, 24).
- **Demographics** (new): ageing, births, migration. 3 cards (4, 11, 23).
- **Environment & energy** (new): emissions and how electricity is made. 3 cards (5, 9, 14).
- **Housing** (new): house prices against incomes, household borrowing. 2 cards (6, 20).
- **Trade** (new): openness and who runs surpluses. 2 cards (19, 21).
- **Health** (new): spending against how long people live. 1 card (8).
- **Innovation** (new): who pays for research. 1 card (15).
- **Education** (new): the generation gap in degrees. 1 card (16).

Health, Innovation and Education start with one card each; the inventory has more series for them (infant mortality, avoidable mortality, patents, broadband, enrolment) that could follow.

---

### 1. The comeback race

- **Name:** The comeback race
- **One-line idea:** Who got back to their pre-pandemic living standard first, and who still hasn't?
- **What it shows and why it's interesting:** Real GDP per person, indexed to 2019-Q4 = 100, one small panel per country with a line at 100. You can see at a glance when each country crossed back over 100 (or didn't). Per person matters: a country can grow just by adding people.
- **Chart type:** Small multiples (7 mini charts, same scale) with a highlighted "back to 100" date label on each.
- **Metric(s) and formula:** Real GDP per capita (derived) = DF_QNA B1GQ / POP; index = value / value at 2019-Q4 × 100. Label = first quarter at or above 100 after 2020-Q1.
- **Source and dataset:** OECD (derived), DF_QNA B1GQ / POP. Built from Real GDP (`OECD.SDD.NAD,DSD_NAMAIN1@DF_QNA`, key `Q.Y.{G7}.S1.S1.B1GQ._Z._Z._Z.XDC.LR.LA.T0102`) and Population (`Q.Y.{G7}.S1.S1.POP._Z._Z._Z.PS._Z.N.T0110`).
- **Frequency and history:** Q, 1947-Q1 to 2026-Q2 (common end 2026-Q1).
- **Coverage and gaps:** All 7. CAN 1981-Q1–2026-Q2; USA 1947-Q1–2026-Q2; GBR 1995-Q1–2026-Q2; JPN 2007-Q3–2026-Q2; DEU 1991-Q1–2026-Q2; FRA 1980-Q1–2026-Q1; ITA 1995-Q1–2026-Q2. FRA 2026-Q2 n/a (no population). Every country covers 2019-Q4, so the chart works for all 7. Inherits GDP and population flags (some recent DEU/JPN population quarters provisional).
- **Per-capita toggle:** Not needed, already per capita. Could offer a "total GDP" toggle using Real GDP (held).
- **Reliability:** High. Official OECD national accounts; recent quarters can be revised.
- **Data status:** Held.
- **Effort:** S. Data on disk; just rebase and add the crossing label.
- **Suggested tab:** Economy

---

### 2. The unemployment heat strip

- **Name:** The unemployment heat strip
- **One-line idea:** When did each country's jobless rate spike, and did the spikes line up?
- **What it shows and why it's interesting:** One row per country, one cell per month, coloured from low (pale) to high (dark). Shocks like 2008-09 and 2020 show up as dark vertical bands; you instantly see that Italy's and France's stay dark far longer, or that the US 2020 spike was short and sharp.
- **Chart type:** Heatmap (rows = countries, columns = months). Scrolls sideways on mobile; timeframe switch trims the columns.
- **Metric(s) and formula:** Unemployment rate, 15+ (% of labour force), as published.
- **Source and dataset:** OECD, `OECD.SDD.TPS,DSD_LFS@DF_IALFS_UNE_M,1.0` (Unemployment rate, monthly, all seven). Key `CAN+USA+GBR+JPN+DEU+FRA+ITA....Y._T.Y_GE15..M`. Held fallback: `OECD.SDD.TPS,DSD_LFS@DF_IALFS_INDIC,1.0` (measure UNE_LF), quarterly for all seven.
- **Frequency and history:** M, 1955-01 to 2026-09.
- **Coverage and gaps:** All 7. CAN 1955-01–2026-08; USA 1955-01–2026-09; GBR 1983-01–2026-06; JPN 1955-01–2026-08; DEU 1991-01–2026-08; FRA 1983-01–2026-08; ITA 1983-01–2026-08. GBR ends 2026-06 (recent cells n/a). Held monthly file has only CAN/USA/JPN; held quarterly file has USA 2025-10 missing (n/a).
- **Per-capita toggle:** No, already a rate.
- **Reliability:** High. Harmonised OECD labour force survey rates.
- **Data status:** Live, needs pull (monthly for all 7). Could launch now as a quarterly heatmap on held data.
- **Effort:** S. One pull; heatmap component is new.
- **Suggested tab:** Labour

---

### 3. G7 living-standards league table

- **Name:** G7 living-standards league table
- **One-line idea:** How has the G7 ranking by income per person shuffled over 50+ years?
- **What it shows and why it's interesting:** Each country is a line that moves between rank 1 and rank 7 year by year. Crossings tell stories: Japan's climb and fall, Italy slipping, the UK and France swapping places.
- **Chart type:** Bump chart (rank over time).
- **Metric(s) and formula:** GDP per capita at current PPPs (USD; PPP = adjusted for price differences between countries). Rank 1 = highest each year.
- **Source and dataset:** OECD, `OECD.SDD.NAD,DSD_NAMAIN10@DF_TABLE1_EXPENDITURE_HCPC,2.0`, measure `B1GQ_POP`.
- **Frequency and history:** A, 1960 to 2025.
- **Coverage and gaps:** All 7. CAN 1970–2025; USA 1970–2025; GBR 1960–2025; JPN 1970–2025; DEU 1970–2025; FRA 1960–2025; ITA 1970–2025. Rank all 7 from 1970 only (before that only GBR and FRA). Latest values flagged E (estimated) or P (provisional).
- **Per-capita toggle:** Not needed, already per capita.
- **Reliability:** High for ranks; small gaps between neighbours can flip on revision.
- **Data status:** Live, needs pull.
- **Effort:** S. Simple annual series; bump chart is a small new component.
- **Suggested tab:** Economy

---

### 4. How fast is each country greying?

- **Name:** How fast is each country greying?
- **One-line idea:** Share of people aged 65+, then versus now: who aged fastest?
- **What it shows and why it's interesting:** Two dots per country joined by a line: 1990 on the left, 2025 on the right. Steeper line = faster ageing. Japan's line is likely to stand out, but the order of the rest is the interesting part.
- **Chart type:** Slope chart.
- **Metric(s) and formula:** Population ages 65 and above (% of total population). Start year switchable (1960 / 1990 / 2005) vs 2025.
- **Source and dataset:** World Bank WDI (underlying: UN WPP), indicator `SP.POP.65UP.TO.ZS`.
- **Frequency and history:** A, 1960 to 2025.
- **Coverage and gaps:** All 7, 1960–2025 each. Gaps not checked.
- **Per-capita toggle:** No, already a share of population.
- **Reliability:** High. UN population estimates; latest year may be revised.
- **Data status:** Live, needs pull.
- **Effort:** S.
- **Suggested tab:** Demographics

---

### 5. Getting richer, emitting less?

- **Name:** Getting richer, emitting less?
- **One-line idea:** Has each country managed to grow its income while cutting carbon per person?
- **What it shows and why it's interesting:** One path per country: across = income per person, up = CO2 per person. A path heading right and down means "decoupled": richer and cleaner. You see who turned the corner and when.
- **Chart type:** Connected scatter (one trail per country, dot per year, latest year labelled).
- **Metric(s) and formula:** x = GDP per capita, PPP (constant 2021 international $); y = CO2 emissions excluding LULUCF per capita (t CO2e per person). (LULUCF = land use and forestry.)
- **Source and dataset:** World Bank WDI `NY.GDP.PCAP.PP.KD` (underlying World Bank / ICP) and WDI `EN.GHG.CO2.PC.CE.AR5` (underlying EDGAR, EU JRC).
- **Frequency and history:** A. GDP 1990–2025; CO2 1970–2024. Usable overlap 1990–2024.
- **Coverage and gaps:** All 7 on both, full years. EDGAR is modelled by the EU's Joint Research Centre, not the countries' own UN inventories. Gaps not checked.
- **Per-capita toggle:** Already per capita. Optional "totals" view: WDI `EN.GHG.ALL.MT.CE.AR5` (total GHG excl. LULUCF, 1970–2024, all 7).
- **Reliability:** Medium-high. Good comparability; modelled emissions.
- **Data status:** Live, needs pull (two series).
- **Effort:** M. Connected scatter is a new chart type and needs careful labels on mobile.
- **Suggested tab:** Environment & energy

---

### 6. Homes vs paychecks

- **Name:** Homes vs paychecks
- **One-line idea:** Where have house prices run furthest ahead of incomes since 2010?
- **What it shows and why it's interesting:** For each country, a dot for 2010 and a dot for the latest quarter, joined by a bar. Long bar to the right = homes got much less affordable. Sorting by the gap makes the ranking obvious.
- **Chart type:** Dumbbell chart (sorted).
- **Metric(s) and formula:** Price-to-income ratio (index: house prices divided by household disposable income per person). Compare 2010-Q1 with each country's latest quarter.
- **Source and dataset:** OECD, `OECD.ECO.MPD,DSD_AN_HOUSE_PRICES@DF_HOUSE_PRICES,1.0`, measure `HPI_YDH`, unit `IX`.
- **Frequency and history:** Q, 1960-Q1 to 2026-Q2.
- **Coverage and gaps:** All 7. CAN 1970-Q1–2026-Q2; USA 1970-Q1–2026-Q2; GBR 1987-Q1–2026-Q2; JPN 1960-Q1–2025-Q4; DEU 1980-Q1–2026-Q2; FRA 1978-Q1–2026-Q2; ITA 1970-Q1–2026-Q2. JPN ends 2025-Q4 (label its end date). It is an index, so it compares change within a country, not levels between countries; the card copy must say so.
- **Per-capita toggle:** No, already a ratio.
- **Reliability:** High for direction of change; levels across countries are not comparable.
- **Data status:** Live, needs pull.
- **Effort:** S.
- **Suggested tab:** Housing

---

### 7. The great rate hike, step by step

- **Name:** The great rate hike, step by step
- **One-line idea:** Which central bank moved first and furthest in 2022-23, and who has cut since?
- **What it shows and why it's interesting:** Policy rates drawn as steps (they change in jumps, not smoothly). Five lines, not seven: Germany, France and Italy share the European Central Bank rate, which is itself a story.
- **Chart type:** Step chart.
- **Metric(s) and formula:** Central bank policy rate (%), as published.
- **Source and dataset:** BIS, `WS_CBPOL`, key `M.{CA|US|GB|JP|XM}`.
- **Frequency and history:** M, 1946-01 to 2026-09.
- **Coverage and gaps:** All 7, but DEU/FRA/ITA show the euro-area rate (XM) from 1999-01 only; pre-1999 national rates not checked (n/a). CAN 1960-07–2026-09; USA 1954-07–2026-09; GBR 1946-01–2026-09; JPN 1946-01–2026-09.
- **Per-capita toggle:** No, a rate.
- **Reliability:** High.
- **Data status:** Live, needs pull.
- **Effort:** S. Needs a "shared euro rate" label so the toggles make sense.
- **Suggested tab:** Economy

---

### 8. Does spending more buy longer lives?

- **Name:** Does spending more buy longer lives?
- **One-line idea:** Health spending against life expectancy: who gets the most years for their money?
- **What it shows and why it's interesting:** Each country is a dot: across = health spending as % of GDP, up = life expectancy. The US likely sits far right but not top; Japan and Italy high up. A toggle animates through 2000 to the latest year.
- **Chart type:** Scatter (with year slider).
- **Metric(s) and formula:** x = Current health expenditure (% GDP); y = Life expectancy at birth (years, total).
- **Source and dataset:** x: World Bank WDI `SH.XPD.CHEX.GD.ZS` (underlying WHO Global Health Expenditure Database). y: OECD `OECD.ELS.HD,DSD_HEALTH_STAT@DF_LE,1.1` (LFEXP, Y0, _T).
- **Frequency and history:** A. Health spending 2000–2024; life expectancy 1960–2024.
- **Coverage and gaps:** All 7. Health spending: JPN and USA end 2023, so the default year is 2023 (2024 shows those two as n/a). Life expectancy: CAN from 1980; GBR, JPN latest flagged E.
- **Per-capita toggle:** No, both already scaled (% of GDP, years).
- **Reliability:** High. Well-established measures.
- **Data status:** Live, needs pull (two series).
- **Effort:** M. Scatter plus year slider.
- **Suggested tab:** Health

---

### 9. How each country makes its electricity

- **Name:** How each country makes its electricity
- **One-line idea:** Coal, other fossil fuels, nuclear and the rest: how has each country's power mix changed since 1990?
- **What it shows and why it's interesting:** Seven small stacked-area charts. You watch the UK's coal band vanish, France's nuclear band dominate, Germany's nuclear band end. The "everything else" band (mainly renewables and hydro) shows who has grown clean power.
- **Chart type:** Stacked area, small multiples (100% scale).
- **Metric(s) and formula:** Coal share; Oil and gas = fossil share minus coal share; Nuclear share; Everything else = 100 minus fossil minus nuclear. All % of electricity output.
- **Source and dataset:** World Bank WDI `EG.ELC.COAL.ZS`, `EG.ELC.FOSL.ZS`, `EG.ELC.NUCL.ZS` (underlying Ember/IEA via WB).
- **Frequency and history:** A, 1990 to 2025.
- **Coverage and gaps:** All 7 to 2025 for coal and fossil. Nuclear: DEU ends 2023 (phase-out), ITA ends 2021 (zeros). Where nuclear is n/a, the nuclear and "everything else" bands are n/a for that year, not assumed zero. (A dedicated renewables share, `EG.ELC.RNEW.ZS`, ends 2021, so it is not used.)
- **Per-capita toggle:** No, shares.
- **Reliability:** Medium-high. Good source; derived "everything else" band is a remainder.
- **Data status:** Live, needs pull (three series).
- **Effort:** M. Derivation plus n/a handling.
- **Suggested tab:** Environment & energy

---

### 10. Public debt: before the crash vs now

- **Name:** Public debt: before the crash vs now
- **One-line idea:** How much has each government's debt grown relative to its economy since 2007?
- **What it shows and why it's interesting:** A dot for 2007 and one for the latest actual year, joined. Japan's and Italy's high starting points, and which countries added most since, all on one screen.
- **Chart type:** Dumbbell chart (sorted by increase).
- **Metric(s) and formula:** General government gross debt (% GDP). Change = latest actual minus 2007.
- **Source and dataset:** IMF DataMapper, WEO, `GGXWDG_NGDP`.
- **Frequency and history:** A, 1980 to 2031 (includes IMF projections). The chart must stop at each country's last actual year; projections are not shown.
- **Coverage and gaps:** All 7. CAN 1980–2031; USA 2001–2031; GBR 1980–2031; JPN 1980–2031; DEU 1991–2031; FRA 1980–2031; ITA 1988–2031. USA only from 2001 in DataMapper. The last actual year must be confirmed per country at pull time.
- **Per-capita toggle:** No, already % of GDP.
- **Reliability:** High for the actual years.
- **Data status:** Live, needs pull.
- **Effort:** S. Main job is cutting off projections.
- **Suggested tab:** Economy

---

### 11. The baby gap

- **Name:** The baby gap
- **One-line idea:** How far below the "replacement" birth rate has each country fallen, and is anyone recovering?
- **What it shows and why it's interesting:** Seven mini charts, each with a dashed line at 2.1 births per woman (roughly what keeps a population stable without migration). France and the US stayed closer for longer; Italy and Japan went far below.
- **Chart type:** Small multiples with reference line.
- **Metric(s) and formula:** Fertility rate, total (births per woman). Reference line at 2.1 (a standard demographic rule of thumb, not from the dataset).
- **Source and dataset:** World Bank WDI `SP.DYN.TFRT.IN` (underlying UN WPP).
- **Frequency and history:** A, 1960 to 2024.
- **Coverage and gaps:** All 7, 1960–2024 each. Gaps not checked.
- **Per-capita toggle:** No, already a rate.
- **Reliability:** High.
- **Data status:** Live, needs pull.
- **Effort:** S.
- **Suggested tab:** Demographics

---

### 12. Whose pay really grew?

- **Name:** Whose pay really grew?
- **One-line idea:** Average real wages, then versus now: where did workers get ahead?
- **What it shows and why it's interesting:** 1990 on the left, 2025 on the right, in the same price-adjusted dollars. Flat lines (Italy and Japan are candidates) are as striking as steep ones.
- **Chart type:** Slope chart (with a "% growth" label on each line).
- **Metric(s) and formula:** Average annual wages (USD PPP, constant prices). Growth = 2025 / 1990 − 1.
- **Source and dataset:** OECD, `OECD.ELS.SAE,DSD_EARNINGS@AV_AN_WAGE,1.0`, unit `USD_PPP`.
- **Frequency and history:** A, 1990 to 2025.
- **Coverage and gaps:** All 7, 1990–2025 each. Full-history flags not checked.
- **Per-capita toggle:** No, already per worker.
- **Reliability:** High.
- **Data status:** Live, needs pull.
- **Effort:** S.
- **Suggested tab:** Labour

---

### 13. The inflation wave

- **Name:** The inflation wave
- **One-line idea:** When did inflation peak in each country, and how long did it take to get back near 2%?
- **What it shows and why it's interesting:** Heatmap rows per country, monthly cells coloured by inflation rate. The 2021-23 wave appears as a band that starts and ends at different times in each country. A toggle switches to core inflation (without food and energy) to show how sticky prices were underneath.
- **Chart type:** Heatmap (with headline / core toggle).
- **Metric(s) and formula:** CPI inflation, year on year (%), headline; core = excluding food and energy.
- **Source and dataset:** OECD, split across two flows: `DSD_PRICES@DF_PRICES_ALL` (COICOP 1999) current for USA, GBR, DEU; `DSD_PRICES_COICOP2018@DF_PRICES_C2018_ALL` current for CAN, JPN, FRA, ITA. Headline key `{area}.M.N.CPI.PA._T.N.GY`; core `{area}.M.N.CPI.PA._TXCP01_NRG.N.GY`.
- **Frequency and history:** M. Headline 1915-01 to 2026-09; core 1956-01 to 2026-08.
- **Coverage and gaps:** All 7 once stitched by country. Headline: CAN 1915-01–2026-08; USA 1956-01–2026-08; GBR 1956-01–2026-08; JPN 1971-01–2026-08; DEU 1956-01–2026-08; FRA 1956-01–2026-09; ITA 1956-01–2026-09. Trap: in the old flow JPN stops 2021-06. USA/GBR/FRA/ITA return 2 series each (national CPI vs HICP), filter on methodology.
- **Per-capita toggle:** No, a rate.
- **Reliability:** High once stitched correctly; medium until the stitch is checked.
- **Data status:** Live, needs pull.
- **Effort:** L. Two flows, per-country stitch and duplicate filtering.
- **Suggested tab:** Economy

---

### 14. G7 emissions map: change since 1990

- **Name:** G7 emissions map: change since 1990
- **One-line idea:** Which countries have cut greenhouse gases most since 1990, and has anyone gone up?
- **What it shows and why it's interesting:** A simple tile map (seven equal tiles laid out roughly by geography, so tiny countries aren't hidden), each coloured by % change in total emissions since 1990. Green = big cuts, red = increases. Tap a tile to see the line.
- **Chart type:** Tile map (cartogram), with tap-to-expand line.
- **Metric(s) and formula:** Greenhouse gas emissions, total (tonnes CO2 equivalent). Change = latest / 1990 − 1.
- **Source and dataset:** OECD, `OECD.ENV.EPI,DSD_AIR_GHG@DF_AIR_GHG,1.0`, key `CAN+USA+GBR+JPN+DEU+FRA+ITA..GHG._T.T_CO2E`.
- **Frequency and history:** A, 1990 to 2024.
- **Coverage and gaps:** All 7 from 1990. USA ends 2022 (2 years behind); its tile must say "to 2022". Others to 2024.
- **Per-capita toggle:** Yes. Use OECD GHG per capita (`KG_CO2E_PS`, same flow; 2 series per country, incl./excl. LULUCF, filter needed) or divide by World Bank `SP.POP.TOTL` (1960–2025, all 7).
- **Reliability:** High. Countries' official inventories via OECD.
- **Data status:** Live, needs pull.
- **Effort:** M. New map component.
- **Suggested tab:** Environment & energy

---

### 15. Who pays for research?

- **Name:** Who pays for research?
- **One-line idea:** How much each country spends on R&D, and how much of it comes from business.
- **What it shows and why it's interesting:** One bar per country, split into business-funded R&D and the rest (government, universities, non-profits). Ranks reveal which economies lean on companies and which on the state.
- **Chart type:** Stacked bar (ranked), with a year selector.
- **Metric(s) and formula:** Gross domestic R&D spending (% GDP) = total bar; Business R&D spending (% GDP) = business segment; Rest = GERD − BERD.
- **Source and dataset:** OECD, `OECD.STI.STP,DSD_MSTI@DF_MSTI,1.3` (G, PT_B1GQ and B, PT_B1GQ).
- **Frequency and history:** A. GERD 1981–2025; BERD 1981–2025.
- **Coverage and gaps:** All 7. GERD: CAN to 2025; USA, JPN, DEU, FRA, ITA to 2024; GBR ends 2023. BERD: CAN to 2025, others to 2024. Default year 2023 so all 7 are complete. USA latest GERD flagged D (definition differs).
- **Per-capita toggle:** No, already % of GDP.
- **Reliability:** High; note USA definition flag.
- **Data status:** Live, needs pull.
- **Effort:** S.
- **Suggested tab:** Innovation

---

### 16. The degree generation gap

- **Name:** The degree generation gap
- **One-line idea:** How much more educated are young adults than the workforce as a whole?
- **What it shows and why it's interesting:** For each country, one dot for all adults 25-64 and one for young adults 25-34 with a degree. A wide gap = a recent education boom.
- **Chart type:** Dumbbell chart.
- **Metric(s) and formula:** Tertiary attainment (% with a degree or equivalent, ISCED 5-8) for ages 25-64 and 25-34, latest year. Gap = 25-34 minus 25-64.
- **Source and dataset:** OECD, `OECD.EDU.IMEP,DSD_EAG_LSO_EA@DF_LSO_NEAC_DISTR_EA,1.0` (Y25T64 and Y25T34).
- **Frequency and history:** A, 1981 to 2025.
- **Coverage and gaps:** All 7. CAN 1981–2025; USA 1981–2025; GBR 1997–2025; JPN 1997–2025; DEU 1989–2025; FRA 1981–2025; ITA 1989–2025. Years before about 2000 are sparse. JPN latest flagged W (code not checked).
- **Per-capita toggle:** No, already a share.
- **Reliability:** High for latest year.
- **Data status:** Live, needs pull.
- **Effort:** S.
- **Suggested tab:** Education

---

### 17. Hardest place to be young and job-hunting

- **Name:** Hardest place to be young and job-hunting
- **One-line idea:** How many times higher is youth unemployment than unemployment overall?
- **What it shows and why it's interesting:** A ranked bar per country of the ratio (youth rate ÷ overall rate). It strips out the general state of the economy and asks whether young people specifically are left out.
- **Chart type:** Ranked horizontal bar (latest month), with a mini sparkline per bar.
- **Metric(s) and formula:** Ratio = Youth unemployment rate (15-24) / Unemployment rate (15+), same month.
- **Source and dataset:** OECD, `OECD.SDD.TPS,DSD_LFS@DF_IALFS_UNE_M,1.0`, youth key `....Y._T.Y15T24..M` and all-ages key `....Y._T.Y_GE15..M`.
- **Frequency and history:** M, 1955-01 to 2026-09.
- **Coverage and gaps:** All 7. Youth: CAN 1976-01–2026-08; USA 1955-01–2026-09; GBR 1983-01–2026-06; JPN 1968-01–2026-08; DEU 1991-01–2026-08; FRA 1983-01–2026-08; ITA 1983-01–2026-08. GBR ends 2026-06, so show its latest month. (Using OECD, not ILOSTAT, because ILOSTAT UK youth data stops 2020-09.)
- **Per-capita toggle:** No, a ratio of rates.
- **Reliability:** High. Same source and definitions on both sides of the ratio.
- **Data status:** Live, needs pull (two series).
- **Effort:** S.
- **Suggested tab:** Labour

---

### 18. Working less, everywhere?

- **Name:** Working less, everywhere?
- **One-line idea:** How much has the average working year shrunk since 2000, and where?
- **What it shows and why it's interesting:** A ranked bar of the change in hours worked per worker since 2000. OECD warns hour levels aren't fully comparable across countries, but changes over time are, so the chart ranks the change, not the level.
- **Chart type:** Ranked bar (diverging around zero).
- **Metric(s) and formula:** Average annual hours worked per worker. Change = latest − 2000 (hours) and %.
- **Source and dataset:** OECD, `OECD.ELS.SAE,DSD_HW@DF_AVG_ANN_HRS_WKD,1.0`.
- **Frequency and history:** A, 1950 to 2025.
- **Coverage and gaps:** All 7. CAN 1961–2025; USA 1950–2025; GBR 1970–2025; JPN 1970–2025; DEU 1970–2025; FRA 1950–2025; ITA 1970–2025.
- **Per-capita toggle:** No, already per worker.
- **Reliability:** Medium-high. Good for trends; levels not comparable (stated on card).
- **Data status:** Live, needs pull.
- **Effort:** S.
- **Suggested tab:** Labour

---

### 19. Surplus or deficit with the world

- **Name:** Surplus or deficit with the world
- **One-line idea:** Which countries earn more from the world than they spend, quarter by quarter?
- **What it shows and why it's interesting:** Bars above zero = surplus (Germany, Japan are candidates), below = deficit (US, UK). Quarterly bars show how shocks like the 2022 energy price spike flipped some countries.
- **Chart type:** Diverging bars over time, small multiples.
- **Metric(s) and formula:** Current account balance (% GDP).
- **Source and dataset:** OECD, `OECD.SDD.TPS,DSD_BOP@DF_BOP,1.0` (CA, B, PT_B1GQ).
- **Frequency and history:** Q, 1955-Q1 to 2026-Q2.
- **Coverage and gaps:** All 7. CAN 1981-Q1–2026-Q2; USA 1960-Q1–2026-Q2; GBR 1955-Q1–2026-Q2; JPN 1996-Q1–2026-Q2; DEU 1991-Q1–2026-Q2; FRA 1999-Q1–2026-Q2; ITA 1995-Q1–2026-Q2. All 7 together only from 1999-Q1. Latest values flagged E or P.
- **Per-capita toggle:** No, already % of GDP.
- **Reliability:** High; recent quarters revised often.
- **Data status:** Live, needs pull.
- **Effort:** S.
- **Suggested tab:** Trade

---

### 20. Household borrowing since 2007

- **Name:** Household borrowing since 2007
- **One-line idea:** Who borrowed more after the financial crisis, and who paid debt down?
- **What it shows and why it's interesting:** Seven small charts of household credit as % of GDP. Canada and the UK against Germany and Italy make a sharp contrast; the 2007 level is marked on each.
- **Chart type:** Small multiples (area) with a 2007 reference line.
- **Metric(s) and formula:** Credit to households (% of GDP).
- **Source and dataset:** BIS, `WS_TC` (total credit), key `Q.{CA..IT}.H.A.M.770.A`.
- **Frequency and history:** Q, 1947-Q4 to 2026-Q1.
- **Coverage and gaps:** All 7. CAN 1969-Q1–2026-Q1; USA 1947-Q4–2026-Q1; GBR 1966-Q4–2026-Q1; JPN 1964-Q4–2026-Q1; DEU 1970-Q4–2026-Q1; FRA 1977-Q4–2026-Q1; ITA 1960-Q4–2026-Q1. Gaps not checked. The inventory reads unit code 770 as % of GDP; confirm in the codelist before launch.
- **Per-capita toggle:** No, already % of GDP.
- **Reliability:** Medium until the unit code is confirmed, then high.
- **Data status:** Live, needs pull.
- **Effort:** S.
- **Suggested tab:** Housing

---

### 21. How open is each economy?

- **Name:** How open is each economy?
- **One-line idea:** Trade as a share of the economy: who lives off trade and who mostly sells at home?
- **What it shows and why it's interesting:** Each bar split into exports and imports (% of GDP), ranked by total. Germany vs the US and Japan shows very different models.
- **Chart type:** Stacked ranked bar.
- **Metric(s) and formula:** Exports of goods and services (% GDP) + Imports of goods and services (% GDP).
- **Source and dataset:** World Bank WDI `NE.EXP.GNFS.ZS` and `NE.IMP.GNFS.ZS`.
- **Frequency and history:** A, 1960 to 2025.
- **Coverage and gaps:** All 7. CAN 1961–2025; DEU 1970–2025; FRA 1960–2025; GBR 1970–2025; ITA 1970–2025; JPN 1970–2024; USA 1970–2024. JPN and USA end 2024, so default year is 2024.
- **Per-capita toggle:** No, already % of GDP.
- **Reliability:** High.
- **Data status:** Live, needs pull (two series).
- **Effort:** S.
- **Suggested tab:** Trade

---

### 22. Jobs recovery scorecard

- **Name:** Jobs recovery scorecard
- **One-line idea:** Is a bigger share of working-age people in work now than before the pandemic?
- **What it shows and why it's interesting:** A ranked bar of the change in employment rate since 2019-Q4. Pairs well with card 1: output vs jobs.
- **Chart type:** Ranked bar (diverging around zero).
- **Metric(s) and formula:** Employment rate, ages 15-64 (%). Change = latest quarter − 2019-Q4, in percentage points.
- **Source and dataset:** OECD, `OECD.SDD.TPS,DSD_LFS@DF_IALFS_INDIC,1.0`, key `{G7}.EMP_WAP...Y._T.Y15T64+Y_GE15._Z.{M|Q}`.
- **Frequency and history:** M (CAN, USA, JPN); Q for all seven. 1970-01 to 2026-Q2.
- **Coverage and gaps:** All 7 quarterly. CAN 1976-01–2026-08; USA 1977-01–2026-09; JPN 1970-01–2026-08; GBR 1971-Q1–2026-Q2; DEU 2005-Q1–2026-Q2; FRA 2003-Q1–2026-Q2; ITA 1998-Q1–2026-Q2. USA 2025-Q4 n/a. ITA break at 2008-Q4. DEU quarters all flagged E.
- **Per-capita toggle:** No, already a rate.
- **Reliability:** High.
- **Data status:** Held.
- **Effort:** S.
- **Suggested tab:** Labour

---

### 23. One in how many? Migrants in each country

- **Name:** One in how many? Migrants in each country
- **One-line idea:** Out of every 100 residents, how many were born abroad, and how has that changed since 1990?
- **What it shows and why it's interesting:** A 10×10 grid of squares per country, coloured squares = international migrants. Easy to grasp on a phone; a toggle flips between 1990 and 2024.
- **Chart type:** Waffle chart (small multiples).
- **Metric(s) and formula:** International migrant stock (% of population), rounded to whole squares (exact value in label).
- **Source and dataset:** World Bank WDI `SM.POP.TOTL.ZS` (underlying UN DESA International Migrant Stock).
- **Frequency and history:** A, 1990 to 2024, but only 8 points per country (5-yearly 1990-2020 plus 2024).
- **Coverage and gaps:** All 7, 1990–2024. No in-between years; do not interpolate.
- **Per-capita toggle:** No, already % of population.
- **Reliability:** Medium-high. UN estimates; sparse years.
- **Data status:** Live, needs pull.
- **Effort:** M. New waffle component.
- **Suggested tab:** Demographics

---

### 24. Workers' slice of the pie

- **Name:** Workers' slice of the pie
- **One-line idea:** Is a bigger or smaller share of national income going to workers than in 2004?
- **What it shows and why it's interesting:** Slope from 2004 to the latest actual year. Shows whether growth has flowed to wages or to profits.
- **Chart type:** Slope chart.
- **Metric(s) and formula:** Labour income share (% GDP).
- **Source and dataset:** ILOSTAT, `ILO,DF_LAP_2GDP_NOC_RT,1.0`.
- **Frequency and history:** A, 2004 to 2026.
- **Coverage and gaps:** All 7, 2004–2026. ILO modelled estimates; recent years may be projections (2026 is present). End the chart at the last year ILO treats as actual; confirm that year at pull time. Breaks not checked.
- **Per-capita toggle:** No, already % of GDP.
- **Reliability:** Medium. Modelled, and recent years may be projections.
- **Data status:** Live, needs pull.
- **Effort:** S.
- **Suggested tab:** Labour

---

### 25. How unequal are incomes?

- **Name:** How unequal are incomes?
- **One-line idea:** Where does each country sit on income inequality after taxes and benefits?
- **What it shows and why it's interesting:** One dot per country on a 0-1 scale (0 = everyone equal), latest year each. The US and UK vs France and Germany.
- **Chart type:** Dot plot (ranked), with each country's year printed by its dot.
- **Metric(s) and formula:** Gini coefficient, disposable income (METH2012).
- **Source and dataset:** OECD, `OECD.WISE.INE,DSD_WISE_IDD@DF_IDD,1.0` (INC_DISP_GINI, METH2012).
- **Frequency and history:** A, 1976 to 2023, not every year.
- **Coverage and gaps:** All 7, but thin and uneven. CAN 1976–2023; USA 2012–2023; GBR 2002–2023; JPN 2018–2021 only; DEU 2008–2023; FRA 2011–2023; ITA 2003–2023. Japan is the weak spot (latest 2021). USA and FRA return 2 series each (filter needed). Older METH2011 years not included. No time view: too uneven.
- **Per-capita toggle:** No, an index.
- **Reliability:** Medium. Good measure, but latest years differ by country and Japan is short.
- **Data status:** Live, needs pull.
- **Effort:** S (plus the USA/FRA filter).
- **Suggested tab:** Economy

---

## Needs pulls

Series not yet held that the top-ranked ideas depend on, in rank order. All are verified live (10 Oct 2026); none are unverified.

1. OECD `DF_IALFS_UNE_M` unemployment rate 15+, monthly, all 7 (card 2; also card 17).
2. OECD `DF_TABLE1_EXPENDITURE_HCPC` GDP per capita, current PPPs (card 3).
3. WDI `SP.POP.65UP.TO.ZS` population 65+ share (card 4).
4. WDI `NY.GDP.PCAP.PP.KD` and `EN.GHG.CO2.PC.CE.AR5` (card 5).
5. OECD `DF_HOUSE_PRICES` price-to-income `HPI_YDH` (card 6).
6. BIS `WS_CBPOL` policy rates (card 7).
7. WDI `SH.XPD.CHEX.GD.ZS` and OECD `DF_LE` life expectancy (card 8).
8. WDI `EG.ELC.COAL.ZS`, `EG.ELC.FOSL.ZS`, `EG.ELC.NUCL.ZS` (card 9).
9. IMF WEO `GGXWDG_NGDP`, cut at last actual year (card 10).
10. WDI `SP.DYN.TFRT.IN` (card 11); OECD `AV_AN_WAGE` (card 12).
11. OECD CPI headline and core, both flows (card 13, large job).
12. OECD `DF_AIR_GHG` total (card 14); WDI `SP.POP.TOTL` as the per-capita denominator.
13. Lower priority: MSTI GERD/BERD, EAG attainment, youth unemployment monthly, hours worked, BOP current account, BIS household credit, WDI trade % GDP, WDI migrant stock, ILO labour share, OECD Gini.

Already held and usable now: real GDP, population, real GDP per capita, employment level, employment rate, unemployment rate (quarterly for all 7). Note the held unemployment file is not on the GitHub remote yet.
