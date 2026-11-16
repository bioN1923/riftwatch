# v3.166: patch movers layout and two hook-order fixes

## What changed
- **Patch movers** (tier list): with one side empty (the demo has no clear fallers), there used to be a full "Falling" panel saying only "No big changes." on desktop and phone.
  - The non-empty side now takes the row, and its list goes two-up from `md`.
  - A line under it notes the quiet side (`mv.noneUp` / `mv.noneDown`, in all 7 languages).
- **Hook-order bugs found and fixed.** Both components called React hooks after an early `return`, which throws "Rendered more hooks than during the previous render" when the early return flips.
  - `PatchMovers`: `useState` came after `if (!m || !data.patch) return null`.
  - `WinConditions` (profile Stats tab): `useGoals`, `useState` and `useLocation` came after `if (games < 10) return null`. Switching the queue filter so the game count crosses 10 could hit this.
  - Found with a small scan for hook calls after a top-level `return` in `src/**/*.tsx` (no ESLint in the project). The scan found no other cases.
- **Decision on "early" team-draft pairs:** pairs under 10 games are still not shown. A 3–1 pair would be shown as grey "information" that carries almost no signal, and the page already explains that this data fills over time.

## Checks
- `tsc`, `vitest` (185) and `vite build` pass.
- a11y: `{}`.
- Click test: the Stats tab clicked through ARAM → All → Arena → Ranked Solo → All with 0 page errors.
- Screenshots: `demo/` and `demo/movers.png`.

## Live check (2026-11-16 14:03 local)
- The live index serves `index-Dbobm9QE.js`, and its Champions chunk contains `mv.noneDown`.
- Ranked patch 16.22 is at 25,137 games, up from 25,054 at 13:44: still about 4–7 a minute.
