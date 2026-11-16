# v3.150: honest "Other matchups" chips

## What changed
- **Why:** on the matchup page, the "Other mid matchups for Ahri" chips showed only a win rate. Every rate from 10+ games was green or red on a plain ≥50% test, so 48% over 42 games read as a loss. One-game results (Ezreal 0%, Lulu 100%, Vi 0%) sat among the others in no particular order.
- **Game counts:** each chip now shows its games ("56 games", "1 game").
- **Order:** chips are sorted by games, most-played first.
- **Colour:** win rates use `sureTone` (green or red only when more than 2 standard errors from 50%). Under `LOW_SAMPLE` they stay faint, as before. In the demo, none of Ahri's other mid matchups is clearly off 50%, so all show plain.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/` and `demo/other-matchups.png`.

## Live check (2026-11-16 11:04 local)
- The live index serves `index-g2MVX-S1.js`, and its Matchup chunk has the other-matchups section with game counts.
