# v3.127 — Search with a role or mode

**Why.** Following v3.126's matchup search: "ahri mid" or "lee sin jg" is how people type into op.gg's and u.gg's search. Here it found nothing (no champion is named "ahri mid"), or opened the champion in its most played role when the player wanted another.

**What.**
- `shared/champSearch.ts` → `searchScope(q)` reads a trailing role or mode word:
  - roles: top; jungle, jg, jng, jgl; mid, middle; bot, bottom, adc; support, supp, sup;
  - modes: aram, arena.
  - It returns the champion part and the role or queue, or null when the last word isn't one of these or is the only word.
- `SearchBox`:
  - when a scope word is found and the rest names a champion, the champion suggestions carry it;
  - the tag shows the role icon and name ("Jungle") or "ARAM"/"Arena" instead of "Champion";
  - choosing one opens `/champions/<slug>?role=…` or `?queue=…`;
  - without a match it falls back to the plain search, so player names are unaffected.

**Checks.**
- tsc passes; 168 tests pass (2 new in `tests/searchScope.test.ts`).
- a11y `{}`.
- Playwright:
  - "ahri mid" → Ahri, tagged Mid;
  - "lee sin jg" → Lee Sin, tagged Jungle; Enter opens `/champions/leesin?role=JUNGLE`;
  - "jinx aram" → Jinx, tagged ARAM;
  - "kai arena" → Kai'Sa and Maokai, tagged Arena;
  - "twisted fate" → Champion, as before;
  - "caps" → players, as before.
- No page errors.

Screen: `demo/search-scope.png`.
