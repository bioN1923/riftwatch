# v3.68 — Compare: only clear edges get gold

Live-style check of `/compare` (Caps vs Rekkles, demo): "Rekkles better in 2" came from 50% vs 58% win rate over 18/19 games and KDA 3.43 vs 3.54. Both are well within chance. This brings the compare page in line with the honest-data rules used elsewhere (movers, patch deltas, counters).

## Change
- `src/lib/compare.ts`:
  - `summarize` keeps per-game values for every table row and returns their standard errors (`se`).
  - New `seOf()` (SE of a mean).
  - New `clearEdge(va, vb, seA, seB, lowerBetter)`: a winner only when |gap| > 2·√(seA² + seB²).
- `Compare.tsx` `Metrics`:
  - Gold and the "better in N" counts now use `clearEdge`. Role-unfair rows still get no winner.
  - A note gives how many rows differ but are too close to call.
- String `cmp.clearNote_*` in 7 languages. 2 new tests (112 total).

## Checks
tsc clean · a11y `{}` · demo:
- Caps vs Rekkles: 0–0 with 2 rows too close.
- Caps vs Faker: Faker's KDA 6.51 is a clear edge.
- Caps vs Perkz: 1 clear edge, 10 too close.

Screenshot: `compare-clear-edges.png`.

## Live check (2026-11-14 14:35)
- v3.68 deployed cleanly at 09:02.
- bioN1923 vs lickit#28cm (20 games each): "bioN1923 better in 0, lickit in 3".
  - The gold marks are on damage/min (787 vs 1,017), vision/min (0.70 vs 1.22) and performance score (4.6 vs 6.0).
  - 9 rows are too close to call, including win rate (40% vs 50%) and KDA (1.77 vs 2.65), which v3.67 would have marked.
  - Screenshot: `live/compare-clear-edges.jpg`.
- Follow-up: lickit plays several roles with no clear main, so the different-roles note didn't trigger. Damage and vision are still compared against a jungler. Worth softening when either player has no main role.
