# v3.128 — One-trick / wide-pool note on profiles

**Why.** Seeing whether someone is a one-trick or plays everything is one of the first things a scout wants. op.gg, Porofessor and others tag it. Riftwatch showed the 20 recent champion portraits but left the counting to the reader.

**What.**
- `src/lib/playstyle.ts` → `poolRead(championIds)` looks at the last 20 games, leaving out remakes:
  - it needs at least 10 counted games;
  - **one-trick** when one champion is at least 60% of them;
  - **wide pool** when there are 10 or more different champions;
  - otherwise nothing.
  - The labels are neutral facts only; Riot's policy rules out labels that mock players.
- `FormRibbon` (profile header) adds it after the record and win streak: "One-trick: Ahri in 13 of 20" (with a tooltip on the rule) or "Wide pool: 11 champions in 18 games".
- Strings `form.oneTrick`, `form.oneTrickTip` and `form.widePool` in 7 languages, with plural forms.

**Checks.**
- tsc passes; 172 tests pass (4 new in `tests/playstyle.test.ts`).
- a11y `{}`.
- Demo: Caps, Faker, Jankos and Doublelift show "Wide pool"; Rekkles, Upset, Bwipo and Hide on bush show nothing. The demo has no one-tricks; that case is covered by the unit tests.
- No page errors.

Screen: `demo/form-pool.png`.
