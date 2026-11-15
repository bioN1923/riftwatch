# v3.91 — Ladder place on profiles

**Why.** op.gg and u.gg show "Ladder rank #1,234" on a profile. For Master and above we already read the apex ladders (cached for 10 minutes), so the profile can say where the player stands without extra Riot traffic beyond those cached league lists.

**What.**
- New endpoint `GET /api/leaderboard/:platform/position/:puuid?queue=solo|flex&tier=…`: the player's place in their tier and overall on the region's apex ladder (tiers above counted first), plus the ladder page. Uses the cached apex leagues (`ladderAll`), only for the tiers up to the player's. Hidden players get nothing. Logic in `shared/ladderPosition.ts` with tests.
- Profile header: under a Master+ rank (solo and flex), "#357 on the EUW ladder" in gold, with a tooltip "#57 of 700 in Grandmaster", linking to `/leaderboard?region=…&tier=…&page=…` (the URL region doesn't change the visitor's saved region).
- Nothing shown below Master, or when the player isn't on the cached list yet (e.g. just promoted).
- Strings in seven languages; 136 tests.

**Checks.** tsc, tests, build, a11y `{}`. Demo (profile response mocked to Grandmaster for a demo ladder player, since demo ranks are random): "#357 on the EUW ladder", link opens Grandmaster page 2 with that player at rank 57. Shots `demo/profile-ladder-place-*.png`.
