# v3.160: Arena champion page labels and honest place colours

## What changed
- **Why (Ahri, Arena tab):**
  - "Best partners" showed a bare decimal (2.85, 3.40 …) with nothing saying it was average place.
  - Every partner under 4.5 was green on 11–16 games.
  - "Across patches" and "Win rate by game length" said "Win rate" though Arena's rate is top 4.
- **`placeTone(avg, games)`** (new, `format.ts`): green or red only when the average place is more than 2 standard errors from 4.5. One game's place has a spread of about 2.29 (uniform over 1–8). Plain under 5 games. Used for:
  - the champion Arena strip (average place);
  - Best partners;
  - the profile Stats-tab Arena panel, replacing its local `≤4.5` rule.
- **Partners label:** the "Best partners" heading now carries "avg place, lower is better" on the right.
- **Top 4 labels:** `PatchHistory` takes an optional `rateLabel`, and `LengthChart` an optional `title`. On the Arena tab they read "Top 4" and "Top 4 rate by game length".
- **Strings:** `arena.avgPlaceLower` and `len.titleArena` in all 7 languages.
- **Demo:** Ahri average place 4.98 over 598 games stays red (clearly worse). Of the partners, only Xayah (2.85, 13 games) is green; the rest are plain.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/` and `demo/arena-page.png`.

## Live check (2026-11-16 12:52 local)
- The live index serves `index-BwcO9vO7.js`, and its Champion chunks contain `arena.avgPlaceLower` and `len.titleArena`.
- The device copy was checked for `placeTone` before deploying.
