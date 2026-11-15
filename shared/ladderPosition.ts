/** Apex tiers, best first. */
export const APEX_TIERS = ['challenger', 'grandmaster', 'master'] as const;
export type ApexTier = (typeof APEX_TIERS)[number];

/**
 * Where a player stands on a region's ladder: their place within their own apex tier and among
 * every apex player of that region (the tiers above counted first). Null if not on the list.
 */
export function ladderPosition(lists: Record<ApexTier, { puuid: string }[]>, tier: ApexTier, puuid: string, pageSize: number) {
  const i = lists[tier].findIndex((e) => e.puuid === puuid);
  if (i < 0) return null;
  const above = APEX_TIERS.slice(0, APEX_TIERS.indexOf(tier)).reduce((n, t) => n + lists[t].length, 0);
  return { tier, rank: i + 1, overall: above + i + 1, tierTotal: lists[tier].length, page: Math.floor(i / pageSize) + 1 };
}
