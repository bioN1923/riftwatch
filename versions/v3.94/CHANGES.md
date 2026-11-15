# v3.94 — Arena by game mode, and a probe that always runs

**Why.** Following v3.93, two gaps:
1. The probe only ran inside the "ladder player has new games" branch of the collector, so during quiet hours it never ran.
2. More importantly: Riot's 2026 Season 2 turned Arena into rotating *events* (3×6, Bravery, Swift Arena). If an event runs on a queue id other than 1700/1710, every Arena game Riftwatch saw was dropped by the champion-stats grouping (it matched queue ids only), and the probe — asking Riot for queue 1710 — would never find anyone. That fits Arena sitting at 0 since early in the season.

**What.**
- `shared/queues.ts`: Arena is also recognised by game mode `CHERRY` (`isArenaMatch`). `noteArenaQueue()` learns an unknown queue id from a CHERRY game; `shapeMatch()` calls it on every match read (logs "Arena: learned queue id …"), so grouping, seeds and the crawler then treat that id as Arena, and `arenaQueue()` (newest id seen) is what the crawler and the profile's Arena filter ask Riot for.
- Client: match rows, personal records and the Item-build comparison use `isArenaMatch` (game mode), so Arena games with a new id still show as Arena.
- Probe: if the queue-filtered lookup is empty for the first two players asked, it reads up to three of their latest games of any queue (`recentArena`); a CHERRY game both finds the player and teaches the queue id. Those games are added to the stats either way, so nothing is wasted. Bounded: at most ~6 extra match reads per probe, every 15 minutes at most.
- Crawler: the probe (`maybeProbe`) now also runs when no ladder player has new games.
- `/api/health` reports Arena search counts only: `arena: { probes, found, lastProbeAt, queued }` — so it can be checked from outside without logs.
- Tests: probe fallback and queue-id learning (142 tests).

**Checks.** tsc, tests, build, a11y `{}`. Demo `/api/health` shows the new block; demo Arena data unaffected (1500 games).

## Live check (2026-11-15)
Deployed 17:14 (local). `/api/health` → `arena: { probes: 1, found: 0, queued: 0 }`: the probe ran right after start-up (including the any-queue fallback for two players) and found no recent Arena games; Arena matches still 0. With the mode check in place, a 0 now most likely means few or no Arena games are being played on EUW right now (Arena is a rotating featured mode in 2026), not that they're being dropped. Probes repeat every 15 minutes; the counts will tell over the next hours.
