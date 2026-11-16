# v3.140 — Items are easier to find

**Why.** The Items page (v3.131) could only be reached from the Champions page header, a champion's build, or `g i`. It wasn't on the home page's tools, not in the phone menu, and the search box didn't know items. On op.gg and u.gg you can type an item name in the search box.

**What.**
- Search box suggests completed **Summoner's Rift** items by name: names starting with the query, or containing it from 4 letters on. Up to 3 suggestions, each with its icon and an "Item" tag.
  - Only ids under 10000 count. Riot gives Arena and other-mode copies higher ids, and those showed up as duplicates ("Black Cleaver" 223071 next to 3071).
  - Items that still build into something, or cost under 2,000 gold, are skipped.
  - Choosing one opens `/items?item=<id>` with that row expanded. Players and champions still come first when they match.
- Home "Tools" section adds **Items** (now a 3-column grid of 6).
- The phone bottom bar's "Tools" menu adds Items.
- Strings `home.tool.items` and `search.item` in 7 languages.

**Checks.**
- tsc passes; 182 tests pass; a11y `{}`.
- Playwright:
  - "infinity" → Infinity Edge;
  - "black cle" → Black Cleaver (one entry); Enter opens `/items?item=3071` with "In 23.6% of builds · 5,179 games" expanded;
  - "zhonya" → Zhonya's Hourglass;
  - "thorn" → Thornmail;
  - "ahri" → the champion, as before;
  - "caps" → players, as before.
  - Home tools: Draft, Compare, Multi-search, Duo, Ladder, Items.
- No page errors.

Screen: `demo/search-item.png`.
