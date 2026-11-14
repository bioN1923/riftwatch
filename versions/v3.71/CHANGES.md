# v3.71 — Fresh game data after each deploy

Follow-up from the v3.70 live check. `/api/static/:locale` is sent with `max-age=3600, stale-while-revalidate=86400`. A browser that loaded it before a deploy kept the old copy, so v3.70's champion damage ratings, and the live-game damage mix built on them, stayed hidden until the cache ran out.

## Change
- `src/lib/ddragon.ts` `loadStatic` requests `/api/static/<locale>?v=<release>`, with the release taken from `CHANGELOG[0].version`, which a test keeps equal to package.json. Each deploy gets a new address, so the first visit after it fetches fresh data. Within a release, caching works as before. The server route ignores the parameter.

## Checks
tsc clean · 116 tests pass · a11y `{}` · demo: the browser requests `/api/static/en_US?v=3.71`, and the tier list still shows all 188 images.

## Live check (2026-11-14 15:05)
- Deploy finished cleanly at 15:04. Reloading a profile in the user's Chrome requested the static data with `v=3.71` over the network instead of reusing the cached v3.70 copy, so the champion damage ratings now reach browsers straight away. There was nothing visual to screenshot.
