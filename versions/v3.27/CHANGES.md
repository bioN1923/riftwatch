# v3.27 — 13 Nov 2026

## Live check (before)
- v3.24–v3.26 are live (the user deployed at 18:24). `/changelog` lists v3.26 first; the tier list's "My pool" works.
- The `lang` attribute follows the chosen language (already set in `src/i18n` and on the server). Nothing to change.

## Added
- **Profiles: "Try next"** (sidebar, under Patch watch). Up to 3 champions the player hasn't played in their recent games that:
  - play their main role (the role of their most-played champion),
  - share a class with one of their top 3 champions in that role ("Like Syndra · Mage"),
  - are tier A or better this patch, with a real sample (no low-sample rows).
- Each links to the champion page for that role and shows its tier and win rate.
- Needs at least 3 games on the main champion; otherwise the panel doesn't show.
- It suggests champions and says nothing about the player, so it's fine under Riot's rule against negative labels.
- Logic in `src/lib/tryNext.ts`. Translated in all 7 languages; class names use the existing translated class labels, not lowercased (German capitalises nouns).

## Checks
- 72 tests pass (new: picks only strong, unplayed, same-role, same-class champions with real samples; needs a real main). Typecheck, build and a11y check clean.
- Demo profiles: Humanoid → Hwei (S+) and Mel (A), both "Like Syndra · Mage"; Faker (support) → Thresh "Like Lux · Support"; two profiles with no match → no panel (`demo/tn-*.png`).
