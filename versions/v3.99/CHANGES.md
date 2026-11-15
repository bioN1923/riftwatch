# v3.99 — Arena line survives restarts

**Why.** v3.98's live check: Arena stuck at 13 games with `queued: 0`. The line of Arena players to follow (`ArenaSeeds`) lived only in memory, and every deploy restarts the server, so the chain broke each time. The collector reads Arena games without storing them on disk (`store=false`), so they couldn't be replayed to rebuild the line either.

**What.**
- `ArenaSeeds` takes an optional file (`server/data/arena-seeds.json` in live mode): loads the line and the "already seen" set on start, saves at most once a minute when it changed (the last 5,000 known players), and on shutdown.
- Shutdown now also handles SIGTERM (Fly uses SIGINT by default, other hosts SIGTERM) and flushes the Arena line along with the other stores.
- Test: the line survives a "restart", other-platform games are ignored, and a known player isn't lined up twice (143 tests).

The 13 games already collected can't be replayed (their players weren't saved), so the line restarts from the next probe find; from then on it carries over deploys.

**Checks.** tsc, tests, build, a11y `{}`. No UI change (demo shots for the record).

## Live check (2026-11-15)
Deployed 17:58 (local); the data folder is on the Fly volume (`/app/server/data`), so `arena-seeds.json` persists. At 18:01: `probes: 1, found: 0, queued: 0`, Arena still 13 — the first probe after the restart found nobody, so the line is empty until a probe (every 15 minutes) or a visitor's Arena game lines players up; from then on it carries over deploys. The 13 games so far were never counted as probe finds, so they most likely came from a visitor's Arena games.
