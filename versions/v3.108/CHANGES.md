# v3.108 — Arena: remember the event queue

**Why.** The Arena line was being worked through (167 → 150 players) but Arena stayed at 21 games. The probe found its player through the any-queue fallback, which suggests Arena is running under an event queue id learned from the CHERRY game mode (v3.94). That learned id lived only in memory: after each deploy the crawler asked Riot for queue 1710 again, got nothing for every lined-up player, and used them up.

**What.**
- The Arena line file (`arena-seeds.json`) now also saves the learned Arena queue ids and restores them on start; learning a new id marks the line to be saved.
- `readQueue` for Arena: when the asked-for queue returns nothing, it reads the player's last three games of any queue — an Arena game among them teaches the id and lines up its players. At most 3 extra match reads per player, through the usual pacing.
- `/api/health` `arena.queue`: the queue id currently used for Arena, so this can be checked from outside.
- Test: learned ids survive a restart (148 tests).

**Checks.** tsc, tests, build, a11y `{}`. Demo health shows `queue: 1710`. No UI change.
