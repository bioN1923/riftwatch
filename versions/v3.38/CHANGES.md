# v3.38: patch movers you can trust

## Live check that started it
On patch 16.22 (8,943 games), the movers showed Sylas +22.2% on 125 games and Lux +18.5% on 148. The filter only required a change of 1 standard error. With about 300 champion-role pairs, roughly a third of them clear 1 SE by chance alone, so the lists were partly noise. The rows also showed only this patch's games.

## Changes
- `server/champStats.ts` `movers()`:
  - a change must be at least **2 standard errors** (`moverSe(g1, g2) = √(.25/g1 + .25/g2)`);
  - the list is ranked by the **change we can be sure of**, `sign(Δ)·(|Δ| − 1 SE)`, instead of `Δ·min(g)/(min(g)+300)`.
- `PatchMovers.tsx`:
  - keeps the server's order (it used to re-sort by raw |Δ|, which put thin samples back on top);
  - each row shows "127 → 125 games" (last patch → this patch), with a tooltip.
- `mv.sub` reworded ("…too big to be chance… Sure changes rank first.") and `mv.gamesTip` added, in all 7 languages.
- Tests:
  - the two existing movers tests now use samples where the intended changes clear 2 SE;
  - new test: +17 on 1500 games a side ranks above +20 on 105.
  - 81 pass.

## Effect on the live data (computed from `/api/champions` before deploying)
- 30 movers (15 up, 15 down) → 17 (7 up, 10 down); 13 dropped as within chance.
- Sylas +22.2 on 127→125 games is still in: z = 3.5, a real swing as far as the data can tell.

## Checks
- Typecheck clean, a11y `{}`.
- Demo screenshot `demo/movers-desktop.png` plus the standard set.
