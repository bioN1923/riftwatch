# v3.181: remakes aren't highlighted in match history

## What changed
- **Why:** the demo profile's first match is a 3:44 remake at 0/0/2. Its row showed "Perfect KDA" in gold, the colour for a great game. A remake doesn't count, and the profile's own totals already leave remakes out (`stats.ts`).
- **`MatchRow`:** on remakes, the KDA line uses `text-faint` instead of `kdaTone`, and the MVP/ACE badge is hidden. The grey "Remake" label and the grey edge were already there.
- **Unchanged:** the post-game scoreboard. It already titles both teams "Remake" and hides the badge column.

## Also checked (phone, 390 px)
- Items page list and an expanded item: fine.
- Profile match rows: fine apart from the remake.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/remake-row.png` and `demo/`.
