# v3.193: profile summary reachable on phones

## What changed
- **Why:** below the `lg` breakpoint, the profile's summary column sits under the match list. It holds the scouting report, Today, Rank history, PatchWatch, Try next, Goals, Champion pool, Played with and Mastery.
  - The list ends in `AutoLoad`, which loads the next page whenever it nears the viewport, up to 4 pages.
  - So on a phone, scrolling toward the summary loaded 20 more games, then 20 more, and so on. The summary moved 4 times further away, and each load cost Riot API calls.
  - In a test, scrolling to the bottom took the list from 20 to 100 games before the summary could be reached.
- **New `useMedia` hook** (`src/lib/useMedia.ts`).
- **Profile:**
  - **Below 1024 px:** `AutoLoad` gets `maxAuto={0}`, so it's a plain "Show more games" button. On wide screens it keeps auto-loading, because the summary is a sticky sidebar there.
  - **On phones:** a "Jump to the summary: rank history, goals, champion pool" button under the queue filters scrolls to the summary column. The column now has `tabIndex=-1` and `scroll-mt-20`, and focus moves to it.
  - New key `profile.jumpSummary`, in all 7 languages.

## Checks
- **Phone:** 20 games before and after six big scrolls (was 20 → 100). The jump button lands on the scouting report, with focus on `aside "Player summary"`.
- **Desktop:** auto-load still works (20 → 60 in the same scroll).
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/jump-button.png`, `demo/after-jump.png` and `demo/`.

## Live
- Deployed 20:49 local. The live bundle has v3.193 and the `profile.jumpSummary` key.
