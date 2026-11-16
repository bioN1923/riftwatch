# v3.206: long match lists render less (react-perf-rules, MEDIUM)

## Measured
- **`client-event-listeners`:** `addEventListener` was wrapped in Playwright and live listeners counted on the profile, stats and champion pages.
  - About 15 per page, each once: shortcuts, the install prompt, online/offline and one resize.
  - None per row or per chart. Nothing to dedupe.
- **Interaction timing:** Event Timing API, 4× CPU throttling, 1280 px, profile with 60 games loaded.
  - Escape with nothing open: 24 ms. Expanding a row: 72–192 ms. Opening a champion sheet: 56–104 ms.
  - Closing the sheet (Escape or X): 360–480 ms.
- **CPU profile of the close** (source-mapped build): about 100 ms of JS. The rest was the browser's style, layout and paint.
- **A/B with injected CSS** (close ms, 3 runs):

  | Variant | Close |
  |---|---|
  | As is | 480, 376, 360 |
  | No backdrop blur | 448, 408, 376 |
  | Stable scrollbar gutter | 408, 504, 464 |
  | `content-visibility: auto` on rows | 184, 272, 240 |

- **Side check:** React Router 7 resolves to `dist/development`, but its production build is byte-for-byte the same size, with no extra development-only checks, so it was left alone.

## What changed
- **`MatchRow` card:** `content-visibility: auto` plus `contain-intrinsic-size: auto 124px`, so off-screen rows skip layout and paint. With `auto`, each row keeps its last real height, and scroll positions stay put.
- **`MatchRow`:** wrapped in `memo`. Its props are the cached match object, puuid and platform, so profile-level changes don't re-render 20–100 rows. On its own this didn't move the close time (JS wasn't the cost), but it's correct and cheap.

## After
- Closing the sheet: 216, 176, 208 ms (Escape) and 232 ms (X), down from 360–480. Opening is unchanged (56–72 ms).
- `#m-<id>` deep links still scroll to the right card (phone: row 16 lands at y 452), and the cards render normally.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/hash-scroll-phone.png` and `demo/`.

## Live
- Deployed 23:23 local. The live entry carries `3.206`, and the live stylesheet has `content-visibility:auto`.
