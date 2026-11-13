# v3.7 — speed and honest numbers (13 Nov 2026)

Iteration 1 of the improvement loop. Found by using the live site with real data (see
`../v3.6/NOTES.md`).

## Speed
- **Visitors' lookups come first.** Background work now waits until at least half of the key's
  Riot budget is free in that region: the champion-stats collector, and a new background
  name lookup for the ladder. A first visit to a profile no longer queues behind them.
- **Ladder pages no longer spend 50 Riot calls on names.** Each request looks up at most 8
  unknown names; the rest fill in in the background, and the page shows placeholders and
  updates itself every few seconds until they're all there.

## Data quality
- **Tier list:** win rates are shrunk as if each champion had 150 extra games at 50% (was 40),
  and anything under 0.5% of games (min 20) is capped at tier B. No more S+ from 44 games.
  The home page's "Strongest picks" uses the same ranking.
- **Patch movers:** need 100 games on both patches, and changes are weighted by sample size.
- **Counters ("Countered by" / "Strong against") and matchup lists:** need at least 8 games and
  3% of the champion's games, with stronger shrinkage. No more "Kog'Maw 0%" from a handful.

## Tooling
- `versions/` — this folder: one folder per version with notes, live and demo screenshots.
- `scripts/shoot-version.cjs` — takes the standard set of demo screenshots for a version.
- `deploy.bat` — runs `fly deploy` and writes `deploy.log`.

## Screenshots
- `demo/` — demo data, 1440 px, full page, plus phone.
- `live/` — riftwatch.fly.dev after deploying.
