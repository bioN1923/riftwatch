# v3.59 — Timeline list ↔ map, duo checks you can keep or remove

## Changes
- **Timeline list ↔ map** (`TimelineTab.tsx`): every kill, death, assist and epic-monster row in the event list is now a button (`Row`) that selects that spot on the map, as if its dot had been clicked. Whatever the selected spot covers (`happeningsNear`, the same ±20 s / short-walk window) is outlined in gold in the list (`aria-pressed`), and the list scrolls itself (not the page) to the first match. Picking a dot on the map does the same. The hint under the map now mentions the list. The list has an accessible name ("Events of this game").
- **Duo finder checks**: each checked player has a remove button (×, "Remove Name#TAG"). Checked Riot IDs are kept in `sessionStorage` (`rw:duo-checked:<platform>`, max 4, read and written inside try/catch), so a reload or a trip to a profile and back keeps them; closing the tab forgets them.
- Strings `tl.listAria`, `tl.showOnMap`, `duo.remove` and the updated `tl.mapHint` in all 7 languages.

## Checks
tsc clean · 101 tests pass · a11y `{}` · demo: `timeline-row-link.png` (a death row picked from the list, outlined, and its dot ringed on the map), `duo-check-remove.png` (after reload, one of two checks removed).
