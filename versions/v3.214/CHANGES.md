# v3.214: ARAM line counters

## ARAM (live, numbers only)
| Time (UTC) | `aram.queued` | ARAM games | Ranked games |
|---|---|---|---|
| 04:58 | 229 | 284 | – |
| 05:06 (after the v3.213 restart) | 300 | 284 | – |
| 05:07 | 299 | 284 | 30,096 |

- Ranked keeps growing: 30,008 at 04:49, 30,096 at 05:07.
- ARAM has stood at 284 since 04:58, while the line stays full (300, its cap).
- **Likely reason:** after a restart the crawler has no memory of each player's game count. Its first pass treats every apex player as "active", which means about 20 paced requests each, so ARAM reads (35% per player) are few and far between. Quiet passes, the other place the line is read, don't happen until that pass ends.
- To tell that apart from reads that find nothing new, the server now counts both.

## What changed
- **`server/crawler.ts`:** `export const aramLine = { reads, added }`.
  - `readQueue(…, 450)` counts a read.
  - Each new ARAM match it adds counts towards `added`.
- **`/api/health`:** `aram: { queued, reads, added }`. These are numbers only, with no player data.
- **`shared/types.ts`:** the optional fields are added to the type.

## Checks
- `tsc`, `vitest` (190) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`.
- Local demo health: `"aram":{"queued":0,"reads":0,"added":0}`.

## Live check (07:14 local, about 30 s after the deploy)
- `3.214` is in the live JS bundle.
- `aram: { reads: 1, added: 5, queued: 300 }`, with 294 ARAM games.
- **Answer:** one read gives about 5 new ARAM games (the full 5 asked for). The line isn't short of games. What's slow is how often it gets read, so the next step is to read it more often without taking from ranked.
