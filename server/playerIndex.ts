import fs from 'node:fs';
import path from 'node:path';
import type { PlayerHit } from '../shared/types';

/**
 * Riot has no "search players by name" endpoint, so autocomplete works the way op.gg's
 * does: from players we have already seen. Every profile, match and live game the server
 * fetches adds its players here. The index is saved to disk so it keeps growing.
 */
interface Entry extends PlayerHit {
  key: string; // normalised "name#tag"
  seen: number;
  hits: number; // how often someone opened this profile
}

const MAX_ENTRIES = 60_000;

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');

export class PlayerIndex {
  private entries = new Map<string, Entry>(); // `${platform}:${key}`
  private dirty = false;

  constructor(private file: string) {
    try {
      const list = JSON.parse(fs.readFileSync(file, 'utf8')) as Entry[];
      for (const e of list) this.entries.set(`${e.platform}:${e.key}`, e);
    } catch {
      /* first run */
    }
    setInterval(() => this.flush(), 15_000).unref();
  }

  add(p: PlayerHit, opts: { viewed?: boolean } = {}) {
    if (!p.gameName || !p.tagLine) return;
    const key = norm(`${p.gameName}#${p.tagLine}`);
    const id = `${p.platform}:${key}`;
    const prev = this.entries.get(id);
    const next: Entry = {
      ...prev,
      platform: p.platform,
      gameName: p.gameName,
      tagLine: p.tagLine,
      key,
      seen: Date.now(),
      hits: (prev?.hits ?? 0) + (opts.viewed ? 1 : 0),
    };
    // Only overwrite profile details when we actually have them.
    for (const k of ['profileIconId', 'level', 'tier', 'rank', 'lp'] as const) if (p[k] !== undefined) (next as any)[k] = p[k];
    delete (next as any).verified;
    this.entries.delete(id);
    this.entries.set(id, next);
    if (this.entries.size > MAX_ENTRIES) {
      const oldest = this.entries.keys().next().value;
      if (oldest) this.entries.delete(oldest);
    }
    this.dirty = true;
  }

  search(query: string, platform: string, limit = 8): PlayerHit[] {
    const raw = query.trim();
    if (raw.length < 2) return [];
    const hashAt = raw.lastIndexOf('#');
    const namePart = norm(hashAt >= 0 ? raw.slice(0, hashAt) : raw);
    const tagPart = hashAt >= 0 ? norm(raw.slice(hashAt + 1)) : '';
    if (!namePart) return [];

    const scored: { e: Entry; s: number }[] = [];
    for (const e of this.entries.values()) {
      const [name, tag] = e.key.split('#');
      let s = 0;
      if (name === namePart) s = 100;
      else if (name.startsWith(namePart)) s = 70;
      else if (name.includes(namePart)) s = 30;
      else continue;
      if (tagPart) {
        if (tag === tagPart) s += 40;
        else if (tag.startsWith(tagPart)) s += 20;
        else continue;
      }
      if (e.platform === platform) s += 25;
      if (e.tier) s += 5;
      s += Math.min(15, e.hits * 3);
      scored.push({ e, s });
    }
    return scored
      .sort((a, b) => b.s - a.s || b.e.seen - a.e.seen)
      .slice(0, limit)
      .map(({ e }) => ({ platform: e.platform, gameName: e.gameName, tagLine: e.tagLine, profileIconId: e.profileIconId, level: e.level, tier: e.tier, rank: e.rank, lp: e.lp }));
  }

  flush() {
    if (!this.dirty) return;
    this.dirty = false;
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify([...this.entries.values()]));
    } catch (e) {
      console.warn('Could not save the player index:', (e as Error).message);
    }
  }
}
