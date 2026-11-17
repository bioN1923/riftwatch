# v3.221: game-length chart grows from the 50% line

## Found
- On Ahri's Arena page (`v3.220/demo/10-arena.jpg`), "Top 4 rate by game length" showed 45% and 40% as short bars rising from the bottom of a 35–65% scale.
- The 50% line floated above them in empty space. The bars' length measured distance from 35%, a number with no meaning, so "below even" took reading the labels.

## What changed
- **`LengthChart`** (ranked, ARAM and Arena champion pages):
  - Each bar now starts at the 50% line and grows up for values above it or hangs down for values below it (minimum 2% so a dead-even length still shows).
  - The percentage sits above an upward bar or below a downward one.
  - Colour is unchanged: green or red only when clearly off 50% (`sureTone`), grey otherwise.
- **`index.css`:** `.grow-y-down` (the same grow animation from the top edge). The reduced-motion rule covers it.

## Checks
- `tsc`, `vitest` (190) and `vite build` pass.
- a11y: `{}`.
- Playwright element shot of Ahri ranked (45%, 44%, 50%, 51%): bars hang from or rise off the line as expected.
- Screenshots: `demo/`.

## Live check (08:28 local)
- `3.221` is in the live JS bundle.
