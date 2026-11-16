# v3.143: shorter champion table on profile stats

## What changed
- **Why:** on the profile Stats tab, "Champions played" listed every champion, and in a wide pool most rows were one-game picks (demo Caps: 10 rows, 6 with one game). That pushed Arena, lane opponents, records, roles and trends far down the page.
- **Collapse:** when there are more than 8 rows, the table shows the first 6 by the current sort (`CHAMP_ROWS`). A button, "Show all {count} champions ({hidden} more)" / "Show fewer", has `aria-expanded`. Sorting still runs over all rows, so sorting by win rate or KDA shows the top six for that column.
- **Strings:** `stats.champsAll` and `stats.champsFewer` in all 7 languages.

## Checks
- `tsc`, `vitest` (183) and `vite build` pass.
- a11y: `{}`.
- Demo: 6 rows, then 10 after the click.
- Screenshots: `demo/` and `demo/champs-collapsed.png`.

## Live check (2026-11-16 09:34 local)
- The live index serves `index-i6wxMGUx.js`, and its Profile chunk contains `stats.champsAll`, so the collapsing table is deployed.
