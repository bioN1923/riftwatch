# v3.197: lane opponents without tiny-sample percentages

## Scans
- **0% / 100% sweep:** a DOM scan at 1280 px across 12 pages, for every "0%" or "100%" on screen and its context.
  - Most hits are a player's own tallies with the count right beside them, such as "Kha'Zix 3W 0L 100%", "Mid 1 game · 100%" and "2× · 0%" on the per-champion items. Those are factual personal records, already plain-coloured since v3.189, and they match how op.gg and u.gg show a player's history. They were left alone.
  - The redundant case was "Lane opponents": "Lee Sin 0–1 · 0%" repeats the record as a verdict-looking percentage.
- **Cut-off scan:** 14 pages at 390 px in French, Spanish, Portuguese and Romanian. No cut-off or overflowing text.

## What changed
- **`LaneOpponents` (StatsTab.tsx):** with fewer than `TONE_MIN_GAMES` (5) games, the card shows only the W–L record. From 5 games, " · 60%" is added as before, coloured with `winRateTone`.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/lane-opponents-phone.png` and `demo/`.

## Live
- Deployed 21:39 local. The live bundle has v3.197 and the new changelog line.
