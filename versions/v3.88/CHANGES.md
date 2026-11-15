# v3.88 — Item build vs high elo

**Why.** The match *Item build* tab showed what was bought and levelled, but not whether that was the usual way to play the champion. op.gg/u.gg put the recommended build on separate champion pages; putting a short comparison right in the game answers "did I build it right?" where the question comes up.

**What.**
- New section *Against high-elo {champion} {role} players* in the Item build tab (Summoner's Rift games where the player has a role; not ARAM or Arena).
- **First three items**: this game's core (first three finished items in purchase order that were still owned at the end — the same rule the server uses for its build stats, now in `src/lib/buildCompare.ts`) against the most played core. If the same three items are one of the five common cores (in any order) it says which one; otherwise matching items are outlined in gold and the rest dimmed, with "N of 3 items match". With fewer than three finished items it says there's nothing to compare yet.
- **Skill max order**: this game's against the most played, when the player levelled at least 9 times.
- Win rates and game counts come from the high-elo games (tone muted under 5 games); a note says so, so they aren't read as this game's result. *Full build* links to the champion page for that role.
- Uses our own `/api/champion` (cached on the server); no Riot calls. Strings in all seven languages. New tests: `tests/buildCompare.test.ts` (128 total).

**Checks.** tsc, tests, build, a11y `{}`. Demo shots `demo/build-vs-highelo-*.png`.
