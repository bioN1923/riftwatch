import { describe, expect, it } from 'vitest';
import { mockMatches, mockProfile, mockTimeline } from '../server/mock';
import { ChampionStatsStore } from '../server/champStats';
import { PlayerIndex } from '../server/playerIndex';
import { LpStore } from '../server/lpStore';
import { RateLimiter } from '../server/rateLimiter';
import { scoreMatch } from '../server/shape';

describe('performance score', () => {
  it('gives one MVP on the winning side and one ACE on the losing side', () => {
    const { matches } = mockMatches({ gameName: 'Tester', tagLine: 'T1' }, 0, 10, {});
    for (const m of matches.filter((x) => !x.remake && x.queueId !== 1700)) {
      scoreMatch(m);
      const mvp = m.participants.filter((p) => p.badge === 'MVP');
      const ace = m.participants.filter((p) => p.badge === 'ACE');
      expect(mvp).toHaveLength(1);
      expect(ace).toHaveLength(1);
      expect(mvp[0].win).toBe(true);
      expect(ace[0].win).toBe(false);
      for (const p of m.participants) expect(p.score).toBeGreaterThanOrEqual(0), expect(p.score).toBeLessThanOrEqual(10);
    }
  });
});

describe('champion statistics', () => {
  const store = new ChampionStatsStore(null);
  const { matches } = mockMatches({ gameName: 'StatsTester', tagLine: 'T1' }, 0, 40, {});
  for (const m of matches) {
    store.addMatch(m);
    store.addTimeline(m, mockTimeline(m));
  }

  it('counts each match once', () => {
    const before = store.tierList('ranked').matches;
    for (const m of matches) store.addMatch(m);
    expect(store.tierList('ranked').matches).toBe(before);
    expect(before).toBe(matches.filter((m) => !m.remake && (m.queueId === 420 || m.queueId === 440)).length);
  });

  it('builds a tier list with sensible rates', () => {
    const t = store.tierList('ranked');
    expect(t.rows.length).toBeGreaterThan(0);
    for (const r of t.rows) {
      expect(r.winRate).toBeGreaterThanOrEqual(0);
      expect(r.winRate).toBeLessThanOrEqual(1);
      expect(['S+', 'S', 'A', 'B', 'C', 'D']).toContain(r.tier);
    }
  });

  it('returns builds, skills and matchups for a champion', () => {
    const top = store.tierList('ranked').rows.sort((a, b) => b.games - a.games)[0];
    const c = store.champion(top.championId, 'ranked', top.role);
    expect(c.summary?.games).toBe(top.games);
    expect(c.spells.length).toBeGreaterThan(0);
    expect(c.skills.path.length).toBeGreaterThan(5);
    expect(c.byLength.reduce((s, b) => s + b.games, 0)).toBe(top.games);
  });
});

describe('player index', () => {
  it('ranks exact and same-region matches first', () => {
    const idx = new PlayerIndex('/nonexistent/dir/players.json');
    idx.add({ platform: 'euw1', gameName: 'Caps', tagLine: 'EUW', tier: 'MASTER' });
    idx.add({ platform: 'na1', gameName: 'Caps', tagLine: 'NA1' });
    idx.add({ platform: 'euw1', gameName: 'Capsule', tagLine: 'EUW' });
    idx.add({ platform: 'euw1', gameName: 'Mycaps', tagLine: 'EUW' });
    const hits = idx.search('caps', 'euw1');
    expect(hits[0]).toMatchObject({ gameName: 'Caps', platform: 'euw1' });
    expect(hits.map((h) => h.gameName)).toContain('Mycaps');
    expect(idx.search('caps#na', 'euw1')[0]).toMatchObject({ platform: 'na1' });
    expect(idx.search('c', 'euw1')).toEqual([]);
  });
});

describe('rank history', () => {
  it('records a snapshot only when the rank changes', () => {
    const lp = new LpStore(null);
    const prof = mockProfile('euw1', 'LpTester', 'T1')!;
    lp.record('p1', prof.ranked, 1);
    lp.record('p1', prof.ranked, 2);
    expect(lp.history('p1')).toHaveLength(prof.ranked.length);
    lp.record('p1', prof.ranked.map((e) => ({ ...e, leaguePoints: e.leaguePoints + 1 })), 3);
    expect(lp.history('p1')).toHaveLength(prof.ranked.length * 2);
  });
});

describe('rate limiter', () => {
  it('spaces requests to respect the window', async () => {
    const rl = new RateLimiter([{ limit: 2, ms: 200 }]);
    const t0 = Date.now();
    await Promise.all([rl.schedule('h'), rl.schedule('h'), rl.schedule('h')]);
    expect(Date.now() - t0).toBeGreaterThanOrEqual(190);
  });

  it('accepts new limits', () => {
    const rl = new RateLimiter([{ limit: 20, ms: 1000 }]);
    rl.setWindows([{ limit: 450, ms: 10_000 }]);
    expect(rl.describe()).toBe('450/10s');
  });
});
