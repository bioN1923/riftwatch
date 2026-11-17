# v3.228: item tooltips name the source of support upgrades

## Found
- v3.227 fixed the Items list's price column, but the shared item tooltip (`ItemTip`, used in builds, match details, the Items list and champion pages) still showed "● 400" in gold for Bulwark of the Mountain, Shard of True Ice and the other 24 non-purchasable upgrades.

## What changed
- **`ItemTip`:** when the item has `upgradeOf`, the cost line shows "Not bought: upgraded from {name}" (`it.upgradeFrom`, muted) instead of the gold price. The source item's name comes from the static data.
- The name/cost row wraps (`flex-wrap`), so the longer text and an optional note badge fit in the 17rem tooltip.
- Also checked: "Stores 0 Stealth Wards" in that tooltip is Riot's own text (Data Dragon 16.22.1 item 3860 description), not a parsing bug.

## Checks
- `tsc`, `vitest` (192) and `vite build` pass.
- a11y: `{}`.
- Screenshot `demo/14-item-tip-upgrade.png`: Bulwark's tooltip reads "Not bought: upgraded from Targon's Buckler".
