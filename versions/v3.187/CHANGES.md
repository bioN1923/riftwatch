# v3.187: profile header without a stray separator

## What changed
- **Why:** on a 390 px phone, a profile whose challenges line doesn't fit next to the region wraps it to a second line, and that line started with "· 🏅 Challenges: Platinum · top 39.0%". The leading dot was a separator for the region, which now sat on the line above.
- **`Challenges` (ProfileHeader.tsx):** the leading "·" is removed. The gold medal icon already separates the challenges from the region on one line, and it starts the line cleanly when the text wraps.

## Also checked
- Light theme, phone:
  - Team draft cards, matchup header and "How the lane goes", and the rune pages: fine.
  - Match details: the post-game scoreboard and timeline map: fine.
- Multi-search on a phone with 5 players: the summary, cards, last 10 and tags are fine.
  - The season win rates use the two-standard-error rule. Rekkles' 53% over 395 games is plain; Mikyx's 55% over 363 games is just past the line, so it's green.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/header-phone.png`, `demo/header-desktop.png` and `demo/`.
