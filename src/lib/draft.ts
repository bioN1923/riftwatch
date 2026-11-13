import type { ChampionStats } from '../../shared/types';

/** Same threshold as the server and the draft page: enough games for a matchup to count. */
export const matchupMin = (games: number) => Math.max(8, Math.round(games * 0.03));

export interface BanPick {
  championId: number;
  /** The pool's average win rate against this champion (shrunk toward 50% for small samples). */
  poolRate: number;
  /** Pool champions with enough games against it, worst first. */
  against: { championId: number; winRate: number; games: number }[];
}

/**
 * "Ban for your pool": the enemy laners your champions do worst against. Each pool champion's
 * matchup list says how it fares against every opponent; an opponent scores the average of those
 * (shrunk) win rates, counting a pool champion with no data as an even 50%. With two or more pool
 * champions, an opponent needs data against at least two of them (and half the pool), so one bad
 * matchup doesn't decide the ban.
 */
export function banSuggestions(pool: number[], stats: Map<number, ChampionStats | undefined>, role: string, limit = 3): BanPick[] {
  const known = pool.filter((id) => stats.get(id)?.role === role);
  if (!known.length) return [];
  const need = known.length < 2 ? 1 : Math.max(2, Math.ceil(known.length / 2));
  const enemies = new Map<number, { sum: number; against: BanPick['against'] }>();
  for (const id of known) {
    const s = stats.get(id)!;
    const min = matchupMin(s.summary?.games ?? 0);
    for (const m of s.matchups) {
      if (pool.includes(m.championId) || m.games < min) continue;
      const e = enemies.get(m.championId) ?? { sum: 0, against: [] };
      e.sum += m.adjusted;
      e.against.push({ championId: id, winRate: m.winRate, games: m.games });
      enemies.set(m.championId, e);
    }
  }
  return [...enemies.entries()]
    .filter(([, e]) => e.against.length >= need)
    .map(([championId, e]) => ({
      championId,
      poolRate: (e.sum + 0.5 * (known.length - e.against.length)) / known.length,
      against: e.against.sort((x, y) => x.winRate - y.winRate),
    }))
    .filter((b) => b.poolRate < 0.5)
    .sort((x, y) => x.poolRate - y.poolRate)
    .slice(0, limit);
}
