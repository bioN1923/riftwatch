# v3.180: labelled Copy link on the draft helpers

## What changed
- **Why:** on a 390 px phone, the five role tabs wrap, so the Copy link button (v3.177) lands on its own row below them. It showed only a link icon, with nothing to say what it does.
- **`CopyLink`:** new `labelled` prop that keeps the "Copy link" text on phones.
  - The lane draft helper and the team draft use it.
  - The profile header stays icon-only on phones, because space there is tight.
- **Unchanged:** wider screens; the button already showed its text there.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/draft-phone.png`, `demo/team-phone.png` and `demo/`.
- Also looked at the full lane draft helper on a phone (Mid vs Zed). Nothing else needed fixing.

## Live
- Deployed 17:08 local. The live bundle has v3.180 and the new changelog line.
