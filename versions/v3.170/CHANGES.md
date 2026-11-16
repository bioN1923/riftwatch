# v3.170: profile rank on one line

## What changed
- **Why:** at desktop width the profile header's ranked blocks are narrow, because the name, buttons and recent-games strip take the left side. "Emerald IV 51 LP" wrapped as "Emerald" / "IV 51 LP" for both solo and flex, which reads oddly in the biggest text on the page.
- **Fix:** tier and division sit in a `whitespace-nowrap` span. LP is its own no-wrap span after it and can still drop to the next line on narrow widths.
- **Widths checked:** 1280, 1024, 768 and 390. `scrollWidth` equals the viewport at every one, so nothing overflows.
- **Team-draft data:** across three test drafts (mid, bot, jungle) the first `enemy` reason has appeared, about 2 hours after the tallies began. Ranked 16.22 is at 25,409 games.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/profile-header-{1280,1024,768,390}.png` and `demo/`.
