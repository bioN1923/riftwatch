# v3.136 — Calmer champion build section

**Why.** Reviewing the whole champion page after v3.133–135 turned up two things.

The build section still coloured every win rate by which side of 50% it fell:
- spells and starting items 47.5% over 451 games, in red;
- 4th item Rylai's 48.9% over 178 games, in red;
- the game-length bars red or green at about 100 games each.

None of these are past two standard errors. The rest of the site has used `sureTone` for that since v3.119–123.

Option lists also showed one-off choices as if they were real options, e.g. "4th item: Zhonya's Hourglass 100%* · 1% pick · 1".

**What.**
- `Rate` (spells, starting items, rune page detail, core build) and `OptionRow` (boots, 4th–6th items) now use `sureTone`. Small samples stay faint with `*` as before.
- `LengthChart` bars are green or red only when sure, and neutral grey otherwise. The percentage labels and tooltips are unchanged.
- Boots and 4th–6th option lists drop options under 10 games (`LOW_SAMPLE`). The most common one always stays.

**Checks.**
- tsc passes; 182 tests pass; a11y `{}`.
- Demo, Ahri mid, light and dark:
  - spells and starting items 47.5%, 4th–6th items and the core build now plain;
  - the length chart shows grey bars;
  - "4th item" lists Rylai's (178 games) without the 1-game Zhonya's.

Screens: `demo/build-*.png`, `demo/length-*.png`.

## Live check (2026-11-16 06:33 local)
- Both Champion chunks (`Champion-CjH0zRlD.js`, `Champion-DUiVm7oG.js`) are served (200).
- Live Ahri mid per-page builds: [7, 0, 1] games.
