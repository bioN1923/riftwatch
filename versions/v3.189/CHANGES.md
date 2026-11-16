# v3.189: honest profile win-rate colours, records wrap, team damage focus

## What changed
- **`winRateTone`** (`src/lib/format.ts`; 12 uses across StatsTab, PlayerChampion, Sidebar and ItemBuild):
  - **Why:** it painted any win rate of 60% or more gold, and 50% or more green, from just 5 games. The Stats tab's lane opponents showed Vi 3–2 (60%) in gold.
  - **The fix:** with a game count, it now returns plain unless `sureTone`'s two-standard-error test says the rate is more than chance. Past that test, it keeps its own scale: gold at 60% or more, green at 50% or more, muted below 50%.
  - Without a game count it behaves as before.
- **Tests:** `features.test.ts` gets a "colours only what is more than chance" case.
  - Plain: 3–2, 6–2 and 8–12.
  - Coloured: 18–2 is gold, 58% over 300 games is green, 40% over 200 games is muted.
  - The old expectation that 6–2 is gold was dropped. 186 tests pass.
- **Personal records (Stats tab):** the label and the "Win · champion · time ago" line wrap with `leading-snug` instead of `truncate`. In two columns on a 390 px phone, "Most damage to…", "Best CS per minu…" and "2 da…" were cut off.
- **Lane draft, "Your team's damage":** the same focus hand-off as v3.188.
  - "Add a teammate's pick" from the keyboard focuses the grid search.
  - Removing a pick focuses the next pick's remove button, or the search.
  - Filling all 5 focuses the last remove button.
  - Keyboard run: open → search, 4 picks → still in search, 5th → "Remove Ahri", remove → "Remove Garen", remove the first → "Remove Jinx".

## Checks
- `tsc`, `vitest` (186) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/lane-phone.png`, `demo/records-phone.png` and `demo/`.
