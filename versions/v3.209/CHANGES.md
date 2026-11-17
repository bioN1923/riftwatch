# v3.209: contained inner scrolling, balanced headings

## Checked first
- **Other `scrollIntoView`/`scrollTo` callers**, after v3.208's deep-link fix: timeline turning points, the ladder's highlighted rank, the Items open row and Privacy anchors.
  - None scrolls past `content-visibility` cards. Only `MatchRow` uses it.
  - The timeline scrolls inside a card that's already on screen.
  - Personal-records and compare best-games links land on the profile's `#m-` path, fixed in v3.208.
- **Stats tab second open:** CPU profile at 4× throttling with a source-mapped build.
  - Visible after about 410 ms.
  - JS self time is about 80 ms in total: React DOM about 50 ms, the router about 10 ms, and the header's `Challenges` 4 ms.
  - The rest of the window is idle plus layout and paint. Nothing worth changing.

## What changed (Web Interface Guidelines leftovers)
- **`overscroll-behavior: contain`** (`overscroll-contain`) on the four inner scroll areas: the champion record sheet body, the header search suggestions, the timeline event list and the lane-draft champion grid. Reaching their end no longer scrolls the page behind, and on Android a pull-down at the top of the sheet doesn't trigger pull-to-refresh.
- **`text-wrap: balance`** on h1–h3 (`index.css`). Headings that explicitly use `nowrap` keep it.

## Checks
- **Browser:** the sheet scroller reports `overscroll-behavior-y: contain`, and h2 reports `text-wrap: … balance`.
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/sheet-phone.png` and `demo/`.
