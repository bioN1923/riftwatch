import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChampionStatsStore } from '../server/champStats';
import { mockArenaMatch, mockMatches } from '../server/mock';
import { augmentText } from '../server/augments';
import { ErrorLog } from '../server/errorLog';
import { alternateLinks, pickLang, seoText, sitemapXml } from '../server/seo';
import { summarize, together } from '../src/lib/compare';

describe('arena statistics', () => {
  const store = new ChampionStatsStore(null);
  for (let i = 0; i < 300; i++) store.addMatch(mockArenaMatch(i));

  it('counts places, augments and partners', () => {
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
    expect(ar.augments.length).toBeGreaterThan(0);
    for (const a of ar.augments) expect(a.avgPlacement).toBeGreaterThanOrEqual(1);
    expect(ar.partners.every((p) => p.championId !== row.championId)).toBe(true);
  });

  it('keeps arena out of ranked', () => {
    expect(store.tierList('ranked').matches).toBe(0);
    expect(store.champion(103, 'ranked').arena).toBeUndefined();
  });
});

describe('augment text', () => {
  it('fills values and strips markup', () => {
    const out = augmentText('Gain <b>@Bonus*100@%</b> damage for @Duration@ seconds.<br><br>{{ Item_Keyword }}Done&nbsp;now', { Bonus: [0, 0.25], Duration: [3, 3] });
    expect(out).toBe('Gain 25% damage for 3 seconds.\n\nDone now');
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
