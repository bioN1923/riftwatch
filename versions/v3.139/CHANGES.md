# v3.139 — Live game: usual build into the lane opponent

**Why.** In a live game the useful question is "what do I build into this?". Porofessor and op.gg's in-game views answer it. Riftwatch's live lane panel gave the matchup verdict and win rate, but you had to open the matchup page for the build.

**What.**
- `LiveGame` `LaneMatchup` adds a second row under the verdict: "**Usual build into Nautilus:**", then the keystone, the matchup's most played core build (linked to Items, with arrows) and its boots, then the number of games.
- It uses the matchup query the panel already makes, so there are no extra requests.
- It only appears when the matchup is callable (10+ games) and the core build has 10+ games. Boots also need 10+ games.
- No premade or duo information is involved; live games still show none.
- String `live.buildInto` in 7 languages.

**Checks.**
- tsc passes; 182 tests pass; a11y `{}`.
- Demo:
  - Rekkles (Thresh support vs Nautilus): the row shows the keystone, a three-item core (item ids 3222 → 3504 → 3853) and boots, from 44 games;
  - Caps (Kha'Zix vs Viego jungle) shows his row too.
  - Checked at 1280 px dark and 390 px light, with no page errors.

Screens: `demo/live-lane-*.png`.

## Live check (2026-11-16 07:03 local)
- The live build serves `i18n-CyDEKjqR.js` with the new string.
- Whether the row appears on live data (its top core build needs 10+ games):

  | Matchup | Games | Top core build | Row |
  |---|---|---|---|
  | Lee Sin vs Sylas | 161 | 34 | shown |
  | Yasuo vs Zed | 65 | 13 | shown |
  | Ahri vs Zed | 117 | 12 | shown |
  | Thresh vs Nautilus | 241 | 7 | hidden |
  | Ashe vs Caitlyn | 41 | 6 | hidden |
  | Garen vs Darius | 35 | 6 | hidden |

- Support and low-sample matchups hide the row: their builds are spread thin or rarely reach three items. That's intended. Showing a 6-game build as "usual" would mislead.
- Live Ahri mid per-page builds: [8, 0, 1].
