import type { LeagueEntry, MatchSummary } from '../../shared/types';
import { me, result } from './stats';

export interface PlayerTag {
  id: string;
  label: string;
  tone: 'good' | 'bad' | 'neutral';
  detail: string; // tooltip / accessible description
}

const ROLE: Record<string, string> = { TOP: 'Top', JUNGLE: 'Jungle', MIDDLE: 'Mid', BOTTOM: 'Bot', UTILITY: 'Support' };

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
    if (n >= 3 && first === 'win') tags.push({ id: 'wstreak', label: `${n} wins in a row`, tone: 'good', detail: `Won the last ${n} games` });
  }
  if (solo?.hotStreak && !tags.some((t) => t.id === 'wstreak')) tags.push({ id: 'hot', label: 'Hot streak', tone: 'good', detail: 'Riot marks this player as on a ranked win streak' });

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
    if (topCount / n >= 0.6 && opts.champName) tags.push({ id: 'otp', label: `One-trick ${opts.champName(topChamp)}`, tone: 'neutral', detail: `${topCount} of the last ${n} games on ${opts.champName(topChamp)}` });
    const roleTop = [...byRole.entries()].sort((x, y) => y[1] - x[1])[0];
    if (roleTop && roleTop[1] / n >= 0.7) tags.push({ id: 'main', label: `${ROLE[roleTop[0]]} main`, tone: 'neutral', detail: `${roleTop[1]} of the last ${n} games in ${ROLE[roleTop[0]]}` });
    const kda = (k + a) / Math.max(1, d);
    if (kda >= 4) tags.push({ id: 'kda', label: 'High KDA', tone: 'good', detail: `${kda.toFixed(2)} KDA over the last ${n} games` });
    if (shareN >= 6 && share / shareN >= 0.3) tags.push({ id: 'carry', label: 'Carries damage', tone: 'good', detail: `${Math.round((share / shareN) * 100)}% of team damage on average` });
    if (vision / minutes >= 1.6) tags.push({ id: 'vision', label: 'Vision control', tone: 'good', detail: `${(vision / minutes).toFixed(2)} vision score per minute` });
    if (mvp / n >= 0.35) tags.push({ id: 'mvp', label: 'Often MVP', tone: 'good', detail: `Best player in their team in ${mvp} of ${n} games` });
  }

  if (solo) {
    const g = solo.wins + solo.losses;
    const wr = g ? solo.wins / g : 0;
    if (g >= 20 && wr >= 0.62) tags.push({ id: 'winrate', label: 'High win rate', tone: 'good', detail: `${Math.round(wr * 100)}% over ${g} ranked games this season` });
    if (solo.veteran) tags.push({ id: 'veteran', label: 'Veteran', tone: 'neutral', detail: 'Has played 100+ games in this division' });
    if (solo.freshBlood) tags.push({ id: 'fresh', label: 'New to this tier', tone: 'neutral', detail: 'Recently promoted into this division' });
  }
  return tags;
}
