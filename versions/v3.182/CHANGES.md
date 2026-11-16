# v3.182: Arena "Best partners" order explained

## What changed
- **Why:** the Arena tab's "Best partners" list is ranked by a shrunk average place, with each pair's average pulled toward 4.5 by 10 virtual games (`server/champStats.ts`). This is on purpose, so a duo with a few lucky games can't top the list. But the list shows the raw average, so on Ahri it reads 2.85, 3.40, 3.27, 3.63, which looks like a sorting bug.
- **`Partners` (Arena.tsx):** a faint note under the list, new key `arena.partnersOrder`: "Fewer games count for less in this order, so a pair with a few lucky games can't top the list."
- **Translations:** the note is in all 7 languages, appended to the i18n text files.
- **Unchanged:** the ranking itself.

## Also checked (phone, 390 px)
- Ladder, Challenger page: fine.
- Arena tab:
  - Item icons open their tooltip on tap, so names are reachable on touch.
  - The length chart and patch table read fine.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/partners-phone.png` and `demo/`.
