# v3.154: finished items stand out in the item path

## What changed
- **Why:** an expanded game's "Item build" tab shows every shop visit, with components, potions, wards and finished items all at the same weight. The first question ("when did their core come online?") meant scanning 15 boxes of icons.
- **Gold ring:** items that count as finished under `isLegendary` (the same test the build comparison uses: no "into", at least 2000 gold, not boots, id < 10000) and weren't sold get a `ring-2 ring-gold`.
- **Key:** a line under the path explains the gold ring ("Finished item") and the existing red strike-through ("Sold").
- **Strings:** `ib.keyDone` and `ib.keySold` in all 7 languages.
- **Reviewed, no change needed:** the other tabs (Performance, Timeline, Metrics) were checked with the fixed expand selector and read clearly.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/` and `demo/item-path.png` (demo Kha'Zix game: 4 rings).
