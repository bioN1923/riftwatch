# v3.126 — Matchup search

**Why.** Opening a matchup took three steps: search for the champion, scroll to Lane matchups, then pick the opponent. u.gg and op.gg both accept "X vs Y" in their search, and it's one of the most common things players look up in champion select.

**What.**
- `SearchBox` reads "A vs B", "A vs. B", "A v B" or "A - B" (en dash too). Each side resolves through the existing `champHit`, so nicknames work ("mf", "cait", "j4"), with the best hit winning: nickname or exact name, then a name that starts with the text, then one that contains it.
- When both sides name different champions, a **Matchup** suggestion leads the list, with both portraits and "Ahri vs Zed". Enter or a click opens `/champions/ahri/vs/zed`, and the matchup page picks the most played lane as before.
- Other suggestions (players, "Look up …#EUW") still follow. The "add a #tag" hint is suppressed when a matchup is found.
- Strings `search.matchup` and `search.matchupTag` in 7 languages.

**Checks.**
- tsc passes; 166 tests pass.
- a11y `{}`.
- Playwright:
  - "ahri vs zed" → Ahri vs Zed;
  - "mf v cait" → Miss Fortune vs Caitlyn;
  - "lee sin - j4" → Lee Sin vs Jarvan IV;
  - "caps" → the player as before;
  - "ahri vs ahri" → no matchup, just the look-up.
  - Enter opens `/champions/ahri/vs/zed`. No page errors.

Screen: `demo/search-matchup.png`.
