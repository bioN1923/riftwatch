# v3.40: search region that follows you, no duplicate players on Home

## Live check that started it
Home on the live site:
- every saved player was on **EUNE**, but the search box said **EUW — Europe West**;
- the favourite bioN1923#EUNE appeared twice, under Favorites and again under Recently viewed.

## Changes
- `storage.ts`:
  - the region store's fallback is now `''`, meaning the visitor hasn't picked one;
  - new `pickRegion(chosen, favorites, recent)` returns the chosen region, else the newest Recently viewed player's server, else the newest favourite's, else EUW;
  - `useRegion()` returns that. Picking a region still saves it and from then on always wins.
  - Visitors who already have a saved region (anyone who changed the region before, on search or the ladder) keep it.
- `Home.tsx`: Recently viewed leaves out players who are in Favorites. The recent list itself is unchanged, so the search suggestions still show them.
- Tests: 83 pass (new: `pickRegion`).

## Checks
- Typecheck clean, a11y `{}`.
- Demo (`demo/home-lists-desktop.png`): favourite Faker#KR1 (EUNE) plus recent [Faker, Annie IRL (EUNE), Someone (EUW)]. The region shows **EUNE**, Recently viewed lists Annie IRL and Someone, and Faker appears once. After picking KR and reloading, it stays KR.
