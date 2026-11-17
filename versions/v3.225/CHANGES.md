# v3.225: dashed chart lines are dashed

## Found
- In profile Trends (`v3.224/demo/06-profile-stats.jpg`), the legend showed "Each game" as a dashed line, but the line itself was solid. Only colour told it apart from the 5-game average.
- **Cause, `LineChart`:** every series path had `pathLength={1}`, which the draw-in animation needs. That also rescales `stroke-dasharray`, so "5 4" meant dashes five times the whole path's length, and the line drew solid.
- Match-detail Metrics charts use the same dashed series option, so they had the same problem.

## What changed
- **`LineChart`:** `pathLength={1}` only for the solid, animated series. Dashed series keep real user-unit dashes ("5 4"), as the legend draws them.

## Checks
- `tsc`, `vitest` (191) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`. Trends shows a dashed "Each game".

## Live check (09:05 local)
- `3.225` is in the live JS bundle.
