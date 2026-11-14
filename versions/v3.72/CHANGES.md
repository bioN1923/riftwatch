# v3.72 — Ladder: who has the LP for the tier above

Like the "promotion cutoff" other ladders show, but only with what Riftwatch can see.

## Change
- `Leaderboard.tsx`:
  - On Grandmaster and Master, one extra cached query fetches the tier above (Challenger and Grandmaster respectively), page 1, for its `minLp`. That's the same query the ladder itself uses, so it's shared when the user switches tiers.
  - Shows "Lowest Challenger right now: 903 LP" under the tier line.
  - Players at or above that LP get a gold "Challenger LP" chip. Its tooltip says they're likely to move up at Riot's next daily update; the existing cutoff tooltip explains that Riot recalculates once a day.
- Polish: `LiveGame.tsx` damage mix drops zero parts. The keys are now `live.dmgAd/Ap/Mixed`, and `live.dmgMix` is removed.
- Strings `lb.upperCut`, `lb.upperChip`, `lb.upperTip` in 7 languages.

## Checks
tsc clean · 116 tests pass · a11y `{}` · demo:
- Grandmaster: "Lowest Challenger right now: 903 LP". No chips, because demo GM LP stays below that.
- Master: "Lowest Grandmaster right now: 451 LP".
- Live game: "2 AD · 3 AP".

## Live check (2026-11-14 15:14)
- Deploy finished cleanly at 15:13. EUNE Grandmaster: "Players in Grandmaster: 500 · lowest right now: 1,210 LP / Lowest Challenger right now: 1,868 LP".
- The top 11 GM players (1,909 down to 1,874 LP) carry the "Challenger LP" chip; #12 at 1,867 doesn't. Screenshot: `live/ladder-upper-cut.jpg`.
