# v3.51: phone sweep, bigger tap targets

## The sweep
I ran a script over 15 pages on the iPhone SE demo: home, tier list, champion, matchup, profile (overview, stats, live), compare, ladder, multi-search, draft, Arena tier list, changelog, privacy and API usage. It checked two things.
- **Horizontal overflow:** none on any page. Only elements outside a scrollable container counted.
- **Tap targets under 24 × 24 px** (WCAG 2.2, 2.5.8). Real ones found:
  - **Table sort buttons** (tier list and Stats tab champion table): 15 px tall, and the "#" column was 8 px wide.
  - **Profile queue filter:** the "All" button was 16 px wide.
  - **Stats tab trend metric buttons:** 22 px tall.
  - **Draft pool "remove" buttons** on the champion icons: 18 × 18 px. Draft "Change" link: 18 px tall.
  - **Not changed, because they fall under the exceptions:** inline text links ("privacy policy"), the visually hidden skip link, and ladder names in 40-px rows (enough space around them).

## Changes
- **Sort buttons:** `min-h-[24px] min-w-[24px]`, with padding offset by a negative margin so the table rows don't grow.
- **Queue filter:** `min-w-[24px]` and `pt-1` on each button.
- **Trend chips:** `min-h-[24px]`.
- **Draft pool remove:** `size-[24px]` with a slightly bigger icon. "Change" gets `py-1 -my-1`.
- Exact px values are used because `size-6` came out at 22 px here (the site's root font size).

## Checks
- **Re-sweep:** the tier list and Stats tab have no small targets left except the hidden skip link. On draft, only links inside text rows remain.
- 94 tests pass, typecheck clean, a11y `{}`, standard screenshots in `demo/`.
