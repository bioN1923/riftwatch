# v3.168: live game on phones

## What changed
- **Rank on phones:** the player rows hide the rank column below `sm`, so at 390 px a row showed only "51% / 92 games". The rank is the first thing people scout. On phones the right-hand column now leads with a 16 px emblem and the tier ("Gold I"), then "51% · 92" on one line. From `sm` up nothing changes; the rank column still sits beside it.
- **Damage-mix line:** with the "Mostly physical damage: armor pays off" badge, the line squeezed into three columns on phones ("Damage / mix: / 4 AD · / 1 AP"). It now wraps whole pieces: the label and counts stay together, and the badge drops to its own line.
- **Rules kept:** no premade information is added; the row shows the same public rank data as before.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/` and `demo/live-phone-red.png` (the 390 px red side).

## Live check (2026-11-16 14:45 local)
- The live index serves `index-D-bN4drb.js`, and its Profile chunk has the phone rank line.
