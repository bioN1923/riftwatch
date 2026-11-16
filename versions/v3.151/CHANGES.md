# v3.151: one honest colour rule for win rates

## What changed
- **Why:** most of the site colours win rates with `sureTone` (green or red only when more than 2 standard errors from 50%). Seven places still used fixed cuts. The live game (seen in the v3.150 screenshot) used ≥55% green and <47% red, so 56% over 133 games was green although that is within chance. Six others used ≥50% green, else red, so 49% looked like a weakness.
- **Switched to `sureTone`:**
  - `LiveGame.tsx`: each player's season solo win rate.
  - `ProfileHeader.tsx`: ranked solo and flex win rate in the header.
  - `Sidebar.tsx`: the big scouting-report win rate.
  - `Arena.tsx`: champion-page top-4 rate (by `sum.games`).
  - `Compare.tsx`: header season win rate.
  - `Draft.tsx`: blind-pick win rate (by `p.games`).
  - `MultiSearch.tsx`: card season win rate.
- **Demo results:** Caps solo 145W 124L, 54%, now plain; flex 57W 8L, 88%, stays green; HexLantern70 56% over 133 games now plain.
- **Not changed:** Arena average placement (`≤4.5`) has no simple 50% baseline, so it stays as it was.

## Checks
- `tsc`, `vitest` (183) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/` (`07-live-game.jpg`, `05-profile.jpg`).
