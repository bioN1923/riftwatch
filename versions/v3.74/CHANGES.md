# v3.74 — Lobby summary polish, Duo finder on the home page

## Changes
- `MultiSearch.tsx` `LobbySummary`: open roles ("Nobody mains Mid.") are listed only when 4 or more players are loaded. With 2 players, saying four roles are open was noise (v3.73 live check). Role clashes still show at any size.
- `Home.tsx` Tools:
  - The Duo finder (added in v3.57 to the nav, but missing here) now has a card: "Players from your recent games who would fit next to you, around your rank."
  - The grid is 5 columns on large screens.
- String `home.tool.duo` in 7 languages.

## Checks
tsc clean · 118 tests pass · a11y `{}` · demo:
- `lobby-2.png`: "Top Hans · Jungle Caps", no open-roles line.
- `lobby-4.png`: "… Nobody mains Mid."
- `01-home.jpg`: 5 tool cards.

## Live check (2026-11-14 15:35)
- Deploy finished cleanly at 15:34.
- Multi-search (bioN1923 + lickit#28cm, loaded by URL): "Average rank Silver II · Jungle bioN1923 · no clear main: lickit", with no open-roles line.
- Home Tools: Draft, Compare, Multi-search, Duo, Ladder. Screenshot: `live/home-tools.jpg`.
