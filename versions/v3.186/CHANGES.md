# v3.186: readable damage tags in the light theme

## What changed
- **Why:** the champion header's damage tag used fixed Tailwind colours tuned for the dark theme: `text-sky-300` (magic) and `text-orange-300` (physical). In the light theme they're pale on near-white, about 1.8:1. axe doesn't flag them because the tag sits over the splash image, where it can't measure contrast.
- **`index.css`:** new theme variables `--dmg-ad` and `--dmg-ap`, set in all three theme blocks (dark, system light, chosen light).
  - Dark: the same orange-300 and sky-300 as before.
  - Light: `#b45309` and `#0369a1`, both about 5:1 or better on white.
- **`Champion.tsx`:** the tag uses `text-(--dmg-*)` with a 45% border mix.
- **Other fixed colours:** a grep for fixed light-shade palette colours (`text-<colour>-100…400`) in `src` finds no others.

## Also checked (phone, 390 px, light theme)
- Home, profile, champion page and What's new: fine.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots:
  - `demo/tag-ahri-light.png`, `demo/tag-zed-light.png`
  - `demo/tag-ahri-dark.png`, `demo/tag-zed-dark.png`
  - `demo/`

## Live
- Deployed 18:13 local. The live bundle has v3.186, and the stylesheet has `--dmg-ap`.
