# v3.34 — 13 Nov 2026

## Checked
- Champion page on iPhone SE (320 px): no horizontal scroll. The bottom bar looked label-less in a screenshot, but measuring showed the labels are there; the screenshot cut the bottom 20 px. Not a bug.
- **Header search on phones was squeezed**: on iPhone SE the input was 43 px wide (placeholder "Play…"), 113 px on iPhone 13. The language button took 57 px for a globe icon plus "EN".

## Changed
- Phones: the language button shows just the code ("EN"); the globe comes back from the `sm` breakpoint. Header gaps are 8 px instead of 12 px on phones.
- The search input grows from **43 → 77 px** (iPhone SE) and **113 → 147 px** (iPhone 13). Desktop is unchanged (`demo/hdr-*.png`).

## Checks
- 76 tests pass; typecheck, build and a11y check clean (the button keeps its "Language: English" label).
