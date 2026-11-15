# v3.99 — Arena line survives restarts

**Why.** v3.98's live check: Arena stuck at 13 games with `queued: 0`. The line of Arena players to follow (`ArenaSeeds`) lived only in memory, and every deploy restarts the server, so the chain broke each time. The collector reads Arena games without storing them on disk (`store=false`), so they couldn't be replayed to rebuild the line either.

**What.**
- `ArenaSeeds` takes an optional file (`server/data/arena-seeds.json` in live mode): loads the line and the "already seen" set on start, saves at most once a minute when it changed (the last 5,000 known players), and on shutdown.
- Shutdown now also handles SIGTERM (Fly uses SIGINT by default, other hosts SIGTERM) and flushes the Arena line along with the other stores.
- Test: the line survives a "restart", other-platform games are ignored, and a known player isn't lined up twice (143 tests).

The 13 games already collected can't be replayed (their players weren't saved), so the line restarts from the next probe find; from then on it carries over deploys.

**Checks.** tsc, tests, build, a11y `{}`. No UI change (demo shots for the record).
