# v3.12 — 13 Nov 2026

## Live check (before)
- `/champions/ahri/vs/syndra`: a small up/down scroll control showed next to the role tabs on desktop (Windows scrollbars on an `overflow-x-auto` row that also scrolled vertically by a pixel).

## Added
- **"How the lane goes"** on matchup pages: two small line charts showing the champion's average gold lead and CS lead over the opponent at 5, 10 and 15 minutes, with a zero line, green/red points and the 15-minute value in the header. Screen readers get every value in the chart's label.
  - Server: `addTimeline` now sums the lane leads at frames 5/10/15 for both laners when all three frames exist (`ld`, `ln` on each matchup pair). `matchup()` returns `lane` once at least 5 such games are recorded.
  - Data builds up from timelines collected from now on, so on the live site the chart appears per matchup as games come in.
  - Translated in all 7 languages (`mp.laneTitle`, `mp.laneSub`, `mp.laneGold`, `mp.laneCs`, `mp.minute`).

## Fixed
- Tab rows (match details, champion, matchup, champions list) get `overflow-y-hidden`, removing the stray vertical scroll control.

## Checks
- 56 tests pass (new "lane curve" test), typecheck and build pass, a11y check clean.
- Demo screenshots in `demo/` (14–15 show the lane chart in dark and light).
