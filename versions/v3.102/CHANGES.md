# v3.102 — Challenges on profiles

**Why.** op.gg and u.gg show a player's Challenges level; it's a quick sense of how much and how broadly someone plays, and Riftwatch didn't use the Challenges API at all.

**What.**
- `riot.challenges()`: `lol-challenges-v1 /player-data/{puuid}`, cached 30 minutes (404 → nothing).
- `GET /api/challenges/:platform/:puuid` → `{ level, points, percentile }` from `totalPoints` only (no per-challenge data); nothing for hidden players or level NONE. Demo: a stable made-up standing.
- Profile header, next to the region: medal icon + "Challenges: Diamond · top 4.2%" (percentile shown only when ≤ 50%), tooltip with the points. Loaded separately, so the profile never waits for it.
- `/api-usage` cache table lists lol-challenges-v1. Seven languages; 144 tests.

**Checks.** tsc, tests, build, a11y `{}`. Demo: "Europe West · Challenges: Master · top 17.0%", tooltip "18,153 challenge points". Shots `demo/challenges-*.png`.

## Live check (2026-11-15)
Deployed 18:27 (local). API only, on the EUNE profile already in the owner's recents: `/api/challenges` → `{ level: PLATINUM, points: 11310, percentile: 0.108 }`, so the header reads "Challenges: Platinum · top 10.8%". Riot's `percentile` is the share of players at or above (lower is better), which fits a Platinum total. Arena unchanged (13; probe found nobody).
