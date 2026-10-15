# Chart 9: options for a fuller electricity mix

Checked 10 Oct 2026, about 07:05 UK time. Open sources only, with no keys. Raw pulls are in crosscheck/elec_mix/ (MANIFEST.txt lists the URLs and sha256). Nothing was added to export/.

## TLDR
- **World Bank:** has coal, gas, oil, nuclear and hydro up to 2025 for all 7 countries, with nuclear stopping early for Germany (2023) and Italy (2021). But "renewables excluding hydro" (EG.ELC.RNWX.ZS) stops in 2021, so a full split that adds to about 100% only exists up to 2021.
- **Ember:** the only open, no-key source with a full split up to 2025 for all 7 countries. It covers 2000 to 2025 in 9 fuels, and the shares add to 100% (rounding to ±0.01). The licence is CC BY 4.0.
- **IEA Monthly Electricity Statistics:** free to download, but IEA's terms exclude standalone datasets from CC BY 4.0. It is also a non-standard source for this project. Not recommended.
- **OECD SDMX:** has no national generation-by-source dataset. The only one I found is regional (TL2/TL3) and partly modelled.
- **Recommendation:** Ember for a full 2025 mix. If the "international organisations only" rule must hold, use World Bank 2021 for the full split, or keep the current 4-band chart (coal, oil and gas, nuclear, everything else) up to 2025. Ember is a think tank, not an international organisation, so using it changes the project's source rule. That is Cavin's call.

---

### Option 1. World Bank WDI output shares
- **Series:** EG.ELC.COAL.ZS (coal), EG.ELC.NGAS.ZS (gas), EG.ELC.PETR.ZS (oil), EG.ELC.NUCL.ZS (nuclear), EG.ELC.HYRO.ZS (hydro), EG.ELC.RNWX.ZS (renewables excluding hydro), EG.ELC.FOSL.ZS (fossil total). All are % of electricity output.
- **Latest non-null year:**
  - Coal, gas, oil, hydro and fossil: 2025 for all 7.
  - Nuclear: 2025, except Germany 2023 and Italy 2021.
  - Renewables excluding hydro: 2021 for all 7.
- **Do the shares add to about 100?** Yes, up to 2021. Coal + gas + oil + nuclear + hydro + renewables excluding hydro in 2021:
  - Canada 99.56
  - US 99.67
  - France 99.44
  - Italy 98.98
  - UK 98.26
  - Germany 98.13
  - Japan 96.49

  The gap of up to 3.5 points is fuels not listed (other or not specified). From 2022, with no renewables series, the listed shares add to only 49 to 92 (Germany 2023 49.2, UK 2023 53.1).
- **Fossil check:** coal + gas + oil equals EG.ELC.FOSL.ZS (Canada 2015: 9.43 + 9.82 + 1.17 = 20.42 against 20.42).
- **Licence:** World Bank open data, CC BY 4.0 (World Bank terms; not re-quoted here)
- **Access:** api.worldbank.org/v2, no key
- **Verdict:** a full split only goes to 2021. Up to 2025, only coal, gas, oil, nuclear and hydro, with the rest shown as a residual.

### Option 2. Ember yearly electricity data
- **File:** https://storage.googleapis.com/emb-prod-bkt-publicdata/public-downloads/yearly_full_release_long_format.csv (no key, 49 MB). Linked from https://ember-energy.org/data/yearly-electricity-data/
- **Latest year:** 2025 for all 7. The first year is 2000 for all 7.
- **Split** (Category "Electricity generation", Subcategory "Fuel", in % and TWh): Bioenergy, Coal, Gas, Hydro, Nuclear, Other Fossil, Other Renewables, Solar, Wind. Ember also publishes aggregates: Clean, Fossil, Renewables, Wind and Solar, Gas and Other Fossil, and Hydro, Bioenergy and Other Renewables.
- **Sum check, 2025:** every country adds to 99.99–100.01. "Other Renewables" is empty for Canada, the UK and Japan in 2025.
- **2025 examples:**
  - France: nuclear 68.77
  - Japan: coal 32.05, gas 32.78
  - Germany: wind 27.18, coal 20.61, solar 17.91, nuclear 0.0
- **Licence:** "Ember content is released under a Creative Commons Attribution Licence (CC-BY-4.0). This means you're free to share and adapt our work – as long as you credit us." (https://ember-energy.org/creative-commons/)
- **API:** api.ember-climate.org needs a free key. The CSV doesn't.
- **Caveat:** Ember is a think tank. It compiles data from EIA, Eurostat, the Energy Institute, the UN and national sources (its metadata says so). It is not an international organisation.

### Option 3. IEA Monthly Electricity Statistics
- **Content:** net electricity production by source: nuclear, conventional thermal (with coal, oil and gas inside it), hydro, wind, solar, geothermal, combustible renewables, other renewables and not specified. It covers all OECD countries, including all 7.
- **Latest data:** to June 2026 (released 16 Sep 2026). I didn't pull it, so I haven't confirmed the latest year per country.
- **Access:** free SDMX ZIP or CSV export through the IEA .Stat Data Explorer. https://www.iea.org/data-and-statistics/data-product/monthly-electricity-statistics
- **Licence:** IEA's terms (https://www.iea.org/terms) say CC BY 4.0 does not cover "Standalone datasets, data explorers and databases". The dataset falls under IEA's Non-CC terms, so republishing it in a public chart would need checking.
- **Annual version:** IEA Electricity Information has 1960–2025 for OECD countries, but it is a registered or paid product.

### Option 4. OECD SDMX
- **Found:** DSD_REG_ENE@DF_PROD_ELEC, "Electricity generation – Regions". It is subnational (TL2/TL3), and partly estimated from IEA national data plus plant databases.
- **National full split:** none found in OECD SDMX.
- **Verdict:** not suitable.
