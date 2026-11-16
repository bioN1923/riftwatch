# v3.172: search finds pages; `g t` shortcut

## What changed
- **Search box page options:** a new `page` option kind. From 3 letters, and not for Riot IDs or matchups, the query is matched against each page's title in the current language plus a few everyday English names. At most 2 pages are offered, above champions. Enter or a click opens the page.
  - **Team draft:** team draft, team comp, counter pick, best pick.
  - **Draft:** draft, lane draft, counter.
  - **Tier list:** tier list, tierlist, meta.
  - **Ladder:** ladder, leaderboard, challenger, ranking.
  - **Multi-search:** multi search, lobby.
  - **Compare:** compare, versus.
  - **Duo:** duo, duo finder.
  - **Items:** items, item stats.
  - **What's new:** what's new, changelog, updates.
  - Page options also count as a match for the "add #TAG" hint, so typing "ladder" doesn't nag about a missing tag.
- **Shortcut:** `g t` opens Team draft. The shortcuts dialog lists it automatically, since it reads `GO_KEYS`.
- **Strings:** `search.page` in all 7 languages.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Search test:
  - "team dr" → [Team draft · Page];
  - "ladder" → [Ladder · Page];
  - "ahri" → Ahri, no page;
  - "draft" → Team draft, then Draft;
  - Enter on "team dr" opens `/draft/team`.
- Shortcut test: on the ladder, `g t` opens `/draft/team` and `g d` opens `/draft`. The home page focuses its search box on load, so shortcuts start after leaving it, as before.
- Screenshots: `demo/search-page.png` and `demo/`.
