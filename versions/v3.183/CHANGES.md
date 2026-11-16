# v3.183: clear recent champions from the home page

## What changed
- **Why:** "Champions you looked at" is kept in the browser (`rw:recent-champs`). The tier list could already clear it (v3.x, `tl.recentClear`), but the home page showed the same row with no way to empty it.
- **Home:** a small "Clear" link next to the heading. It calls `clearRecentChamps`, and the row disappears.
- **Both Clear links:** now have `aria-describedby="recent-champs-h"`, so a screen reader hears "Clear, Champions you looked at" instead of a bare "Clear".

## Also checked (phone, 390 px)
- ARAM tab on Ahri: the stat strip, build cards and rune pages scroll strip read fine.
- Duo finder:
  - Empty state is fine.
  - Results for Caps#EUW: the fit card and "Check a player" are fine.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Clear test in a fresh headless browser: the list was emptied and the section removed.
- Screenshots:
  - `demo/home-recent.png`, `demo/home-cleared.png`
  - `demo/`

## Live
- Deployed 17:43 local. The live bundle has v3.183 and the new changelog line.
