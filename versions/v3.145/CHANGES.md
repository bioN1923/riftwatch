# v3.145: tier bands on the tier list

## What changed
- **Why:** the tier list (44+ rows) had the same thin line between every row. The only cue for where one tier ended was the small badge, so it was hard to see that, for example, S stops at row 10.
- **Fix:** when sorted by tier (the default), a row whose tier differs from the row above gets a `border-t-2 border-line-strong` line instead of the usual thin one. Other sorts are unchanged, since tiers are mixed there.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/` and `demo/tier-bands.png`, which shows the S+→S and S→A breaks.

## Live check (2026-11-16 10:04 local)
- The live index serves `index-D3WzjWx1.js`, and its Champions chunk contains the tier-break class.
