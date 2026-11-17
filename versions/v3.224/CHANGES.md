# v3.224: activity calendar, even days and an honest legend

## Found
In the profile Stats tab's Activity calendar (`v3.223/demo/06-profile-stats.jpg`):
- A day went green when its win rate was `>= 0.5`, so a 2–2 day showed as "Won most games that day", which it wasn't.
- The legend said "Darker = more games". Cells mix the win or loss colour into the empty-cell colour, so on the dark theme more games means a *brighter* cell, the opposite of the legend.

## What changed
- **`StatsTab` activity cells:** green only for days with more wins than losses, red for more losses, and the muted grey (same intensity scale) for even days.
- **Legend:**
  - New "Even" swatch (`stats.legendEven`).
  - "Darker = more games" now reads "Stronger colour = more games" (`stats.legendDark`, en.json edited directly, and the 6 other languages appended).
  - The legend wraps (`flex-wrap`) now that it has four items.

## Checks
- `tsc`, `vitest` (191) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`. The demo has no even day, so only the legend change shows.
