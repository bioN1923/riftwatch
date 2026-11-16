# v3.161: Team draft (user request)

> "Make a Page where users can input some champions during draft from their team and enemy team and suggest Best Pick for his role with explanations. Sinergy with team picks and counter for enemy"

## What's new
- **Page `/draft/team`** (`src/pages/TeamDraft.tsx`). Linked from the Draft page, from Draft back to it, and from the phone Tools menu.
  - **Inputs:** a role, up to 4 allies and up to 5 enemies, picked with the same searchable champion grid as the Draft page (`ChampionGrid`, now exported). Everything lives in the URL (`role`, `allies`, `enemies` as champion slugs), so a draft can be shared.
  - **Best picks:** the top 6 champions for the role, each as a card:
    - draft score;
    - usual win rate and games;
    - the champion's own strength;
    - up to 5 reasons, strongest first, with the champion icon and a signed effect.
  - **Reason kinds:**
    - *Lane:* the enemy is its usual lane opponent.
    - *Enemy:* anyone else on the enemy team.
    - *With:* a teammate (the usual partner role, or anyone else).
  - **Damage-mix note:** with at least 2 allies, a card can add a damage note ("adds magic damage: your team leans physical"). It is words only and doesn't change the score, since no win-rate data backs it.
  - **From your pool:** if a Draft-helper pool is saved for the role, those champions are ranked for this draft too, and pool champions are tagged in the main list.
  - **Key and note:** a key explains coloured vs grey effects, and a note explains the data and its limits.
- **Server:**
  - **New tallies:** `al` and `en` per champion-role, covering every teammate and every enemy, in any role. They are filled for ranked games as they're read and trimmed to the 100 most common above 120 entries.
  - **`ChampionStatsStore.teamPicks(role, allies, enemies)`:** for every champion with enough games in the role (as blind picks), score = strength (`shrunk(w, g, 150) − 0.5`) + Σ reasons.
    - Lane and partner pairs use the lane (`vs`) and duo (`duo`) tallies when they have `matchupMin` games, with shrink weight K=100 (see the tuning note).
    - Other pairs use `al`/`en` with ≥10 games, K=150.
    - Each reason's delta is `(w − base·g)/(g + K)`, the pair's effect shrunk toward the champion's own rate.
    - `sure` = the raw gap is more than 2 standard errors.
  - **`GET /api/draft/team?role=&allies=&enemies=`:** ids are validated, with at most 4 allies and 5 enemies.
- **Types and strings:** `TeamPicks` and `TeamPickReason` in `shared/types.ts`; `td.*` strings (33 keys) in all 7 languages.
- **Tests:** score equals strength plus reasons; results are sorted; taken champions are skipped; every shrunk effect is at most the raw gap; an unknown role gives no picks.

## Honest limits
- Lane matchups and the usual partner have history from before today. Any-teammate and any-enemy pairs (`al`/`en`) only start filling from games read after this deploy, so until then most cards lean on lane and partner data. The page says so.
- Win rates only. There is no guessing at team-composition rules (engage, peel and so on) the data hasn't seen.
- The demo data's pair effects are random and larger than real ones. The heavier shrinking (K=50/100, raised from 25/40 after the first demo run showed +15 scores built mostly on "could be chance" reasons) keeps scores modest.

## Fixes during the build
- The first wording said "Wins lane into Lee Sin: 49%". The effect is relative to the champion's usual rate, so all reasons now say "better/worse than usual …".
- Uncertain reasons were cluttered with a repeated "could be chance" suffix. They are now grey, with one key above the list.

## Checks
- `tsc`, `vitest` (185) and `vite build` pass.
- a11y: `{}`, with `/draft/team` added to the check.
- Phone: no horizontal scroll at 390 px.
- Click test: adding a champion through the grid updates the URL.
- Screenshots:
  - `demo/team-draft.png` (desktop);
  - `demo/team-draft-phone.png`;
  - `demo/team-draft-add.png`;
  - `demo/` (usual set).

## Tuning after the first live look (13:10 local)
- **Live data:** the endpoint returned 59 mid candidates for allies Lee Sin/Jinx/Leona and enemies Zed/Vi/Kai'Sa/Thresh. Reasons were lane (37) and duo (52) only, since `al`/`en` start empty.
- **The problem:** Ahri ranked #1 on a real effect (into Zed 62% over 127 games), but #2 was carried by a 16-game lane matchup at 81% (+7.2).
- **The change:** shrink weights were raised to K=100 for lane and partner and K=150 for other pairs. The 127-game edge still counts about +6, while a 16-game one drops to about +4, so small samples can't leapfrog well-sampled ones.

## Live check (2026-11-16 13:11 local)
- `/draft/team` serves the app shell.
- `/api/draft/team` for the test draft returns 59 mid candidates. After tuning, #1 is 103 (+9.1: lane +6.1 on 127 games, duo +1.8 on 202), then 105 (+6.6; its 16-game lane edge is now +4.1) and 157 (+6.3).
- Both device copies were checked (`TeamDraft.tsx` present; `LANE_K = 100`) before each deploy.
