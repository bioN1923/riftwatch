# v3.218: chosen runes listed by name

## Found
- On desktop, the full rune page (`RuneTrees`) on champion, matchup and match-detail pages used about 40% of its panel width (`v3.216/demo/04-matchup.jpg`).
- The rest was empty, and the picked runes could only be named by hovering each icon.

## What changed
- **`RuneTrees`:** from `md` up, a fourth column "Chosen runes" lists the picked runes by name, in the order played (keystone first, in gold), then the three stat shards (faint).
  - Names come from the static data (`a.rune(id).name`, `SHARD_INFO`), so nothing is invented. A rune without a name is skipped.
  - The column is `aria-hidden`: screen readers already get each lit icon's name, so this avoids reading them twice.
  - It's hidden on phones, where the trees already fill the width.
- **i18n:** `bp.picked`, "Chosen runes", in 7 languages.

## Checks
- `tsc`, `vitest` (190) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`, matchup page.

## Live check (07:48 local)
- `3.218` is in the live JS bundles.
