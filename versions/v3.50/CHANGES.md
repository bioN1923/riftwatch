# v3.50: compact profile header on phones

## Changes (phones only, below 640 px; `sm` and up unchanged)
- **Profile icon:** 60 px instead of 92 px, aligned to the top, with a tighter gap. The level badge is `text-xs`.
- **Name:** `text-3xl` instead of `text-4xl`, and the tag `text-xl`.
- **Buttons in one row:**
  - Update keeps its label;
  - **Copy link** and **Compare** are icon-only, with the label kept for screen readers (`sr-only`) and as a `title` tooltip;
  - the short "Copied" confirmation still shows as text;
  - "Updated … · next update in …" moves to its own line under the buttons.

## Measured (demo profile Caps#EUW, dark theme)
| Device | First match card, before | After |
|---|---|---|
| iPhone SE | y = 733 | **y = 631** (−102 px) |
| iPhone 13 | y = 679 | **y = 631** (−48 px) |

On iPhone SE the profile tabs are now on the first screen.

## Checks
- 94 tests pass, typecheck clean, a11y `{}` (icon-only buttons keep their accessible names), no horizontal overflow.
- Screenshots in `demo/`: `before-phone-profile-*` and `phone-profile-*` for iPhone SE and iPhone 13, plus the standard set.
