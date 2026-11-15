import fs from 'node:fs';
import path from 'node:path';

/**
 * Earlier LP of ladder players, so the ladder can show how much each moved. A snapshot of a
 * ladder (Challenger and Grandmaster only — Master is too big to keep) is taken at most once an
 * hour, whenever the ladder is read anyway; nothing is fetched for it. Snapshots older than two
 * days are dropped. Kept on disk so a restart doesn't reset the comparison.
 */
const HOUR = 3600_000;
export const SNAPSHOT_EVERY = HOUR;
const KEEP = 48 * HOUR;
/** Compare with the snapshot closest to a day old, but at least an hour old. */
const TARGET_AGE = 24 * HOUR;

type Snap = { at: number; lp: Record<string, number> };

export class LadderHistory {
  private s: Record<string, Snap[]> = {};
  private dirty = false;
  constructor(private file: string | null) {
    if (!file) return;
    try {
      this.s = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      /* first run */
    }
    setInterval(() => this.flush(), 5 * 60_000).unref();
  }

  /** Remember this ladder's LP if the last snapshot is an hour old (or there is none). */
  record(key: string, entries: { puuid: string; lp: number }[], now = Date.now()) {
    const list = (this.s[key] ??= []).filter((x) => now - x.at < KEEP);
    this.s[key] = list;
    if (list.length && now - list[list.length - 1].at < SNAPSHOT_EVERY) return;
    const lp: Record<string, number> = {};
    for (const e of entries) if (e.puuid) lp[e.puuid] = e.lp;
    list.push({ at: now, lp });
    this.dirty = true;
  }

  /** The snapshot to compare with: closest to a day old, at least an hour old; null if none yet. */
  baseline(key: string, now = Date.now()): Snap | null {
    const list = (this.s[key] ?? []).filter((x) => now - x.at >= HOUR && now - x.at < KEEP);
    if (!list.length) return null;
    return list.reduce((best, x) => (Math.abs(now - x.at - TARGET_AGE) < Math.abs(now - best.at - TARGET_AGE) ? x : best));
  }

  flush() {
    if (!this.file || !this.dirty) return;
    this.dirty = false;
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify(this.s));
    } catch (e) {
      console.warn('Could not save ladder history:', (e as Error).message);
    }
  }
}
