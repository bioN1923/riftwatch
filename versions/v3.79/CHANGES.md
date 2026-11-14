# v3.79 — Champions played on phones

The last table from the v3.78 phone sweep. The Stats tab's "Champions played" had a 760 px minimum width, so on a phone CS, damage, gold, kill share, damage share and vision sat off-screen.

## Change
- `StatsTab.tsx`: below `sm`, the table shows Champion, Games (with W/L), Win rate and KDA (with averages) at full width. The six per-minute columns, header and cells, appear from `sm` up, where the layout is unchanged.

## Checks
tsc clean · 119 tests pass · a11y `{}` · phone sweep: every page is clear apart from the tier list's role tabs, which scroll on purpose · demo `phone-stats-table.png`.

## Live check (2026-11-14 16:19)
- Deploy finished cleanly at 16:18. On desktop, bioN1923's Champions played table still shows all ten columns (Champion … Vision/min), so desktop is unchanged.
- The phone layout was checked on the demo server, without resizing the user's browser.
