# v3.18 — 13 Nov 2026

## Considered first
- Compare page "played together / against": already exists (`Together`).
- Bundle size: the 141 KB `i18n` chunk is mostly React (the build named the shared vendor chunk after i18n). Main bundle 250 KB (77 KB gzipped). No quick win.
- Duo-partner picks in the draft helper: synergy data keeps only each champion's top 6 partners, too thin at today's sample.

## Added
- **Draft helper: "Safe blind picks"**, shown while no enemy laner is chosen. When you pick first, you want a champion that can't be hard-countered. Lists up to 8 champions for the role, ranked by their **floor**: the average shrunk win rate of their three worst lane matchups that have enough games. Each row shows:
  - the overall win rate;
  - the worst matchup with its win rate and game count;
  - an "In your pool" tag when it's one of your champions;
  - a link to the champion page for that role.
- To qualify, a champion needs the tier list's minimum games, at least 5 matchups with enough games, and an overall shrunk win rate of at least 49% ("safe but losing" isn't a good first pick; the first version listed 47% Akali and Yone).
- Server: `blindPicks(role)` in `champStats.ts`, `GET /api/blind?role=` (cached 5 minutes). No Riot API calls.
- Translated in all 7 languages.

## Checks
- 65 tests pass (new: ranking by floor, worst matchup is the lowest of the three averaged, 5-matchup minimum). Typecheck, build and a11y check clean.
- Demo: `demo/blind-*.png`.
