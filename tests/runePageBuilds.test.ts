import { describe, expect, it } from 'vitest';
import { ChampionStatsStore } from '../server/champStats';
import { mockMatches, mockTimeline } from '../server/mock';

describe('builds per rune page', () => {
  it('gives each well-played rune page its own builds, consistent with the overall tally', () => {
    const s = new ChampionStatsStore(null);
    for (const nm of ['Caps', 'Faker', 'Rekkles', 'Upset', 'Jankos', 'Bwipo', 'Chovy', 'Ruler'])
      for (let k = 0; k < 4; k++)
        for (const m of mockMatches({ gameName: nm + k, tagLine: 'EUW' }, 0, 20, {}).matches) {
          s.addMatch(m);
          if (!m.remake && m.teams.length) s.addTimeline(m, mockTimeline(m));
        }
    const tl = s.tierList('ranked');
    const row = tl.rows.filter((r) => r.role !== 'ALL').sort((a, b) => b.games - a.games)[0];
    const c = s.champion(row.championId, 'ranked', row.role);
    const withBuilds = c.runes.filter((r) => r.builds?.length);
    expect(withBuilds.length).toBeGreaterThan(0);
    for (const r of withBuilds) {
      expect(r.buildGames).toBeGreaterThanOrEqual(20);
      expect(r.buildGames!).toBeLessThanOrEqual(c.coreTotal);
      expect(r.builds![0].games).toBeLessThanOrEqual(r.buildGames!);
    }
  });
});
