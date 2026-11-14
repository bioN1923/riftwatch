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

## Live check (2026-11-14 08:19)
- Deploy finished cleanly. On bioN1923's third match, clicking "Blue side won a 3-for-0 fight and took Baron, 1 tower" switched the map to Everyone and opened the popup at 25:39 ("Veigar killed Nasus · with Tristana"). Screenshot: `live/tp-to-map.jpg`.
- Follow-up: the popup lists only what happened near the clicked spot (±20 s, a short walk), so a fight spread across the map shows just its first kill. Next step: show all of a fight's kills when it's opened from Turning points.
