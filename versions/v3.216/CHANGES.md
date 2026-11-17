# v3.216: visible win-rate bar track

## Found
- On the tier list (`v3.215/demo/02-tier-list.jpg`), the win-rate bar's track (`bg-sunken`) was almost the same colour as the table row.
- Only the coloured part showed. Near 50% that's a few pixels, which looked like a stray tick beside the number rather than a scale.

## What changed
- **`WinRateBar`** (tier list and champion matchups):
  - The track is now `bg-line`, the divider colour, so its full ±5-point range is visible.
  - The 50% mark is `bg-muted` and 1 px taller on each side, so you can tell which way a short bar points.
- Screenshots are taken during the 900 ms grow animation, so the bars look shorter in `demo/` than they settle at.

## Checks
- `tsc`, `vitest` (190) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`.
