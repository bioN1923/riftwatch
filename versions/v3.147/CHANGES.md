# v3.147: champion pool bars sized by games

## What changed
- **Why:** in the profile sidebar's "Champion pool", every bar was full width with green/red split by win rate. A one-game 100% (Aurora, Orianna in the demo) showed a solid full green bar, the strongest-looking row in the panel.
- **Bar length:** the bar now spans `games / most-played games` of the track, with a minimum of 8% so it stays visible. The win/loss split sits inside it. The `aria-label` (wins and losses) is unchanged.
- **a11y check:** the plain `/duo` page (the v3.146 "How it works" state) is now in the page list of `scripts/a11y-check.cjs`.

## Checks
- `tsc`, `vitest` (183) and `vite build` pass.
- a11y: `{}`, now including `/duo`.
- Screenshots: `demo/` and `demo/pool-bars.png`.
