# v3.120 — One matchup test everywhere

**Why.** v3.119 gave the matchup page and the live game a single rule for when a matchup is "clear". Three other places still used their own rules:
- The champion page counters strip called a chip "sure" past about **one** standard error on the adjusted rate. The matchup page needs two, so a chip could look solid while its matchup page said "Leaning …".
- The lane matchups table coloured every win rate above 10 games green or red.
- The Draft helper's "ban for your pool" chips coloured each pool champion's win rate by which side of 50% it fell.

**What.**
- `laneMatchups()` decides "sure" with `matchupCall`, the same 2-SE test as the matchup page. Chip order (sure first) and the dashed "leaning" style are unchanged.
- The matchups table colours the win rate with `callTone`: green or red only when sure, plain otherwise, and faint with `*` under 10 games as before. A new note, `mu.toneNote`, says so (7 languages).
- Draft ban chips: each entry in `BanPick.against` now carries `adjusted`, and its colour comes from `callTone(matchupCall(x))`.

**Checks.**
- tsc passes; 160 tests pass.
- a11y `{}`.
- Demo, Ahri mid:
  - table: Mel 34.1% red (sure); Syndra 40.0%, Hwei 41.9% and Viktor 43.6% plain;
  - strip: Mel solid, the others dashed.
- The Draft page renders without errors.

Screens: `demo/matchups-table.png`, `demo/counters.png`.

Unchanged: win-rate bars still show position (red under 50%), not certainty.

## Live check (2026-11-16 00:29 local)
- The live build serves `i18n-CpUEkk_n.js` with the new note.
- Live data for Ahri mid (2,718 games), comparing the old rule with the new one:
  - counters strip: 1 of 10 usable chips is now "sure", down from 4;
  - lane matchups table: 5 matchups get a colour, down from 52 (every one with 10+ games used to be coloured).
- Arena: 267 games.
