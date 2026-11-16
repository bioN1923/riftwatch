# v3.146: Duo finder "How it works"

## What changed
- **Why:** with no player chosen, the Duo finder showed a lone form above blank space. On a new browser there are no saved-player chips either, so first-time visitors got no sense of what would happen.
- **New section:** `HowItWorks` in `Duo.tsx` is shown until a player is picked. It has three numbered steps, checked against the code:
  1. **Your recent games** (`candidatesFrom`): players from your latest ranked games, either team, hidden profiles skipped.
  2. **Around your rank:** players whose main role differs from yours and who are within `MAX_RANK_GAP` of your rank.
  3. **Scored for fit:** the same factors as the page intro.
- **Footnote:** only public match data is used, and the finder contacts no one.
- **Strings:** `duo.how.*` (8 keys) in all 7 languages, appended to the txt files.

## Checks
- `tsc`, `vitest` (183) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/` and `demo/duo-empty.png`.

## Live check (2026-11-16 10:26 local)
- The live index serves `index-7EFod07E.js`, and its Duo chunk contains `duo.how.title`.
- Deploy waited about 15 minutes on the command-check error before it went out.
