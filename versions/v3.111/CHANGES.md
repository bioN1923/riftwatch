# v3.111 — Arena event games named "Arena"

**Why.** v3.108 found Arena currently runs on queue 1750. The client's queue-name table only knew 1700 and 1710, so a player's Arena games in their match list (and an Arena live game) were labelled "Special mode".

**What.** `queueName(id, gameMode)`: a game in the CHERRY mode is "Arena" whatever its queue id. Match rows (label and screen-reader text) and the live game header pass the game mode. Test `tests/queueName.test.ts` (149 tests).

**Checks.** tsc, tests, build, a11y `{}`. The demo has no Arena games in the sample profiles, so the unit test covers the label.
