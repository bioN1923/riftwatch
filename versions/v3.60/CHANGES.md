# v3.60 — Timeline list → map on phones

## Live-style check (demo, iPhone 13)
- Duo finder on a phone: no horizontal overflow, cards and the Check a player form fit (`demo/phone-duo.png`). Nothing to change.
- Timeline on a phone: map and list are stacked, so tapping a list row (new in v3.59) changed the map out of sight, above the list. The tap seemed to do nothing.

## Change
- `TimelineTab.tsx` `pickFromList`: after a row selects its spot, if the map square isn't fully on screen (top under the 64 px sticky header, or bottom below the viewport), the page scrolls the map into view (`scroll-mt-[88px]`; instant when the user prefers reduced motion). On desktop, where the map sits beside the list, the page doesn't move.

## Checks
tsc clean · 101 tests pass · a11y `{}` · phone: scrollY 1912 → 1526, map 125–455 of 664 px (`demo/phone-row-to-map.png`); desktop: scrollY unchanged.

## Live check (2026-11-14 07:50, desktop Chrome)
- Deploy finished cleanly; the new build is served (`scroll-mt-[88px]` on the map figure).
- Map fully visible → clicking a list row left the page where it was (scrollY 1127 → 1127).
- Map top tucked under the header → clicking a row brought it back (scrollY 1413 → 1308, map at 125–425 px). Screenshot: `live/timeline-scroll.jpg`.
