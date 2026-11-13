# v3.48: server notices for the right server

## The problem (from the v3.47 network log)
On `bioN1923#EUNE`'s profile, the header asked for `/api/status/euw1`. The status banner always used the visitor's saved search region, here EUW. Earlier tonight the live site showed a "Server issues / Login issues" notice while I browsed EUNE profiles. That notice was EUW's, but nothing on the page said so.

## Changes
- **`src/lib/pageRegion.ts` `pageRegion(pathname, search, fallback)`:** the server the page is about.
  - A profile's path region (`/lol/eun1/…`, `/live`, `/stats`) comes first.
  - Then the `?region=` of the ladder or multi-search.
  - Otherwise the visitor's search region.
  - Unknown regions fall back too.
- **`StatusBanner`:** uses `pageRegion`, and each notice now starts with the server's label, e.g. "**EUNE · Incident:** …".
- **Tests:** 94 pass (new: `pageRegion` for profile, live tab, ladder, multi-search, non-region pages and unknown regions).
- **Considered and left for later:** sending the per-champion Data Dragon file (abilities and lore) through our server. That file is versioned and the browser caches it permanently, so the gain is small.

## Checks
- Typecheck clean, a11y `{}`. The demo has no server notices, so the standard screenshots show no banner (`demo/`).

## Live check (00:04)
- Deployed automatically (EXIT CODE 0, 00:03:50).
- Network log:
  - on `/lol/eun1/bioN1923-EUNE` the header now asks for **`/api/status/eun1`** (it used to ask for euw1);
  - on `/champions` (not about a server) it asks for `/api/status/euw1`, the saved search region.
- Neither server has notices right now, so no banner shows. The label rendering is covered by the code review and tests only.
- Screenshot: `live/tier-list.jpg`.
