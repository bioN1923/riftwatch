# v3.223: faint win rate under 5 games on profile stats

## Found
- On the profile Stats tab (`v3.222/demo/06-profile-stats.jpg`), "Champions played" showed Kha'Zix (3 games) and Aurora (1 game) at **100%** and Fiora (1 game) at **0%**, in the same bold as Sylas's 25% over 4.
- "By role" read "1 game · **100%**" the same way.
- Lane opponents on the same tab already drop the % under 5 games (v3.197), and Compare now shows a record (v3.220).

## What changed
- **`StatsTab`:** a `few(games)` helper (`games < TONE_MIN_GAMES`, i.e. 5).
  - In the champion table's win-rate column and the role lines, a rate from fewer than 5 games is `text-faint`, normal weight and uncoloured.
  - The % stays because both places already show the record next to it (e.g. "3W 0L"); it's just no longer emphasised.
- From 5 games up, nothing changes: bold, coloured only when clearly off 50%.

## Checks
- `tsc`, `vitest` (191) and `vite build` pass.
- a11y: `{}`, so the faint text passes contrast.
- Screenshots: `demo/`.

## Live check (08:46 local)
- `3.223` is in the live JS bundle.
- ARAM spot-check: 515 games, up from 339 at 07:39 local.
