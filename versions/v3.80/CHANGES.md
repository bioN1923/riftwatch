# v3.80 — Tier list: small samples don't top a rate sort

Live check of the tier list sorted by win rate. The top was Annie Support 66.7% (36 games), Akshan Top 66.7% (54), Rek'Sai Top 63.6% (55) and Zac Mid 61.9% (42). Those are off-role picks with tiny samples, already marked `*` (42 of 309 rows), but sorted above every real result.

## Change
- `Champions.tsx`:
  - When sorting by win rate, pick rate or ban rate, rows flagged `lowSample` go after the rest, still sorted among themselves. A note above the table says so whenever such rows exist.
  - A small-sample win rate is greyed out, with the "Small sample" tooltip.
  - On phones, where the Games column is hidden, it carries the `*`.
- Tier and name sorts are unchanged.
- String `tl.smallLast` in 7 languages.

## Checks
tsc clean · 119 tests pass · a11y `{}`. The demo has no small-sample rows, so the order is checked in the live check.

## Live check (2026-11-14 16:28)
- Deploy finished cleanly at 16:27. Sorted by win rate, the live tier list now starts with Pantheon Mid 61.2% (85 games), Riven Mid 60.1% (173), Zilean Top 59.6% (114) and Lux Bot 58.8% (182).
- All 42 small-sample rows come after the other 266, and the note shows above the table. Screenshot: `live/tier-sort-wr.jpg`. Sort state isn't saved anywhere.
