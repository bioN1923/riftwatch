# v3.234: live game lane links on phones

## Found (phone pass, iPhone 13)
- **Live game lane panel:** the two links ("Open matchup", "How Kha'Zix fits this draft") wrap under the summary on a phone.
  - Their column was right-aligned (`items-end`), so the short "Open matchup" floated mid-panel above the longer link.
  - It read as misplaced.
- **Team lists and the keyboard shortcuts dialog** (opened with "?" on the tier list, where no input has focus): fine.

## What changed
- **`LiveGame`** lane panel link column: `items-start` below `sm`, `items-end` from `sm` up, as before.

## Checks
- `tsc`, `vitest` (193) and `vite build` pass.
- a11y: `{}`.
- `demo/14-phone-live-lane.jpg`: both links line up on the left.
