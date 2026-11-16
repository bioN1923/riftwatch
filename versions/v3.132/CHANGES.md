# v3.132 — Champion items link to the Items page

**Why.** v3.131 added the Items page, but nothing led to it except a button on the Champions page. The natural way in is from a build: "Ahri builds Void Staff, who else does?".

**What.**
- `ItemRow` takes `linked`. A linked icon becomes a link to `/items?item=<id>`, with a focus ring, and its tooltip carries a hint: "Click to see who else builds it".
- On champion pages, these are linked:
  - the three core items of the selected build (48 px icons);
  - the 4th, 5th and 6th item options.
- These are not linked:
  - starting items and boots, which the Items page doesn't cover;
  - the build-variation picker, which is a button already.
- Items page:
  - the item named in the address is scrolled into view once the list loads (`#item-<id>`, `scroll-mt-20`) and opens expanded;
  - if that item isn't on the list (too few ranked builds), a short note says so instead of nothing happening.
- Keyboard: **g i** opens Items, and it appears in the `?` shortcuts list.
- Strings `it.openHint` and `it.missing` in 7 languages.

**Checks.**
- tsc passes; 180 tests pass.
- a11y `{}`.
- Demo:
  - Ahri's page has 6 item links;
  - clicking Void Staff opens `/items?item=3135` with that row expanded, at the top of the view (y = 73 px), with 11 champions;
  - `/items?item=1001` shows "Boots isn't built often enough in ranked to list yet.";
  - g i on the ladder page goes to `/items`.
- No page errors.

Screens: `demo/champion-item-link.png`, `demo/items-from-champion.png`.
