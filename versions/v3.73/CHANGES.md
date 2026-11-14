# v3.73 — Multi-search lobby summary

An idea from lobby tools like Porofessor: before champion select, the useful questions are how strong the lobby is, who plays what, and where people will clash.

## Change
- `src/lib/lobbyRoles.ts`:
  - A player "mains" a role when it's at least half of their last 10 ranked games (and they have at least 3 games). Everyone else counts as having no clear main.
  - It returns the mains by role, the roles two or more people main (`clash`), and the roles nobody mains (`open`). 2 tests.
- `src/lib/ladder.ts`: new `averageRank()`, moved out of the live-game page, which now uses it too.
- `MultiSearch.tsx` `LobbySummary`: one panel above the cards, e.g. "Average rank Platinum I · Top Hans, Jankos · Jungle Caps · Bot Mikyx · Support Rekkles". Below it: "More than one main for Top, so someone will be off-role. Nobody mains Mid."
  - It uses the profile and match data the page already loads, so there are no extra API calls.
  - It waits until every player has loaded, and shows "(n of N ranked)" when some players are unranked.
- Strings `ms.lobby*` in 7 languages.

## Checks
tsc clean · 118 tests pass · a11y `{}` · demo `lobby-summary.png`.

## Live check (2026-11-14 15:25) and fix
- The deploy at 15:23 was clean, but the live check found a bug: bioN1923, lickit#28cm and a misspelled third ID (not found) gave two cards and no summary. The summary waited for every profile, and a not-found one never arrives.
- Fix: it waits only for players still loading. Players not found, or whose matches failed, are left out. Redeployed.
- After the fix (deployed 15:25), the same lobby shows "Average rank Silver II · Jungle bioN1923 · no clear main: lickit", with the not-found player left out. Screenshot: `live/lobby-summary.jpg`. Loaded by URL only, so nothing was saved to the user's recent lobbies.
- Follow-up: with just 2 players, "Nobody mains Top, Mid, Bot, Support" is noise. Only list open roles once a lobby is nearly full (4+ players).
