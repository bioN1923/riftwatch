# v3.95 — Ladder place in the live game

**Why.** v3.91 put "#357 on the EUW ladder" on apex profiles. In a live game it's even more useful at a glance (op.gg's live view shows ladder rank too): "Grandmaster 760 LP" says less than "#512".

**What.**
- `src/lib/useLadderPosition.ts`: shared hook for the v3.91 endpoint (only for Master+, cached 5 minutes client-side; the server reads cached apex leagues). The profile header now uses it too.
- Live game rows: after an apex player's LP, " · #512" in gold, with the full "#512 on the EUW ladder" as a tooltip. Hidden players aren't looked up. Lower tiers unchanged (no request).
- 142 tests.

**Checks.** tsc, tests, build, a11y `{}`. Demo (scout ranks mocked to Challenger/Grandmaster since demo ranks are random, positions mocked): rows read "1,420 LP · #41" and "760 LP · #512"; only apex players triggered position requests (2). Shot `demo/live-ladder-rows.png`.
