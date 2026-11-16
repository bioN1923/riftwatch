# v3.162: from a live game to Team draft

## What changed
- **Live lane panel:** under "Open matchup" there's a second link, "How {champion} fits this draft". It builds `/draft/team?role=<guessed role>&allies=<4 teammates>&enemies=<5 enemies>&mark=<own pick>`.
  - **Data used:** only champion ids from the live game, plus the role from the same lane guess the panel already uses. No names, ranks or premade information go into the link, so the live page's no-premade rule is untouched.
- **Team draft `mark` parameter:** a "Your pick" section above the list shows that champion's card, with the same reasons and score, and its rank among every candidate ("#5 of 6"). If the champion doesn't have enough games in the role, it says so instead.
- **Fix during the build:** `useStaticData` in `Suggestions` was first placed after an early return, which breaks React's hook order. It was moved to the top of the component.
- **Strings:** `live.draftOpen`, `td.mark`, `td.markLead` and `td.markMissing` in all 7 languages.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Click test (demo Caps live game): the link goes to `/draft/team?role=JUNGLE&allies=ksante,mel,xayah,leona&enemies=ambessa,viego,yone,caitlyn,lux&mark=khazix`, and "Your pick" shows Kha'Zix at #5 of 6.
- Screenshots: `demo/live-link.png`, `demo/team-draft-mark.png` and `demo/`.

## Live check (2026-11-16 13:22 local)
- The live index serves `index-3_qajj-N.js`. The `live.draftOpen` string is in the i18n chunk, and `td.markLead` is in the TeamDraft chunk.
- Team-draft data so far: the test draft has lane (38) and duo (52) reasons, and still no `ally`/`enemy` ones. That is expected: those tallies began at 13:08, and at about 4 ranked games a minute no pair has reached the 10-game minimum yet.
