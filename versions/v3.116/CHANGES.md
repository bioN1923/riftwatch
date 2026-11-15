# v3.116 — Installable as an app

**Why.** Players check stats from their phone between games; op.gg and others are a tap away from the home screen. Riftwatch had only an SVG favicon, so "Add to home screen" gave a screenshot tile and no name.

**What.**
- `public/manifest.webmanifest`: name, short name, standalone display, dark background/theme colours matching `--bg`, icons, and shortcuts (Champions, Ladder, Draft helper). Linked with `crossorigin="use-credentials"` so it also loads behind the site's basic auth.
- Icons rendered from the favicon mark: 192 px, 512 px, a 512 px maskable one with the mark inside the safe zone, and a 180 px `apple-touch-icon` for iOS.
- `theme-color` for dark and light, so the mobile browser bar matches the page.
- No service worker (no offline caching to go stale against live data).

**Checks.** Demo: manifest served as `application/manifest+json`, Chrome's `Page.getAppManifest` reports no errors and `getInstallabilityErrors` is empty. a11y `{}`. Icon: `demo/icon-512.png`.

## Live check (2026-11-15 23:41 local)
- `/manifest.webmanifest` → 200, `application/manifest+json`, short name "Riftwatch", 3 icons, 3 shortcuts; `/icon-512.png` → 200; live index links the manifest and both theme colours.
- Arena: 163 games (151 at 21:32 UTC); health `arena` queue 1750, 998 players lined up, no probes needed.
