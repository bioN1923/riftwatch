# v3.47: performance pass, one slim game-data file

## What the pass looked at (live site)
- **JS bundles:** largest are index 252 kB (79 kB gzip) and Profile 124 kB (33 kB). Routes are already split, the 7 languages are lazy, and nothing stood out.
- **Console:** no errors or warnings on the profile, draft, ladder or multi-search pages.
- **Compression and caching:** Express `compression()` is on, hashed assets are `immutable` for 1 year, and API caching headers are set per route.
- **Biggest real cost:** on every first visit, the browser downloaded 4 Data Dragon files plus `versions.json` straight from Riot's CDN.
  - That's **889 kB of JSON (143 kB gzip)**, and `item.json` alone is 668 kB.
  - The site uses only a few fields from them; most of the bytes are stats, map flags, sprite coordinates and recipes data.
  - The browser has to parse all of it before champion names, items or runes can appear.

## Changes
- **`shared/staticSlim.ts`:** `slimStatic(version, champion, summoner, item, runes)` keeps exactly the fields the client used, with the same transforms as before (plaintext fallback, rune short descriptions, tree slots). It's shared by the server and the client.
- **Server `GET /api/static/:locale`** (one of the 7 site locales; anything else → 400):
  - fetches the 4 files once, slims them, and caches the JSON string in memory for 1 hour, so a new patch shows up within the hour;
  - concurrent requests share one fetch, and a Data Dragon hiccup keeps serving the last good copy;
  - the response is `public, max-age=3600, stale-while-revalidate=86400` and gzip-compressed.
- **Client `useStaticData`:** one request to `/api/static/<locale>`. If that fails, it falls back to Data Dragon directly through the same `slimStatic`, so nothing can break.
- **Measured on the 16.22.1 en_US files:**
  - **889 kB raw → 496 kB** (−44%);
  - **143 kB gzip → 89 kB** (−38%);
  - **5 requests → 1**, on our own origin, with no extra cross-origin connection before the first names show.
- **Tests:** 93 pass (new: the exact fields kept, and locale validation).

## Checks
- Typecheck clean, a11y `{}`.
- Locally the sandbox server can't reach Data Dragon, so `/api/static/en_US` gives 503 and an unknown locale gives 400. That exercised the **fallback**: the demo screenshots still show every champion, item and rune (`demo/`).
