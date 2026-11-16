import { describe, expect, it } from 'vitest';
import { ChampionStatsStore } from '../server/champStats';
import { mockArenaMatch, mockMatches, mockTimeline } from '../server/mock';

describe('itemStats', () => {
  it('counts completed items across champions, ranked only', () => {
    const s = new ChampionStatsStore(null);
    for (const nm of ['Caps', 'Faker', 'Rekkles', 'Upset'])
      for (const m of mockMatches({ gameName: nm, tagLine: 'EUW' }, 0, 20, {}).matches) {
        s.addMatch(m);
        if (!m.remake && m.teams.length) s.addTimeline(m, mockTimeline(m));
      }
    for (let i = 0; i < 50; i++) s.addMatch(mockArenaMatch(i));
    const out = s.itemStats();
    expect(out.builds).toBeGreaterThan(0);
    expect(out.items.length).toBeGreaterThan(0);
    for (let i = 1; i < out.items.length; i++) expect(out.items[i - 1].games).toBeGreaterThanOrEqual(out.items[i].games);
    const top = out.items[0];
    expect(top.share).toBeCloseTo(top.games / out.builds);
    for (const c of top.champions) {
      expect(c.games).toBeGreaterThanOrEqual(10);
      expect(c.winRate).toBeGreaterThanOrEqual(0);
      expect(c.winRate).toBeLessThanOrEqual(1);
    }
  });
});
