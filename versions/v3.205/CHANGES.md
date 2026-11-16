# v3.205: matchup and lane draft without the static-data waterfall

## Measured (react-perf-rules, 400 ms per `/api` call, cold load)
| Page | Before | After |
|---|---|---|
| Matchup `/champions/ahri/vs/zed` | `/vs/` 989→1391 ms, after static | 270→672 ms, alongside static |
| Lane draft `/draft?enemy=zed` | `/champions/238` 688→1092 ms, after static | 318→720 ms, alongside static |
| Team draft (link with teams) | an extra `/draft/team?allies=&enemies=` sent before static, then the real one | only the real request (it still waits for static: it sends numeric keys) |
| Champion `/champions/ahri` | 3.204 fix | still parallel through the shared helper |
| Ladder | already parallel | unchanged |

## What changed
- **New `src/lib/early.ts`:** `startEarly(key, fetcher)`, `takeEarly(key, fallback)`, `plainSlug()` and `championEarlyKey()`. These generalise v3.204's champion-only map.
  - A failed early request falls back to a normal fetch.
  - Unused entries expire after 30 s.
  - The key helper lives in `lib/`, so the draft page doesn't import (and bundle) the champion page (`bundle-*`).
- **Server** `GET /api/champions/:id/vs/:opp`: both sides accept a key or a slug. Same pair or unknown returns 400.
- **`api.matchup`:** accepts `number | string`.
- **`MatchupPage` and `DraftPage`:** on a cold load with plain slugs, they start the request by slug. `MatchupView` and the lane draft's `Results` take it.
- **`TeamDraft` `Suggestions`:** the query has `enabled: !!sd`.

## Checks
- **Curl:** `/vs/` with slugs 200, with keys 200, `ahri/vs/ahri` 400.
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`. The a11y run renders the matchup, team draft and lane draft pages.
- Screenshots: `demo/`.

## Next
- The MEDIUM rules: duplicate global listeners, and re-renders on the profile's long match list.

## Live
- Deployed 23:06 local. The live entry carries `3.205`, and `/api/champions/ahri/vs/zed?group=ranked` answers 200 with 138 games.
