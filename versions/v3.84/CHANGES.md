# v3.84 — Honest empty Arena tier list

Re-check of the v3.83 Arena sourcing at 14:55 UTC: still 0 Arena matches. No visitor's EUW Arena game has seeded the queue yet, which is expected.

Meanwhile the empty Arena tier list said "The server is reading high-elo ranked games in the background. Stats appear here within a few minutes…". That's wrong for Arena: those games now come from players looked up on the site (v3.83).

## Change
- `Champions.tsx`: an empty Arena list shows `tl.collectingArena` instead: "Arena games come from players looked up on Riftwatch: open the profile of someone who plays Arena, and their games, then their opponents' games, start filling this list." The text is in 7 languages.

## Checks
tsc clean · 122 tests pass · a11y `{}` · demo shots (the demo has Arena data, so the empty state is checked live).
