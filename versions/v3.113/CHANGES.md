# v3.113 — No win/loss colour on a handful of games

**Why.** v3.82 stopped colouring win rates on fewer than five games in the profile (champion pool, sidebar, Stats tab). Other places still painted "100%" green on 1 game and "0%" red on 2: Multi-search champion lines, Compare's top champions, the live game's lane line, and a couple of lists on champion pages.

**What.**
- `wlTone(wr, games)` in `format.ts`: green/red as before, plain text under `TONE_MIN_GAMES` (5).
- Used in Multi-search (champion lines), Compare (top champions), the live game ("your lane" win rate), and the champion page's lists that show raw per-player/per-matchup rates without a low-sample check.
- Server: the Arena line can hold 1,000 players (was 300; it was full and dropping finds).
- Test for `wlTone` (150 tests).

**Checks.** tsc, tests, build, a11y `{}`. Demo Multi-search Caps: Sylas 3 games 33%, Graves 2 games 0%, Kha'Zix 1 game 100% — all plain now. Shot `demo/multisearch-card-tone.png`.
