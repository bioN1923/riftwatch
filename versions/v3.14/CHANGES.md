# v3.14 — 13 Nov 2026

## Live check (before)
- **The v3.13 backfill works.** Ahri vs Syndra now shows "How the lane goes" from 8 games (`live/before-matchup-lane-ahri-vs-syndra.jpg`).
- **The chart and the header disagreed.** The header said −122 gold at 15 (all 50 games); the chart said +371 (the 8 games with lane data so far). Readers had no way to tell why.
- New games came in slowly this morning (+11 in about an hour). That's the normal overnight low for EU high-elo players, not a fault.

## Added
- **Champion pages: "How the lane goes"** across every lane opponent: average gold and CS lead at 5/10/15 minutes for the chosen role (ranked, needs 20+ games). It sits next to "Win rate by game length", so a champion's early-versus-late identity can be read in one place.
- **Game-length verdict.** "Win rate by game length" now opens with a one-line read: wins most in short games / wins more the longer the game goes / steady across game lengths. It compares games under 25 minutes with games over 30 (at least 60 games on each side, 4-point gap).
- Translated in all 7 languages (`cp.laneSub`, `len.early`, `len.late`, `len.even`, `mp.laneEarly`).

## Changed
- Matchup lane charts that use fewer games than the rest of the page say so: "Still filling in: the numbers above use all 50 games."
- Lane chart numbers: CS leads have one decimal (−0.4 instead of −0), and a lead that rounds to zero shows as a neutral "0".
- `LaneCurve` moved to `src/components/champions/LaneCurve.tsx` and is shared by both pages.

## Checks
- 59 tests pass (new: champion-wide lane curve, game-length verdict thresholds). Typecheck, build and a11y check clean.
- Demo: `demo/cp-*-lane.png` (dark, light, phone), `demo/cp-dark-len.png`.

## Live check (after deploy)
- Deployed 13 Nov 2026 10:57 (deploy.log EXIT CODE 0).
- `/champions/ahri`: "How the lane goes" from 100 games (+168 gold, +3.9 CS at 15) right above "Win rate by game length", whose verdict reads "Win rate holds steady across game lengths." (`live/champion-ahri-lane-and-length.jpg`).
- `/champions/ahri/vs/syndra`: 9 games now, with the "Still filling in: the numbers above use all 50 games." note (`live/matchup-ahri-vs-syndra-note.jpg`). At 9 games the chart is still noisy (+586 gold at 15 against −122 for all games); the note covers that until more games are backfilled.
