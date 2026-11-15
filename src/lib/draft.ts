import type { ChampionStats } from '../../shared/types';

/** Same threshold as the server and the draft page: enough games for a matchup to count. */
export const matchupMin = (games: number) => Math.max(8, Math.round(games * 0.03));

export interface BanPick {
  championId: number;
  /** The pool's average win rate against this champion (shrunk toward 50% for small samples). */
  poolRate: number;
  /** Pool champions with enough games against it, worst first. */
  against: { championId: number; winRate: number; adjusted: number; games: number }[];
  /** All those games together. */
  games: number;
  /**
   * The pool's combined win rate against it is clearly under 50%: the top of its 95% range is below
   * even. Otherwise it's only leaning, and could still be chance.
   */
  sure: boolean;
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
      e.against.push({ championId: id, winRate: m.winRate, adjusted: m.adjusted, games: m.games });
      enemies.set(m.championId, e);
    }
  }
  return [...enemies.entries()]
    .filter(([, e]) => e.against.length >= need)
    .map(([championId, e]) => {
      const games = e.against.reduce((n, x) => n + x.games, 0);
      const wins = e.against.reduce((n, x) => n + x.winRate * x.games, 0);
      return {
        championId,
        poolRate: (e.sum + 0.5 * (known.length - e.against.length)) / known.length,
        against: e.against.sort((x, y) => x.winRate - y.winRate),
        games,
        sure: games > 0 && winRange(wins / games, games)[1] < 0.5,
      };
    })
    .filter((b) => b.poolRate < 0.5)
    // Clear problems first, then the rest by how badly the pool does.
    .sort((x, y) => Number(y.sure) - Number(x.sure) || x.poolRate - y.poolRate)
    .slice(0, limit);
}

/** Same prior the server uses to shrink matchup win rates (MATCHUP_K). */
const MATCHUP_K = 25;

/**
 * The win rate a matchup answer can be fairly sure of: the sample-adjusted rate minus about one
 * standard error, the same rule as safe blind picks. Ranks "65% on 40 games" below "58% on 400".
 */
export const cautiousRate = (adjusted: number, games: number) => adjusted - 0.5 / Math.sqrt(games + MATCHUP_K);

/** 95% Wilson interval for a win rate over `games` games: where the true rate likely is. */
export function winRange(winRate: number, games: number): [number, number] {
  if (!games) return [0, 1];
  const z = 1.96;
  const d = 1 + (z * z) / games;
  const centre = (winRate + (z * z) / (2 * games)) / d;
  const half = (z * Math.sqrt((winRate * (1 - winRate)) / games + (z * z) / (4 * games * games))) / d;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}
