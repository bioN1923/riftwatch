# v3.46: draft answers with honest ranges

## Live check that started it
`/draft?role=MIDDLE&enemy=yasuo` on the live site:
- "Best answers to Yasuo" was led by **Ahri 65.0% (40 games)**, in confident green.
- 65% on 40 games has a 95% range of about **49.5–77%**, so it could still be a coin flip.
- The list was ranked by the shrunk rate alone, while the Blind picks panel (v3.18) and the tier list (v3.19) already rank by the cautious estimate.

## Changes
- **`src/lib/draft.ts`:**
  - `cautiousRate(adjusted, games)` = adjusted − 0.5/√(games + 25), the same rule as safe blind picks;
  - `winRange(rate, games)` is the 95% Wilson interval.
- **Ranking:** "Best answers" and "From your pool" (including the "Pick …" sentence) now rank by `cautiousRate`.
- **Display (`RateWithRange`):** under each win rate, a small likely range ("45–73%").
  - The rate is green only when the whole range is above 50%, red only when it's all below, otherwise neutral.
  - The tooltip reads "Over 40 games the real win rate is likely between 50% and 77%".
- **Text:** the `draft.bestLead` intro explains the ranking and the range (7 languages); new string `draft.rangeTip`.
- **Tests:** 92 pass (2 new).

## Checks
- Typecheck clean, a11y `{}`.
- Demo: Zed 60.0% (45–73%), Ahri 56.9% (44–69%), Hwei 58.1%, Syndra 57.1%. All are neutral, because none of their ranges clear 50% on demo-sized samples.
- Screenshots: `demo/draft-ranges-desktop.png` and `demo/draft-ranges-phone.png`.

## Live check (23:49)
- Deployed automatically (EXIT CODE 0, 23:48:02).
- Mid vs Yasuo:
  - **Ahri 65.9% (41 games), range 51–78%:** green, just. With one more win in the sample the whole range now clears 50%.
  - **Yone 60.6% (33 games), range 44–75%:** neutral.
  - **Locke 55.0% (20 games, small sample), range 34–74%:** neutral.
- The new intro text shows. Screenshot: `live/draft.jpg`.
