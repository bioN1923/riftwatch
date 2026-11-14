# v3.69 — Compare: players without a clear main role

Follow-up from the v3.68 live check. lickit#28cm spreads games over several roles, so the "different roles" rule, which needs both players at ≥ 60% in one role, didn't apply. Damage and vision were still scored against a jungler.

## Change
- `src/lib/compare.ts`:
  - `topRole()`: a player's most played role and its share.
  - `roleGap(a, b)`: role-dependent rows can't be scored fairly when:
    - both have clear mains (≥ 60%) that differ → `different`;
    - one is spread over several roles and their most played role isn't the other's → `flex`, naming that player, role and share.

    Players whose most played role is the same still compare fully.
- `Compare.tsx` uses `roleGap`. The `flex` case shows "{name} plays several roles (most often {role}, {share} of games)…", and only win rate and KDA get a winner.
- String `cmp.rolesFlex` in 7 languages. 2 new tests (114 total).

## Checks
tsc clean · a11y `{}`. Every demo player has a clear main, so the flex case is covered by the unit tests and the live check.
