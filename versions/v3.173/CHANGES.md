# v3.173: Compare empty state

## What changed
- **Why:** like the Duo finder before v3.146, `/compare` with no players was a form, one grey line ("Enter two Riot IDs…") and blank space.
- **`WhatYouSee`:** four cards describing what a comparison contains, each written from what the page actually renders:
  - **Rank and form:** both ranks, each player's last 20 games, and any games they played together.
  - **Per-game stats:** the gold mark appears only for edges bigger than normal game-to-game swings (`clearEdge`).
  - **Roles and champions:** includes the per-role games and win rate added in v3.141.
  - **Best games.**
- **Strings:** `cmp.see.*` (9 keys) in all 7 languages.
- **a11y check:** the empty `/compare` page is now in the page list.
- **Team-draft data:** in the mid test draft the `enemy` reasons now show up (1), and the jungle one has 2. Still no `ally` reasons, since teammates in a specific role are rarer.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`, including the empty `/compare`.
- Screenshots: `demo/compare-empty.png` and `demo/`.

## Live check (2026-11-16 15:49 local)
- The live index serves `index-zjDPMVyb.js`, and its Compare chunk contains `cmp.see.title`.
