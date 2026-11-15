# v3.122 — Multi-search: add the default tag to untagged names

**Why.** Pasting a lobby without tags (for example "Caps joined the lobby", or names copied from a stream or chat) gave only "No Riot IDs found yet". A Riot ID needs its tag, but most players keep the default one their server gave them (#EUW, #NA1, #KR1…). op.gg's multi-search accepts names this way too.

**What.**
- `src/lib/lobby.ts`:
  - `untaggedNames(text)` takes each line or comma piece without a `#`, strips the English "joined the lobby" ending, and skips "left the lobby" lines.
  - It keeps only 3–16 character names, the length of a Riot game name, so sentences are ignored.
  - Duplicates are dropped, ignoring case.
- `withDefaultTag(text, tag)` rewrites the box: tagged IDs stay as they are, untagged names get `#tag`, one per line.
- Multi-search: under the found or none line, a small box reads "4 names have no #tag, so they can't be looked up yet: Caps, Rekkles, Jankos, Bwipo", with an **Add #EUW, the server's default tag** button. The tag follows the selected region (`defaultTag` in `shared/regions.ts`).
- Nothing is looked up until the user presses Scout. The tag is a suggestion they can see and edit, not a guess made silently.
- Strings `ms.untagged` and `ms.addTag` in 7 languages, with plural forms.

**Checks.**
- tsc passes; 163 tests pass (3 new in `tests/lobbyUntagged.test.ts`).
- a11y `{}`.
- Demo: pasting 5 lobby lines (one of them a leaver) gives 4 untagged names. Clicking the button turns them into "Caps#EUW…Bwipo#EUW", Scout becomes "Scout 4 players", and 4 cards load. No page errors.

Screens: `demo/multi-untagged.png`, `demo/multi-after.png`.
