# v3.200: friendly offline and server-error messages

## Found (phone, 390 px; failures simulated with Playwright `route`)
- **Profile with the network down:** "Can't reach the Riftwatch server. Is it running? Start it with "npm run dev"". That is a local-development hint, and the production build showed it to real visitors.
- **Champion page with a non-JSON 500:** "The server responded with 500." with no way to retry.
- **Match list with a Riot 503** (a JSON error body): the message and the Try again button were already fine.

## What changed
- **`api.ts`:**
  - No response at all (status 0): "Can't reach Riftwatch. Check your connection and try again." The "npm run dev" hint is kept only under `import.meta.env.DEV`. Checked: the production bundle no longer contains "npm run dev".
  - Error without a JSON body: "Riftwatch couldn't load this (error N). Try again in a moment."
- **`ErrorState`:** in other languages, status 0 uses the new key `error.offline.body`, in all 7 languages, instead of the "Riot's servers didn't answer" text.
- **Champion page:** its `ErrorState` gets `onRetry={() => q.refetch()}`, so it shows Try again.
- **Left as is:** in German, a bare 5xx still uses the generic "Riots Server haben nicht richtig geantwortet" text (`error.UPSTREAM.body`). In practice nearly all such errors come from Riot.

## Also checked
- What's new on a phone: 12 entries per page, then "Show older updates (180 more)". It reads fine despite 70+ entries today.

## Checks
- Playwright, English and German: the offline and champion-500 alerts show the new text plus Try again.
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/offline-phone.png`, `demo/champion-500-phone.png` and `demo/`.

## Live
- Deployed 22:13 local. The live bundle has `3.200` and the new offline message, and no "npm run dev" anywhere.
