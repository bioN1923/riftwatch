# v3.169: Team draft phone polish

## What changed
- **"Done" button:** on a phone, opening "Add a champion" in Team draft shows a tall champion grid. It stayed open until the team was full, and the add button disappeared, so the only way past it was scrolling. A small "Done" button above the grid now closes it, and "Add a champion" comes back. New string `td.done` in all 7 languages.
- **Readable links:** both draft pages built their URLs with `URLSearchParams`, which writes commas as `%2C` (`?allies=leesin%2Cjinx`). Passing the string to `setSearchParams` didn't help, because React Router parses and re-encodes it. Both pages now `navigate({ search })` with the commas restored, so shared drafts read `?allies=leesin,jinx&enemies=zed`. Reading still goes through `useSearchParams`, which accepts either form, so old links keep working.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Phone test (390 px, touch):
  - adding Jinx gives `?role=MIDDLE&allies=leesin,jinx&enemies=zed`;
  - after "Done" the grid is gone and the add button is back;
  - the lane draft keeps `?pool=ahri,syndra`.
- Screenshots: `demo/` and `demo/team-draft-phone-done.png`.

## Live check (2026-11-16 14:56 local)
- The live index serves `index-DXcZFosc.js`, and its TeamDraft chunk contains `td.done`.
