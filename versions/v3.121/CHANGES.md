# v3.121 — Home: recently viewed champions, even spacing

**Why.** The home page remembered players but not champions; champions you'd opened only showed up on the Champions page, one click further away. op.gg and u.gg both bring recent champion lookups back on their front page. Reviewing the v3.120 home shot also turned up uneven spacing:
- about 120 px between Strongest picks and Climbing fastest;
- no gap at all between Climbing fastest and Tools;
- a half-width "Falling since …" box when no champion was rising.

**What.**
- `src/components/champions/RecentChamps.tsx` → `RecentChampList`, taken out of `Champions.tsx` so Home can use it without loading the Champions page code. Champions.tsx uses it unchanged.
- Home side column: a new "Champions you looked at" section (only when there are any), after favourites and recent players, with a grid icon. String `home.recentChamps` in 7 languages.
- `Climbers` section: `mt-10` replaced by `pb-20`, so each section gap is 80 px.
- `Movers`: two columns only when both the rising and falling lists have entries.

**Checks.**
- tsc passes; 160 tests pass.
- a11y `{}`.
- Playwright with seeded `rw:recent-champs` (in its own browser, not the user's): 4 champion links render, and the section is absent without the stored list. No page errors at 1440 px or 390 px.

Screens: `demo/home-recent.png`, `demo/home-fresh.png`, `demo/home-phone.png`.

## Live check (2026-11-16 00:38 local)
- The live index serves `index-Bp_i0Vdu.js`, which contains the home section, and `i18n-B-AZTOH_.js` with the new string (200).
- Checked by API only, so the user's browser storage was left alone.
- Arena: 288 games.
