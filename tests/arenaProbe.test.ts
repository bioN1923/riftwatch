import { describe, expect, it } from 'vitest';
import { FALLBACK_PLAYERS, findArenaPlayer, PROBE_PLAYERS } from '../server/arenaProbe';
import { arenaQueue, isArena, isArenaMatch, noteArenaQueue } from '../shared/queues';

describe('findArenaPlayer', () => {
  const page = async () => Array.from({ length: 20 }, (_, i) => ({ puuid: `p${i}` }));
  it('returns the first player asked who has Arena games', async () => {
    const asked: string[] = [];
    const found = await findArenaPlayer({ page, arenaIds: async (p) => (asked.push(p), asked.length === 3 ? ['EUW1_1'] : []), random: () => 0 });
    expect(found).toBe(asked[2]);
    expect(asked).toHaveLength(3);
  });
  it('asks only a few players, and copes with errors', async () => {
    let n = 0;
    const found = await findArenaPlayer({ page, arenaIds: async () => (n++, Promise.reject(new Error('429'))) });
    expect(found).toBeNull();
    expect(n).toBe(PROBE_PLAYERS);
    expect(await findArenaPlayer({ page: () => Promise.reject(new Error('x')), arenaIds: async () => ['a'] })).toBeNull();
  });
});

describe('Arena by game mode', () => {
  it('uses the any-queue fallback for the first players only', async () => {
    const page = async () => Array.from({ length: 20 }, (_, i) => ({ puuid: `p${i}` }));
    let fallbacks = 0;
    const found = await findArenaPlayer({ page, arenaIds: async () => [], recentArena: async () => (++fallbacks, false) });
    expect(found).toBeNull();
    expect(fallbacks).toBe(FALLBACK_PLAYERS);
    expect(await findArenaPlayer({ page, arenaIds: async () => [], recentArena: async () => true, random: () => 0 })).toBe('p0');
  });
  it('learns a new Arena queue id from the CHERRY game mode', () => {
    expect(isArenaMatch({ queueId: 1790, gameMode: 'CHERRY' })).toBe(true);
    expect(isArena(1790)).toBe(false);
    expect(noteArenaQueue(1790, 'CLASSIC')).toBe(false);
    expect(noteArenaQueue(1790, 'CHERRY')).toBe(true);
    expect(isArena(1790)).toBe(true);
    expect(arenaQueue()).toBe(1790);
    expect(noteArenaQueue(1790, 'CHERRY')).toBe(false);
  });
});

describe('ArenaSeeds on disk', () => {
  it('keeps the line across restarts', async () => {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const path = await import('node:path');
    const { ArenaSeeds } = await import('../server/arenaSeeds');
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rw-')), 'arena-seeds.json');
    const a = new ArenaSeeds('euw1', 300, 20_000, file);
    a.note({ id: 'EUW1_1', queueId: 1710, participants: [{ puuid: 'x' }, { puuid: 'y' }, { puuid: 'z' }] as never });
    a.note({ id: 'EUN1_2', queueId: 1710, participants: [{ puuid: 'other' }] as never }); // another platform: ignored
    expect(a.take()).toBe('x');
    a.flush();
    const b = new ArenaSeeds('euw1', 300, 20_000, file);
    expect(b.size).toBe(2);
    expect(b.take()).toBe('y');
    b.note({ id: 'EUW1_3', queueId: 1710, participants: [{ puuid: 'x' }] as never }); // already known: not lined up again
    expect(b.size).toBe(1);
  });
});

describe('learned Arena queue ids', () => {
  it('are saved with the line and restored after a restart', async () => {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const path = await import('node:path');
    const q = await import('../shared/queues');
    const { ArenaSeeds } = await import('../server/arenaSeeds');
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rw-')), 'arena-seeds.json');
    q.noteArenaQueue(1777, 'CHERRY');
    const a = new ArenaSeeds('euw1', 300, 20_000, file);
    a.touch();
    a.flush();
    expect(JSON.parse(fs.readFileSync(file, 'utf8')).queues).toContain(1777);
    // A "restart": drop the learned id, then load the file again.
    q.ARENA_QUEUES.delete(1777);
    expect(q.isArena(1777)).toBe(false);
    new ArenaSeeds('euw1', 300, 20_000, file);
    expect(q.isArena(1777)).toBe(true);
  });
});
