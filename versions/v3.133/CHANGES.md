# v3.133 — Named rune pages and builds; items follow the rune page

**Asked for** (user, 05:43):
1. Improve the design of builds.
2. Replace "Page 1, 2, 3" with meaningful names.
3. When you switch rune page, automatically show the items built with those runes.

**What.**

*Names.*
- `VariationCards` takes a `title` per card instead of "Page/Build n". Titles wrap to two lines, and the tags (Most played / Best win rate) get their own row so they never clip on phones.
- Rune pages are named by keystone and secondary tree: "Arcane Comet · Inspiration". If two shown pages share both, the first rune that differs is added in brackets.
- Builds are named by their first item ("Malignance first"). If two builds start alike they use the first two items ("Shadowflame → Void Staff"), or all three if needed.
- The core box header uses the name too: "Shadowflame → Void Staff — first three completed items, in buying order".

*Items follow the rune page.*
- Server: each champion-role now also tallies builds per rune page. `RoleAgg.rp[primary|secondary]` is a build tally (core, 4th–6th, per-core boots and follow-ups). It is filled in `addMatch` and corrected to purchase order in `addTimeline`, like the main tally. Saves keep each role's 8 busiest pages, with 20 builds each.
- `runeVariations(runes, rp)` gives each page `buildGames`, plus `builds` once it has 20 or more games with three completed items (`PAGE_BUILD_MIN`).
- Champion page: `BuildPanel` holds one rune-page choice shared by `RunesBlock` (now controllable) and `ItemsBlock`.
  - Picking a page swaps the Items section to that page's builds, under a gold line: "Items built with Lethal Tempo · Resolve · 98 games".
  - With too few games it keeps every page's builds and says so in a grey line ("Only 7 games with … so far — showing builds from every rune page").
  - The matchup page is unchanged and uses its own per-matchup builds.
- **Live data:** older games were tallied before per-page builds existed and can't be split by page now. Pages fill in as new games are read, and until then the grey fallback line shows.

*Design and honesty.*
- Build variations under 10 games are dropped (the main one always stays), since a 1-game "Rabadon's first" isn't a real choice.
- Per-build boots and 4th–6th items are used only with 10+ games; otherwise the champion-wide picks are shown, as before when there were none.
- Win rates on variation cards use `sureTone` (coloured only when clear).
- The "Best win rate" tag is now outlined, which also fixes its light-theme contrast.
- Demo data: each demo champion uses 2–3 rune pages, each with its own usual build, so the switch can be seen.

**Checks.**
- tsc passes; 181 tests pass (new `tests/runePageBuilds.test.ts`: pages get builds only from 20 games, never more games than the champion total).
- a11y `{}` after the tag fix.
- Demo, Ahri mid:
  - pages are "Arcane Comet · Inspiration | Lethal Tempo · Resolve | Electrocute · Sorcery";
  - picking the second page shows "Items built with Lethal Tempo · Resolve · 98 games", with Banshee's Veil → Shadowflame → Rylai's in place of Shadowflame → Void Staff → Rabadon's.
  - Checked at 1280 px dark and 390 px light, with no page errors.

Screens: `demo/build-*-page1.png`, `demo/build-*-page2.png`.
