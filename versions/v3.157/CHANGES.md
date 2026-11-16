# v3.157: a 404 page that isn't a dead end

## What changed
- **Why:** an unknown URL (an old share link, a typo) showed "This page doesn't exist" with one button, "Search for a player". Someone who came for the tier list or the ladder had to go home and find it again.
- **Section links:** under the button there's now an "Or go straight to" row. It's a `nav` with its own `aria-label`, holding seven chips with icons: Champions, Ladder, Multi-search, Compare, Draft, Duo and Items. Labels reuse the existing nav and heading strings.
- **Strings:** one new string, `notFound.elsewhere`, in all 7 languages.
- **a11y check:** `/some/missing/page` is now in the page list of `scripts/a11y-check.cjs`.
- **Also looked at:** the keyboard-shortcuts link (`/?shortcuts`); no change needed.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`, now including the 404 page.
- Screenshots: `demo/` and `demo/not-found.png`.
