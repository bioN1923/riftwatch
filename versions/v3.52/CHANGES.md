# v3.52: keyboard pass

## The pass (Playwright, 1280 px)
- **Tab order:** I pressed Tab 45 times on each of 8 pages (home, tier list, champion, profile, draft, ladder, multi-search, compare) and recorded, for each focused element, whether it shows a focus indicator and whether it can be seen.
  - Buttons and links all have a ring. **Text inputs and the header search did not:** they only switched their 1-px border to gold, a weak signal on the dark theme.
  - **Ladder:** the "Find a player" form had a visually hidden submit button that was still a Tab stop, so focus landed on something invisible.
- **Escape:**
  - closes the language menu and gives focus back to its button;
  - closes the header search suggestions with focus staying in the input;
  - closes the phone Tools menu.
  - All three already worked; no change needed.

## Changes
- **All text inputs** (compare, multi-search textarea, ladder find, goals): `focus:ring-2 focus:ring-gold/50` added on top of the gold border.
- **Header search box:** `focus-within:ring-2 focus-within:ring-gold/50` on the wrapper, so the ring shows whether the region menu or the text field has focus.
- **Ladder:** the hidden submit button gets `tabIndex={-1}`. Enter still submits, and screen readers still find it in the form.

## Checks
- 94 tests pass, typecheck clean, a11y `{}`.
- Every ladder Tab stop now has a size.
- Focus ring screenshot: `demo/focus-input.png`. Standard set in `demo/`.
