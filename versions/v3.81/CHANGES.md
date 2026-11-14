# v3.81 — Arena's new queue id

Live check of the Arena tier list (`/champions?queue=arena`): "No games collected yet". `/api/champions?group=arena` had 0 rows while ARAM had 167.

Cause: Riot moved Arena from queue 1700 to 1710. The [Riot developer-relations issue #921](https://github.com/RiotGames/developer-relations/issues/921) reports the new queue id 1710 "Arena". The collector still asked for queue 1700, which no longer has new games, and the server only recognised 1700 as Arena. The match row already knew both ids.

## Change
- New `shared/queues.ts`: `ARENA_QUEUES` {1700, 1710}, `ARENA_QUEUE` = 1710 (current), `isArena()`.
- `server/crawler.ts` collects Arena from queue 1710.
- `server/champStats.ts` (group and aggregation) and `server/shape.ts` recognise both ids.
- The profile's Arena filter (`server/index.ts`) asks Riot for 1710.
- `MatchRow.tsx` uses `isArena`.
- 1 test (120 total).

## Expected after deploy
The Arena tier list fills as the collector reads new games: about every third ladder player gets their last 5 Arena games checked.

## Checks
tsc clean · a11y `{}` · demo shots.

## Live check (2026-11-14 16:38)
- Deploy finished cleanly at 16:36. The server is healthy and the collector is running (`collecting: true`).
- Two minutes after the deploy, Arena still has 0 matches. The collector is paced and checks Arena for only about a third of the ladder players it visits, so games arrive gradually. To re-check at the next version: `/api/champions?group=arena` `matches` should be above 0.
