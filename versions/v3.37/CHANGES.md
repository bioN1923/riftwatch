# v3.37: champion addresses, server side

Found in the v3.36 live check: `/champions/yasou` had the tab title "Yasou build, runes and counters". The server built a page title for any slug.

## Changes
- `src/lib/champSearch.ts` moved to `shared/champSearch.ts`, so the server can use it too; the old path re-exports it. The runtime image ships only `server/` and `shared/`.
- New `champAddressFix(path, search, champs)`: the real address when every champion in `/champions/<a>[/vs/<b>]` is guessed without doubt. It returns null if the address is already right, if the guess is only a suggestion, if both sides are the same champion, or if the list isn't loaded yet.
- Server, before rendering:
  - **302 redirect** for sure guesses (`/champions/mf?role=BOTTOM` → `/champions/missfortune?role=BOTTOM`), so shared links and link previews land on the real page.
  - **Unknown champion:** HTTP **404**, `noindex`, title "Champion not found · Riftwatch" (7 languages).
  - **Unknown matchup:** 404 and "Matchup not found".
  - The slug patterns accept any characters, so `miss-fortune` and `kai'sa` get the same treatment.
- Safe right after a restart: until the Data Dragon champion list loads, the old behaviour stays (page title from the address, status 200, no redirect). A real champion never gets a 404.
- Client: the not-found champion and matchup pages set `document.title` themselves too.
- Tests: 80 pass (new: `champAddressFix`).

## Checks
- Typecheck clean, a11y `{}`. The client typo flows still work in the demo (same results as v3.36).
- The sandbox can't reach Data Dragon, so locally the server runs the "list not loaded" fallback: `/champions/ahri` gives 200 with the right title. The redirect and 404 logic is covered by the unit test and checked live.

## Live check (22:26)
- Deployed automatically (EXIT CODE 0, 22:25:10).
- `/champions/ahri` → 200 "Ahri build, runes and counters · Riftwatch".
- `/champions/yasou` → **404** "Champion not found · Riftwatch". `/champions/ahri/vs/yasou` → **404** "Matchup not found · Riftwatch".
- `/champions/mf` → **302**. `/champions/mf?role=BOTTOM` ends at `/champions/missfortune?role=BOTTOM`; `/champions/tf/vs/asol` ends at `/champions/twistedfate/vs/aurelionsol`.
- The browser tab on `/champions/yasou` reads "Champion not found · Riftwatch". Screenshot: `live/not-found-title.jpg`.
