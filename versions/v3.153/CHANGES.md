# v3.153: damage key in game details

## What changed
- **Why:** in an expanded game's "Post game" table, each player's Damage cell has two numbers with bars: dealt (red) on top, taken (grey) below. Only a hover `title` said which was which, so on touch screens, or at a glance, the second number (often larger, for tanks) read as unexplained.
- **Key:** the Damage header now has a small key under it: red swatch "dealt", grey swatch "taken". The swatches are `aria-hidden`, and the text is `text-muted` for contrast.
- **Strings:** `pg.dealtShort` and `pg.takenShort` in all 7 languages.
- **Screenshot fix:** expanding a row in the screenshot script now targets the row's own button: `article[aria-label]` → `button[aria-expanded]`.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/` and `demo/damage-key.png`.
