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

## Live findings and second fix (same version)
After the first v3.130 deploy, a 36-request probe ran clean (median 37 ms, max 177 ms). The new `/api/health.perf` showed what the remaining stall was:
- one stall of **378 ms**, with a **274 ms GC** at the same moment, plus a 242 ms neighbour;
- both came as `champStats.flushAsync` finished (3.4 s total);
- every other save (`players`, `lp`, `errorLog`) took 0 ms;
- the 4.2 s stall in the list was startup (loading `champions.json`).

So the last pause was a full garbage collection, set off by building the whole ~50 MB save as one string (pieces, then `join`).

**Fix.**
- `writeJsonChunked(file, value)` streams the same JSON straight into a `fs.WriteStream`. It sends 64 kB at a time, waits for `drain` when the stream is full, then closes and renames `file.tmp` to `file`. The full text never exists in memory, so a save no longer leaves a 50 MB string for the GC to sweep. `stringifyChunked` is kept and shares the same walker.
- Both `ChampionStatsStore.flushAsync` and `PlayerIndex.flushAsync` use it.
- The champion stats save now runs every 2 minutes instead of every 30 s. Each save still allocates a lot, and the shutdown save covers deploys and restarts.

**Checks.**
- 179 tests pass; a new test writes a 5,000-key object through the stream and compares it to `JSON.stringify`.
- Local benchmark (12,000 Rift and 1,500 Arena games, a 5.2 MB file): the async save took 209 ms in all, with the longest pause 15 ms and the **longest GC 2 ms**.
- a11y `{}`.
