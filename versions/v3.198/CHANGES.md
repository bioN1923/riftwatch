# v3.198: the changelog stays out of the first load

## What changed
- **Why:** the build output showed a 48.6 kB `changelog-*.js` chunk (16.4 kB gzipped). Every page pulled it in at startup, because `Layout` (the "What's new" dot) and `ddragon.ts` (the static-data cache key) imported `CHANGELOG` only to read `CHANGELOG[0].version`.
- **`vite.config.ts`:** `define: { __APP_VERSION__ }` comes from `package.json` ("3.198.0" becomes "3.198", the changelog's form).
- **New `src/version.ts`:** exports `APP_VERSION`, with a guarded fallback "0" outside Vite, such as in Vitest.
- **New `src/lib/version.ts`:** holds `newerThan`. `data/changelog.ts` re-exports it.
- **`Layout` and `ddragon.ts`:** use `APP_VERSION`. Only the What's new page imports `CHANGELOG`, and its text now ships inside that page's lazy chunk.
- **New test:** `package.json`'s version must equal the newest changelog entry, so the two can't drift apart. 187 tests pass.

## Checks
- **Build:** no separate changelog chunk. The changelog text appears only in `Changelog-*.js`, which isn't preloaded by `index.html`. `api-*.js` carries `3.197` (the build before the bump).
- **Playwright (phone):** the champion page loads 36 JS files, none of them the changelog. `/changelog` still lists its entries.
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`.
