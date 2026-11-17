# v3.215: ARAM line read once a minute

## Rate before (live, numbers only)
| Time (UTC) | reads | added | ARAM games | Ranked games |
|---|---|---|---|---|
| 05:06 (v3.214 restart) | 0 | 0 | 284 | – |
| 05:07 | 1 | 5 | 294 | – |
| 05:17 | 2 | 10 | 296 | 30,153 |

- That's 2 reads in about 11 minutes.
- One ranked player can take a minute of paced requests (match ids, then a game and a timeline for up to 10 games), so the 35% chance per player came to roughly one read every 3–5 minutes.
- `added` counts every ARAM game read, while the tier list counts only the current patch, which is why 10 added shows as +2 here.

## What changed
- **`crawler.ts`:** the per-player `Math.random() < 0.35` ARAM read is replaced by a clock: after a ranked player, if at least `ARAM_EVERY_MS` (60 s) has passed since the last ARAM read, read one lined-up ARAM player.
  - That's about 6 paced requests a minute, roughly a quarter of the budget, up from about a tenth.
  - Ranked still gets the rest, and every request still yields to visitors and to the key's headroom.
- The quiet-pass batch from v3.212 is unchanged.

## Checks
- `tsc`, `vitest` (190) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`.

## Live check (05:23 UTC, about 40 s after the deploy)
- `3.215` is in the live JS bundle.
- `aram: { reads: 1, added: 5 }`, with 307 ARAM games (296 before the deploy).
- The once-a-minute rate is to be confirmed in v3.216: `reads` should be close to the minutes since the restart.
