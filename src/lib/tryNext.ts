import type { TierRow } from '../../shared/types';

const STRONG = new Set(['S+', 'S', 'A']);
const ORDER: Record<string, number> = { 'S+': 0, S: 1, A: 2 };

export interface TryNextPick {
  championId: number;
  row: TierRow;
  /** The player's champion it resembles, and the class they share. */
  like: number;
  tag: string;
}

/**
 * "Try next": champions the player hasn't played lately that fit their main role and the class of
 * a champion they already play there, and that are strong on this patch (tier A or better, with a
 * real sample). Suggestions, not judgements: nothing here says anything about the player.
 */
export function tryNext(
  played: { championId: number; games: number; role: string }[],
  rows: TierRow[],
  tags: (championId: number) => string[],
  limit = 3,
): TryNextPick[] {
  const main = played[0];
  if (!main || main.games < 3) return [];
  const mine = played.filter((p) => p.role === main.role).slice(0, 3);
  const seen = new Set(played.map((p) => p.championId));
  const out: TryNextPick[] = [];
  const candidates = rows
    .filter((r) => r.role === main.role && STRONG.has(r.tier) && !r.lowSample && !seen.has(r.championId))
    .sort((x, y) => ORDER[x.tier] - ORDER[y.tier] || x.rank - y.rank);
  for (const r of candidates) {
    const theirs = tags(r.championId);
    const like = mine.find((p) => tags(p.championId).some((t) => theirs.includes(t)));
    if (!like) continue;
    out.push({ championId: r.championId, row: r, like: like.championId, tag: tags(like.championId).find((t) => theirs.includes(t))! });
    if (out.length >= limit) break;
  }
  return out;
}
