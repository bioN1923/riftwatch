# v3.64 — The whole deciding fight on the map

Follow-up from the v3.63 live check: opening the 3-for-0 Baron fight from Turning points showed only its first kill, because the popup lists what happened near the clicked spot.

## Change
- `turningPoints.ts`: the fight turning point carries its `kills`.
- `mapEvents.ts` `happeningsOf(events, only)`: the popup list for a given set of events, wherever they are on the map, plus the multi-kills scored during them by those killers. One new test.
- `TimelineTab.tsx`:
  - A selection can carry `only`. The deciding fight passes its kills and the objectives taken after it.
  - The popup is titled "Fight at m:ss and what followed" and lists all of them.
  - Every dot and diamond in the set gets the gold outline.
  - The map switches to Everyone if any of them isn't the selected player's own.
- String `tl.fightAt` in 7 languages.

## Checks
tsc clean · 106 tests pass · a11y `{}` · demo `tp-click-phone-1.png`: Akali killed Kai'Sa 8:46, Vi killed Fiora 8:51, Vi took Infernal Drake 10:16, 3 dots outlined.

## Live check (2026-11-14 08:28)
- Deploy finished cleanly. On bioN1923's third match, the deciding fight now opens as "Fight at 25:39 and what followed":
  - Veigar killed Nasus
  - Shyvana killed Akali
  - Veigar killed Caitlyn
  - Shyvana took Baron (27:05)

  4 markers are outlined, and the event list row "27:05 Enemy team took Baron" is highlighted too. Screenshot: `live/fight-popup.jpg`.
- The popup doesn't list towers, because they aren't map events here. The Turning points line still mentions them.
