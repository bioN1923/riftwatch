/**
 * Finding the first Arena players. Arena games normally come from Arena players already seen (see
 * arenaSeeds.ts), but that chain needs a start, and apex ladder players hardly play Arena. So when
 * the line is empty the collector looks at a random page of an everyday tier (Silver to Emerald)
 * and asks a few of its players for recent Arena games; the first one who has some starts the chain.
 * About ten requests, at most every 15 minutes, and only while nothing else is lined up.
 */
export const PROBE_EVERY_MS = 15 * 60_000;
export const PROBE_PLAYERS = 6;
const TIERS = ['SILVER', 'GOLD', 'PLATINUM', 'EMERALD'];
const DIVISIONS = ['I', 'II', 'III', 'IV'];

export interface ProbeDeps {
  page: (tier: string, division: string, page: number) => Promise<{ puuid?: string }[]>;
  /** Recent Arena match ids for a player (an empty list if none). */
  arenaIds: (puuid: string) => Promise<string[]>;
  random?: () => number;
}

/** A player with recent Arena games, or null if none of the few asked had any. */
export async function findArenaPlayer(d: ProbeDeps): Promise<string | null> {
  const r = d.random ?? Math.random;
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const entries = await d.page(pick(TIERS), pick(DIVISIONS), 1 + Math.floor(r() * 3)).catch(() => []);
  const puuids = (entries ?? []).map((e) => e.puuid).filter((x): x is string => !!x);
  for (let i = 0; i < PROBE_PLAYERS && puuids.length; i++) {
    const puuid = puuids.splice(Math.floor(r() * puuids.length), 1)[0];
    const ids = await d.arenaIds(puuid).catch(() => [] as string[]);
    if (ids.length) return puuid;
  }
  return null;
}
