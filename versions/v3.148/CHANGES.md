# v3.148: multi-search champion rows

## What changed
- **Why:** with five players the multi-search cards are about 190 px wide. Each top-champion row put the name, games, win rate and KDA on one line, so most names were cut: "Kha'…", "Thre…", "Nauti…", "Amb…", "Miss …", "Smol…" in the demo lobby.
- **Two-line rows:** the name now has a line to itself (with a `title` for very long names). Under it, "N games · win rate · KDA" appears in small text. The icon grows from 22 to 28 px to fit both lines.
- **Colours:** the same rules as before. Win rate uses `wlTone` (plain under 5 games) and KDA uses `kdaTone`.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/` and `demo/multisearch-cards.png`, a 5-player lobby where every name shows in full.
