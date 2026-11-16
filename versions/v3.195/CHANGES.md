# v3.195: compare cards without cut-off text on phones

## How it was found
A Playwright scan at 390 px looked for every element with `text-overflow: ellipsis` whose text is actually cut (`scrollWidth > clientWidth`). It covered 15 pages:
- Home, tier list, champion (ranked and Arena), matchup
- Profile overview, stats and live
- Ladder, items, both draft helpers, compare, multi-search and the duo finder

Only one hit remained: the compare player cards, "#EUW · Europe W…". The v3.189 and v3.194 fixes had cleared the others.

## What changed
- **`PlayerCard` (Compare.tsx):**
  - On phones, the tag and region sit on two lines; the " · " is hidden there. From `sm` up, it's still one line, "#EUW · Europe West".
  - The rank line's "N games" is `whitespace-nowrap`, so "games" doesn't sit alone on a third line.

## Also checked (phone, 390 px)
- The LP panel ("Rank history") reads fine.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/compare-cards-phone.png` and `demo/`.

## Live
- Deployed 21:09 local. The live bundle has v3.195 and the new changelog line.
