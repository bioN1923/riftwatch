# v3.174: Multi-search empty state

## What changed
- **Why:** same gap as Compare (v3.173) and Duo (v3.146). With no lobby pasted, and no saved lobbies on a new browser, `/multisearch` was a text box and blank space.
- **`WhatYouSee`:** three cards, each checked against what the page renders:
  - **Lobby summary:** average solo rank, who mains which role, and the clash or uncovered-role note (`LobbySummary`).
  - **Each player:** rank and LP, the last 10 ranked games, and the top 3 champions with games, win rate and KDA.
  - **Tags:** role main, one-trick, win streak, high KDA and so on. "Premade with" is described as coming from public match history, which is how `lobbyDuos` works; it is never taken from the lobby itself.
- **Layout:** if you have saved lobbies, they still show first; the cards appear only while nothing is being scouted.
- **Strings:** `ms.see.*` (6 keys) in all 7 languages. The heading reuses `cmp.see.title`.
- **a11y check:** the empty `/multisearch` page is now in the page list.
- **Also checked:** the champion build panel on a 390 px phone reads well; no change.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/multisearch-empty.png` and `demo/`.
