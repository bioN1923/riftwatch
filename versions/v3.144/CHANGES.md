# v3.144: phone champion header alignment

## What changed
- **Why:** on phones, the champion page's stat strip is a 3-column grid with `items-end`. The tier badge is taller than the numbers, so the "Tier" label sat higher than "Win rate" and "Pick rate" in the same row (visible in v3.143 `12-phone-champion.jpg`).
- **Fix:** the grid now uses `items-start` on phones, so labels line up at the top of each row. From `sm` up it is the same flex row with `items-end`, unchanged on desktop.

## Checks
- `tsc`, `vitest` (183) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/` (`12-phone-champion.jpg` shows the aligned labels).
- The terminal check failed for about 12 minutes mid-version, so this shipped a little later than usual.

## Live check (2026-11-16 09:56 local)
- The live index serves `index-C1AQq_7I.js`, and its Champion chunk has the new grid classes (`sm:items-end sm:gap-x-8`).
