# v3.89 — Rate limits retry on their own

**Why.** In the v3.88 live check the first profile load hit "Too many requests right now" (the shared dev key). The panel told people to try again "in a moment" but didn't say when, so people press *Try again* early — which only adds to the load — or give up. Also, TanStack Query was retrying a 429 once immediately, ignoring Retry-After.

**What.**
- `ErrorState` gets an `onRetry` prop. For a `RATE_LIMITED` error it shows "Trying again in N seconds…" (polite live region), waiting the server's Retry-After (kept between 3 s and 60 s; 10 s when none), then calls `onRetry`. At most **two** automatic retries per page within two minutes — the count lives outside the component, because a retry can re-mount the panel. After that the manual *Try again* button stays.
- Without an `action`, the panel now shows a *Try again* button itself when it has `onRetry`.
- Wired into the profile (header and match list), ladder, champion tier list, Duo and the match-details timeline gate.
- Query client: no instant retry for `RATE_LIMITED` (the panel waits instead).
- Strings in seven languages; `tests/retryDelay.test.ts` (130 tests).

**Checks.** tsc, tests, build, a11y `{}`. Playwright with a mocked 429 (Retry-After 4 s): one failure → countdown, then the profile loads at ~4 s (2 requests). Nine failures → requests at 0.2 s, 4.3 s, 8.3 s, then it stops and leaves the button (3 requests). Shot: `demo/rate-limit-countdown.png`.

Found on the way: the production server reads `dist/index.html` once at start, so the demo server must be restarted after every build (a stale index → 404 on the new bundle).

## Live check (2026-11-15)
Deployed 16:16 (local). riftwatch.fly.dev/changelog lists v3.89; the live bundle carries the countdown string and the rate-limit handling. A real 429 wasn't provoked on purpose (it would spend the shared key's budget for everyone); the behaviour was verified against the demo server with a mocked 429 (see above). Arena tier list: still 0 matches.
