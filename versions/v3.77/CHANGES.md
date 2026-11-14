# v3.77 — Match scoreboard on phones

Phone check of the match detail tabs: "Post game" was the only one with content past the edge. Its table had a 580 px minimum width inside a sideways-scrolling box, so on a phone the CS and Items columns sat off-screen with no hint, and names were cut to 5 letters.

## Change
- `PostGame.tsx`:
  - The table no longer has a minimum width.
  - Below a 580 px container, the CS and Items columns are hidden. Each player's cell gets a second line with their items (16 px) and "41 CS · 2.4/m".
  - From 580 px up the layout is unchanged; Gold and Wards still appear at 680 and 740 px.

## Checks
tsc clean · 119 tests pass · a11y `{}` · demo `phone-scoreboard.png` (iPhone 13: no element past the edge; every player shows items and CS). The other four tabs were already within the screen.
