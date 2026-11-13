# v3.24 — 13 Nov 2026

## Found in the v3.23 live check
- Header search "tf": the champion row read "Twist…". The role tags ("Mage · Marksman") and the "Champion" badge sat beside the name and took its room.

## Fixed
- The champion's class moves to the line under the name ("Mage · Marksman · The Card Master"), so the name keeps the row's width.
- On phones the "Champion" badge shows only its icon (the word stays for screen readers), because the dropdown is narrow there.
- Checked in Playwright with "tw": "Twisted Fate" is no longer cut on desktop (1280 px) or iPhone 13 (`demo/search-tw-*.png`).
- Also checked the tier list's "Weak against" icons: they already have alt text and a tooltip ("Ahri vs Zed"). No change.

## Checks
- 69 tests pass; typecheck, build and a11y check clean.

## Deploy
- Built while the link to the PC was down (the remote-device connection failed after the user got home), so the copy to the project folder and the deploy wait until it's back.
