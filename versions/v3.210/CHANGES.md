# v3.210: tiers need 50 games

## Live data after the night (numbers only)
- **Ranked, patch 16.22:** 29,867 games, up from 25,409 at about 15:00 yesterday. That's about 300 an hour, in line with the dev key's rate.
- **Arena:** 7,011 games. **ARAM:** 269 games across 172 champions (median 14 games each).
- **Matchups:** Ahri vs Zed has 144 games (138 last night), Ahri vs Syndra 253.
- **Team draft** (Mid with Lee Sin + Jinx against Vi + Ezreal): the top 6 picks carry 6 lane, 6 duo, 2 ally and 1 enemy reasons. The ally and enemy samples are still thin, as expected.
- **Server:** heap 378 MB, event loop mean 10 ms (p99 12 ms), and the longest GC pause 225 ms.

## Problem
- **ARAM tiers:** 50 of 172 champions had a tier: 11 S+, 10 S, 8 A, 9 B, 8 C, 4 D.
  - S+ came from records like 67% over 24 games (16–8, about 1.7 standard errors from 50%) and 56% over 39 games.
  - The cut-off was `max(20, 0.5% of games)`, which is 20 in a 269-game queue.
  - The cautious score shrinks win rates, but tiers are percentiles, so the best of a noisy field still got S+.
- The ranked cut-off is unaffected, because 0.5% of 29,867 games is 149.

## What changed
- **`champStats.rows`:** the floor is the new `TIER_MIN_GAMES` = 50. Below it the tier is "–", as before.
  - ARAM now shows its existing "early data" note, and its champions without a tier.
  - Arena's cut-off rises from 35 to 50 games.
- **`tl.earlyData`:** now says "about 50 games" (was 20) in all 7 languages, all plural forms.
- **New server test:** no row under `TIER_MIN_GAMES` has a tier in any queue. 188 tests pass.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`.

## Live
- Deployed 06:29 local. The live entry carries `3.210`.
- ARAM: 269 games, all 172 champions shown with "–" (no tier).
- Arena (7,062 games): S+ 11, S 21, A 38, B 43, C 35, D 25.
- Ranked (29,908 games): S+ 21, S 35, A 60, B 76, C 50, D 26, – 38. Unchanged apart from normal data drift.
