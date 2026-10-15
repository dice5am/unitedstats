# Unemployment long series: gate (Labour unemployment chart and heat strip)

Date: 10 Oct 2026, about 06:50 UK time. Nothing was modified or pushed. The scripts and output are in crosscheck/gate_unemp_long.py and crosscheck/gate_unemp_long.out. No new data was pulled after your instruction: the ILOSTAT checks use raw/ilo_20261010T053734Z/ and two ILOSTAT files I had pulled to crosscheck/raw/ (ilo_UNE_M.csv, ilo_UNE_Q.csv) just before it arrived.

**Gate: PASS, with labels (listed at the end).**

## Files
- **Source:** export/oecd_unemployment_rate_m_15plus.json, sha256 3b47f4f64886a4f18b893654bd5257ead54c9d7b7c51d78a7acd4aa300d72e15. It comes from OECD DF_IALFS_UNE_M and is the same file the heat strip uses.
- **Wrapper:** /workspace/skyscraper/canada-factcheck/warehouse/export/c1_unemployment_rate_long.json, sha256 ccf0417e18e2398fa250591d489a8653d2345afa8b260037b157560bd78556b1.
- **Old chart file:** c1_unemployment_rate.json, sha256 7c77ec1f71358c42a1f9633e03e2e2078e138224c1bcb78ee8b4e3ce91d4483a. It is identical in the warehouse, in the repo working copy and at git HEAD, so it is untouched.

## Source checks
- **Seasonally adjusted, ages 15+:** Yes. Every raw row has ADJUSTMENT=Y and AGE=Y_GE15.
- **Duplicate country-months:** None.
- **Zeros:** None.

- **Canada:** start 1955-01; end 2026-08; nulls 0; flags B (break) at 1975-12
- **US:** start 1955-01; end 2026-09; nulls 1 (2025-10); flags none
- **Japan:** start 1955-01; end 2026-08; nulls 0; flags none
- **UK:** start 1983-01; end 2026-06; nulls 0; flags none
- **Germany:** start 1991-01; end 2026-08; nulls 0; flags none
- **France:** start 1983-01; end 2026-08; nulls 0; flags none
- **Italy:** start 1983-01; end 2026-08; nulls 0; flags P (provisional) on 108 months, 1983-01 to 1991-12

- **The US null is a real gap.** OECD publishes no October 2025 value, and the ILOSTAT US series also skips that month. I believe this was the federal shutdown, but I haven't confirmed that from a source document.
- **Start dates:** The UK, France and Italy do go back to 1983, and Germany to 1991. The raw OECD pull has no earlier rows for them. Germany starts in 1991 because it is unified Germany.
- **Against the old chart file:**
  - Canada, the US and Japan monthly: the maximum difference is 0.0, an exact match.
  - Quarterly, all seven: see the wrapper section below.

## Wrapper checks
- **Monthly figures:** an exact copy of the source for all 7 countries (periods, values and flags).
- **Quarters:** every quarter is the mean of its three months, with 0 mismatches. A quarter is null if any month is missing; the only one is US 2025-Q4.
- **golden_round3.json** (canada-factcheck/analysis):
  - It has the new key unemployment_long_pts.
  - The four existing keys match the repo copy at HEAD exactly.
  - I recomputed all 35 window values independently from the source, with 0 mismatches.

### Old quarterly vs new quarterly
- **Canada, US, Japan:** max difference 0.000003 (rounding); where n/a; since 2023 0
- **UK:** max difference 1.13 pts; where 1984-Q2 (10.73 new, 11.87 old); since 2023 0.14 or less
- **Italy:** max difference 0.83 pts; where 2020-Q2; since 2023 0.59 pts (2026-Q1: 5.57 new, 4.98 old)
- **Germany:** max difference 0.61 pts; where 2004-Q2; since 2023 0.14 or less
- **France:** max difference 0.48 pts; where 2003-Q4; since 2023 0.06 or less

Warehouse's figures are confirmed: up to 1.1 points apart, and Italy 0.59 apart since 2023.

**Why they differ.** Both series are OECD, both use the ILO definition, both cover ages 15 and over, and both are seasonally adjusted, so this is not a definition change. They are two different OECD estimates:
- **The old series** is DF_IALFS_INDIC, a quarterly labour force survey compilation. Every German quarter in it is flagged E (estimated).
- **The new series** is DF_IALFS_UNE_M, a monthly estimate.

