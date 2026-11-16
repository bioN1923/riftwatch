# v3.190: player-champion comparison colours only sure gaps

## What changed
- **Why:** a player's record on one champion opens as a sheet from the profile (`?champ=`). Its "Compared with the average <champion>" table coloured every gap over 3%, whatever the sample. On Caps' Graves (3 games), the 33.3% win rate showed red with "↓ 30%", Deaths and CS green, and Assists red. That's the kind of claim the rest of the site no longer makes from a few games.
- **`Cmp` (PlayerChampion.tsx):** now takes `games`, plus `rate` for the win-rate row.
  - **Win rate:** coloured only when it is more than 2 standard errors from the champion's average win rate, with at least `TONE_MIN_GAMES` games.
  - **Per-game stats** (kills, deaths, assists, CS, damage, gold): coloured from `CMP_SURE_GAMES` (10) games.
  - **Otherwise:** the value is plain, and the arrow and percentage stay in muted grey, so the direction is still visible.
- **Note:** under 10 games, a faint line reads "Only N games on this champion so far, so these gaps could still be chance. Colours appear once there are enough games."
  - New key `pc.fewGames`, in all 7 languages, with plural forms: `_one`/`_other`, plus Romanian `_few` and Polish `_few`/`_many`.

## Also checked (phone, 390 px)
- Live game tab: the matchup card, team panels, damage mix, bans and player rows read fine.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/pc-compare-phone.png` and `demo/`.

## Live
- Deployed 18:59 local. The live bundle has v3.190 and the `pc.fewGames` key.
