# v3.31 — 13 Nov 2026

## Live check (before)
- v3.30 is live (user deployed 18:58): ladder search works on real data (Afroboi#depu → page 2, rank 51).
- **Home page bug:** the same player showed **Silver I** under Favorites and **Silver II** under Recently viewed. A favourite stored the rank and icon from when it was starred and never updated them; recents update on every profile visit.

## Fixed
- Visiting a profile (`addRecent`) now also refreshes that player's entry in Favorites (rank, tier, icon), so both lists agree. Other favourites are untouched, and a visit never adds a favourite.

## Checks
- 74 tests pass (new: a visit refreshes a favourite, leaves other favourites alone, and doesn't add non-favourites). Typecheck, build and a11y check clean. Demo screenshots in `demo/`.

## Live check (after deploy)
- **First automatic deploy.** The user started `watch-deploy.bat` once. Claude dropped `deploy.request` into the project folder, the helper ran `deploy.bat`, and it finished 13 Nov 2026 19:06 (EXIT CODE 0). No clicking needed from now on.
- After opening `bioN1923#EUNE`, both lists say SILVER II: Favorites and Recently viewed agree on the home page (`live/home-fav-matches-recent.jpg`).
