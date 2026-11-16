# v3.194: "Best with" cards show full names on phones

## What changed
- **Why:** the champion page's "Best with" cards (win rate with each jungler or support on the same team) are two per row on a 390 px phone. Each card held the portrait, the name with the game count under it, and the win rate on the right. The name was cut to "Lee S…" and "Nidal…", and "61 games" wrapped to two lines.
- **`Synergy` (Champion.tsx):** the win rate moves under the name, as "54.1% · 61 games". The colour is unchanged: `sureTone`, so only a gap bigger than chance is coloured. The name now gets the whole text width, and the padding is slightly tighter.
- **Desktop:** checked in three columns; it reads the same.

## Also checked (phone, 390 px)
- `AutoLoad` is used only on the profile match list, which v3.193 fixed. The Stats tab uses a "10 more games" button, and the ladder uses pages.
- Goals panel: the picker, target input, met-in-N strip and adding a second goal all work. Tested in a throwaway headless browser.
- Champion build panel: Build at a glance, rune pages and starting items read fine.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/bestwith-phone.png`, `demo/bestwith-desktop.png` and `demo/`.

## Live
- Deployed 20:59 local. The live bundle has v3.194 and the new changelog line.
