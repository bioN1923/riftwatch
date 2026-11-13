# v3.28 — 13 Nov 2026

## Live check (before)
- v3.27 is live (user deployed 18:33). "Try next" on `Annie IRL#Annie` suggests Ahri, Ekko and Orianna ("Like Annie · Mage").

## Added
- **Match details → lane matchup.** Under the tabs of an opened Summoner's Rift game (not ARAM, Arena or remakes), a link reads e.g. "Syndra vs Yasuo in Mid: how this matchup usually goes". It opens the matchup page (win rate, lane curve, build and runes) for that role.
- After a loss, players want to know whether it was the matchup or the game; now that's one click from match history.
- The lane opponent comes from the game's own positions (no guessing, unlike the live-game card).
- Translated in all 7 languages (`md.matchup`).

## Checks
- 72 tests pass; typecheck, build and a11y check clean.
- Playwright (desktop and iPhone 13): opening a game on `Humanoid#EUW` shows "Syndra vs Yasuo in Mid…", which links to `/champions/syndra/vs/yasuo?role=MIDDLE` (`demo/mdlink-*.png`).

## Live check (after deploy)
- The user ran `deploy.bat`: finished 13 Nov 2026 18:42 (EXIT CODE 0).
- `Annie IRL#Annie`:
  - the first game is a special mode, so it correctly gets no link;
  - a Ranked Solo/Duo game shows "Annie vs Ornn in Top: how this matchup usually goes" → `/champions/annie/vs/ornn?role=TOP` (`live/match-matchup-link.jpg`).
