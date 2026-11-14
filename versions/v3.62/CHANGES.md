# v3.62 — Map events in a popup on the dot

User feedback: "It should be a popup on dot containing events. In the list is hard to track exactly."

## Change
- `TimelineTab.tsx`: the events at a picked spot no longer appear in a panel under the map. They show in `MapPopup`, a small box pinned to the clicked dot, with a pointer to it.
  - It opens above the spot in the lower half of the map and below it in the upper half, and leans inwards near the left and right edges.
  - Width is min(280 px, 85 vw), so it fits on phones.
  - For epic-monster diamonds, which are fanned out in their pit, it points at the clicked diamond (`sel.ax/ay`).
- Close it with ×, Esc, or a click on empty map. Clicking the same dot again also closes it.
- Rows in the event list still work: tapping one opens the popup on its dot, and on phones the map scrolls into view (v3.60).
- The popup is `role="dialog"` with the "Around m:ss" label, and `aria-live` so screen readers hear the contents.

## Checks
tsc clean · 105 tests pass · a11y `{}` · demo: `popup-desktop-*`, `popup-phone-*` (corner kill, Baron diamond, mid-map kill; Esc closes each).

## Live check (2026-11-14 08:11)
- Deploy finished cleanly. On bioN1923's third match, clicking a mid-map dot opened the popup on the dot: "Around 28:17 · Shyvana killed Lillia · Nasus killed Shyvana · with Lillia". Screenshot: `live/map-popup.jpg`.
