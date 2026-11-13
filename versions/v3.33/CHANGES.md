# v3.33 — 13 Nov 2026

## Found in the v3.32 live check
- Scouting "Annie IRL#Annie" made the link `?players=Annie%2520IRL-Annie`: the name was encoded twice (`toSlug` encodes for URL paths, then `URLSearchParams` encoded it again). The page still worked, but shared links looked broken.
- Compare had the same problem (`?a=euw1/…`). On the server, the compare link preview read the name as "Annie%20IRL".

## Fixed
- New `querySlug` for query-string values (plain "Name-TAG", encoded once by `URLSearchParams`), used by Multi-search, its recent lobbies and Compare. Profile paths keep `toSlug`.
- `fromSlug` reads both forms, so links shared before this fix still open correctly, and a stray "%" can't crash it.
- Server `compareSide` decodes old links too, so the page title and preview image show "Annie IRL".

## Checks
- 76 tests pass. New test: a link is encoded once (`players=Annie+IRL-Annie`); old double-encoded links still read; a "%" in a name doesn't throw. Typecheck, build and a11y check clean.
- Playwright:
  - scouting "Hide on bush#KR1, Annie IRL#Annie" → `players=Hide+on+bush-KR1%2CAnnie+IRL-Annie`;
  - the old link `Annie%2520IRL-Annie` still fills "Annie IRL#Annie";
  - Compare title "Annie IRL#Annie vs Hide on bush#KR1".

## Live check (after deploy)
- Deployed automatically (`deploy.request` → `watch-deploy.bat`): finished 13 Nov 2026 19:22 (EXIT CODE 0).
- The old link `/compare?a=euw1%2FAnnie%2520IRL-Annie&b=euw1%2FAfroboi-depu` opens correctly. After "Swap", the address bar reads `?a=euw1%2FAfroboi-depu&b=euw1%2FAnnie+IRL-Annie`, encoded once (`live/compare-clean-link.jpg`).
