# v3.16 — 13 Nov 2026

## Live check (before)
- Pages fine. The profile icon on `/lol/euw1/Kaori-EUW33` that looked like an empty dark square does load: it's icon 7, which is just very dark.

## Added
- **Draft helper: "Ban for your pool".** Once you have champions in your pool, the draft page shows the 3 enemy laners your champions do worst against this patch: their icon, your pool's average win rate against them, each of your champions' win rate against them (worst first), and a link that opens the answers to that champion.
  - Scoring (`src/lib/draft.ts`, `banSuggestions`): average of each pool champion's shrunk win rate against the enemy, counting a pool champion with no data as 50%. Only matchups with enough games count (same threshold as the rest of the draft page). With 2+ pool champions, an enemy needs data against at least two of them and half the pool, so one bad matchup can't decide the ban. Only enemies the pool loses to (< 50%) are suggested, and your own pool champions are never suggested.
  - Uses the champion data the page already loads (cached), so no extra Riot API calls.
  - Translated in all 7 languages.
  - Most stat sites suggest bans by global ban or win rate. This one bans for the champions *you* play.

## Checks
- 61 tests pass (new: ban scoring and thresholds). The first version of the test caught a flaw: with a pool of 2, one awful matchup outranked an enemy that beats both champions. Fixed by requiring at least two pool champions.
- The a11y check caught the small red percentages on grey chips in light mode (contrast 4.27, needs 4.5); the chips are outlined instead of filled now, and the check is clean.
- Typecheck and build pass. Demo: `demo/ban-*.png` (dark, light, phone); "See answers to Hwei" opens `/draft?…&enemy=hwei`.

## Live check (after deploy)
- Deployed 13 Nov 2026 12:28 (deploy.log EXIT CODE 0). The source archive reached the PC; the git-history archive (14 MB) was rejected twice with HTTP 400, so the PC's git copy catches up in a later sync. The deploy only needs the source.
- `/draft?role=MIDDLE&pool=ahri,syndra,orianna,viktor` (live data): "Ban for your pool" suggests Yone (pool wins 48.5%; 45/45/46/52% per champion) and Akali (49.0%). Only two are shown because live matchup samples are still small (`live/draft-ban-for-pool.jpg`). The Tools tab is highlighted on the draft page.
