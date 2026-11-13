# v3.6 — baseline (live, 13 Nov 2026)

The version that was live when the improvement loop started. Screenshots in `live/` are the
real site (riftwatch.fly.dev, real Riot data), taken in the desktop app's browser at 1280×800.

## Problems found on the live site

- **First visit to a profile took 48 s to show match history.** The development key allows
  100 Riot calls per 2 minutes per region; ladder pages spent 50 calls on player names and the
  stats collector kept spending the rest, so visitors' lookups queued.
- **Small samples ranked as the best champions.** Tier list S+ included Veigar Bot (44 games)
  and Evelynn (58 games); the home page "Strongest picks" showed the same.
- **Patch movers dominated by noise**: Quinn −23.8% on 45 games, Sylas +20.3% on 85.
- **Champion counters from a handful of games**: Ahri "countered by Kog'Maw 0%",
  "strong against Ryze 80%".
