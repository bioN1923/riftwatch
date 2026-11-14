# v3.54: counters that say how sure they are

## Why
After movers (v3.38), patch deltas (v3.39) and draft answers (v3.46), counters were the last place still showing every lean as a fact:
- **Champion page:** "Countered by / Strong against" listed every matchup whose adjusted win rate was on the wrong or right side of 50%, all in confident red or green.
- **Tier list:** "Weak against" put a red ring on the 3 worst matchups, even when they were 47% on a few dozen games.

Measured on the live data (via the API) for 5 champions: of their usable matchups, **19 "hardest"** were shown in red, but only **4** stay under 50% even on an optimistic read (adjusted rate + 1 standard error). Likewise **29 "easiest"** were shown in green, but only **8** were clearly favourable.

Rather than hide the rest, which would leave most champions empty this early in the patch, they're now marked as *leaning*.

## Changes
- **Server, `countersOf(role)`** (now exported and tested):
  - returns `{ ids, sure }`, with clear counters first, then leaning ones, up to 3;
  - "clear" means `shrunk(w, g, 25) + 0.5/√(g + 25) < 0.5`;
  - the tier rows get `counters` plus `countersSure` (shared type updated).
- **Tier list "Weak against":** clear counters keep the red ring. Leaning ones get a neutral ring at 70% opacity, with the tooltip "Ahri vs Zed · leaning, could still be chance".
- **Champion page counters strip:**
  - each matchup is marked `sure` with the same ±1 SE rule, and the sure ones come first;
  - leaning ones get a dashed neutral border and grey percentage, with the tooltip note;
  - a one-line legend explains the dashed style whenever one is shown.
- **The matchup table's Hard/Easy tabs** use the same ordering.
- Strings `tl.leaning` and `cp.leaningNote` in 7 languages. Tests: 96 pass (new: clear first, `sure` count, winning matchups never listed).

## Checks
- Typecheck clean, a11y `{}`.
- **Demo:**
  - Ahri Mid: Mel 34% (clear, red) first; Syndra, Hwei and Viktor leaning (dashed). Strong against: all leaning.
  - Tier list Mid, first 8 rows: "Cll", "lll", "lll", "CC", "Cll"… (C = clear, l = leaning).
- Screenshots: `demo/counters-strip.png` plus the standard set.

## Live check (06:45)
- Deployed automatically (EXIT CODE 0, 06:44:25).
- **Tier list, Mid (70 rows):** 25 "Weak against" icons are clear (red ring) and 94 are leaning (faded, neutral ring). Before, all 119 were red.
- Screenshot: `live/tier-mid.jpg`.
- I didn't open champion pages in the owner's browser, so nothing was added to Recently viewed. The champion page strip is checked in the demo.
