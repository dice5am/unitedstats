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
