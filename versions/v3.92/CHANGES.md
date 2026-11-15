# v3.92 — Personal records

**Why.** League of Graphs and similar sites show "records" (best KDA game, most kills…). They're fun, and they answer "show me my best games" without scrolling. Before building it, a 360 px sweep of 15 pages found no horizontal overflow, so mobile polish wasn't the pressing gap.

**What.**
- New panel *Personal records* at the end of the Stats tab (`src/lib/records.ts`): most kills, best KDA (deaths 0 → "Perfect"), most damage to champions, biggest multi-kill (triple or better), best CS and vision per minute (Summoner's Rift games of 15+ minutes, so early surrenders don't inflate them) and longest game. Remakes and Arena are left out; ties go to the newer game. Each card: champion, value, win/loss, champion name, how long ago.
- Each card links to the Overview with `#m-<match id>`; the profile now scrolls that game into view once it's in the list and outlines it in gold for a moment (no smooth scroll with reduced motion).
- Needs at least three records to show. Strings in seven languages; `tests/records.test.ts` (138 tests).

**Checks.** tsc, tests, build, a11y `{}`. Demo: records list as expected; clicking "Most damage" lands on that Flex game in view with the outline. Shots `demo/records-*.png`.
