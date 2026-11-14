# v3.78 — Tier list and ladder tables on phones

A phone sweep (iPhone 13, demo) over compare, duo, tier list, Arena, ladder, multi-search, stats, live game and draft looked for anything past the right edge. Three tables had a minimum width inside a sideways scroller, with columns hidden off-screen and no hint: the tier list (720 px), the ladder (640 px) and the Stats tab's champion table (760 px).

## Changes
- **Tier list** (`Champions.tsx`), below `sm`:
  - It shows #, Champion, Tier and Win rate (with the patch change).
  - The role moves under the champion name as icon + label.
  - Pick rate, ban rate, games and the win-rate bar come back from `sm` up. `header()` gained an optional class for that.
- **Ladder** (`Leaderboard.tsx`), below `sm`:
  - Games move under the win rate ("614 games") and the bar is left out.
  - From `sm` up the layout is unchanged.
- Not changed this round: the Stats tab's champion table, which is a deliberately wide comparison table.

## Checks
tsc clean · 119 tests pass · a11y `{}` · sweep: tier list, Arena and ladder now have no table past the edge (only the role tabs, which scroll on purpose) · demo `phone-tierlist-table.png`, `phone-ladder-table.png`.
