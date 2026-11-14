# v3.82 — No colour for tiny win-rate samples

On profiles, "Lillia 75% (4)" was in strong green and "Diana 0% (4)" in grey, as if they meant something. With 4 games either could easily be luck. This follows the same honest-data rule as the tier list, compare and draft pages.

## Change
- `src/lib/format.ts` `winRateTone(wr, games?)`: under `TONE_MIN_GAMES` (5) games the colour is neutral (`text-text`). Above that, the bands are as before (≥ 60% bright, ≥ 50% green, below 50% muted).
- Game counts are now passed everywhere it's used on profiles: the champion pool sidebar, "Often queues with", the Stats tab's champions played and roles, and the player-champion panel (headline, items and runes).
- 1 test (121 total).

## Arena re-check (from v3.81)
At 14:38 UTC, about 3 minutes after the v3.81 deploy, Arena still had 0 matches while ARAM had 147. Too early to judge; checked again after this deploy (below).

## Checks
tsc clean · a11y `{}` · demo shots.

## Live check (2026-11-14 16:47)
- Deploy finished cleanly at 16:45. bioN1923's champion pool now reads "44% (9)" muted, while "75% (4)", "0% (4)" and "100% (1)" are neutral; before, they were green or grey.
- Arena re-check: still 0 matches about 10 minutes after v3.81. A probe of 4 Master players' last 5 games (queue "all") found only ranked solo (420), and their Arena lists were empty. Apex ladder players, the only ones the collector visits, rarely play Arena.
- Arena data will still come from visitors: every match the server fetches for a profile already feeds the stats (`server/index.ts`). Since v3.81, Arena games on 1710 count there too.
- Follow-up: the collector's Arena lookups on apex players are mostly wasted calls. Consider sourcing Arena games another way, e.g. from co-players in visitors' Arena matches, or dropping that lookup.
