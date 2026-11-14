# v3.76 — Recent games strip on phones

Phone check of the profile header: the 20 recent-game icons ran past the right edge. Only 10½ were visible, with no hint that the strip scrolls sideways.

## Change
- `ProfileHeader.tsx`: on phones the strip is a 10-column grid (two rows of ten, newest first). From the `sm` breakpoint up it's the same single scrolling row as before.

## Checks
tsc clean · 119 tests pass · a11y `{}` · demo `phone-form-strip.png` (iPhone 13: two full rows above "9–9 in the last 20").
