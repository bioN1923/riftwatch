# v3.129 — Saves no longer stall requests

**Why.** Timing the live API, a request that normally takes about 40 ms took 1.7–2.2 s now and then: once in 38 one-per-second requests, and on the first tier-list request. The server saves `champions.json` every 30 s and the player index every 15 s. Each save trimmed, ran `JSON.stringify` over the whole store and called `fs.writeFileSync` in one go, and nothing else could run meanwhile. The live champion store holds four patches of builds, matchups and players, so it is large.

**What.**
- `server/chunkedJson.ts` → `stringifyChunked(value, { depth, budgetMs })` walks the top levels of objects (and long arrays item by item) itself. It stringifies small subtrees natively and pauses with `setImmediate` whenever it has run for 8 ms. Output is identical to `JSON.stringify` for plain data.
- `ChampionStatsStore.flushAsync()`, the 30 s save:
  - trims tails champion by champion with pauses (the trim pass is now a `trimRole` method shared with the blocking save);
  - caps patches and seen-lists (`prepare()`);
  - serialises with `stringifyChunked`;
  - writes `champions.json.tmp` with `fs.promises` and then renames it. A crash mid-write leaves the previous file whole, where it used to leave a truncated one.
  - A `saving` flag stops saves overlapping, and a failed save marks the store dirty again.
- `PlayerIndex.flushAsync()`, the 15 s save, works the same way.
- The blocking `flush()` stays for shutdown (SIGINT/SIGTERM). It now also writes when an async save is still in flight, since the process exits before that save could finish.

**Checks.**
- tsc passes; 176 tests pass, 4 of them new:
  - `chunkedJson.test.ts`: output identical to `JSON.stringify` (nested data, `undefined` left out, long arrays with holes, budget 0);
  - `champStatsFlush.test.ts`: `flushAsync` and `flush` write the same data, no `.tmp` is left behind, and the store reloads.
- Local benchmark (8,000 Rift and 1,500 Arena games, a 4.5 MB file): the blocking save took 101 ms; the async save took 170 ms in all, with the longest pause in request handling at 13 ms.
- a11y `{}`; no UI changes.
