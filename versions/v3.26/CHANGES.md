# v3.26 — 13 Nov 2026

## Context
- The link to the PC came back. v3.25 (with v3.24) was copied into the project folder; the user double-clicks `deploy.bat` (clicking through File Explorer failed while they were using the PC).

## Added
- **Tier list ↔ your champion pool.** The draft helper already saves "Your champion pool" per role in the browser. The tier list now reads it:
  - each saved champion gets a gold star in its own role's row (screen readers hear "In your pool");
  - a **My pool** toggle (`aria-pressed`) next to the filter shows only those champions, across roles.
- The toggle only appears on ranked, and only when a pool is saved; nothing changes for anyone else.
- The pool storage helpers moved to `src/lib/pool.ts`, shared by the draft helper and the tier list.
- Translated in all 7 languages (`tl.myPool`, plus a tooltip).

## Checks
- 70 tests pass; typecheck, build and a11y check clean.
- Playwright with a saved pool (Mid: Ahri, Syndra, Orianna; Bot: Jinx): 4 stars; "My pool" → exactly those 4; no button without a pool. The first label ("Your champion pool") wrapped onto two lines on phones; it's "My pool" now (`demo/pool-*.png`).
