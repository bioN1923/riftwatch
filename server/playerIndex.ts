import fs from 'node:fs';
import path from 'node:path';
import { stringifyChunked } from './chunkedJson';
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
  puuid?: string;
}

const MAX_ENTRIES = 60_000;

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');

export class PlayerIndex {
  private entries = new Map<string, Entry>(); // `${platform}:${key}`
  private byPuuid = new Map<string, string>(); // puuid -> entries key
  private dirty = false;

  constructor(private file: string) {
    try {
      const list = JSON.parse(fs.readFileSync(file, 'utf8')) as Entry[];
      for (const e of list) {
        this.entries.set(`${e.platform}:${e.key}`, e);
        if (e.puuid) this.byPuuid.set(e.puuid, `${e.platform}:${e.key}`);
      }
    } catch {
      /* first run */
    }
    setInterval(() => void this.flushAsync(), 15_000).unref();
  }

  /** Players who hid their profile: never suggested, never stored. */
  isBlocked: (puuid: string) => boolean = () => false;

  add(p: PlayerHit & { puuid?: string }, opts: { viewed?: boolean } = {}) {
    if (!p.gameName || !p.tagLine) return;
    if (p.puuid && this.isBlocked(p.puuid)) return;
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
    if (p.puuid && !p.puuid.startsWith('demo-rand')) {
      // A changed Riot ID replaces the old one: Riot's policy forbids exposing historic Riot IDs.
      const old = this.byPuuid.get(p.puuid);
      if (old && old !== id) this.entries.delete(old);
      next.puuid = p.puuid;
      this.byPuuid.set(p.puuid, id);
    }
    this.entries.delete(id);
    this.entries.set(id, next);
    if (this.entries.size > MAX_ENTRIES) {
      const oldest = this.entries.keys().next().value;
      if (oldest) this.entries.delete(oldest);
    }
    this.dirty = true;
  }

  /** Forget a player completely (they hid their profile), by id and by name. */
  remove(puuid: string, name?: { platform: string; gameName: string; tagLine: string }) {
    const id = this.byPuuid.get(puuid);
    if (id) this.entries.delete(id);
    if (name) this.entries.delete(`${name.platform}:${norm(`${name.gameName}#${name.tagLine}`)}`);
    this.byPuuid.delete(puuid);
    this.dirty = true;
  }

  /** The PUUID stored for a Riot ID, if any. */
  puuidOf(platform: string, gameName: string, tagLine: string) {
    return this.entries.get(`${platform}:${norm(`${gameName}#${tagLine}`)}`)?.puuid;
  }

  /** Riot ID for a puuid, if this server has seen the player. */
  nameOf(puuid: string): { gameName: string; tagLine: string } | undefined {
    const id = this.byPuuid.get(puuid);
    const e = id ? this.entries.get(id) : undefined;
    return e && e.puuid === puuid ? { gameName: e.gameName, tagLine: e.tagLine } : undefined;
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

  private saving = false;

  /** Regular save: serialised in slices and written to a temporary file, so requests don't stall. */
  async flushAsync() {
    if (!this.dirty || this.saving) return;
    this.saving = true;
    this.dirty = false;
    try {
      const body = await stringifyChunked([...this.entries.values()]);
      await fs.promises.mkdir(path.dirname(this.file), { recursive: true });
      await fs.promises.writeFile(`${this.file}.tmp`, body);
      await fs.promises.rename(`${this.file}.tmp`, this.file);
    } catch (e) {
      this.dirty = true;
      console.warn('Could not save the player index:', (e as Error).message);
    } finally {
      this.saving = false;
    }
  }

  /** Shutdown path: one blocking save. */
  flush() {
    // A save still in flight at shutdown never finishes (the process exits), so write anyway.
    if (!this.dirty && !this.saving) return;
    this.dirty = false;
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify([...this.entries.values()]));
    } catch (e) {
      console.warn('Could not save the player index:', (e as Error).message);
    }
  }
}
