# v3.230: Name#TAG in links; multi-search small samples

## Checked first (from the v3.229 note)
- Role labels with German: `ROLE_LABEL` is translated (`role.*` keys).
  - German, French, Spanish and Polish use the community's English role names on purpose (Top/Jungle/Mid/Bot/Support), with Junglă/Jungla where it applies.
  - Romanian has "Suport", and Portuguese has Topo/Selva/Meio/Suporte.
- The language switch in a link is `?lang=`, not `?hl=`, so the v3.229 test simply didn't switch language. Nothing to fix.

## Found
- A multi-search link written by hand, `/multisearch?players=Caps%23EUW,…` (the Riot ID's own `#`, encoded), opened an empty page: "No Riot IDs found yet".
- `fromSlug` only knew our `Name-TAG` form. The same goes for any slug read from a link.
- Multi-search player cards showed "2 games · **100%**" in bold, the last place that small-sample rule hadn't reached.

## What changed
- **`fromSlug`:** if the decoded text has a `#` (which can't appear in a name), split there; otherwise split at the last `-` as before. Both parts are trimmed.
  - A name with a hyphen ("Some-Name#EUW") still parses correctly.
- **Multi-search:** a champion's win rate from fewer than `TONE_MIN_GAMES` (5) games is `text-faint`, not bold.
- **Test:** `fromSlug` handles `Name-TAG`, encoded spaces, `%23`, a hyphenated name with `#`, and rejects input with no tag.

## Checks
- `tsc` and `vite build` pass.
- `vitest`: 193 (+1).
- a11y: `{}`.
- `demo/14-multisearch-hash-link.jpg`: the `%23` link now loads all 5 players.

## Live check (09:55 local)
- `3.230` is in the live JS bundle.
