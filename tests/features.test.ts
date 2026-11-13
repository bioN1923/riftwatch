import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChampionStatsStore } from '../server/champStats';
import { mockArenaMatch, mockMatches } from '../server/mock';
import { ErrorLog } from '../server/errorLog';
import { alternateLinks, pickLang, seoText, sitemapXml } from '../server/seo';
import { summarize, together } from '../src/lib/compare';

describe('arena statistics', () => {
  const store = new ChampionStatsStore(null);
  for (let i = 0; i < 300; i++) store.addMatch(mockArenaMatch(i));

  it('counts places, partners and item popularity, but never augment or item win rates', () => {
    const list = store.tierList('arena');
    expect(list.matches).toBe(300);
    const row = list.rows[0];
    expect(row.role).toBe('ALL');
    const s = store.champion(row.championId, 'arena');
    const ar = s.arena!;
    expect(ar.placements.reduce((a, b) => a + b, 0)).toBe(s.summary!.games);
    expect(ar.avgPlacement).toBeGreaterThanOrEqual(1);
    expect(ar.avgPlacement).toBeLessThanOrEqual(8);
    // A top-four finish is a win.
    expect(s.summary!.winRate).toBeCloseTo(ar.placements.slice(0, 4).reduce((a, b) => a + b, 0) / s.summary!.games, 5);
    expect(ar.items.length).toBeGreaterThan(0);
    for (const it of ar.items) {
      expect(Object.keys(it).sort()).toEqual(['id', 'pickRate']); // popularity only
      expect(it.pickRate).toBeLessThanOrEqual(1);
    }
    expect(JSON.stringify(s)).not.toMatch(/augment/i);
    expect(s.builds).toEqual([]);
    expect(s.core).toEqual([]);
    expect(s.later).toEqual([]);
    expect(ar.partners.every((p) => p.championId !== row.championId)).toBe(true);
  });

  it('keeps arena out of ranked', () => {
    expect(store.tierList('ranked').matches).toBe(0);
    expect(store.champion(103, 'ranked').arena).toBeUndefined();
  });
});

describe('search engine text', () => {
  it('picks ?lang first, then Accept-Language, then English', () => {
    expect(pickLang('de', 'fr-FR')).toEqual({ lang: 'de', explicit: true });
    expect(pickLang(undefined, 'pt-BR,pt;q=0.9')).toEqual({ lang: 'pt', explicit: false });
    expect(pickLang('xx', 'ja-JP')).toEqual({ lang: 'en', explicit: false });
  });

  it('translates titles', () => {
    expect(seoText('ro', 'champTitle', { name: 'Ahri' })).toBe('Ahri: build, rune și counteri · Riftwatch');
  });

  it('links every language variant', () => {
    const links = alternateLinks('https://x.gg', '/champions/ahri', 'fr', new URLSearchParams('queue=aram'));
    expect(links[0]).toBe('<link rel="canonical" href="https://x.gg/champions/ahri?queue=aram&amp;lang=fr" />');
    expect(links).toHaveLength(1 + 7 + 1);
    expect(links.at(-1)).toContain('hreflang="x-default" href="https://x.gg/champions/ahri?queue=aram"');
    const xml = sitemapXml('https://x.gg', ['/', '/champions?queue=arena']);
    expect(xml.match(/<url>/g)).toHaveLength(16);
    expect(xml).toContain('<loc>https://x.gg/champions?queue=arena&amp;lang=pl</loc>');
  });
});

describe('error log', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('groups repeats and alerts once per new problem', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      calls.push(String(init.body));
      return new Response(null, { status: 204 });
    });
    const log = new ErrorLog(null, 'https://hooks.example/abc');
    log.record({ source: 'server', kind: 'TypeError', message: 'Match EUW1_7012345 failed after 3 tries' });
    log.record({ source: 'server', kind: 'TypeError', message: 'Match EUW1_7099999 failed after 4 tries' });
    log.record({ source: 'riot', kind: 'KEY_INVALID', message: 'Riot rejected the API key.', urgent: true });
    await new Promise((r) => setTimeout(r, 0));
    const entries = log.entries();
    expect(entries).toHaveLength(2);
    expect(entries.find((e) => e.kind === 'TypeError')!.count).toBe(2);
    expect(calls).toHaveLength(2);
    expect(JSON.parse(calls[1]).content).toContain('KEY_INVALID');
  });
});

