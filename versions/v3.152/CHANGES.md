# v3.152: Items page bars and cost

## What changed
- **Why:** the Items page listed items with only "In X% of builds · N games" as text. Seeing how quickly popularity drops down the list meant reading every number, and the item's price wasn't shown at all.
- **Share bar:** each row has a thin gold bar under the share line, scaled to the most-built item in the current view (it changes with the kind filter, search and patch). It is `aria-hidden`; the text still carries the number.
- **Cost:** the item's total gold from Data Dragon static data (`a.item(id).gold`), shown from `md` up as "3,000 gold". New string `it.cost` in all 7 languages.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/` and `demo/items-bars.png`.

## Note
- The planned look at the expanded match view was set aside: the scripted click opened the wrong row, and the Items page had a clear gap. It's still on the list.

## Live check (2026-11-16 11:26 local)
- The live index serves `index-CcIzyv63.js`, and its Items chunk contains `it.cost`.
