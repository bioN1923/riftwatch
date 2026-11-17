# v3.227: support upgrades on the Items page

## Found
- The Items list showed **Bulwark of the Mountain** and **Shard of True Ice** at "400 gold", as if they were cheap items to buy.
- They're support quest upgrades. Data Dragon 16.22.1 has `gold.purchasable: false` for both, with `specialRecipe` 3859 and 3851 (the items they come from), and `gold.total` 400.

## What changed
- **`shared/staticSlim.ts`:** items with `purchasable === false` and a `specialRecipe` get `upgradeOf` (that item's id). This is Riot's own field, so nothing is invented. It's also added to `ItemData`.
- **`Items.tsx`:** for those items, the price column reads "Upgrade" (`it.upgrade`), and hovering shows "Not bought: upgraded from {name}" (`it.upgradeFrom`), with the source item's name from the static data.
  - Live check (local, real Data Dragon): "upgraded from Targon's Buckler" and "upgraded from Frostfang".
- **i18n:** two keys in 7 languages. A broken French line (`\a` from printf) was replaced by a later correct line.
- **Test:** `slimStatic` sets `upgradeOf` only for non-purchasable items with a recipe.

## Checks
- `tsc` and `vite build` pass.
- `vitest`: 192 (+1).
- a11y: `{}`.
- Screenshots: `demo/`.

## Live check (09:26 local)
- `3.227` is in the live JS bundle.
- The live `/api/static/en_US` has 26 items with `upgradeOf`.
