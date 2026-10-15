# Ember electricity mix (chart 9): gate

Checked 10 Oct 2026, about 07:05 UK time. Nothing was modified or pushed. The script and output are crosscheck/elec_mix/gate_ember.py and crosscheck/elec_mix/gate_ember.out.

**Gate: PASS, with labels for Web (listed at the end).**

## The file
- **Path:** /workspace/skyscraper/unitedstats-warehouse/export/ember_electricity_mix_share.json
- **sha256:** 7859146f7212f4bf3d1f95f029f8bbfb4f3391767b4965a75f357b4767731659
- **Built from:** Ember's yearly long-format CSV. The raw sha256 recorded in the file (259e1095…4c3b) is the same as my own independent pull in crosscheck/elec_mix/.

## Checks
- **Values:** all 1,586 country-source-year values match my raw pull exactly (0 mismatches). Nulls match too.
- **Coverage:** all 7 countries and every year from 2000 to 2025, with no missing years.
- **Duplicates:** none in the file and none in the raw data.
- **Categories:** the 9 Ember fuels exactly: Bioenergy, Coal, Gas, Hydro, Nuclear, Other Fossil, Other Renewables, Solar, Wind.
  - For Canada and Japan, "Other Renewables" is absent. Ember publishes no rows for it for either country, so this is correct, not a gap.
- **Sum to 100:** the 9 shares add to between 99.98 (Germany 2008) and 100.02 (Japan 2022) for every country-year. A tolerance of 0.1 holds everywhere.
- **Nulls:** only UK "Other Renewables" for 2020–2025 (6 years), exactly as in the raw data.
- **Zeros:** all are real zeros published by Ember, not stand-ins for missing values (0 zeros where the raw value is missing):
  - Italy nuclear: 26 years
  - Germany nuclear: 2 years (2024–25)
  - Japan nuclear: 1 year
  - Early solar: Canada, UK and France 8 years each; Germany 1
  - Other Renewables: UK 20 years, Germany 14
- **No double counting:** Ember's six aggregates sit in a separate block, "aggregates_not_to_sum", not among the 9 fuels. They are Clean, Fossil, Gas and Other Fossil, Hydro, Bioenergy and Other Renewables, Renewables, and Wind and Solar. They also match the raw data exactly. Web must never add them to the 9 fuels.
- **Credit line:** "Source: Ember, Yearly Electricity Data (CC BY 4.0)"
- **Licence:** CC BY 4.0. Ember's wording: "Ember content is released under a Creative Commons Attribution Licence (CC-BY-4.0)" (https://ember-energy.org/creative-commons/)
- **Exception note:** recorded in the file ("One-chart exception to international-sources rule (Cavin, chart #9)").

## Labels Web must show
- **Credit line:** show the one above on the chart.
- **Category order:** stack the 9 fuels only, never the aggregates.
- **Missing values:**
  - UK "Other Renewables" for 2020–2025 is n/a, not 0.
  - Canada and Japan have no "Other Renewables" band, which is not 0.
- **Rounding:** totals may show 99.98–100.02.
- **Source note:** this chart's source is a think tank, as an approved one-off exception.
