import type { LeagueEntry, MatchSummary } from '../../shared/types';
import { me, result } from './stats';
import { t } from '../i18n';
import { pct } from './format';
import { ROLE_LABEL } from '../components/ui/RoleIcon';

export interface PlayerTag {
  id: string;
  label: string;
  tone: 'good' | 'bad' | 'neutral';
  detail: string; // tooltip / accessible description
}

/**
 * Riot's developer policy forbids shaming players on any metric, recent form included,
 * so every tag here either honours a player or states a neutral fact. No negative tags.
 *
 * Quick-read labels in the spirit of Porofessor and op.gg: streaks, one-tricks, mains,
 * standout habits. Only claims a tag when there are enough games to back it up.
 */
export function playerTags(opts: {
  matches?: MatchSummary[];
  puuid: string;
  solo?: LeagueEntry;
  level?: number;
  champName?: (id: number) => string;
}): PlayerTag[] {
  const tags: PlayerTag[] = [];
  const { matches = [], puuid, solo } = opts;
  const games = matches.flatMap((m) => {
    const p = me(m, puuid);
    return p && !m.remake ? [{ m, p, r: result(m, p) }] : [];
  });

  // Current streak (newest first).
  if (games.length) {
    const first = games[0].r;
    let n = 0;
    for (const g of games) {
      if (g.r !== first) break;
      n++;
    }
    if (n >= 3 && first === 'win') tags.push({ id: 'wstreak', label: t('tag.wstreak', { count: n }), tone: 'good', detail: t('tag.wstreak.detail', { count: n }) });
  }
  if (solo?.hotStreak && !tags.some((t) => t.id === 'wstreak')) tags.push({ id: 'hot', label: t('tag.hot'), tone: 'good', detail: t('tag.hot.detail') });

  if (games.length >= 8) {
    const byChamp = new Map<number, number>();
    const byRole = new Map<string, number>();
    let k = 0,
      d = 0,
      a = 0,
      mvp = 0,
      share = 0,
      shareN = 0,
      vision = 0,
      minutes = 0;
    for (const { m, p } of games) {
      byChamp.set(p.championId, (byChamp.get(p.championId) ?? 0) + 1);
      if (p.position) byRole.set(p.position, (byRole.get(p.position) ?? 0) + 1);
      k += p.kills;
      d += p.deaths;
      a += p.assists;
      if (p.badge === 'MVP' || p.badge === 'ACE') mvp++;
      if (p.position !== 'UTILITY') {
        const team = m.participants.filter((x) => x.teamId === p.teamId).reduce((s, x) => s + x.damage, 0);
        share += p.damage / Math.max(1, team);
        shareN++;
      }
      vision += p.visionScore;
      minutes += m.duration / 60;
    }
    const n = games.length;
    const [topChamp, topCount] = [...byChamp.entries()].sort((x, y) => y[1] - x[1])[0];
    if (topCount / n >= 0.6 && opts.champName) tags.push({ id: 'otp', label: t('tag.otp', { champion: opts.champName(topChamp) }), tone: 'neutral', detail: t('tag.otp.detail', { count: topCount, total: n, champion: opts.champName(topChamp) }) });
    const roleTop = [...byRole.entries()].sort((x, y) => y[1] - x[1])[0];
    if (roleTop && roleTop[1] / n >= 0.7) tags.push({ id: 'main', label: t('tag.main', { role: ROLE_LABEL[roleTop[0]] }), tone: 'neutral', detail: t('tag.main.detail', { count: roleTop[1], total: n, role: ROLE_LABEL[roleTop[0]] }) });
    const kda = (k + a) / Math.max(1, d);
    if (kda >= 4) tags.push({ id: 'kda', label: t('tag.kda'), tone: 'good', detail: t('tag.kda.detail', { kda: kda.toFixed(2), total: n }) });
    if (shareN >= 6 && share / shareN >= 0.3) tags.push({ id: 'carry', label: t('tag.carry'), tone: 'good', detail: t('tag.carry.detail', { share: pct(share / shareN) }) });
    if (vision / minutes >= 1.6) tags.push({ id: 'vision', label: t('tag.vision'), tone: 'good', detail: t('tag.vision.detail', { value: (vision / minutes).toFixed(2) }) });
    if (mvp / n >= 0.35) tags.push({ id: 'mvp', label: t('tag.mvp'), tone: 'good', detail: t('tag.mvp.detail', { count: mvp, total: n }) });
  }

  if (solo) {
    const g = solo.wins + solo.losses;
    const wr = g ? solo.wins / g : 0;
    if (g >= 20 && wr >= 0.62) tags.push({ id: 'winrate', label: t('tag.winrate'), tone: 'good', detail: t('tag.winrate.detail', { rate: pct(wr), total: g }) });
    if (solo.veteran) tags.push({ id: 'veteran', label: t('tag.veteran'), tone: 'neutral', detail: t('tag.veteran.detail') });
    if (solo.freshBlood) tags.push({ id: 'fresh', label: t('tag.fresh'), tone: 'neutral', detail: t('tag.fresh.detail') });
  }
  return tags;
}
