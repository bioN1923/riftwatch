# v3.158: rare roles folded on champion pages

## What changed
- **Why:** a light-theme spot check (home, Ahri, ladder; all read well) showed Ahri with five role tabs: Mid 98%, Support 1%, Top 1%, Bot 0%, Jungle 0%. Four were near-empty pages that mostly said "not enough games", and they made the tab strip look like Ahri is a flex pick.
- **Fold rule:** a role is folded when its share is under 2% *and* it has fewer than `LOW_SAMPLE` (10) games (`rareRole`). Folded roles sit behind one "+N more roles" button that shows them all. The role you are on (from the URL or a click) is always shown, even if it's rare.
- **Results:** Ahri now shows "Mid 98% · +4 more roles". Lee Sin shows "Jungle 99%" plus the button. Champions with real flex shares are unchanged.
- **Strings:** `cp.moreRoles_*` plurals in all 7 languages.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: the first run flagged `aria-required-children` because the button sat inside `role=tablist`. The button now sits next to the tablist, and the re-run gives `{}`.
- Click test: after the button, all roles are back.
- Screenshots: `demo/` and `demo/role-tabs.png`.

## Live check (2026-11-16 12:33 local)
- The first deploy (12:31) went out with a stale archive, the pre-fix build with the button inside the tablist, because the re-made `rw-sync-324` was not picked up under the same name. It was re-sent as `rw-sync-324b`/`rw-gitd-324b` and redeployed at 12:33.
- The live index serves `index-DF1sJzsI.js`, and its Champion chunk has `cp.moreRoles` and the outer `mt-6 flex items-center gap-5` wrapper, so the fixed build is live.
- Lesson: never reuse an archive name after amending; always bump the suffix.
