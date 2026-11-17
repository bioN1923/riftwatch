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

  it('lists the champion across patches, oldest first, matching each patch', () => {
    const row = store.tierList('ranked').rows[0];
    const s = store.champion(row.championId, 'ranked', row.role);
    const h = s.history ?? [];
    expect(h.length).toBeGreaterThanOrEqual(1);
    expect(h.map((x) => x.patch)).toEqual([...s.patches].reverse().filter((p) => h.some((x) => x.patch === p)));
    const latest = h.find((x) => x.patch === s.patch)!;
    expect(latest.games).toBe(s.summary!.games);
  });

  it('lists a matchup across patches, matching the viewed patch', () => {
    const row = store.tierList('ranked').rows[0];
    const opp = store.champion(row.championId, 'ranked', row.role).matchups[0];
    if (!opp) return;
    const m = store.matchup(row.championId, opp.championId, 'ranked', row.role);
    const latest = (m.history ?? []).find((x) => x.patch === m.patch);
    expect(latest?.games).toBe(m.games);
  });

  it('builds a tier list with sensible rates', () => {
    const t = store.tierList('ranked');
    expect(t.rows.length).toBeGreaterThan(0);
    for (const r of t.rows) {
      expect(r.winRate).toBeGreaterThanOrEqual(0);
      expect(r.winRate).toBeLessThanOrEqual(1);
      expect(['S+', 'S', 'A', 'B', 'C', 'D']).toContain(r.tier === '–' && r.lowSample ? 'D' : r.tier);
      if (r.lowSample) expect(r.tier).toBe('–');
    }
  });

  it('gives no tier below the games floor, in every queue', async () => {
    const { TIER_MIN_GAMES } = await import('../server/champStats');
    for (const group of ['ranked', 'aram', 'arena'] as const) {
      for (const r of store.tierList(group).rows) {
        if (r.games < TIER_MIN_GAMES) expect(r.tier).toBe('–');
      }
    }
  });

  it('tags "best" only on variations with enough games', async () => {
    const { BEST_MIN_GAMES } = await import('../server/champStats');
    for (const group of ['ranked', 'aram'] as const) {
      for (const row of store.tierList(group).rows.slice(0, 15)) {
        const s = store.champion(row.championId, group, row.role);
        for (const v of [...s.builds, ...s.runes]) if (v.tags.includes('best')) expect(v.games).toBeGreaterThanOrEqual(BEST_MIN_GAMES);
      }
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

describe('lane counters', () => {
  const store = new ChampionStatsStore(null);
  for (let i = 0; i < 25; i++) {
    const { matches } = mockMatches({ gameName: `Counter${i}`, tagLine: 'T' }, 0, 20, {});
    for (const m of matches) {
      store.addMatch(m);
      store.addTimeline(m, mockTimeline(m));
    }
  }

  it('lists only losing matchups as counters, at most three', () => {
    for (const row of store.tierList('ranked').rows) {
      expect((row.counters ?? []).length).toBeLessThanOrEqual(3);
      const c = store.champion(row.championId, 'ranked', row.role);
      for (const id of row.counters ?? []) {
        const m = c.matchups.find((x) => x.championId === id)!;
        expect(m.winRate).toBeLessThan(0.5);
      }
    }
  });

  it('pulls small samples towards 50% and reports lane leads', async () => {
    const { shrunk } = await import('../server/champStats');
    expect(shrunk(1, 1)).toBeCloseTo(0.545, 2);
    expect(shrunk(60, 100)).toBeGreaterThan(0.58);
    const row = store.tierList('ranked').rows.sort((a, b) => b.games - a.games)[0];
    const m = store.champion(row.championId, 'ranked', row.role).matchups.find((x) => x.goldDiff15 != null);
    expect(m?.csDiff15).not.toBeNull();
    expect(m?.xpDiff15).not.toBeNull();
  });
  it('reports a single matchup consistently with the champion page', () => {
    const row = store.tierList('ranked').rows.sort((a, b) => b.games - a.games)[0];
    const c = store.champion(row.championId, 'ranked', row.role);
    const top = c.matchups[0];
    const mu = store.matchup(row.championId, top.championId, 'ranked', row.role);
    expect(mu.games).toBe(top.games);
    expect(mu.winRate).toBeCloseTo(top.winRate, 6);
    expect(mu.runes.reduce((n, r) => n + r.games, 0)).toBeLessThanOrEqual(mu.games);
    expect(mu.coreTotal).toBeLessThanOrEqual(mu.games);
    expect(mu.others.some((o) => o.championId === top.championId)).toBe(false);
    expect(store.matchup(row.championId, 99999, 'ranked', row.role).games).toBe(0);
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

describe('ladder (demo)', () => {
  it('is sorted by LP and sized per tier', async () => {
    const { mockLadder } = await import('../server/mock');
    const ch = mockLadder('challenger', 'solo');
    expect(ch).toHaveLength(300);
    for (let i = 1; i < ch.length; i++) expect(ch[i - 1].lp).toBeGreaterThanOrEqual(ch[i].lp);
    expect(mockLadder('master', 'solo').length).toBeGreaterThan(ch.length);
  });
});
