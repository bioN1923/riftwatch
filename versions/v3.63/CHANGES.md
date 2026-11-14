# v3.63 — Turning points open the map popup

## Change
- `turningPoints.ts`: first blood and the deciding fight now carry a map position: the kill, or the fight's first kill.
- `TimelineTab.tsx`: those two Turning points rows are buttons with a map-pin icon ("Show on the map" for screen readers). Clicking one passes a `focus` down to `PlayerTimeline`, which then:
  - switches the map to "Everyone" if the moment isn't one of the selected player's own kills, deaths or assists, so its dot is drawn;
  - opens the v3.62 popup on that spot;
  - scrolls the map into view if it's off screen.
- Tests updated for the new fields (105 pass).

## Checks
tsc clean · a11y `{}` · demo `tp-click-{desktop,phone}-{0,1}.png`: both rows open the popup on desktop and phone, and the phone scrolls the map to the top of the screen (map y = 125).
