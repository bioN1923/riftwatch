# v3.125 — "Install app" in the footer

**Why.** v3.116 made Riftwatch installable, but on desktop the only way to install was a small icon in Chrome's address bar that few people notice, and Android shows its banner only when it decides to. A visible, quiet button helps without nagging anyone.

**What.**
- `src/lib/install.ts`:
  - catches `beforeinstallprompt` (stopping the browser's automatic banner) and keeps the event;
  - `useCanInstall()` (a `useSyncExternalStore`) is true while an offer is waiting;
  - `promptInstall()` opens the browser's own dialog and uses the offer up;
  - `appinstalled` clears it.
- Footer: an **Install app** link-style button, gold with a download icon, shown only while an offer is waiting. Safari and Firefox never send the event, so they never see it. The footer nav now wraps on narrow screens. String `footer.install` in 7 languages.
- Demo fix found while reviewing match details: the timeline of a remake (a 3:44 demo game) listed Baron at 3:14 and Herald at 15:08, after the game had ended. `mockTimeline` now drops events outside the game's length. This was demo-only; real timelines come from Riot.

**Checks.**
- tsc passes; 166 tests pass.
- a11y `{}`.
- Playwright:
  - no button by default;
  - after a synthetic `beforeinstallprompt`, the button appears; clicking it calls `prompt()` and the button goes away;
  - the remake timeline (224 s) has 0 events after the end.
- No page errors.

Screen: `demo/footer-install.png`.

## Live check (2026-11-16 01:19 local)
- The live index serves `index-DJg5QM6p.js`, which contains the install handling.
- Whether Chrome actually offers the install on the live site wasn't checked: that needs the open tab reloaded, and the check stayed API-only. Chrome decides on its own whether to offer an install, and the site's basic auth may affect that.
- Arena: 382 games.
