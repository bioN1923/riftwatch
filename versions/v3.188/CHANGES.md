# v3.188: draft helpers keep keyboard focus

## What changed
- **Why:** in a keyboard-only test of the team draft, pressing Enter on "Add" dropped focus to `<body>`, so the next Tab started again at "Skip to content". The button unmounts when the grid opens. The same happened with "Done", every remove button, a grid tile picked with Enter, the lane draft's enemy pick and its "Change" button, and the pool's remove buttons.
- **The fix:** each control that disappears now hands focus on.
  - **Team draft (`TeamPanel`):**
    - "Add" opened from the keyboard focuses the grid's search box.
    - "Done" focuses "Add".
    - Removing a pick focuses the next pick's remove button, or "Add" when none is left.
    - Filling the team focuses its last remove button.
  - **`ChampionGrid`:**
    - New `autoFocus` prop.
    - `onPick(id, viaKey)`.
    - A tile picked from the keyboard returns focus to the search box.
  - **Lane draft:**
    - An enemy picked from the keyboard focuses "Change".
    - "Change" from the keyboard focuses the grid search.
    - The pool's "Add" from the keyboard focuses the search.
    - Removing from the pool focuses its "Add".
- **Keyboard detection:** `event.detail === 0` on a click means it came from Enter or Space.
  - A tap or click doesn't move focus into the search box, so phones don't open the on-screen keyboard over the grid. Checked with a Playwright tap: focus stays on body.
  - A fresh page load doesn't move focus either.

## Checks
- Keyboard run (Playwright, recorded in the run log): every step above landed on the expected element.
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`.

## Live
- Deployed 18:37 local. The live bundle has v3.188 and the new changelog line.
