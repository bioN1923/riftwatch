# v3.20 — 13 Nov 2026

## Live check (before)
- Tier list after v3.19: S+ rows all have 150+ games.
- Patch movers: Shyvana +17.1% (128 games), Vladimir −14.8% (198). Checked: Shyvana's change is about 2.6× its sampling noise, so it's a real signal, and game counts are shown. The list has no filter for pure noise, though.
- Phone match cards: "24:55 · 4 days ago" broke inside "4 days ago" ("ago" alone on the next line), seen on the v3.15 phone check.

## Changed
- **Phone match cards:** the queue / length / time-ago line is a wrapping row that breaks *between* pieces, never inside one. The first attempt (no-wrap on each piece) pushed "9 minutes ago" past the edge on a 320 px iPhone SE; caught in Playwright and replaced. Checked on iPhone SE and iPhone 13: no horizontal scroll (`demo/match-card-iphone-se.png`).
- **Phone Tools menu, keyboard and screen readers:** opening it moves focus to the first tool; Escape closes it and returns focus to the Tools button.
- **Patch movers:** a change smaller than one standard error of the difference (√(0.25/games + 0.25/prevGames)) is left out as sampling noise. The bar is deliberately low: 5 points on 400 games each (1.4 SE) still counts, per the existing test.

## Checks
- 67 tests pass (new: movers noise filter). Typecheck, build and a11y check clean. Tools focus checked in Playwright (Enter → "Multi-search" focused; Escape → "Tools" focused, menu closed).

## Live check (after deploy)
- Deployed 13 Nov 2026 13:40 (deploy.log EXIT CODE 0).
- Phone (375 px), `/lol/euw1/Kaori-EUW33`: match cards read "Ranked Solo/Duo / 24:55 /" then "5 days ago" whole on the next line. No horizontal scroll (`live/phone-match-cards.jpg`; pictures hadn't painted in the background pane).
- Patch movers still list 15 up and 15 down after the noise filter.
