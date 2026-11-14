import { isArena } from '../shared/queues';
import type { MatchSummary } from '../shared/types';

/**
 * Where the collector finds Arena games. Apex ladder players hardly ever play Arena, so asking
 * them is wasted budget. Instead, every Arena game Riftwatch reads (a visitor's, or one the
 * collector found) puts its other players in line here, and the collector reads a few of their
 * recent Arena games: Arena players lead to more Arena players. Bounded, and each player only once.
 */
export class ArenaSeeds {
  private queue: string[] = [];
  private known = new Set<string>();
  constructor(
    private platformId: string,
    private maxQueue = 300,
    private maxKnown = 20_000,
  ) {}

  /** Line up the players of an Arena game from this platform (match ids start with the platform, e.g. EUW1_). */
  note(m: Pick<MatchSummary, 'id' | 'queueId' | 'participants'>) {
    if (!isArena(m.queueId) || !m.id.toUpperCase().startsWith(`${this.platformId.toUpperCase()}_`)) return;
    for (const p of m.participants) {
      if (!p.puuid || this.known.has(p.puuid)) continue;
      if (this.known.size >= this.maxKnown) this.known.clear(); // forget the oldest round rather than grow forever
      this.known.add(p.puuid);
      if (this.queue.length < this.maxQueue) this.queue.push(p.puuid);
    }
  }

  /** The next player to look up, if any. */
  take(): string | undefined {
    return this.queue.shift();
  }

  get size() {
    return this.queue.length;
  }
}
