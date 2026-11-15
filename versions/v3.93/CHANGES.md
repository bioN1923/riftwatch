# v3.93 — Arena: find the first Arena players

**Why.** The Arena tier list has shown 0 matches since v3.81. v3.83 made Arena games come from Arena players already seen (a chain), and the chain had to be started by a visitor opening a profile with recent Arena games — which hasn't happened. Apex ladder players (the collector's usual source) don't play Arena. So the list never starts.

**What.**
- `server/arenaProbe.ts` `findArenaPlayer()`: picks a random page (1–3) of a random everyday tier and division (Silver–Emerald, solo queue), then asks up to six of its players for their last three Arena match ids; the first player with any is returned. Errors count as "none".
- `riot.leaguePage()`: `league-v4 /entries/{queue}/{tier}/{division}?page=`, cached 30 minutes.
- Crawler: when no Arena seed is lined up, at most every 15 minutes it runs the probe through the usual pacing (`paced()`: waits for idle visitors and keeps half the key's budget free) and reads the found player's Arena games, which line up their opponents (`arenaSeeds`) — the chain then runs as before. Roughly 1 + 6 + 3–5 requests per probe.
- Arena empty-state text and `/api-usage` updated to describe it (seven languages for the empty state).
- `tests/arenaProbe.test.ts` (140 tests).

**Checks.** tsc, tests, build, a11y `{}`. The collector doesn't run in demo mode, so the real check is the live Arena match count over the next hours.

## Live check (2026-11-15)
Deployed 17:02 (local). `/api/health` ok (live mode), collector running (`collecting: true`), `/api-usage` serves the updated text. Arena matches still 0 at 17:05 — expected so soon: the probe only runs inside the collector loop when ladder players have new games and visitors are idle, and every request waits for the pacing. To be re-checked in the next iterations.
