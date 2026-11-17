# v3.217: CS at 15 with one decimal

## Found
- In the Matchup header (`v3.216/demo/04-matchup.jpg`, Ahri vs Zed), CS at 15 read **−1**.
- The "How the lane goes" chart right below it ended at **−1.3 @15**: the same number, rounded differently.
- CS gaps in lane are small (a few minions), so the decimal carries real information and rounding it away hides it.

## What changed
- `Lead` for `csDiff15` now uses `decimals={1}` in:
  - the Matchup header tile
  - the champion page's matchup table
- The colour threshold (`CS_QUIET`, 3) is unchanged.
- Gold and XP stay whole numbers, as in the chart.

## Checks
- `tsc`, `vitest` (190) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`. The header now reads −1.3.
