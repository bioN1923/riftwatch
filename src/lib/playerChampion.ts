import type { MatchSummary, Participant } from '../../shared/types';
import { me } from './stats';

/** One player's record on one champion, from their loaded matches. */
export interface PlayerChampion {
  championId: number;
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  csPerMin: number;
  damagePerMin: number;
  goldPerMin: number;
  visionPerMin: number;
  killShare: number;
  mainRole: string | null;
  items: { id: number; games: number; wins: number }[];
  keystones: { id: number; secondaryStyle: number; games: number; wins: number }[];
  spells: { ids: number[]; games: number; wins: number }[];
  opponents: { championId: number; games: number; wins: number }[];
  recent: { match: MatchSummary; p: Participant; opponent?: Participant }[];
}

/**
 * Aggregate the games a player played on one champion. `isCompleted` decides which
 * items count as finished items for the "most built" list (boots and components don't).
 */
export function playerChampion(matches: MatchSummary[], puuid: string, championId: number, isCompleted: (itemId: number) => boolean): PlayerChampion | null {
  let games = 0,
    wins = 0,
    kills = 0,
    deaths = 0,
    assists = 0,
    cs = 0,
    dmg = 0,
    gold = 0,
    vision = 0,
    kp = 0,
    minutes = 0;
  const roles = new Map<string, number>();
  const items = new Map<number, { games: number; wins: number }>();
  const keys = new Map<string, { id: number; secondaryStyle: number; games: number; wins: number }>();
  const spells = new Map<string, { ids: number[]; games: number; wins: number }>();
  const opps = new Map<number, { games: number; wins: number }>();
  const recent: PlayerChampion['recent'] = [];
  const tally = <K, V extends { games: number; wins: number }>(m: Map<K, V>, k: K, init: () => V, win: boolean) => {
    const v = m.get(k) ?? init();
    v.games++;
    if (win) v.wins++;
    m.set(k, v);
  };

  for (const m of matches) {
    if (m.remake) continue;
    const p = me(m, puuid);
    if (!p || p.championId !== championId) continue;
    const min = m.duration / 60;
    games++;
    if (p.win) wins++;
    kills += p.kills;
    deaths += p.deaths;
    assists += p.assists;
    cs += p.cs;
    dmg += p.damage;
    gold += p.gold;
    vision += p.visionScore;
    kp += p.killParticipation;
    minutes += min;
    if (p.position) roles.set(p.position, (roles.get(p.position) ?? 0) + 1);
    for (const id of new Set(p.items.slice(0, 6).filter((id) => id && isCompleted(id)))) tally(items, id, () => ({ games: 0, wins: 0 }), p.win);
    if (p.keystone) tally(keys, `${p.keystone}:${p.secondaryStyle}`, () => ({ id: p.keystone, secondaryStyle: p.secondaryStyle, games: 0, wins: 0 }), p.win);
    const sp = [...p.spells].sort((x, y) => x - y);
    tally(spells, sp.join(), () => ({ ids: sp, games: 0, wins: 0 }), p.win);
    const opponent = p.position ? m.participants.find((x) => x.teamId !== p.teamId && x.position === p.position) : undefined;
    if (opponent) tally(opps, opponent.championId, () => ({ games: 0, wins: 0 }), p.win);
    recent.push({ match: m, p, opponent });
  }
  if (!games) return null;

  const byGames = <T extends { games: number; wins: number }>(list: T[]) => list.sort((a, b) => b.games - a.games || b.wins - a.wins);
  return {
    championId,
    games,
    wins,
    kills,
    deaths,
    assists,
    csPerMin: cs / minutes,
    damagePerMin: dmg / minutes,
    goldPerMin: gold / minutes,
    visionPerMin: vision / minutes,
    killShare: kp / games,
    mainRole: [...roles.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    items: byGames([...items.entries()].map(([id, v]) => ({ id, ...v }))).slice(0, 6),
    keystones: byGames([...keys.values()]).slice(0, 3),
    spells: byGames([...spells.values()]).slice(0, 2),
    opponents: byGames([...opps.entries()].map(([id, v]) => ({ championId: id, ...v }))).slice(0, 8),
    recent: recent.sort((a, b) => b.match.startedAt - a.match.startedAt).slice(0, 8),
  };
}
