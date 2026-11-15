# v3.123 — Clear-only colours on champion headlines; Duo → Compare

**Why.** Reviewing the v3.122 champion shot: Ahri's headline win rate, 49.6% over 423 games, showed in red. One standard error at that sample is about 2.4 points, so the number says "about even", not "weak". The "Best with" partners did the same thing: 61.2% over 67 games showed green and 44.3% over 61 showed red, both within noise. Separately, the Duo finder suggested players with no quick way to look at them next to you; the Compare page already does exactly that.

**What.**
- `format.ts` → `sureTone(wr, games)`: green or red only when the win rate is more than 2 standard errors from 50% (the same test as `matchupCall`), plain otherwise, and plain under 5 games.
- Champion `StatStrip` headline win rate and the `Synergy` ("Best with") partners use `sureTone`. Per-player rows (Who plays it most) keep `wlTone`, since those are personal records, not claims about the champion.
- Duo finder: a `YouCtx` context carries the searched Riot ID, and each `DuoCard` shows **Compare with you**, linking to `/compare?a=<you>&b=<them>`. String `duo.compare` in 7 languages.

**Checks.**
- tsc passes; 166 tests pass (3 new in `tests/sureTone.test.ts`).
- a11y `{}`.
- Demo:
  - Ahri's headline 49.6% is plain, and all 6 "Best with" partners are plain (none clear);
  - Duo card link `/compare?a=euw1/Caps-EUW&b=euw1/QuietDrake-GG` opens Compare.
- No page errors.

Screens: `demo/duo-card.png`, `demo/champion-hero.png`.
