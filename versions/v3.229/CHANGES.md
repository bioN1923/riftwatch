# v3.229: one row of role tabs on phones

## Found
- On an iPhone 13 (390 px), the Draft helper's role tabs wrapped to Top / Jungle / Mid / Bot, with Support alone on a second line.
- That pushed the enemy picker down and made Support look like a separate control.
- The team draft uses the same tabs.

## What changed
- **`Draft.tsx` and `TeamDraft.tsx`** role tablists:
  - Below `sm`, a 5-column grid with the icon above a `text-xs` label (truncated if a language's label is long).
  - From `sm` up, the same inline buttons as before.
- Roles, ARIA (`role="tab"`, `aria-selected`) and click behaviour are unchanged.

## Checks
- `tsc`, `vitest` (192) and `vite build` pass.
- a11y: `{}`.
- Playwright element shots on iPhone 13 and iPhone SE (375 px) for both pages (`demo/14-phone-role-tabs.png`): all five fit in one row.

## Live check (09:45 local)
- `3.229` is in the live JS bundle.
