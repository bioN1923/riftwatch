# v3.142: Ladder win/loss bar

## What changed
- **Why:** the Ladder's win-rate column used `WinRateBar`, which starts at 50% and fills to full at ±5 points. That suits champion win rates, but on the ladder top players sit at 50–56%, so most rows showed a few-pixel sliver of green. Its track barely showed on the dark theme, so it looked like a stray mark (noted in the v3.140 screenshot).
- **New bar:** `WinLossBar` in `Leaderboard.tsx` is a 96 px split bar: green for the share of wins, then red for losses, with a 50% tick, so you can see which side is ahead. It's `aria-hidden`; the percentage and the W/L counts next to it carry the information.
- **Phones:** unchanged; the bar is hidden there, as before.

## Checks
- `tsc`, `vitest` (183) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`, plus a crop of the ladder in `demo/ladder-wl.png`.

## Live check (2026-11-16 09:26 local)
- The live index serves `index-DUj78F22.js`, and its Leaderboard chunk contains the split bar (`bg-loss/80`).
