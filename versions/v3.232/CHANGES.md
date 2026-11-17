# v3.232: the performance score says it's out of 10

## Found
- In an expanded match's Post game tab on a phone, each player row's KDA cell showed "5.00 7.5".
  - The first is the KDA ratio.
  - The second is the 0–10 performance score, explained only by a `title` tooltip, which needs a mouse.
- Under a "KDA" column header, "7.5" read like a second KDA.

## What changed
- **`PostGame`:** the score reads `7.5/10`. The "/10" is faint and `aria-hidden`, and screen readers get "Performance score (0–10): 7.5" from an `sr-only` prefix.
- The `title` stays for mouse users, and the cell no longer wraps.

## Checks
- `tsc`, `vitest` (193) and `vite build` pass.
- a11y: `{}`.
- `demo/14-phone-postgame-score.jpg` (iPhone 13): "5.00 7.5/10".

## Live check (10:17 local)
- `3.232` is in the live JS bundle.
