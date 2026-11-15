# v3.115 — Ladder places jump to the row

**What.**
- `LadderPlace` (profile, Compare, Multi-search) adds `hl=<rank>` to its ladder link, so the ladder opens on the right page with the player's row highlighted and scrolled into view (the ladder already supported `hl` for "Find a player").
- Ladder strip: each "#81" in Climbing/Dropping fastest is a button that goes to that page and highlights the row (labelled "Show place 81 on the ladder").
- One string in seven languages; 150 tests.

**Checks.** tsc, tests, build, a11y `{}`. Demo: clicking "#81" → `/leaderboard?region=euw1&page=2&hl=81`, row 81 (CrimsonGank, +90) highlighted and in view. Shot `demo/ladder-jump-to-row.png`.
