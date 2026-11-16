# v3.149: "What's new" grouped by day

## What changed
- **Why:** `/changelog` listed all 140+ versions in one column, each with its own date line. In the demo the page was about 16,000 px tall, and 31 entries in a row repeated "November 16, 2026".
- **By day:** entries sit under one `h2` per day (weekday and date, plus "N updates" for that whole day). Each version is an `h3`.
- **Paging:** the page opens with `PER_PAGE` (12) versions, or more if you have more unseen ones, so the "New" badges stay visible. "Show older updates (N more)" adds 24 at a time.
- **Height:** 1,650 px on open, down from about 16,000 px.
- **Strings:** `cl.updates_*` and `cl.older_*` plurals in all 7 languages, including the ro/pl forms. The entries themselves stay English, as before.

## Checks
- `tsc`, `vitest` (183) and `vite build` pass.
- a11y: `{}`.
- Click test: 12 entries become 36 after one click.
- Screenshots: `demo/` and `demo/changelog-days.png`.

## Live check (2026-11-16 10:54 local)
- The live index serves `index-DISKBjEy.js`, and its Changelog chunk contains `cl.older` (the paging).
