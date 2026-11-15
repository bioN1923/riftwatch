# v3.105 — Ladder: climbing fastest

**State after the pause (19:42 UTC).** Both earlier features are now working live: the EUNE Challenger ladder has LP changes for all 200 players against the 16:33 UTC snapshot (36 moved, −70 to +89 LP), and the Arena search found its first player (`probes 12, found 1, queued 110`), with Arena up from 13 to 17 games and a line of 110 players to follow.

**What.**
- Ladder API: `climbers` — the five biggest LP gains in the whole tier since the snapshot (not just the page you're on), named players only from names already known (no lookups for this strip), hidden players left out.
- Ladder page: "Climbing fastest since {when}" strip above the table: name (to the profile), "+90", and their place "#81".
- One string in seven languages; 147 tests.

**Checks.** tsc, tests, build, a11y `{}` (18 states × 2 themes). Demo strip shown on desktop and phone. Shots `demo/ladder-climbers-*.png`.

## Live check (2026-11-15)
Deployed 21:51 (local). EUNE Challenger, against the 16:33 UTC snapshot: climbers #120 +116, #130 +89, #165 +87, #59 +75, #161 +48 — all named. Arena after this restart: 21 games and **167 players still lined up** (`probes 0` — no probe needed because the line survived the deploy, which is exactly what v3.99 was for).
