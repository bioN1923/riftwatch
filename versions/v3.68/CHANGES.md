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
