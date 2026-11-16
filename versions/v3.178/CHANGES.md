# v3.178: lane charts use the quiet-lead rule

## What changed
- **Why:** v3.167 made tiny gold, CS and XP leads plain on the matchup header and table, but the "How the lane goes" charts right below still drew them red. Ahri vs Zed showed a red line and a red "−74 @15" (gold) and "−1.3 @15" (CS) under a header saying "could still be chance".
- **`LaneCurve`:** each chart takes a `quiet` threshold. Leads smaller than it get the neutral colour for the line, the dots and the "@15" figure. The thresholds are `GOLD_QUIET` 100 and `CS_QUIET` 3.
- **Shared constants:** the thresholds moved to `src/lib/format.ts`, and `Champion.tsx` re-exports them. This avoids a circular import, because `Champion.tsx` uses `LaneCurve`.
- **Demo:**
  - Ahri vs Zed: gold and CS are now grey, with only the −107 dot at 5 minutes still red.
  - Ahri vs Viktor: −499 gold at 15 stays red, and CS −0.9 is grey.
- **Also checked:** the chart renders in full on phones. The gap seen in an earlier full-page phone shot was the bottom nav overlapping the capture.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/lane-quiet.png`, `demo/lane-viktor.png` and `demo/`.

## Live
- Deployed 16:48 local. The live bundle has v3.178 and the new changelog line.
