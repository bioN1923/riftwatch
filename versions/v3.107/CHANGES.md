# v3.107 — LP change next to the ladder place

**What.**
- `/api/leaderboard/:platform/position/:puuid` adds `lpChange` and `since` from the ladder snapshots (v3.103) for Challenger and Grandmaster players.
- `LadderPlace` (profile header, Compare, Multi-search) appends "· +47 LP compared with yesterday" (green/red/faint) when there is a snapshot.
- One string in seven languages; 147 tests.

**Checks.** tsc, tests, build, a11y `{}`. Demo (rank and position change mocked, since demo keeps no snapshots): "#357 on the EUW ladder · +47 LP compared with 20 hours ago". Shot `demo/profile-ladder-change.png`.

## Live check (2026-11-15)
Deployed 22:11 (local). API only: the top EUNE Challenger climber's position → `{ rank: 119, overall: 119, lpChange: 116, since: 16:33 UTC }`, matching the ladder's climbers strip (+116). Arena: 21 games, 150 lined up (being worked through).
