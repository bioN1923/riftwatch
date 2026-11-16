# v3.202: profile loading state shows whose profile it is

## Checked (phone, 390 px)
- **Match details tabs with a failing timeline API:** Item build, Timeline and Metrics show "Couldn't load this" plus Try again. Performance doesn't need the timeline. Fine.
- **Unranked player** (the profile response's `ranked` emptied with Playwright): both queues show "Unranked" with empty emblems. Fine.
- **Slow network** (every API call delayed 4–5 s):
  - The profile skeleton was all grey, with no sign of whose profile was loading, although the Riot ID is in the address.
  - Its layout also no longer matched the page: a 320 px sidebar on the left, where the real page has the matches on the left and a 310 px summary on the right.

## What changed
- **`ProfileSkeleton`:** takes `gameName`, `tagLine` and `platform`. It shows "Name #TAG" in the display font, with the region name under it, where the header will be.
- **Body layout:** follows the real page, `lg:grid-cols-[minmax(0,1fr)_310px]`. A filter-bar placeholder and four 124 px match cards are on the left; two summary blocks on the right show only from `lg`.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/loading-phone.png`, `demo/loading-desktop.png` and `demo/`.

## Live
- Deployed 22:34 local. The live entry carries `3.202`.
