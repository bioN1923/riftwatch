# v3.226: faint win rate under 5 games in the profile sidebar

## Found
- The profile Overview sidebar's "Champion pool" (`v3.225/demo/05-profile.jpg`) showed Kha'Zix "**100%** (3)", Aurora "**100%** (1)" and Orianna "**100%** (1)" in bold.
- The Stats tab stopped emphasising these in v3.223, and Compare in v3.220.
- "Often queues with" duo rows used the same bold style.

## What changed
- **`Sidebar.tsx`:** in Champion pool and Often queues with, under `TONE_MIN_GAMES` (5) the win rate is `text-faint` and normal weight. The game count stays beside it.
- From 5 games up, nothing changes.
- Both tabs and Compare now follow the same rule.

## Checks
- `tsc`, `vitest` (191) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`.
- Note: the full-page profile screenshots show older match rows as empty boxes. That's `content-visibility: auto` (v3.206) skipping rendering of off-screen rows in a full-page capture, not a page bug.

## Live check (09:15 local)
- `3.226` is in the live JS bundle.
