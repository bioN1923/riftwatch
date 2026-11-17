# v3.219: "All changes" from the home movers strip

## Found
- On the home page, the "Rising since 15.19" strip showed up to three champions and left the rest of its full-width panel empty (`v3.218/demo/01-home.jpg`).
- The tier list has a fuller "Patch movers" section: up to five risers and fallers, game counts before and after, and a note when one side is quiet.
- The strip didn't lead there.

## What changed
- **Home `Movers`:** an "All changes" link at the right end of the last row (`ml-auto`), pointing to `/champions#movers`. It sits in the space a short list leaves.
- **`PatchMovers`:** the section gets `id="movers"` and `scroll-mt-20`.
  - Arriving with `#movers` scrolls it into view once the tier list has data, then again after 300 ms once the rows above have settled (the same pattern as profile deep links).
  - The hooks stay above the early returns.
- **i18n:** `home.moversAll` in 7 languages.

## Checks
- `tsc`, `vitest` (190) and `vite build` pass.
- a11y: `{}`.
- Playwright: clicking "All changes" on home lands on `/champions#movers`, with the section top at 73 px, just under the sticky header (156 px before the second scroll).
- Screenshots: `demo/`.

## Live check (07:59 local)
- `3.219` is in the live JS bundle.
- Live movers: 8 risers and 6 fallers. Home shows both rows, and the link sits at the end of the "Falling" row.
