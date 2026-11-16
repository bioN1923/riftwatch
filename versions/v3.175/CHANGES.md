# v3.175: clear an empty tier-list filter

## What changed
- **Why:** filtering the tier list to nothing ("No champions match that filter. Try another name or role.") left you to find the filter box and delete the text by hand, and to remember whether "My pool" was also on.
- **Fix:** when there are games but the filter or "My pool" leaves no rows, the empty state shows a "Clear filter" button. It resets both the search text and the pool toggle. It doesn't show for the "no games yet" empty states, where nothing can be cleared. New string `tl.clearFilter` in all 7 languages.
- **Also checked:** the Ladder at 390 px reads well (no sideways scroll; rank, LP change and win rate fit); no change.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Click test: filtering "zzqq" gives the empty state; "Clear filter" brings back 44 rows and an empty input.
- Screenshots: `demo/tierlist-clear.png` and `demo/`.