describe('player comparison', () => {
  const a = mockMatches({ gameName: 'Caps', tagLine: 'EUW' }, 0, 20, {}).matches;
  const puuid = a[0].participants.find((p) => p.gameName === 'Caps')!.puuid;

  it('averages per game without remakes', () => {
    const s = summarize(a, puuid);
    const played = a.filter((m) => !m.remake);
    expect(s.games).toBe(played.length);
    expect(s.winRate).toBeCloseTo(s.wins / s.games, 6);
    expect(s.kills).toBeGreaterThan(0);
  });

  it('finds games played together', () => {
    const m = a.find((x) => !x.remake)!;
    const me = m.participants.find((p) => p.puuid === puuid)!;
    const mate = m.participants.find((p) => p.teamId === me.teamId && p.puuid !== puuid)!;
    const foe = m.participants.find((p) => p.teamId !== me.teamId)!;
    expect(together([m], [], puuid, mate.puuid)).toMatchObject({ sameGames: 1, vsGames: 0 });
    expect(together([m], [], puuid, foe.puuid)).toMatchObject({ sameGames: 0, vsGames: 1, vsWinsA: me.win ? 1 : 0 });
  });
});

describe('profile privacy', async () => {
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  const { PrivacyStore } = await import('../server/privacy');
  const { PlayerIndex } = await import('../server/playerIndex');

  it('hides only after the named icon is equipped, and remembers it', () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rw-priv-')), 'privacy.json');
    const store = new PrivacyStore(file);
    const acc = { puuid: 'p1', gameName: 'Faker', tagLine: 'KR1' };
    const c = store.challenge(acc, 'kr', 5, 'hide');
    expect(c.iconId).not.toBe(5);
    expect(c.iconId).toBeGreaterThanOrEqual(0);
    expect(c.iconId).toBeLessThanOrEqual(28);
    expect(store.verify('p1', 5)).toBeNull();
    expect(store.isHidden('p1')).toBe(false);
    expect(store.verify('p1', c.iconId)?.action).toBe('hide');
    expect(store.isHidden('p1')).toBe(true);
    expect(store.verify('p1', c.iconId)).toBeNull(); // one use only
    expect(new PrivacyStore(file).isHidden('p1')).toBe(true);
    const s2 = store.challenge(acc, 'kr', c.iconId, 'show');
    store.verify('p1', s2.iconId);
    expect(store.isHidden('p1')).toBe(false);
  });

  it('removes a hidden player from search and keeps them out', () => {
    const idx = new PlayerIndex(path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rw-idx-')), 'players.json'));
    idx.add({ platform: 'kr', puuid: 'p1', gameName: 'Faker', tagLine: 'KR1' });
    idx.add({ platform: 'kr', gameName: 'Faker', tagLine: 'KR1' });
    expect(idx.search('Faker', 'kr')).toHaveLength(1);
    idx.remove('p1', { platform: 'kr', gameName: 'Faker', tagLine: 'KR1' });
    idx.isBlocked = (id) => id === 'p1';
    idx.add({ platform: 'kr', puuid: 'p1', gameName: 'Faker', tagLine: 'KR1' });
    expect(idx.search('Faker', 'kr')).toHaveLength(0);
  });
});

