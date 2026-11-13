# v3.8 — your champions, your goals (13 Nov 2026)

Iteration 2.

## New
- **Patch watch** (profile sidebar): the player's five most played champions, each in their
  usual role, with this patch's tier and win rate from Riftwatch's aggregate stats, and the
  change since last patch. Op.gg/u.gg show tier lists and profiles separately; this joins
  them, so "did my champions just get better or worse?" is answered on the profile.
- **Goals** (profile sidebar): pick up to three targets — CS/min, deaths (at most), vision/min,
  kill participation, damage/min, control wards — and see, game by game over the recent
  Summoner's Rift games, whether you hit them: a dot per game, how often, the average and the
  current streak. Saved in the browser per player; no account needed.
- **Tier list shows the change since last patch** under each win rate (only when both patches
  have enough games to compare).

## Fixed
- Profile header: the LP number and "LP" no longer split over two lines.
- Scouting report: "Ezreal is the comfort pick: 5 games, 0% won" became neutral wording —
  "Most played: Ezreal, 5 games, 0 won."

## Screenshots
- `demo/` — standard pages; `05-profile` shows Patch watch and Goals.
- `live/` — after deploying.
