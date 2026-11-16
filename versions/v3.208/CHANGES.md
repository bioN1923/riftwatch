# v3.208: faster return to the match list, deep links that land

## Measured (4× CPU throttling)
- **Header search:** typing "Faker#KR1" peaks at 64 ms per key. It sends 2 requests in total: one debounced search and one `resolve=1`, with none cancelled. Fine.
- **Champion page role switch:** settles in 170–220 ms. Fine.
- **Profile with 60 games, Stats → Overview:** 1124–1396 ms until the cards are back (v3.207 build, 6 runs). The page re-mounts every card at once.
- **Bug found on the way:** a `#m-<id>` link to a card far down the list stopped about 1,600–2,000 px short.
  - It dates from v3.206: off-screen cards are laid out from `contain-intrinsic-size: 124px`, but desktop cards are 165 px (127 px on phones and tablets).
  - The smooth scroll aimed at a position computed from the estimates.

## What changed
- **`ProfileView`** (react-perf-rules `js-request-idle-callback`):
  - The overview renders the first 20 games, then lifts the cap in `requestIdleCallback`, with a 600 ms timeout and a `setTimeout` fallback.
  - The cap resets each time you return to the overview (derived-state reset during render).
  - Games added with "Show more" after that render at once.
- **`MatchRow`:** the size estimates match the measured heights, `auto 127px` and `auto 165px` from `lg`.
- **Deep links:** they scroll instantly, then once more after 300 ms when the cards in between have rendered (was a single smooth scroll). The hash effect also re-runs when the cap lifts, so a game past the first 20 is found.

## After
- **Stats → Overview:** 521–761 ms (current build, 12 returns over 2 runs) against 1124–1396 ms. All 60 cards are present after idle.
- **Deep link to game 45** (desktop, via Stats → Overview): the card sits at y 403 in a 900 px viewport. On a phone, game 19 sits at y 394 in 844.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/hash-row45.png` and `demo/`.