describe('policy safeguards', async () => {
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  const { PrivacyStore } = await import('../server/privacy');
  const { PlayerIndex } = await import('../server/playerIndex');
  const { LpStore } = await import('../server/lpStore');
  const tmp = (n: string) => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rw-')), n);

  it('keeps a hidden player hidden after the API key (and so the PUUID) changes', () => {
    const file = tmp('privacy.json');
    const store = new PrivacyStore(file);
    const c = store.challenge({ puuid: 'dev-key-puuid', gameName: 'Faker', tagLine: 'KR1' }, 'kr', 1, 'hide');
    store.verify('dev-key-puuid', c.iconId);
    const after = new PrivacyStore(file);
    expect(after.isHidden('prod-key-puuid')).toBe(false);
    expect(after.isHiddenPlayer({ puuid: 'prod-key-puuid', gameName: 'faker', tagLine: 'kr1' })).toBe(true);
    expect(after.isHidden('prod-key-puuid')).toBe(true); // learned the new PUUID
    expect(new PrivacyStore(file).isHidden('prod-key-puuid')).toBe(true);
  });

  it('never suggests an old Riot ID after a rename', () => {
    const idx = new PlayerIndex(tmp('players.json'));
    idx.add({ platform: 'euw1', puuid: 'p', gameName: 'OldName', tagLine: 'EUW' });
    idx.add({ platform: 'euw1', puuid: 'p', gameName: 'NewName', tagLine: 'EUW' });
    expect(idx.search('OldName', 'euw1')).toHaveLength(0);
    expect(idx.search('NewName', 'euw1')).toHaveLength(1);
  });

  it('moves rank history to a new PUUID', () => {
    const lp = new LpStore(null);
    lp.record('old', [{ queueType: 'RANKED_SOLO_5x5', tier: 'GOLD', rank: 'I', leaguePoints: 50, wins: 10, losses: 5, hotStreak: false, veteran: false, freshBlood: false }]);
    lp.track({ platform: 'euw1', puuid: 'old', gameName: 'a', tagLine: 'b' });
    lp.rekey('old', 'new');
    expect(lp.history('old')).toHaveLength(0);
    expect(lp.history('new')).toHaveLength(1);
    expect(lp.isTracked('new')).toBe(true);
  });
});

describe('patch movers', async () => {
  const { movers } = await import('../server/champStats');
  const row = (championId: number, winRate: number, games: number) => ({ championId, role: 'MIDDLE', winRate, games, pickRate: 0.05, banRate: 0, tier: 'A' as const, rank: 1, lowSample: false });
  it('ranks real changes and ignores small samples', () => {
    const m = movers([row(1, 0.55, 400), row(2, 0.45, 400), row(3, 0.7, 10), row(4, 0.501, 400)], [row(1, 0.5, 400), row(2, 0.5, 400), row(3, 0.4, 10), row(4, 0.5, 400)], '15.19');
    expect(m.up.map((x) => x.championId)).toEqual([1]);
    expect(m.down.map((x) => x.championId)).toEqual([2]);
    expect(m.up[0].delta).toBeCloseTo(0.05);
  });
});

describe('benchmarks', async () => {
  const { ChampionStatsStore } = await import('../server/champStats');
  const { mockMatches } = await import('../server/mock');
  it('averages a role across champions and for one champion', () => {
    const store = new ChampionStatsStore(null);
    for (let i = 0; i < 30; i++) for (const m of mockMatches({ gameName: `Bench${i}`, tagLine: 'X' }, 0, 20, {}).matches) store.addMatch(m);
    const mid = store.benchmarks('MIDDLE');
    expect(mid.games).toBeGreaterThan(50);
    expect(mid.avg!.csPerMin).toBeGreaterThan(3);
    expect(mid.avg!.csPerMin).toBeLessThan(12);
    const someChamp = Number(Object.keys((store as any).s.patches[mid.patch!].ranked.champs).find((id) => (store as any).s.patches[mid.patch!].ranked.champs[id].roles.MIDDLE));
    const one = store.benchmarks('MIDDLE', someChamp);
    expect(one.games).toBeLessThan(mid.games);
    expect(store.benchmarks('TOP', 999999).avg).toBeNull();
  });
});
