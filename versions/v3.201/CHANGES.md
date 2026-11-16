# v3.201: retry everywhere, and no false "not enough games"

## Simulated
A Playwright run at 390 px on 10 pages. Every `/api/*` call returned a non-JSON 500, except static data and health, so the app still boots. Results:
- **Ladder, team draft, items, tier list, duo finder:** an error message plus Try again. Fine.
- **Matchup:** an error message, but no Try again.
- **Compare:** two identical "Couldn't load this" boxes, with no Try again and no player name.
- **Multi-search:** "Couldn't load this player." on each card, with no way to retry.
- **Lane draft:** "Not enough games of Zed Mid yet to compare matchups." This was wrong: it was a failed load, not missing data. The "safe blind picks" panel also failed silently.
- **Home:** the tier cards just don't show. Acceptable for a teaser section.

## What changed
- **`Draft.tsx`:** `Results` and the blind-picks panel show `ErrorState` with retry when the query errors with no data, before the "not enough games" check.
- **`Matchup.tsx`:** `ErrorState` gets `onRetry`.
- **`Compare.tsx`:** each failed player's `ErrorState` is titled with their Riot ID and gets its own retry.
- **`MultiSearch.tsx`:** a failed card (not "not found") gets a small Try again button that refetches just that player.

## Checks
- **Playwright:** each page shows its error with a retry button. After lifting the failure and pressing Try again, the error clears. On Compare, retrying one player clears just that one.
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/*-error.png` and `demo/`.
