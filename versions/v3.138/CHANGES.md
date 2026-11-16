# v3.138 — Build at a glance on matchup pages; per-page builds checked

**Per-page builds check.** Live Ahri mid's per-page build counts stayed at [7, 0, 1] for about 15 minutes, so the counting was checked before building anything new:
- Live ranked games went from 23,244 to 23,428 in 45 minutes, about 4 a minute, half the earlier estimate.
- Ahri mid's games with three completed items went from 1,298 to 1,316 (+18) in the same time. Of those, 8 landed on the three shown pages, and the rest on less common pages that aren't shown.
- The top three champion-roles have [5, 3, 2, 0], [3, 2, 2] and [1, 4, 1].
- So counting works. The pages fill slowly because only part of each champion's games have three completed items, and those are spread across rune pages. Ahri's main page should reach 20 in about another 1½ hours; most others will take longer.

**What.**
- `BuildGlance` is exported and takes any `BuildData`, with skills optional since matchup data has no skill order.
- The matchup page "How to play Ahri into Zed" opens with the strip: runes, spells, start, core items and boots, all specific to that matchup.
- `RunesBlock` there is now controlled, so the strip follows the rune page picked. The matchup's items stay the matchup's own; there are no per-page builds per opponent, which would be far too thin.

**Checks.**
- tsc passes; 182 tests pass; a11y `{}`.
- Demo, Ahri vs Zed, at 1280 px dark and 390 px light: the strip shows, and picking the second rune page changes it from "Arcane Comet · Inspiration" to "Lethal Tempo · Resolve".
- No page errors.

Screens: `demo/matchup-glance-*.png`.

## Live check (2026-11-16 06:53 local)
- The live build serves `Matchup-BX5GgA6e.js` (200).
- Live Ahri vs Zed (116 games) has everything the strip needs: 3 rune pages, 2 spell pairs, 1 start, 3 builds and 3 boots.
