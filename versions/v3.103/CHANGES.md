# v3.103 — Ladder LP change

**Why.** op.gg and other ladders show who is climbing. Riftwatch's ladder only showed current LP.

**What.**
- `server/ladderHistory.ts`: whenever a Challenger or Grandmaster ladder is read anyway (cached 10 minutes; no extra Riot calls), an LP snapshot is kept — at most one an hour, for two days, saved on the volume (`data/ladder-history.json`) and on shutdown. Master is skipped (too large to keep).
- Ladder API: each entry gets `lpChange` against the snapshot closest to a day old (at least an hour old); the ladder gets `since`. Players who weren't in that tier then get nothing (no fake "+").
- Ladder page: "+24" / "−13" / "±0" next to the LP (green/red/faint; under it on phones), with a line "Green and red numbers by the LP: change since yesterday." Nothing shows until the first snapshot is an hour old.
- Demo: a made-up day-old snapshot so the column can be seen. `/api-usage` mentions the snapshots. Seven languages; `tests/ladderHistory.test.ts` (146 tests).

**Checks.** tsc, tests, build, a11y `{}`. Demo ladder shows the column and the note. Shots `demo/ladder-lp-change-*.png`.
