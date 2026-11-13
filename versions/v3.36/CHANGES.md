# v3.36: champion addresses forgive typos and nicknames

## Changes
- `guessChampion(slug, champs)` in `src/lib/champSearch.ts` handles mistyped addresses.
  - **Sure** (the page redirects with `replace`, keeping `?role=`):
    - a nickname or the name written another way (`mf`, `miss-fortune`, `kai'sa`, `Kai%27Sa`);
    - the only name starting with what was typed (3+ letters).
  - **Suggest** ("Did you mean Yasuo?"): one clear nearest name by edit distance with adjacent swaps, within max(1, ⌊len/4⌋) edits. Nothing is suggested on a tie (`zad` → Zac or Zed) or when no name is close (`xyzzy`).
- Champion page: redirects when sure; otherwise the not-found card shows "Did you mean X?" as the main button, with "Browse all champions" beside it.
- Matchup page: each side is resolved separately. Example: `/champions/tf/vs/asol` → `/champions/twistedfate/vs/aurelionsol`; `/ahri/vs/yasou` → "Did you mean Ahri vs Yasuo?".
- Strings `cp.didYouMean` and `mp.didYouMean` in all 7 languages.
- Tests: 79 pass (2 new).

## Demo check
`mf?role=BOTTOM` → `missfortune?role=BOTTOM` · `miss-fortune` → `missfortune` · `yasou` → "Did you mean Yasuo?" · `xyzzy` → browse only · `ahri/vs/zd` → "Ahri vs Zed?" · `tf/vs/asol` → redirect.

Screenshots: `demo/did-you-mean-phone.png`, `demo/matchup-did-you-mean-phone.png`, plus the standard set.
