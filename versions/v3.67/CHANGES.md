# v3.67 — Make a win condition a goal

## Change
- `Insights.tsx`: exports `useGoals`, `MetricId`, `Goal` and `MAX_GOALS` (3), so other panels can add goals. Behaviour is unchanged: goals are per player, in this browser's localStorage `rw:goals:<puuid>`.
- `StatsTab.tsx` `GoalButton`: in "What your wins have in common", conditions on deaths, CS/min, kill participation or vision (wins side above the cut-off, or ≤ for deaths) get a "Make it a goal" button.
  - Clicking it adds a goal with the condition's cut-off as the target. A line then says "Added to your goals, tracked game by game on the Overview", with a link.
  - The button reads "Already a goal" (disabled) when that stat already has one. It's disabled with an explanation when 3 goals exist.
  - Flipped conditions ("Under 1.3 vision…") and stats goals don't track (damage share, length, first blood) get no button.
- Strings `wc.goal*` in 7 languages.

## Checks
tsc clean · 110 tests pass · a11y `{}` · demo: `win-conditions-goal.png` (after adding "5 deaths or fewer"), `goals-from-stats.png` (Overview: Deaths ≤ 5, met in 10 of 16).
