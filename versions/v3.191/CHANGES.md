# v3.191: high-elo comparison and trends colour only clear gaps

## What changed
- **Why:** a sweep for green/red decided by a plain comparison, after v3.190, found two more on the Stats tab.
  - "Compared with high elo" coloured every gap: +3% gold per minute and +4% kills showed green over 13 games.
  - The Trends line ("Recent half vs earlier half") coloured any change above zero.
- **`Benchmarks` (Insights.tsx):** a row is coloured only when the player has at least 10 games in the role and the gap is at least 10%. Otherwise the bar is `bg-line-strong` and the percentage is muted.
  - The footnote adds `bench.grey`: "Grey: a gap under 10%, or fewer than 10 of your games. Too small to read much into." It's in all 7 languages.
- **Trends (StatsTab.tsx):** the same rule, a change of at least 10% of the metric's average over at least 10 games.
- **Already honest:**
  - Team draft reasons, `Items.tsx`, `PatchDelta`, the patch movers and the ladder LP change were left alone.
  - The movers and LP rows only list changes that already passed their own tests.
  - LP is an exact number, not a sample.

## Demo (Caps, 13 Jungle games)
- Plain: CS +7%, gold +3%, kills +4%.
- Coloured: damage +22% and deaths −17% are green, assists −25% is red.
- Trends KDA: −1.1, about 29% of the average over 18 games, stays red.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/bench-phone.png`, `demo/trend-phone.png` and `demo/`.

## Live
- Deployed 20:28 local. The live bundle has v3.191 and the `bench.grey` key.
