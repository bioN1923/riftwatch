# v3.118 — Arena panel on the profile Stats tab

**Why.** The Stats tab treated Arena games like any other: a top-four finish counted as a "win" in the champion table, and nothing said how the player places. op.gg's Arena profile view leads with average place and the augments the player picks most. With augments in match rows since v3.117, the profile can summarise them too.

**What.**
- `src/lib/arenaSummary.ts`: from the player's loaded Arena games (remakes skipped), the number of games, average place, top-four count, first places, how often each place 1–8 came up, champions (games, average place, top fours), and the player's own augment picks counted.
- `StatsTab` `ArenaStats` panel (only when there is at least one Arena game), after the champion table:
  - average place, top-four rate and first places;
  - a bar chart of places 1–8, with top-half bars green;
  - the top 5 champions with games played and average place;
  - the 5 augments picked most, with a note that Riot doesn't allow win rates for augments.
- Honest colours: average place is green when 4.5 or better, red otherwise, and plain under 5 games (`TONE_MIN_GAMES`). The top-four rate uses `winRateTone`, so it is also plain on a few games.
- Strings `ars.*` in all 7 languages, with Romanian and Polish plural forms.

**Checks.**
- tsc passes; 156 tests pass (2 new in `tests/arenaSummary.test.ts`).
- a11y `{}`.
- Demo (one Arena game): the panel reads "Average place 3.00 · Top 4 100% (plain) · 1st places 0", with Aurora and 4 augments. No page errors at 1280 px or 390 px.

Screens: `demo/arena-stats-*.png`.

## Live check (2026-11-16 00:08 local)
- The live build serves the same chunks as the local one: `Profile-DY_pAg-0.js` (contains the `ars-h` panel) and `i18n-CoC3sJX7.js`, both 200.
- I didn't open a profile with Arena games (none allowed to open); the panel is checked on the demo.
- Arena: 225 games (199 at 21:58 UTC); health `arena` queue 1750, 1000 lined up (the line is full).