The new series almost exactly matches ILOSTAT's "EU Labour Force Survey adjusted series" (yearly averages):

- **UK 1984:** new 10.87; ilo 10.86; old 11.77
- **France 2010:** new 9.27; ilo 9.28; old 8.87
- **Germany 2019:** new 2.95; ilo 2.95; old 3.14
- **Italy 2020:** new 9.35; ilo 9.30; old 9.15

This suggests the old quarterly series is the outlier: a different estimate, or an older revision. For Italy since 2023, the old quarters move more sharply (2025-Q4 5.49, 2026-Q1 4.98, 2026-Q2 5.85) than the monthly-based ones (5.73, 5.57, 5.73). That fits a difference in seasonal adjustment or estimation, but I could not confirm the cause from OECD documents, so it should not be stated as fact.

## Break flags
- **What the new series carries:** Canada 1975-12 (B), which Warehouse kept. Germany, France and Italy have no break flags in DF_IALFS_UNE_M.
- **The old annual breaks:** Germany 1998, 2004, 2009, 2010 and 2019; France 2004, 2013 and 2020; Italy 2003, 2004 and 2020.
- **Jumps in the new series** (December to the following January) in those years: Italy 2003 +0.4; every other break year moves by 0.1 or less.

Dropping the old breaks matches what the new series publishes. The new series looks smoothed across those survey changes rather than broken. The underlying surveys did change, however, so this is a risk to note rather than a lost break flag. I recommend a footnote rather than break ticks: "Germany, France and Italy: OECD monthly estimates, smoothed across survey changes; no break flagged by OECD."

## ILOSTAT cross-check (recent levels)
ILOSTAT's monthly series (DF_UNE_DEAP) appears not to be seasonally adjusted, so a single month can differ from the OECD's seasonally adjusted figure. I inferred that from the data: the 12-month means agree, but single months don't. It isn't confirmed in metadata.

- **Canada:** latest common period 2026-08; oecd 6.4; ilo 7.30; difference -0.90; 12-month mean difference +0.03
- **US:** latest common period 2026-09; oecd 4.2; ilo 4.0; difference +0.20; 12-month mean difference -0.01
- **Japan:** latest common period 2026-08; oecd 2.5; ilo 2.6; difference -0.10; 12-month mean difference 0.00
- **Germany:** latest common period 2026-07; oecd 4.0; ilo 4.2; difference -0.20; 12-month mean difference -0.01
- **France:** latest common period 2026-07; oecd 8.3; ilo 8.1; difference +0.20; 12-month mean difference -0.01
- **Italy:** latest common period 2026-07; oecd 6.0; ilo 6.3; difference -0.30; 12-month mean difference +0.06
- **UK (quarterly):** latest common period 2026-Q1; oecd 4.93; ilo 4.40; difference +0.53; 12-month mean difference n/a

- **US:** ILO's figure covers ages 16 and over.
- **UK:** ILO's monthly UK series stops in 2020-09, so I used its quarterly figure. Over 2025, ILO's four quarters average 4.89 against 4.85 for the OECD.
- **Differences over 0.5 points:**
  - **Canada, August 2026 (0.9):** a seasonal effect. ILO's August figure isn't adjusted, and the 12-month means differ by only 0.03.
  - **UK, 2026-Q1 (0.53):** the same reason. ILO's Q1 figure isn't adjusted, and the 2025 averages agree within 0.04.

**Verdict:** agree.

## What Web must label
- **US, October 2025:** n/a (not published), and US 2025-Q4 n/a in the quarterly view.
- **UK:** ends 2026-06; show its own latest month.
- **Start dates:** the UK, France and Italy start 1983-01, and Germany 1991-01. Before that, show n/a, never zero.
- **Canada:** break at 1975-12.
- **Italy:** 1983-01 to 1991-12 are provisional (P).
- **Source change:** the chart now uses OECD monthly estimates (DF_IALFS_UNE_M). UK, German, French and Italian figures can differ from the earlier quarterly series by up to 1.1 points historically, and by up to 0.6 for Italy recently.
- **Germany, France and Italy:** the footnote on smoothed survey changes (above).
