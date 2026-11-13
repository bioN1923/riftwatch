# v3.22 — 13 Nov 2026

## Live check (before)
- Compare (`Kaori#EUW33` vs `MRO#ZKU`) loads all sections: last 20 games, per-game stats, roles, most played.
- **Data is the bottleneck.** Ranked games on patch 16.22 grew only 6,650 → 6,692 in about 2.5 hours. Many features still show small samples (matchups of 8–17 games, "still filling in" notes).
- Cause in `server/crawler.ts`: each pass walked every Challenger and Grandmaster player, skipping 70% at random, and asked for their **last 10** games, whether or not they'd played since the last visit. Most of those calls returned games already counted.

## Changed
- **The collector only visits players who have played since its last pass.** The league entries it already downloads carry each player's ranked game count (wins + losses), so checking is free. Unchanged players cost no calls. A player with new games is asked for exactly that many (up to 10; 10 on the first visit).
- **Master tier added** to Challenger and Grandmaster: more active high-elo players to draw new games from. The league lists are cached 10 minutes, as before.
- When nobody has played since the last pass, the quiet time goes to the lane-curve backfill (20 older games), or the collector rests 2 minutes. No busy loop.
- The "Compared with high elo" panel text now says "Master, Grandmaster and Challenger games", in all 7 languages.
- Pacing, the 50% headroom rule and "visitors first" are unchanged.

## Checks
- 68 tests pass. New test with a fake Riot API: the first pass asks for 10 games from each of 3 players; after one player's game count goes up by 3, the next pass asks only that player, for 3 games. Typecheck, build and a11y check clean.
- To verify in the next iteration: the ranked game count should grow faster than about 17/hour.

## Live check (after deploy)
- Deployed 13 Nov 2026 14:07 (deploy.log EXIT CODE 0). The site stays responsive with the bigger Master league list: tier list API 0.17 s, a profile 0.24 s.
- Baseline for measuring the new collection rate: **6,718 ranked games on 16.22 at 12:10 UTC** (6,692 at about 11:30 UTC). The next iteration compares.
- Nothing visual changed this round, so there are no live screenshots.
