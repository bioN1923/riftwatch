# v3.19 — 13 Nov 2026

## Live check (before)
- Tier list (6,692 ranked games on 16.22), top rows:
  - Warwick: **S+** from **54 games** (68.5%);
  - Mordekaiser: **S+** from **99 games** (61.6%);
  - above Alistar (859 games, 57.7%) and Kalista (672 games, 54.8%).
- A tier list that crowns small hot streaks loses trust fast (`live/before-tierlist.jpg`; dim because the browser pane was in the background).

## Fixed
- **Tier score is now cautious.** On top of the existing shrinkage (150 extra 50% games), the score takes off about one standard error (0.5/√(games+150)): about 3.5 points for 54 games, 1.6 for 859. A small sample needs a much bigger edge to rank high; big samples barely move. This is the same idea as the v3.18.1 blind-pick fix. Popularity still adds a little, as before.
- Regression test with the live numbers: Warwick (54 games, 68.5%) must rank below Nidalee (266, 57.9%) and Nunu (293, 56%) and not be S+. It **fails on the old score and passes on the new one** (checked by temporarily reverting).

## Checks
- 66 tests pass. Typecheck, build and a11y check clean. Demo screenshots in `demo/`.
