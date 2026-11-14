# v3.75 — Draft: honest ban suggestions

The draft helper's "Ban for your pool" painted every suggestion red, including Viktor at 49.8%, which is no real edge. The rest of the draft page already uses ranges and "leaning" labels.

## Change
- `src/lib/draft.ts` `banSuggestions`: each ban now carries `games` (the pool's games against that champion) and `sure`. A ban is sure when the top of the 95% Wilson range for the pool's combined win rate is under 50%. Sure bans sort first, then by pool win rate.
- `Draft.tsx` ban cards:
  - Show "Your pool wins 43.6% · 122 games".
  - Leaning bans get a muted rate, a dashed border and the existing "leaning, could still be chance" label.
- 1 new test (119 total).

## Checks
tsc clean · a11y `{}` · demo `draft-bans.png`: Hwei and Mel are clear (red); Viktor at 49.8% over 134 games is leaning (dashed).
