import { describe, expect, it } from 'vitest';
import { findArenaPlayer, PROBE_PLAYERS } from '../server/arenaProbe';

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
