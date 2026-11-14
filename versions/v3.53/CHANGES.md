# v3.53: recently viewed champions

## Why this one
Every big stats site keeps your recent searches close, and Riftwatch already does that for players (Home → Recently viewed). Champions had nothing: going back to a champion you checked a minute ago meant searching or scrolling the tier list again.

I also considered "Items by game length" and "Build when ahead/behind" for the champion page. They would need per-game item timings split by game state, and the collector doesn't store those reliably yet, so I left them out rather than show thin numbers.

## Changes
- **`storage.ts`:**
  - `pushRecentChamp(list, {id, role}, max = 8)` puts the newest first, keeps one entry per champion (opening it in another role replaces the old entry), and keeps at most 8;
  - the store is `rw:recent-champs`, with `useRecentChamps`, `addRecentChamp` and `clearRecentChamps`.
- **Champion page:** opening it records the champion and the role from the URL.
- **Tier list:** a "Recently viewed" row above the free rotation.
  - Champion icons with a small role badge; each links back to the same role (`?role=MIDDLE`).
  - In ARAM or Arena mode the links go to that mode instead.
  - The label says e.g. "Ahri · Mid", and the "Clear" button empties the list.
  - The row is hidden when the list is empty, so first-time visitors see no change.
- **Privacy:** stored only in the visitor's browser, never sent anywhere.
- Strings `tl.recent` and `tl.recentClear` in 7 languages. Tests: 95 pass (new: ordering, one entry per champion, cap of 8).

## Checks
- Typecheck clean, a11y `{}`.
- Demo: after opening Ahri, Zed (Mid), Jinx (Bot), Ahri (Mid) and Thresh, the row reads Thresh, Ahri · Mid, Jinx · Bot, Zed · Mid. In ARAM mode the links carry `?queue=aram`. Clear removes the row.
- Screenshot `demo/recent-champs.png` plus the standard set.

## Live check (06:35, after a pause in the loop overnight)
- Deployed automatically (EXIT CODE 0, 06:34:25).
- `/changelog` lists v3.53 first, with the NEW badge.
- The tier list shows **no** "Recently viewed" row in the owner's browser. That's correct: no champion page has been opened since the deploy, so the list is empty. I deliberately didn't open champion pages here, so as not to write anything into the owner's browser storage.
- The row itself is checked in the demo (`demo/recent-champs.png`). Live screenshot: `live/tier-list.jpg`. The tier list now reads 11,148 ranked games on 16.22.
