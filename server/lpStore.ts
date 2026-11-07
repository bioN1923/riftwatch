import fs from 'node:fs';
import path from 'node:path';
import type { LeagueEntry, LpPoint, TrackedPlayer } from '../shared/types';

/**
 * Ranked history. Riot only reports the current rank, so the server keeps a snapshot every
 * time a player's rank changes (on profile views, and on a timer for tracked players).
 */
interface Store {
  history: Record<string, LpPoint[]>; // by puuid
  tracked: TrackedPlayer[];
}

const MAX_POINTS = 400;

export class LpStore {
  private s: Store = { history: {}, tracked: [] };
  private dirty = false;

  constructor(private file: string | null) {
    if (file) {
      try {
        this.s = JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch {
        /* first run */
      }
      setInterval(() => this.flush(), 30_000).unref();
    }
  }

  record(puuid: string, entries: LeagueEntry[], at = Date.now()) {
    const list = (this.s.history[puuid] ??= []);
    for (const e of entries) {
      if (e.queueType !== 'RANKED_SOLO_5x5' && e.queueType !== 'RANKED_FLEX_SR') continue;
      const last = [...list].reverse().find((p) => p.queue === e.queueType);
      const changed = !last || last.tier !== e.tier || last.rank !== e.rank || last.lp !== e.leaguePoints || last.wins !== e.wins || last.losses !== e.losses;
      if (!changed) continue;
      list.push({ t: at, queue: e.queueType, tier: e.tier, rank: e.rank, lp: e.leaguePoints, wins: e.wins, losses: e.losses });
      this.dirty = true;
    }
    if (list.length > MAX_POINTS) list.splice(0, list.length - MAX_POINTS);
  }

  history(puuid: string) {
    return this.s.history[puuid] ?? [];
  }

  tracked() {
    return this.s.tracked;
  }

  isTracked(puuid: string) {
    return this.s.tracked.some((t) => t.puuid === puuid);
  }

  track(p: TrackedPlayer) {
    if (this.isTracked(p.puuid)) return;
    this.s.tracked.push(p);
    this.dirty = true;
  }

  untrack(puuid: string) {
    this.s.tracked = this.s.tracked.filter((t) => t.puuid !== puuid);
    this.dirty = true;
  }

  /** Delete everything stored about a player (they hid their profile). */
  forget(puuid: string) {
    delete this.s.history[puuid];
    this.untrack(puuid);
  }

  flush() {
    if (!this.dirty || !this.file) return;
    this.dirty = false;
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify(this.s));
    } catch (e) {
      console.warn('Could not save LP history:', (e as Error).message);
    }
  }
}
