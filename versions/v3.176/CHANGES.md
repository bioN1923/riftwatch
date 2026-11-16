# v3.176: clear an empty Items filter

## What changed
- **Why:** same gap as the tier list (v3.175). On `/items`, a search with no matches, or a type chip plus text that leaves nothing, showed "No items match." with no way back but undoing both by hand.
- **Fix:** the empty row gets a "Clear filter" button (reusing `tl.clearFilter`). It empties the search box and removes `?kind=` from the URL. It shows only when a filter is actually set.
- **Team-draft data:** the first `ally` reason has appeared (bot test draft). Enemy reasons are growing: mid 2, jungle 4.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Click test: `?kind=crit` plus "zzqq" gives the empty row; the button brings back all 41 items, with no query string left.
- Screenshots: `demo/items-clear.png` and `demo/`.

## Live check (2026-11-16 16:27 local)
- The live index serves `index-dKTJ93I3.js`, and its Items chunk contains `tl.clearFilter`.
- A late second copy of the v3.176 reminder arrived during the work; it was done once.
