import fs from 'node:fs';
import path from 'node:path';
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
  private dirty = false;
  /**
   * With a file, the line survives restarts (every deploy restarts the server, and a line kept
   * only in memory meant the chain of Arena players broke each time). Saved at most once a minute.
   */
  constructor(
    private platformId: string,
    private maxQueue = 300,
    private maxKnown = 20_000,
    private file: string | null = null,
  ) {
    if (!file) return;
    try {
      const saved = JSON.parse(fs.readFileSync(file, 'utf8')) as { queue?: string[]; known?: string[] };
      this.queue = (saved.queue ?? []).slice(0, maxQueue);
      this.known = new Set((saved.known ?? []).slice(-maxKnown));
    } catch {
      /* first run */
    }
    setInterval(() => this.flush(), 60_000).unref();
  }

  /** Write the line to disk if it changed (also called on shutdown). */
  flush() {
    if (!this.file || !this.dirty) return;
    this.dirty = false;
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify({ queue: this.queue, known: [...this.known].slice(-5000) }));
    } catch (e) {
      console.warn('Could not save the Arena line:', (e as Error).message);
    }
  }

  /** Line up the players of an Arena game from this platform (match ids start with the platform, e.g. EUW1_). */
  note(m: Pick<MatchSummary, 'id' | 'queueId' | 'participants'>) {
    if (!isArena(m.queueId) || !m.id.toUpperCase().startsWith(`${this.platformId.toUpperCase()}_`)) return;
    for (const p of m.participants) {
      if (!p.puuid || this.known.has(p.puuid)) continue;
      if (this.known.size >= this.maxKnown) this.known.clear(); // forget the oldest round rather than grow forever
      this.known.add(p.puuid);
      if (this.queue.length < this.maxQueue) this.queue.push(p.puuid);
      this.dirty = true;
    }
  }

  /** The next player to look up, if any. */
  take(): string | undefined {
    const next = this.queue.shift();
    if (next) this.dirty = true;
    return next;
  }

  get size() {
    return this.queue.length;
  }
}
