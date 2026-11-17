# v3.212: the ARAM line is read in quiet passes too

## ARAM growth after v3.211 (live, numbers only)
| Time (UTC) | `aram.queued` | ARAM games (16.22) | Ranked games |
|---|---|---|---|
| 04:43 | 10 | 269 | 29,908 |
| 04:46 | 38 | 269 | 29,990 |
| 04:49 | 38 | 269 | 30,008 |

- The line fills from every match the server reads, visitors' profile games included. Those don't count towards champion stats, which explains a queue that grows while the ARAM count stays put.
- The collector takes from the line only on its 35%-per-active-player chance. At about 24 requests a minute, that's 3–4 players in three minutes, so roughly a one-in-five chance of no ARAM read at all. The window is too short to judge; to re-check over a longer span.
- There's no server-side cache on `/api/champions` (only `max-age=60`), and the ARAM aggregation is fine, so 269 is the real count.

## What changed
- **`crawler.ts`, quiet branch** (nobody on the apex ladder played since the last pass): after the Arena line or probe, read up to `ARAM_QUIET_BATCH` (5) lined-up ARAM players, at most 5 games each, before the lane-curve backfill.
  - This time used to go only to the backfill or to sleeping, so ranked loses nothing.
  - Every request is still paced and yields to visitors (8 s after a user request, and never past half of the key's headroom).

## Also checked
- The ARAM champion page is already honest about its samples: under 50 games it shows "Early numbers: built from N games…", and win rates under 10 games are starred. Since v3.211 the "Best win rate" badge needs 20 games.

## Checks
- `tsc`, `vitest` (190) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`.

## Live check (06:55 local, about 1 minute after the deploy)
- `3.212` is in the live JS bundle.
- `aram.queued` 153, ARAM games 279 (up from 269). The line is being read, and ARAM games are being counted again.
