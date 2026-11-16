# v3.207: deferred filtering on the tier list and items

## Measured
Event Timing API, 4× CPU throttling, 1280 px. The longest keyboard event while typing "ahri" and then backspacing it.

| Interaction | Before |
|---|---|
| Tier list filter (about 170 rows) | max 208 ms; backspacing back to the full list cost 168–208 ms per key |
| Items filter | max 128 ms |
| Team draft grid search | max 32 ms |
| Ladder tier tab click | 64 ms |
| Items row expand | 32 ms |
| Tier list role tab | 24 ms |

- The tier list is a `<table>`. `content-visibility` has no effect on table rows, because CSS containment doesn't apply to internal table elements. So the fix is a React one.

## What changed
- **`ChampionsPage` and `ItemsPage`:** the filtered list is computed from `useDeferredValue(query)` instead of `query`. The input re-renders at once on each keystroke, and React refilters and renders the long list as an interruptible background update. This is the `rerender` transitions rule.

## After (two runs each)
| Page | Max | Top five |
|---|---|---|
| Tier list filter | 128 ms (was 208) | 128, 120, 104, 88, 88 |
| Items filter | 104 ms (was 128) | 104, 80, 64, 48, 48 |

- Filtering results are unchanged, and the full lists come back after clearing.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`.
