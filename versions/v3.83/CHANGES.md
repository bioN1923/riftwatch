# v3.83 — Arena games from Arena players

Follow-up from v3.82. The collector only visits Challenger/Grandmaster/Master players, and a probe showed their recent games are all ranked solo. Asking a third of them for Arena games (2 calls each) was mostly wasted budget, and the Arena tier list stayed empty.

## Change
- New `server/arenaSeeds.ts` (`ArenaSeeds`): a bounded queue (300 waiting, 20k remembered) of players from Arena games on the collector's platform. Each player is queued only once; games from other platforms or queues are ignored.
- `server/index.ts`: every match fetched for a visitor's profile already fed the champion stats. Arena ones now also feed `arenaSeeds`.
- `server/crawler.ts`:
  - The random apex Arena lookup is gone; ARAM sampling stays.
  - After each ladder player, the collector takes one queued Arena player and reads their last 5 Arena games. That's the same pacing as everything else: it waits while visitors use the site and keeps half the key's budget free.
  - Those games queue their own players in turn, so it snowballs within the cap.
  - The shared `readQueue()` handles both ARAM and Arena.
- 1 test (122 total).

## Notes
- It needs one Arena game to start: the first visitor whose profile has a recent Arena game on the collector's platform (EUW by default) seeds it.
- Rate limits: at most one extra player per ladder player, and the same paced, budget-capped calls as before. In practice that's no more calls than the old random Arena lookups.

## Checks
tsc clean · a11y `{}` · demo shots (the collector doesn't run in demo mode).

## Live check (2026-11-14 16:55)
- Deploy finished cleanly at 16:54. Health is 200, the collector is running, and ranked is at 14,245 matches and still growing.
- Arena is still at 0, as expected until the first visitor profile with a recent EUW Arena game seeds the queue. I didn't seed it artificially (no test lookups in the user's browser). To re-check in a later version: `/api/champions?group=arena` `matches`.
