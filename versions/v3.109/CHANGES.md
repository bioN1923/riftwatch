# v3.109 — Arena: read more of the line

**State.** After v3.108 the Arena chain runs: at 20:27 UTC Arena had 26 games (up from 21) and the line was full (300 players, the cap). The bottleneck is now throughput: one lined-up player was read per *active ladder player*, and none at all while the ladder was quiet, so a full line drained slowly while the cap threw new players away.

**What.**
- `readArenaLine(n)` in the crawler. With ladder players active: one lined-up Arena player per ladder player, as before. When the ladder is quiet: up to 10 lined-up players (`ARENA_QUIET_BATCH`) before the lane-curve backfill or the 2-minute rest — instead of only probing.
- Every request still goes through `paced()` (2.5 s apart, waits while visitors are active, keeps half the key's budget free), so visitors aren't affected.
- No UI change; 148 tests.

**Checks.** tsc, tests, build.
