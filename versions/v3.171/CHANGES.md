# v3.171: complete "What stays in your browser"

## What changed
- **Phone sweep (390 px):** Compare, Items and Multi-search all read well, with no horizontal scroll.
- **Privacy page:** "What stays in your browser" named only language, theme, region, starred players and recent searches. A search of the code for every `rw:*` key, plus the other `localStorage`/`sessionStorage` writes, found more. The paragraph now lists them all:
  - `rw:recent-champs`: recently viewed champions;
  - `rw:lobbies`: saved multi-search lobbies;
  - `rw:draft-pool`: draft champion pools;
  - the per-player goals key in `Insights.tsx`: profile goals;
  - `rw:seen-version`: "What's new" entries seen;
  - the duo finder's checked players, in `sessionStorage`, so they last for the current tab only.
- `rw:theme-choice` and `rw:theme` are covered by "theme"; `rw:shortcuts` is an in-page event name, not stored data.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`.

## Live check (2026-11-16 15:24 local)
- The live index serves `index-B7gU7-Rh.js`, and its Privacy chunk has the full list.
