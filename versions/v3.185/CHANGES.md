# v3.185: last mouse-only hint, compare best games on phones

## What changed
- **Mouse-only wording:** a search of the English strings for hover/click/mouse after v3.184 left three hits.
  - `tl.hover`: already fixed in v3.184.
  - `pv.step1`: about the League client, which runs on a PC, so it stays.
  - `it.openHint`: the note in a linked item's tooltip on builds, "Click to see who else builds it". On touch, a tap opens the tooltip and follows the link at once, so "click" never fit.
- **`it.openHint`:** now "Opens the item's page: who else builds it", in all 7 languages. English was edited in `en.json`; other languages were appended to their text files.
- **Compare, Best games:** the value links get `whitespace-nowrap`. On a 390 px phone, "Penta kill" broke over two lines in the narrow column.

## Also checked (phone, 390 px)
- Compare (Caps vs Rekkles): the player cards, last 20, head to head, by role and most played read fine.
- Privacy page: the hide tool, policy text and browser storage list read fine.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/best-games-phone.png` and `demo/`.
