import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RiotClient } from '../server/riot';
import { MatchStore } from '../server/matchStore';
import { RateLimiter, backoffMs, parseLimitHeader } from '../server/rateLimiter';
import { getPlatform } from '../shared/regions';

const euw = getPlatform('euw1')!;
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

afterEach(() => vi.unstubAllGlobals());

describe('rate limit handling', () => {
  it('waits out Retry-After on a 429 and pauses the whole region meanwhile', async () => {
    const times: number[] = [];
    let n = 0;
    vi.stubGlobal('fetch', async () => {
      times.push(Date.now());
      return n++ === 0 ? json({}, 429, { 'retry-after': '1', 'x-rate-limit-type': 'application' }) : json({ puuid: 'p', profileIconId: 1, summonerLevel: 1, revisionDate: 0 });
    });
    const riot = new RiotClient('k');
    const t0 = Date.now();
    const pa = riot.summoner(euw, 'a');
    await new Promise((r) => setTimeout(r, 50)); // the 429 has arrived; now another visitor asks
    const [a, b] = await Promise.all([pa, riot.summoner(euw, 'b')]);
    expect(a.puuid).toBe('p');
    expect(b.puuid).toBe('p');
    // Both the retry and the other queued request waited the full second.
    expect(times.slice(1).every((t) => t - t0 >= 990)).toBe(true);
  });

  it('backs off exponentially when Riot gives no Retry-After, and retries 5xx', async () => {
    const statuses = [429, 503];
    vi.stubGlobal('fetch', async () => {
      const s = statuses.shift();
      return s ? json({}, s) : json(['EUW1_1']);
    });
    const riot = new RiotClient('k');
    expect(await riot.matchIds(euw, 'p', 0, 1, {})).toEqual(['EUW1_1']);
    expect(statuses).toHaveLength(0);
  });

  it('gives up quickly with a retry time when Riot asks for a long wait', async () => {
    vi.stubGlobal('fetch', async () => json({}, 429, { 'retry-after': '60' }));
    const riot = new RiotClient('k');
    await expect(riot.summoner(euw, 'x')).rejects.toMatchObject({ code: 'RATE_LIMITED', retryAfter: 60 });
    // The pause is remembered: the next request fails fast without calling Riot.
    const spy = vi.fn(async () => json({}));
    vi.stubGlobal('fetch', spy);
    await expect(riot.summoner(euw, 'y')).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('reads per-method limits from Riot', () => {
    expect(parseLimitHeader('2000:10')).toEqual([{ limit: 1800, ms: 10_000 }]);
    const rl = new RateLimiter([]);
    rl.setWindows(parseLimitHeader('20:1,100:120'), 'euw1|match');
    expect(rl.describe('euw1|match')).toBe('18/1s, 90/120s');
    expect(backoffMs(0)).toBeGreaterThanOrEqual(1000);
    expect(backoffMs(3)).toBeGreaterThanOrEqual(8000);
    expect(backoffMs(10)).toBeLessThan(16_300);
  });
});

describe('match storage', () => {
  it('fetches a finished match once, then serves it from disk', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-matches-'));
    const spy = vi.fn(async () => json({ metadata: { matchId: 'EUW1_42' } }));
    vi.stubGlobal('fetch', spy);
    const a = new RiotClient('k', undefined, new MatchStore(dir));
    await a.match(euw, 'EUW1_42');
    await new Promise((r) => setTimeout(r, 50));
    // A fresh client (as after a restart) finds it on disk.
    const b = new RiotClient('k', undefined, new MatchStore(dir));
    expect(await b.match(euw, 'EUW1_42')).toEqual({ metadata: { matchId: 'EUW1_42' } });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('removes the least recently used matches past the cap', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-matches-'));
    const store = new MatchStore(dir, 10);
    for (let i = 0; i < 12; i++) {
      store.set(`EUW1_${i}`, { i });
      await new Promise((r) => setTimeout(r, 15));
    }
    await new Promise((r) => setTimeout(r, 50));
    expect(store.size).toBeLessThanOrEqual(10);
    expect(store.get('EUW1_11')).toEqual({ i: 11 });
    expect(store.get('EUW1_0')).toBeUndefined();
  });
});

describe('match storage across API keys', () => {
  it('refetches a stored match that was saved under another key', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-matches-'));
    const store = new MatchStore(dir);
    store.set('EUW1_9', { metadata: { participants: ['dev-puuid'] } });
    await new Promise((r) => setTimeout(r, 50));
    const spy = vi.fn(async () => json({ metadata: { participants: ['prod-puuid'] } }));
    vi.stubGlobal('fetch', spy);
    const riot = new RiotClient('k', undefined, store);
    expect(await riot.match(euw, 'EUW1_9', true, 'dev-puuid')).toEqual({ metadata: { participants: ['dev-puuid'] } });
    expect(spy).not.toHaveBeenCalled();
    expect(await riot.match(euw, 'EUW1_9', true, 'prod-puuid')).toEqual({ metadata: { participants: ['prod-puuid'] } });
    expect(spy).toHaveBeenCalledTimes(1);
    await new Promise((r) => setTimeout(r, 50));
    expect(store.get('EUW1_9')).toEqual({ metadata: { participants: ['prod-puuid'] } });
  });
});
