# v3.44: premades in multi-search

## Live check
- **Multi-search** on the live site (5 players: 4 real EUNE accounts plus 1 made-up name) works well: cards, last-10 strips, tags, and "Not found on this server" for the fake name.
- **Missing:** Porofessor's best-known feature, spotting premades. A lobby with a duo plays differently, and Riftwatch already loads each player's last 10 ranked games, which is all that's needed.

## Changes
- **`src/lib/lobbyDuos.ts` `lobbyDuos(players)`:**
  - pools all loaded games, so a game in two players' lists counts once;
  - for every pair, counts the games on the **same team** (remakes skipped), with wins;
  - a pair needs **2+ games**, because one shared game can be matchmaking chance.
- **`MultiSearch.tsx`:**
  - the page reads the same profile and match queries the cards already run. They're shared through the cache, so there are **no extra API calls**.
  - each card gets neutral tags "Premade with {name}", listed first, with the tooltip "Same team in 3 of their recent ranked games (2 won): likely queued together".
- **Privacy:** only players already shown in the lobby are paired, from public match data. Hidden profiles fail to load and are never paired.
- Strings `ms.duo` and `ms.duoTip` in 7 languages.
- Tests: 90 pass (2 new): pooled counting, opponents ignored, a single game ignored, remakes and unloaded players ignored.

## Checks
- Typecheck clean, a11y `{}`.
- Demo lobby Caps, QuietDrake, ShyWard and Faker: Caps and QuietDrake shared 3 games and get "Premade with …" on both cards. ShyWard shared 2 games with Caps in Caps's list, but the demo's ShyWard profile is a different generated account, so there's correctly no tag.
- Screenshot: `demo/multisearch-premades.png`.
