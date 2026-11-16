# v3.131 — Items page

**Why.** Every big stats site has an item view; lolalytics and op.gg show how often an item is built and on whom. Riftwatch already tallied builds per champion but had no way to look at them from an item's side, such as "who builds Death's Dance?" or "is Black Cleaver still popular?".

**What.**
- Server `ChampionStatsStore.itemStats(patch?)` → `/api/items`, ranked only. Riot's policy rules out Arena item stats.
  - It sums every completed item from each champion-role's build tallies: the three core items plus the 4th–6th slots.
  - **Share** is out of games with three or more completed items (`builds`).
  - For each item it lists the 12 champion-roles that build it most (10+ games): their win rate with it, plus their usual win rate and games in that role.
  - Items under 20 games are left out.
  - Tallies keep each champion's 40 most common builds, so very rare builds are missing; that's an undercount, never a wrong number.
- New page `/items` (lazy route), linked from the Champions header next to Draft:
  - a filterable list showing icon, name with the full item tooltip, "In 19.3% of builds · 4,220 games" and the top-5 champion portraits;
  - opening a row (kept in the URL as `?item=`) shows the champion table: champion and role (linked to that champion page), games, win rate, and **vs usual**;
  - "vs usual" is green or red only past two standard errors, plain otherwise, with a tooltip giving the usual rate;
  - a note explains that a higher win rate with an item shows a pattern, not proof the item causes wins (people building it are often already ahead).
- Strings `it.*` in 7 languages. a11y-check now also covers `/items?item=6333` (19 pages × 2 themes).

**Checks.**
- tsc passes; 180 tests pass (new `tests/itemStats.test.ts`: ranked only, sorted, share = games ÷ builds, rows ≥ 10 games).
- a11y `{}`.
- Demo: 21,911 builds and 41 items. Death's Dance comes first (19.3%, 4,220 games), and its table shows Sylas jungle 564 games at 50.5% (+0.1%). Checked at 1280 px dark and 390 px light, with no page errors.

Screens: `demo/items-dark-1280.png`, `demo/items-light-390.png`.
