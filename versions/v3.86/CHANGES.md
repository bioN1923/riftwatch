# v3.86 — Ladder find across tiers

Before, "Find a player" on the ladder only searched the tier on screen. Looking up a Master player from the default Challenger tab said they weren't on the ladder.

## Change
- `Leaderboard.tsx` `onFind`: it tries the current tier first, then the other two apex tiers.
  - On a hit in another tier, it switches to that tier and page, highlights the row, and says "{name} is in Master: showing that ladder."
  - If the player is in none of them: "{name} isn't in Challenger, Grandmaster or Master here (or their name isn't known here yet)."
  - The notes clear when a tier tab is clicked.
  - At most 3 server lookups per search, and only when needed.
- Strings `lb.notFoundAny`, `lb.foundIn` in 7 languages.

## Arena re-check
At 15:12 UTC, Arena matches were still 0, waiting for a visitor's EUW Arena game.

## Checks
tsc clean · 123 tests pass · a11y `{}` · demo `ladder-find-other-tier.png`: searching QuietTide#NA1 from Challenger opened Master page 2 with row 54 highlighted. A made-up ID gives the all-tiers message.

## Live check (2026-11-14 17:22)
- Deploy finished cleanly at 17:20. On EUNE I took the 5th Grandmaster player and searched for them from the Challenger tab. The page switched to Grandmaster, highlighted row 5, and said "… is in Grandmaster: showing that ladder." Screenshot: `live/ladder-find.jpg`.
