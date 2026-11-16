# v3.203: Web Interface Guidelines pass (inputs, taps, preconnect)

## Review
First pass with Vercel's Web Interface Guidelines (the `web-design-guidelines` skill). The rules were fetched fresh from `vercel-labs/web-interface-guidelines` `command.md` and checked against `src` with greps, then in the browser.

Already compliant:
- No `transition: all`, no clickable `<div>`/`<span>`, no `...` in the strings.
- `color-scheme` and per-scheme `theme-color` meta tags are set, and `aria-live` is used on async updates.
- The header search's `outline-none` is replaced by a `focus-within` ring on its wrapper. The menu and profile summary use `outline-none` only as programmatic focus targets (`tabIndex=-1`).

Findings fixed:
- **Forms:** 10 text inputs and the multi-search textarea had no `autoCorrect`/`autoCapitalize`, and most had no `spellCheck`/`autoComplete`. On phones, Riot IDs and champion names got capitalised or autocorrected.
- **Touch & interaction:** no `touch-action: manipulation`.
- **Performance:** no `<link rel="preconnect">` to the asset CDN (`ddragon.leagueoflegends.com`), which almost every page uses.

## What changed
- **Text inputs:** SearchBox, Compare, Champions, Items, Leaderboard, Privacy, both draft inputs, both Duo inputs and the Multi-search textarea all get `autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}`. Attributes some inputs already had were kept once.
- **`index.css`:** `touch-action: manipulation` on a, button, input, select, textarea, label, summary and `[role=button|tab]`.
- **`index.html`:** `<link rel="preconnect" href="https://ddragon.leagueoflegends.com">`.

## Checks
- **Playwright** (phone, touch), on 9 pages: every text input reports `autocapitalize=none autocorrect=off spellcheck=false autocomplete=off`. A button reports `touch-action: manipulation`.
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`.

## Live
- Deployed 22:45 local. The live entry carries `3.203`, and the live `index.html` has the ddragon preconnect.
