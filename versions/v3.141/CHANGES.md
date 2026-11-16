# v3.141: Compare role panel

## What changed
- **Labels:** the Compare page's "By role" panel showed only role icons, so you had to know them. Each role now has its name next to the icon; the icon is `aria-hidden` so screen readers don't hear the name twice.
- **Order and empty rows:** roles neither player played are left out (the old panel showed 0% / 0% rows). The rest are sorted by the two players' combined share.
- **Per-role record:** each player's bar is followed by their games and win rate in that role, from the loaded (non-remake) games. This comes from `roleRecord()` in `src/lib/compare.ts`. The win rate is coloured by `sureTone`, so a 1-game 100% stays plain. A dash means no games in that role.
- **Note:** a footnote explains what the bars and the right-hand column show. String `cmp.roleNote` is in all 7 languages.
- **Test:** a test of `roleRecord` checks that remakes and games without a position are skipped.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}` on 19 pages × 2 themes.
- Screenshots: `demo/`, plus a crop of the panel in `demo/compare-roles.png`. Demo: Caps Jungle 94% (17 games, 47%), Rekkles Support 79% (15 games, 53%).

## Live check (2026-11-16 07:24 local)
- The live index serves `index-BiDPgqc4.js`, and its Compare chunk contains `cmp.roleNote`, so the new role panel is deployed.
