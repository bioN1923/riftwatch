# v3.11 — compared with high elo, today at a glance (13 Nov 2026)

Iteration 5 (ran on its own while you were at work).

## New
- **Compared with high elo** (profile → Stats): the player's per-game numbers in their main role
  — CS, gold and damage per minute, kills, deaths, assists — next to the average for that role
  in the Challenger/Grandmaster games Riftwatch collects, with how far above or below (fewer
  deaths counts as better). Switch between the roles they've played at least 3 games in.
  New endpoint `/api/benchmarks?role=…[&champion=…]`.
- **Today** (profile sidebar, only on days they've played): games, won–lost, LP change from
  rank history when it covers today, and the best game of the day (when there were 2+).

## Checked
- Live site healthy: tier list API answers in ~0.1 s; 6,512 ranked games on 16.22; 226 tier
  rows carry a last-patch comparison.
- Accessibility check (now also covering the Stats tab): zero violations.
- Tests: 55 passing (new: benchmarks).
