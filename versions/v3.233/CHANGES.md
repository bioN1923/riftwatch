# v3.233: lane leads on phones

## Found (phone pass over the match-detail tabs, iPhone 13)
- **Metrics → Lane leads:** three columns (10, 15 and 20 minutes), each holding three leads, in about 110 px each.
  - The numbers ran together ("+1.3k+2.2k" across a column border).
  - The 20-minute XP lead was clipped at the right edge.
- **Performance, Item build and Timeline:** read fine at this width. Skill order scrolls sideways inside its own box, as intended.

## What changed
- **`Metrics`, below `sm`:** the lane-leads box is a single column, one row per minute mark, with "At 10 minutes" on the left and the three leads on the right.
- From `sm` up it's the same three columns, centred, as before. Desktop shot checked.

## Checks
- `tsc`, `vitest` (193) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/14-phone-lane-leads.png` and `demo/15-desktop-lane-leads.png`.

## Live check (10:27 local)
- `3.233` is in the live JS bundle.
