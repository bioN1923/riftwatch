# v3.57: Duo finder (user request)

## Request (06:44 and 06:46)
"Search premade or best premade where you can see the players you fit better with, from champs, playstyle, objectives, vision. It should be from any role but not yours … best fit or another algorithm." And: "It should be around the same rank too, so no high elo with Silver."

## Design decisions
- **Where candidates come from:** the players in **your own last 20 ranked Solo/Duo games**, teammates and opponents. Matchmaking already put them near your MMR.
  - Riot's API can't search the whole player base.
  - Scoring strangers taken from our crawled games would rank people who never opted in, a grey area under the policy list on `/api-usage`. So it's left out.
  - Hidden profiles are skipped. This is stated on the page and on `/api-usage`.
- **Not your role:** candidates whose position in your games was your main role are dropped before any lookups.
- **Around your rank:** within **4 divisions** (about one tier, `MAX_RANK_GAP`). Silver II sees Bronze II to Gold II. Master and up count as one step above Diamond I.
- **API cost:** at most 12 rank checks (the scout endpoint, cached), then the last 10 ranked games for at most 5 players who pass, all cached for 10 minutes. Results appear as they load.

## Scoring (`src/lib/duoFit.ts`, pure and tested)
- `playStyle(matches, puuid, tagsOf)` reads, from recent ranked games:
  - main role and share;
  - vision per minute;
  - objective damage per minute;
  - kills+deaths per minute (how fight-heavy their games are);
  - kill share;
  - champion class mix;
  - start-hour histogram, in the visitor's time zone.
- `duoFit(me, myRank, them, theirRank)` gives a 0–100 score from 7 weighted parts:

| Part | Weight | How it's scored |
|---|---|---|
| Rank | 20% | 1 − gap / 5 divisions |
| Role pairing | 15% | 1 for classic pairs (Jungle + Mid/Top/Support/Bot, Bot + Support, Mid + Support), else 0.6 |
| Timing | 20% | Overlap of the two hour histograms |
| Champion styles | 15% | 1 − class overlap: different classes make a rounder team |
| Fights | 10% | Similarity of kills+deaths per minute |
| Vision | 10% | 1 if they ward at least as much as you, else the ratio |
| Objectives | 10% | Similarity of objective damage per minute |

- It returns `null` (not shown) for the same main role, no ranked games, or more than 4 divisions apart.

## UI
- **`/duo`:** "Duo finder" in the desktop nav and the phone Tools menu.
  - A Riot ID and region form, with chips for your favourites and recent players.
  - The page says what it's based on, e.g. "From your last 18 ranked games (Jungle, Emerald IV); 12 players from those games were checked".
- **One card per fit, best first:**
  - rank emblem and name (links to their profile), their role and rank, and "played on your team N times (W won)";
  - a big **fit** number;
  - all 7 parts as small bars with plain sentences, e.g. "Bot next to your Jungle", "Plays at the same hours as you: 80% overlap (most often around 21:00)", "Vision 1.6/min (you 0.9)";
  - "Based on their last 10 ranked games."
- **Profiles:** a "Find a duo" button next to Compare (icon-only on phones). The phone header still fits with no overflow, and the first match stays at y = 634 on iPhone SE.
- The footer note says it's a rough guide from small samples, not a judgement of anyone.
- 23 strings in 7 languages, with plurals including Romanian few and Polish few/many. Tests: 101 pass (2 new: playstyle reading, scoring and exclusions, rank steps).

## Checks
- Typecheck clean, a11y `{}`.
- **Demo:**
  - Caps (Jungle, Emerald IV) → QuietDrake (Bot, Diamond IV, 5 games together), fit 58, with the rank part low (4 divisions apart) and timing 33%.
  - Rekkles and Faker → "Nobody from your recent games fits". In the demo, co-player ranks are random, so few are within a tier; real matchmaking keeps them close.
- Screenshots: `demo/duo-*.png` plus the standard set.

## Live check (07:17)
- Deployed automatically (EXIT CODE 0, 07:15:28).
- **`/duo` for bioN1923#EUNE:** "From your last 20 ranked games (Jungle, Silver II); 12 players from those games were checked". Five fits, all between Silver IV and Gold IV, none of them junglers:
  - **lickit#28cm**, Bot, Silver II: **85**. Same rank, Bot next to Jungle, 70% same playing hours, Marksman vs your Fighter, fights 0.53 vs 0.52/min, vision 1.33 vs 0.70/min.
  - **T1 Faker#SMURF**, Top, Silver II: 69.
  - **KitingExpert#ZERI**, Mid, Silver IV: 66.
  - **xemi0907#0907**, Support, Gold IV: 64.
- Screenshot: `live/duo-bioN1923.jpg`. The demo screenshots were regenerated with the "Rank: X (you Y)" wording.
