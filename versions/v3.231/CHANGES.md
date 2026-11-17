# v3.231: phone match rows keep the score beside spells and runes

## Found
- On an iPhone 13, a match row with a wide score plus badges ("10 / 6 / 10", "3.33 KDA · ACE · Double kill") wrapped as a whole block under the spells and runes.
- That row was taller and laid out differently from its neighbours.
- **Cause:** the score block's width was set by its widest line (the badge line), so the flex row wrapped it.

## What changed
- **`MatchRow`, below `sm`:**
  - The score block is `min-w-0 flex-1`, so it takes the space left beside spells and runes, and the badge line wraps inside it (`flex-wrap`).
  - The score is 24 px (28 px from `sm`) and doesn't wrap.
  - The gap between spells and score is 12 px (20 px from `sm`).
- From `sm` up, nothing changes (`sm:flex-none`, the same sizes and gaps). Checked with a desktop screenshot.

## Checks
- `tsc`, `vitest` (193) and `vite build` pass.
- a11y: `{}`.
- `demo/14-phone-match-rows.jpg` (iPhone 13): every row has the score beside spells, and Double kill wraps under the KDA.
- Also checked: the "?" shortcut on the home page types into the search box because it has focus, which is expected.

## Live check (10:07 local)
- `3.231` is in the live JS bundle.
