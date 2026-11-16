# v3.159: "In your pool" on Draft's best answers

## What changed
- **Why:** the Draft page shows "Best answers to {enemy}" and "From your pool" side by side. To tell whether a top counter was something you already play, you had to compare the two lists by eye. Blind picks already tagged pool champions; lane answers didn't.
- **Tag:** `AnswerList` takes an optional `inPool` set. The "Best answers" list passes your pool, and matching rows get the existing gold "In your pool" tag (`draft.inPool`, already translated).
- **Demo:** Zed mid with pool Ahri/Syndra/Orianna. Syndra, the #1 answer, is tagged.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/` and `demo/draft-inpool.png`.

## Live check (2026-11-16 12:43 local)
- The live index serves `index-Qrq07m3m.js`. Its Draft chunk uses `draft.inPool` twice (blind picks, plus the new best-answers tag), up from one before.
- The device copy was checked for the new code before deploying.
