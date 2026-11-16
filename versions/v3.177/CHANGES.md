# v3.177: "Copy link" on the draft helpers

## What changed
- **Why:** both draft pages keep the whole draft in the URL (role, picks, enemy, team), and since v3.169 those links read cleanly. But sharing one with teammates during champion select meant selecting the address bar.
- **Shared button:** `CopyLink` moved from `ProfileHeader.tsx` into `src/components/ui/CopyLink.tsx`, so the draft pages don't pull in the profile header's code.
  - **Team draft:** the button sits at the right of the role row once an ally or enemy is added.
  - **Lane draft:** it shows once an enemy laner or teammates are set.
  - It copies the address without any `#hash` and confirms with "Copied", the same as on profiles.
- **Also checked:** the ARAM tier list (patch movers, tiers and bars) and the lane draft's blind-pick panel at 390 px both read well; no change.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Click test with clipboard permission:
  - the copied text is `/draft/team?role=MIDDLE&allies=leesin,jinx&enemies=zed`;
  - an empty team draft shows no button;
  - the profile header still has its button.
- Screenshots: `demo/team-draft-copy.png` and `demo/`.
