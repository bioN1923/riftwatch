# v3.156: wlTone joins the honest colour rule

## What changed
- **Why:** the champion page's "Who plays it most" panel coloured each player's win rate with `wlTone`, which was plain under 5 games and otherwise a plain ≥50% split. So 2–3 over 5 games (40%) was red, and 3–3 (50%) was green.
- **Fix:** `wlTone(wr, games)` now hands off to `sureTone`, the 2-standard-error test used across the site since v3.151. Without a game count it keeps the old split.
- **Affected:** all three callers.
  - Champion page "Who plays it most".
  - Compare "Most played" champion rows.
  - Multi-search champion rows.
- **Test:** the `wlTone` test is updated. 12–8 is now plain; 30–10 is green and 12–28 is red.

## Checks
- `tsc`, `vitest` (183) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/` and `demo/top-players.png`, where the demo top players' 5–6 game rates are now all plain.

## Live check (2026-11-16 12:05 local)
- The live index serves `index-hH-EphBd.js`, and the 3.156 changelog entry is in its changelog chunk, so this build is live. `wlTone` itself is minified, so it was verified by build identity.
