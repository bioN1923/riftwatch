/**
 * A one-line read on how wide a player's recent champion pool is, like the "one-trick" tags on other
 * sites. Neutral facts only (Riot's policy: no labels that mock a player).
 */
export type PoolRead = { kind: 'oneTrick'; championId: number; games: number; total: number } | { kind: 'wide'; champions: number; total: number } | null;

/** Needs 10 counted games; one-trick at 60% on one champion, wide at 10+ different champions. */
export function poolRead(championIds: number[]): PoolRead {
  const total = championIds.length;
  if (total < 10) return null;
  const counts = new Map<number, number>();
  for (const id of championIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  const [topId, topGames] = [...counts].sort((a, b) => b[1] - a[1])[0];
  if (topGames / total >= 0.6) return { kind: 'oneTrick', championId: topId, games: topGames, total };
  if (counts.size >= 10) return { kind: 'wide', champions: counts.size, total };
  return null;
}
