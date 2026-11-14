# v3.66 — What your wins have in common

New panel on the profile Stats tab, under "Compared with high elo".

## How it works (`src/lib/winConditions.ts`)
- For each stat (deaths, CS/min, kill participation, vision/min, share of team damage, game length, first-blood involvement), the player's counted games are split at their own median. The cut-off is rounded the way it's shown, so the label and the split agree.
- Win rate on each side; the split is kept when both sides have ≥ 4 games and the gap is ≥ 15 points.
- It's always phrased for the side the wins are on ("5 deaths or fewer", or "Under 1.3 vision score a minute"), with the record and win rate on both sides.
- "Sure" when the gap is more than twice its two-proportion standard error; otherwise "could still be chance". Ranked by gap minus its standard error; top 3 shown.
- Hidden below 10 games; with no qualifying split it says so plainly.

## Other
- Strings `wc.*` (+ `*Flip` variants) in 7 languages.
- `tests/winConditions.test.ts` (2 tests).

## Checks
tsc clean · 110 tests pass · a11y `{}` · demo `win-conditions.png` (Caps: 5 deaths or fewer 7–4 vs 2–5 …).

## Live check (2026-11-14 08:48)
- Deploy finished cleanly. bioN1923, last 20 games:
  - 8 deaths or fewer: 8–3 (73%), otherwise 0–9 (0%)
  - 6.7+ CS a minute: 7–2 (78%), otherwise 1–10 (9%)
  - 40%+ kill participation: 5–5 vs 3–7, marked "could still be chance"

  Screenshot: `live/win-conditions.jpg`.
