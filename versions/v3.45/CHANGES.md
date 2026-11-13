# v3.45: ladder cut-off line; premades stay out of live games

## Live game premades: deliberately not added
The loop prompt suggested bringing v3.44's premade detection to the live game. I checked our own Riot-policy statement on `/api-usage`: *"Live games show only public profile data … No session-specific information such as premade groups."* So the live game stays without it.
- The `/api-usage` policy list now says where multi-search's "Premade with" tags come from: public match history only (the same recent games anyone can open on those profiles), never the lobby or a live game.
- It also states that the live game view doesn't mark premades.

## Ladder: players in the tier and the lowest LP
- Live check: the EUW ladder works (find, tiers, pages, names).
- What other ladders show that we didn't: the LP cutoff to get into Challenger or Grandmaster.
- **Server:** `Ladder.minLp` is the LP of the lowest player in the tier, taken from the list we already fetch (no extra calls).
- **Ladder page, Challenger and Grandmaster** (not Master, which has no cap): "Players in Challenger: 300 · lowest right now: 903 LP".
- The tooltip explains that Riot recalculates the real promotion cutoff once a day, so it can differ a little.
- Strings `lb.cutoff` and `lb.cutoffTip` in 7 languages. The wording avoids "N players", because Polish plurals change with the number.

## Checks
- 90 tests pass, typecheck clean, a11y `{}`.
- Demo: Challenger "300 · 903 LP", Grandmaster "700 · 451 LP", Master shows no line.
- Screenshots: `demo/ladder-cutoff-desktop.png` and `demo/ladder-cutoff-phone.png`.

## Live check (23:40)
- Deployed automatically (EXIT CODE 0, 23:39:17).
- EUW Solo: "Players in Challenger: **300** · lowest right now: **2,273 LP**" and "Players in Grandmaster: **700** · lowest right now: **1,517 LP**".
- Screenshot: `live/ladder.jpg`.
