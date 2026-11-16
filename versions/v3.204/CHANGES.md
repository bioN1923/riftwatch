# v3.204: React performance pass (champion-page waterfall)

## Review
First pass with Vercel's React performance rules (the `react-perf-rules` skill), CRITICAL categories first (`async-*` waterfalls, `bundle-*`). The method: delay every `/api/*` response by 400 ms in Playwright, then log each request's start and end on a cold load.

- **Profile** `/lol/euw1/Caps-EUW`:
  - `profile` runs alongside static, status and health.
  - Then challenges, lp, champions, matches and live run in parallel. They need the puuid, so the dependency is real.
  - Arena augments are fetched only once the matches show an Arena game, which follows the `bundle-conditional` rule.
  - No avoidable waterfall.
- **Champion** `/champions/ahri`:
  - `/champions/103` started at 725 ms, only after `/static/en_US` finished at 689 ms. The page needed the static data just to map the slug "ahri" to key 103.
  - That's one full round trip on every cold open, such as a shared link or a search result. This breaks the `async-parallel` rule.
- **Bundle:** v3.198 already took the changelog out of the entry chunk. Routes are lazy and there are no barrel files.

## What changed
- **Server** `GET /api/champions/:id`: accepts a numeric key or a slug, resolved with the existing `championBySlug` from the OG-card data. An unknown slug returns 400, as before.
- **`api.champion`:** accepts `number | string`.
- **`ChampionPage`:** on a cold load (static data not yet loaded, plain-slug URL), it starts `api.champion(slug, filters)` at once and stores the promise in a module map, keyed by slug, group, role and patch.
  - `ChampionView`'s `queryFn` uses that promise once, falling back to a normal fetch if it failed.
  - An unused promise is dropped after 30 s.
  - Warm navigations are unchanged.
- **Web Interface Guidelines leftover:** `translate="no"` on the profile name and the champion name `<h1>`.

## Measured (400 ms added per API call)
| | stats request start | stats request end |
|---|---|---|
| Before | 725 ms (after static) | 1127 ms |
| After | 235 ms (alongside static) | 637 ms |

- `?queue=aram`, `?role=TOP` and the alias `/champions/mf` also use the early request, with no second stats request.
- Curl: `/api/champions/ahri` 200, `/api/champions/103` 200, `/api/champions/nope` 400.

## Checks
- `tsc`, `vitest` (187) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`.
