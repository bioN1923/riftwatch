# v3.163: Team draft on the home page

## What changed
- **Why:** the new Team draft page (v3.161) was reachable from the Draft page, the live game and the phone Tools menu, but not from the home page's Tools section, where most visitors look for tools.
- **Featured card:** Team draft leads the list as a two-column card with the gold tick, a gold-tinted border and a "New" badge. It reuses the `cl.new` string and the new `home.tool.teamDraft` description, which is in all 7 languages.
- **Grid:** the section is now `sm:grid-cols-2 lg:grid-cols-4`. The wide card plus six tools fill 2 rows of 4, or 4 rows of 2, with no orphan.
- **Team-draft data check:** the live test draft still has lane (38) and duo (53) reasons only, about 15 minutes after the ally/enemy tallies began. That's expected.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/` and `demo/home-tools.png`.

## Live check (2026-11-16 13:31 local)
- The live index serves `index-iOyv-AX4.js`, which contains the `home.tool.teamDraft` card.
