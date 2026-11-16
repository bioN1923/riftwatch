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
  - Rekkles (Thresh support vs Nautilus): Aery, Celestial Opposition → Mobility Boots-tier core, 44 games;
  - Caps (Kha'Zix vs Viego jungle) shows his row too.
  - Checked at 1280 px dark and 390 px light, with no page errors.

Screens: `demo/live-lane-*.png`.
