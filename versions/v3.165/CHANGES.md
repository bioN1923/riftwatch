# v3.165: draft helpers on the API usage page; crawler check

## Crawler check (first, as planned)
- Ranked patch 16.22 games read: 25,021 at 13:40 local, then 25,054 at 13:44:33. That's about 7 a minute, so the crawler is reading games.
- The team-draft `al`/`en` tallies started at 13:08, so they have roughly 250 games behind them. A specific champion-role-plus-ally pairing is in only a small share of games, so reaching the 10-game minimum takes time (likely days for most pairs). No bug; the page's note already says this data fills over time.

## What changed
- **Riot policies section** of `/api-usage`: a new bullet for the draft helpers. They work only from champion picks the visitor enters, or those already visible in a live game, plus win rates aggregated from games already read. They show no player names and never infer premades or other lobby information.
  - **Exception stated honestly:** the lane draft's optional "Fill from a Riot ID" pool import reads that player's recent games, like opening their profile. It was checked in `Draft.tsx` (`api.profile` + `api.matches`) before writing the sentence.
- **Intro:** the opening paragraph now lists the draft helpers among the site's features.

## Checks
- `tsc`, `vitest` (185) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`.

## Live check (2026-11-16 13:50 local)
- The live index serves `index-DlDUV527.js`, and its ApiUsage chunk contains the draft-helpers bullet.
