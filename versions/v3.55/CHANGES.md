# v3.55: sidebar bottom reachable while scrolling (user request)

## Request (06:44)
"On desktop you can see the bottom of the sidebar only when the whole page is scrolled down, instead of scrolling the sidebar separately."

## Cause
The profile and champion sidebars were `sticky` at `top: 72px`. When a sidebar is taller than the window, its top stays pinned and the rest hangs off the bottom of the screen. Only when the page itself runs out does the sidebar move up and show its last cards (on the demo profile: "Often queues with" and "All-time mastery").

## Fix
- **`src/lib/useStickyTop.ts`:** the pure `stickyTop(h, viewport)` returns 72 when the sidebar fits; otherwise `viewport − h − 16`, a negative top, so the sidebar sticks **by its bottom**.
  - In effect the sidebar scrolls along with the page until its last card is in view, then stays put. Long pages no longer hide the end of it.
  - The `useStickyTop()` hook re-measures with a `ResizeObserver` (cards load in) and on window resize. It uses a callback ref, so it also works when the sidebar mounts after the loading skeleton.
- **Applied to:** the profile sidebar (`ProfileView`) and the champion page sidebar (`ChampionView`).
- **Phones:** unchanged, because the sidebar isn't sticky there.

## Checks
- **Demo at 1440×800:**
  - profile: sidebar 1819 px, top −1035 px; scrolled halfway down a 4219 px page, the bottom of the sidebar is in view;
  - champion: sidebar 990 px, top −206 px; its bottom is in view mid-page too.
  - Screenshot: `demo/sidebar-*-mid-scroll.png`.
- Tests: 97 pass (new: `stickyTop`). Typecheck clean, a11y `{}`.

## Live check (06:54)
- Deployed automatically (EXIT CODE 0, 06:53:55).
- **bioN1923#EUNE:** the sidebar is 1946 px in a 917 px window and gets `top: -1045px`.
- Scrolled to 1800 of 4295 px, the sidebar's bottom ("Often queues with", "All-time mastery") is already in view (`live/profile-mid-scroll.jpg`).
