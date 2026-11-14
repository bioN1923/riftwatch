# v3.61 — Turning points

A short story of each match, under the gold-lead chart in the Timeline tab, in game order:

- **First blood**: the first kill by a champion (minion executions don't count).
- **Biggest gold swing**: the largest change in the gold lead over 3 minutes, shown only when it's at least 1.5k.
- **The deciding fight**: kills chained ≤ 15 s apart count as one fight. Each fight the winners won (≥ 2 kills, more for than against) is scored as kill difference plus what they took within 90 s: Baron/Elder 3, Atakhan 2, drake/Herald 1, tower 0.5. The best wins, and ties go to the later fight. Shown as "Red side won a 3-for-1 fight and took Baron Nashor, 1 tower".
- **Comeback or lead**: if the winners were ever 2.5k+ behind, "came back from X gold behind" (at the low point); otherwise "led from here to the end" from the minute they took the lead for good.

Pure logic in `src/lib/turningPoints.ts` (`fights`, `turningPoints`) with 4 tests in `tests/turningPoints.test.ts`. Hidden for remakes and games under 6 minutes. Strings `tp.*` in all 7 languages (Polish/Romanian tower plurals).

## Checks
tsc clean · 105 tests pass · a11y `{}` · demo `turning-points.png`.
