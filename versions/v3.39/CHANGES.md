# v3.39: honest colours on win-rate changes

## Live check that started it
Every tier-list row shows the change since last patch (e.g. Kennen "+7.2%"), in green or red whatever the sample. On live patch 16.22, **198** rows had a change of at least 0.5 points, and only **18** of those were beyond 2 standard errors. The other **180** were coloured as if they meant something.

## Changes
- `src/components/ui/PatchDelta.tsx`:
  - `realChange(now, before, games, prevGames)` uses the same bar as Patch movers: |Δ| ≥ 2·√(.25/g₁ + .25/g₂). Without game counts it trusts the change.
  - Within normal swing, the number stays but turns grey (`text-faint`), and the tooltip adds "within normal swing for this many games".
  - Tiny changes still show "±0".
- The tier list and the profile's "Your champions on <patch>" pass `games`/`prevGames` (the server already sent `prevGames`).
- String `mv.noise` in 7 languages.
- Tests: 82 pass (new: `realChange`).

## Checks
- Typecheck clean, a11y `{}`.
- Demo: 44 deltas → 0 green, 2 red, 42 grey. The demo data is random, so that's expected.
- Screenshot: `demo/tier-deltas-desktop.png` plus the standard set.
