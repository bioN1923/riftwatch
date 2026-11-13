# v3.29 — 13 Nov 2026

## Live check (before)
- v3.28 is live (user deployed 18:42); the matchup link checked on `Annie IRL#Annie`.
- That profile's first game was labelled "Special mode" and showed "CS 0 · 0.0/m". The match API says queue 1740 (another game is 1750).
- Checked Riot's official queue list (static.developer.riotgames.com/docs/lol/queues.json): **1740 and 1750 aren't in it**, so the generic "Special mode" label is the honest one. But the list names two modes we didn't: **1400 Ultimate Spellbook** and **1810–1840 Swarm**.

## Changed
- Queue names: Ultimate Spellbook (1400) and Swarm (1810–1840) added, kept as proper names like ARURF and URF.
- Match rows hide **CS** when no player in the game has any (Arena, Brawl, Swarm and similar modes), and **Vision** when nobody has a vision score, instead of showing zeros.

## Checks
- 73 tests pass (new: queue names, including the fallback for queues not in Riot's list). Typecheck, build and a11y check clean. Demo screenshots in `demo/`.
