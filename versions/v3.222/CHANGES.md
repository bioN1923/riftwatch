# v3.222: numbered ladder pages

## Found
- **Ladder** (`v3.221/demo/09-ladder.jpg`): 300 Challenger players over 6 pages, and Master has far more, but the pager only had Previous and Next. Reaching page 6 took five clicks, each waiting on a load.
- **Draft helper**, "Ban for your pool": each pool-champion chip's hover text was only the champion's name. The game count behind its percentage was nowhere.

## What changed
- **`Leaderboard.tsx`:** numbered page buttons between Previous and Next (`sm` and up; phones keep Previous/Next).
  - **`pageList(page, pages)`:** every page up to 7; beyond that, the first, the last and up to two either side of the current page, with "…" gaps. A gap that would hide a single page shows that page instead.
  - The current page has `aria-current="page"` and a gold border. Each button is labelled "Page N" (`lb.pageN`, 7 languages).
- **`Draft.tsx`:** ban chip `title` is now "Name · 47.9% · 110 games".
- **Test:** `pageList` cases (all six pages; gaps at 1/20, 10/20 and 4/20; a single page).

## Checks
- `tsc` and `vite build` pass.
- `vitest`: 191 (+1).
- a11y: `{}`.
- Screenshots: `demo/`. The ladder shows buttons 1–6 with 1 current.

## Live check (08:38 local)
- `3.222` is in the live JS bundle.
