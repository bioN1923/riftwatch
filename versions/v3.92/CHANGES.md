# v3.92 — Personal records

**Why.** League of Graphs and similar sites show "records" (best KDA game, most kills…). They're fun, and they answer "show me my best games" without scrolling. Before building it, a 360 px sweep of 15 pages found no horizontal overflow, so mobile polish wasn't the pressing gap.

**What.**
- New panel *Personal records* at the end of the Stats tab (`src/lib/records.ts`): most kills, best KDA (deaths 0 → "Perfect"), most damage to champions, biggest multi-kill (triple or better), best CS and vision per minute (Summoner's Rift games of 15+ minutes, so early surrenders don't inflate them) and longest game. Remakes and Arena are left out; ties go to the newer game. Each card: champion, value, win/loss, champion name, how long ago.
- Each card links to the Overview with `#m-<match id>`; the profile now scrolls that game into view once it's in the list and outlines it in gold for a moment (no smooth scroll with reduced motion).
- Needs at least three records to show. Strings in seven languages; `tests/records.test.ts` (138 tests).

**Checks.** tsc, tests, build, a11y `{}`. Demo: records list as expected; clicking "Most damage" lands on that Flex game in view with the outline. Shots `demo/records-*.png`.

## Live check (2026-11-15)
Deployed 16:52 (local). Same EUNE profile as before (no new profile opened): Personal records shows all seven (most kills 15, best KDA 22.00, most damage 41.3k, Triple kill, 9.2 CS/min, 0.9 vision/min, longest 39:25). Clicking "Best KDA" opened the Overview at `#m-EUN1_…` with that game in view and outlined. Arena tier list: still 0 matches.
