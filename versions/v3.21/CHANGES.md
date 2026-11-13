# v3.21 — 13 Nov 2026

## Live check (before)
- Ladder loads (Kaori#EUW33 #1, 4,351 LP). Champion API about 70 ms.
- Ahri's champion page gets 83 matchups, 49 with fewer than 8 games. Checked how they're shown: greyed out with a "*" and a "only N games" tooltip, and the Hardest/Easiest tabs only use matchups with enough games. Honest already; nothing to change.

## Accessibility audit
- **Reduced motion:** the site has 10 CSS animations (fades, slides, growing bars, the live pulse, image zoom-ins) and **no `prefers-reduced-motion` handling**. Visitors who turn on "reduce motion" (for motion sickness or vestibular disorders) still got every animation.
- **Keyboard focus:** tabbed through 25 stops on 5 pages (home, tier list, champion, draft, profile). Every focusable control shows focus: an outline, the gold border on search fields, or the raised background on the region picker. No change needed.

## Added
- **"Reduce motion" support** (`src/index.css`): with the system setting on, all animations and transitions finish instantly and content appears in its final state (WCAG 2.3.3). Checked in Playwright: champion page bar animation 0.9 s → 0.01 ms, page fade 0.36 s → 0.01 ms, image fade 0.55 s → 0.01 ms; without the setting nothing changes.

## Checks
- 67 tests pass; typecheck, build and a11y check clean. Demo screenshots in `demo/`.

## Live check (after deploy)
- Deployed 13 Nov 2026 13:50 (deploy.log EXIT CODE 0).
- `/champions/ahri` live stylesheet contains the `@media (prefers-reduced-motion: reduce)` rule (read from the page's CSS; the check browser itself doesn't ask for reduced motion, so the page looks unchanged there, as intended). Nothing to screenshot this round: the change is invisible unless the setting is on.
