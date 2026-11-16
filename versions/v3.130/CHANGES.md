# v3.130 — Server timings; non-blocking match-cache pruning

**Why.** v3.129 cut the periodic request stalls from 1.7–2.2 s to about 0.55 s, but one still came roughly every 35 s, and the cause was a guess. This version measures it. Reading the code for blocking work also turned up one more certain offender: once the match cache passed its cap of 20,000 files, `MatchStore.prune()` ran `readdirSync`, then `statSync` on every file, then `rmSync` on 2,000 of them, all in one blocking pass.

**What.**
- `server/perf.ts` measures:
  - **event-loop delay** with `monitorEventLoopDelay`: max, p99 and mean for the current 5-minute window, plus the previous window;
  - **GC pauses** through a `PerformanceObserver('gc')`: count, total, longest and last, with its kind;
  - **heap** in use;
  - **named spans**: `instrument(obj, method, name)` wraps a method, sync or async, and keeps count, average, max, last and how long ago it ran;
  - **stalls**: a 100 ms ticker records the last 12 delays over 150 ms, each with the span that had just run and any GC at the same moment.
- `index.ts` instruments every store save:
  - `champStats.flushAsync/flush`, `players.flushAsync/flush`;
  - `lp`, `errorLog`, `arenaSeeds`, `ladderHistory` and `privacy` saves.
- It also instruments crawler ingest (`champStats.addMatch/addTimeline/addLane`) and the match cache (`get/set/prune`).
- `/api/health` gains `perf` with these figures. It holds numbers and method names only, nothing about players.
- `MatchStore.prune()` is now asynchronous: `fs.promises.readdir`, `stat` in batches of 200, sort, then `rm` in batches of 200. Errors are logged, not thrown.

**Checks.**
- tsc passes; 178 tests pass, 2 of them new:
  - `matchStorePrune.test.ts`: with a cap of 20, the 21st file triggers a prune down to 18, the newest file survives and the count is right;
  - `perf.test.ts`: sync and async spans are timed.
- Demo: `/api/health.perf` reports the loop, GC (263 pauses, longest 13 ms), heap 235 MB and spans. It records the 5.4 s startup stall from seeding the demo, attributed to `champStats.addMatch`.
- a11y `{}`.
