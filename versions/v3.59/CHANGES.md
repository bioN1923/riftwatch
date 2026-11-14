# v3.59 — Timeline list ↔ map, duo checks you can keep or remove

## Changes
- **Timeline list ↔ map** (`TimelineTab.tsx`): every kill, death, assist and epic-monster row in the event list is now a button (`Row`) that selects that spot on the map, as if its dot had been clicked. Whatever the selected spot covers (`happeningsNear`, the same ±20 s / short-walk window) is outlined in gold in the list (`aria-pressed`), and the list scrolls itself (not the page) to the first match. Picking a dot on the map does the same. The hint under the map now mentions the list. The list has an accessible name ("Events of this game").
- **Duo finder checks**: each checked player has a remove button (×, "Remove Name#TAG"). Checked Riot IDs are kept in `sessionStorage` (`rw:duo-checked:<platform>`, max 4, read and written inside try/catch), so a reload or a trip to a profile and back keeps them; closing the tab forgets them.
- Strings `tl.listAria`, `tl.showOnMap`, `duo.remove` and the updated `tl.mapHint` in all 7 languages.

## Checks
tsc clean · 101 tests pass · a11y `{}` · demo: `timeline-row-link.png` (a death row picked from the list, outlined, and its dot ringed on the map), `duo-check-remove.png` (after reload, one of two checks removed).

## Live check (2026-11-14 07:41)
- Deploy finished cleanly. On bioN1923's third match, the timeline list has 30 clickable rows. Clicking "Killed Tristana" (4:38) outlined that row, ringed its dot, and showed "Tristana killed Nasus / Lillia killed Tristana · with Nasus" under the map. Screenshot: `live/timeline-row-link.jpg`.
- The duo-check removal and memory weren't exercised live, so nothing was written to the user's browser storage. They were verified on the demo server.
