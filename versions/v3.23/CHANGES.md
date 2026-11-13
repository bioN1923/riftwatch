# v3.23 — 13 Nov 2026

## Live check (before)
- v3.22 collector, first reading: 6,718 ranked games at 12:10 UTC → 6,742 at 12:17 UTC (+24 in 7 minutes, about 200/hour against about 17/hour before). Longer measurement at the end of this round (see v3.22/CHANGES.md).

## Added
- **Champion search understands nicknames** (`src/lib/champSearch.ts`, `champHit`). Players type "mf", "tf", "j4", "lb", "ww", "gp", "tk", "asol", "naf", "donger", "yi", "raka", "mumu", "mundo", "ks", "bv", "wu"…, but search only matched names that start with or contain the text, so these found nothing (or the wrong champion).
- Results rank nickname/exact name first, then names starting with the text, then names containing it. Punctuation, spaces and accents are ignored ("kaisa" → Kai'Sa, "chogath" → Cho'Gath).
- Used in all three champion searches: the header search box, the tier-list filter and the Draft helper's champion grid.

## Checks
- 69 tests pass (new: nickname, prefix, contains and no-match cases). Typecheck, build and a11y check clean.
- Playwright on the demo:
  - header search "j4" → Jarvan IV first (`demo/search-j4.png`);
  - tier filter "mf" → Miss Fortune, "kaisa" → Kai'Sa;
  - draft grid "gp" → Gangplank.
