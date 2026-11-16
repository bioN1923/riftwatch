# v3.179: team draft teams as one row on phones

## What changed
- **Why:** on a 390 px phone, each picked champion took half a row. With all 4 allies and 5 enemies filled in, the two team panels ran five rows deep, and "Best picks" started about one and a half screens down.
- **`TeamPanel` (phones only, below `sm`):**
  - The list is a 5-column grid: one slot per champion, with the portrait over a short name that is truncated if needed.
  - The remove button sits on the slot's corner as a 24 px round badge.
  - The "Add" slot is a dashed square with a plus. Its label is kept for screen readers.
- **`sm` and up:** unchanged; the chips still show the name inline and wrap.
- **Result:** both teams fit on the first phone screen, and the "Best picks" heading starts right below.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`. The a11y run covers `/draft/team` with picks.
- Screenshots:
  - `demo/td-phone-full.png`, `demo/td-phone-part.png`, `demo/td-desktop.png`
  - `demo/`

## Live
- Deployed 16:59 local. The live bundle has v3.179 and the new changelog line.
