# v3.41: exact game time on hover

## Live check
I went through the profile of bioN1923#EUNE: overview, an expanded match (post-game scoreboard), the Stats tab (compared with high elo, champions played) and the Live game tab. Everything rendered correctly and the numbers checked out (kill share, deaths shown red as worse than high elo). The one gap: match rows only say "6 days ago", with no way to see when the game was played.

## Changes
- `MatchRow.tsx`:
  - the relative time is now a `<time dateTime="…ISO…">`;
  - its `title` gives the exact end, e.g. "Friday, November 13 at 10:33 PM", from `exactTime(ms)`. That uses `toLocaleString` in the site language and the visitor's own time zone.
- No new strings: the date words come from the browser in the chosen language.

## Checks
- 83 tests pass, typecheck clean, a11y `{}`.
- Demo, Europe/Bucharest: the "22 minutes ago" row has the title "Friday, November 13 at 10:33 PM" and datetime `2026-11-13T20:33:36Z`.
- The standard screenshots are in `demo/`. The browser tooltip itself doesn't show up in headless screenshots.
