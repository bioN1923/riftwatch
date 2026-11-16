# v3.155: ladder search fits its hint

## What changed
- **Phone sweep:** checked at 390 px wide: live game, multi-search, ladder and compare. None scrolls sideways (`scrollWidth` 390 on all four).
- **The one clear issue:** the Ladder's "Find a player (Name#TAG)" input was a fixed `w-52` (208 px). Its placeholder was cut off both in the 390 px phone shot and in the earlier desktop shot ("…(Name#TAC"), which hides the hint about the `#TAG` format.
- **Fix:** on phones the search form spans the full row (`w-full`). From `sm` up the input is `w-72` (288 px). The longest translation (pt, "Encontrar um jogador (Nome#TAG)", about 200 px at 14 px) fits.
- **Measured fit:** the English placeholder is 153 px of text. Space for it is 319 px on phones and 219+ px on desktop, after padding.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`, `demo/ladder-search-phone.png` and `demo/ladder-search-desk.png`.
