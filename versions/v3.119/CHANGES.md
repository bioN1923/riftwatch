# v3.119 — Honest matchup calls

**Why.** The live game's lane line coloured the raw matchup win rate green or red, so "Kha'Zix wins 48.7% (113 games)" showed in red. At 113 games one standard error is about 4.7 points, so that's noise, and the matchup page itself called the same matchup "An even matchup". The matchup page also said "X is favoured" in full colour for any adjusted edge over 2 points, however few games backed it.

**What.**
- `src/lib/matchupVerdict.ts` → `matchupCall(m)`:
  - fewer than 10 games → too few;
  - an adjusted win rate within 2 points of 50% → even;
  - otherwise the side is called **sure** only when the raw win rate is more than 2 standard errors from 50%, and is **leaning** if not.
- `callTone`: green or red only for sure calls; leaning and even calls stay plain.
- `src/lib/matchupText.ts` → `callText`: "X is favoured", "Leaning X, could still be chance", "An even matchup" or "Too few games to call yet". New string `mp.leans` in 7 languages.
- Matchup page headline and its win-rate tile use the call.
- Live game lane line leads with the call ("An even matchup · Kha'Zix wins 48.7% … (113 games) · −36 gold at 15"). The number itself is no longer coloured.

This follows the same honest-data rules as the tier list, which shows leaning differences dashed and gives no tiers on low samples.

**Checks.**
- tsc passes; 160 tests pass (4 new in `tests/matchupVerdict.test.ts`).
- a11y `{}`.
- Demo:
  - live lane line reads "An even matchup";
  - Kha'Zix vs Sylas reads "An even matchup" (plain);
  - Ahri vs Zed and Jinx vs Caitlyn read "Leaning …, could still be chance" (plain).

Screens: `demo/live-lane.png`, `demo/matchup.png`.

**Arena line.** Full at 1000 players, but Arena games keep growing (~2.6 a minute) and the cap only stops memory growing; extra seeds found while it's full are simply not queued. No change needed.

## Live check (2026-11-16 00:19 local)
- The live build serves `i18n-DA2WjbhK.js` with the new string.
- Live matchup data, run through the same rule:
  - Ahri vs Zed mid: 106 games, 60.4% → **Ahri is favoured** (sure);
  - Lee Sin vs Sylas jungle: 41 games, 39.0% → **Leaning Sylas** (not sure);
  - Ashe vs Caitlyn bot: 39 games, 51.3% → **An even matchup**.
- Arena: 244 games.
