import { TtlCache } from './cache';
import { ApiError } from './errors';
import { RateLimiter, backoffMs, parseLimitHeader } from './rateLimiter';
import type { Platform } from '../shared/regions';

const MINUTE = 60_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rateLimited = (retryAfter?: number) => new ApiError(429, 'RATE_LIMITED', 'Riot is rate limiting requests. Try again in a moment.', retryAfter);

/** Raw Riot payload types — only the fields we read. */
export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}
export interface RiotSummoner {
  puuid: string;
  id?: string; // removed by Riot in 2025 on most platforms
  profileIconId: number;
  summonerLevel: number;
  revisionDate: number;
}

/** Longest a visitor's request will wait for Riot before we answer "try again shortly". */
const MAX_WAIT_MS = 10_000;
const MAX_ATTEMPTS = 4;

export class RiotClient {
  private cache = new TtlCache<unknown>(1500);
  /** Application limits, per routing host (Riot counts them per region). */
  private limiter: RateLimiter;
  /** Method limits, per host + endpoint; filled in from Riot's X-Method-Rate-Limit headers. */
  private methodLimiter = new RateLimiter([]);
  private appLimitHeader = '';
  private methodLimitHeaders = new Map<string, string>();

  constructor(
    private apiKey: string,
    limits = { perSecond: 20, perTwoMinutes: 100 },
    private matchStore?: { get(id: string): unknown | undefined; set(id: string, data: unknown, replace?: boolean): void },
  ) {
    this.limiter = new RateLimiter([
      { limit: limits.perSecond, ms: 1000 },
      { limit: limits.perTwoMinutes, ms: 2 * MINUTE },
    ]);
  }

  /**
   * GET a Riot endpoint with caching and rate limiting.
   * - Requests queue per region and per endpoint so we stay under the key's limits (read from
   *   Riot's own X-App-Rate-Limit / X-Method-Rate-Limit headers).
   * - On 429 the whole region (or endpoint) pauses for Retry-After, then retries; without a
   *   Retry-After (service limits) we back off exponentially with jitter.
   * - 5xx and network failures are retried with exponential backoff too.
   */
  async get<T>(host: string, path: string, ttlMs: number, opts: { fresh?: boolean; allow404?: boolean; method: string }): Promise<T | null> {
    const key = `${host}${path}`;
    if (!opts.fresh) {
      const hit = this.cache.get(key);
      if (hit !== undefined) return hit as T | null;
    }
    const methodKey = `${host}|${opts.method}`;
    let lastRetryAfter: number | undefined;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const waiting = Math.max(this.limiter.pausedFor(host), this.methodLimiter.pausedFor(methodKey));
      if (waiting > MAX_WAIT_MS) throw rateLimited(Math.ceil(waiting / 1000));
      await this.limiter.schedule(host);
      await this.methodLimiter.schedule(methodKey);

      let res: Response;
      try {
        res = await fetch(`https://${host}.api.riotgames.com${path}`, {
          headers: { 'X-Riot-Token': this.apiKey },
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        if (attempt < 2) {
          await sleep(backoffMs(attempt, 500));
          continue;
        }
        throw new ApiError(502, 'UPSTREAM', 'Could not reach the Riot API. Check your internet connection.');
      }

      this.adaptLimits(res.headers.get('x-app-rate-limit'));
      this.adaptMethodLimits(methodKey, res.headers.get('x-method-rate-limit'));
      if (res.ok) {
        const data = (await res.json()) as T;
        if (ttlMs > 0) this.cache.set(key, data, ttlMs);
        return data;
      }
      if (res.status === 404) {
        if (opts.allow404) {
          this.cache.set(key, null, Math.min(ttlMs, MINUTE));
          return null;
        }
        throw new ApiError(404, 'NOT_FOUND', 'Not found');
      }
      if (res.status === 429) {
        const header = res.headers.get('retry-after');
        const retryAfterMs = header ? Number(header) * 1000 : NaN;
        const type = res.headers.get('x-rate-limit-type'); // application | method | service
        // Honour Retry-After for everyone queued on that limit, not just this request.
        if (Number.isFinite(retryAfterMs)) {
          if (type === 'method') this.methodLimiter.pause(methodKey, retryAfterMs);
          else this.limiter.pause(host, retryAfterMs);
        }
        const wait = Number.isFinite(retryAfterMs) ? retryAfterMs : backoffMs(attempt);
        lastRetryAfter = Math.ceil(wait / 1000);
        if (wait > MAX_WAIT_MS || attempt === MAX_ATTEMPTS - 1) throw rateLimited(lastRetryAfter);
        if (!Number.isFinite(retryAfterMs)) await sleep(wait); // the pause above covers the other case
        continue;
      }
      if (res.status === 401 || res.status === 403) {
        throw new ApiError(
          502,
          'KEY_INVALID',
          'The Riot API key was rejected. Development keys expire every 24 hours — generate a new one at developer.riotgames.com and update server/.env.',
        );
      }
      if (res.status >= 500 && attempt < 2) {
        await sleep(backoffMs(attempt, 500));
        continue;
      }
      throw new ApiError(502, 'UPSTREAM', `Riot API returned ${res.status}.`);
    }
    throw rateLimited(lastRetryAfter);
  }

  /**
   * How much of the key's budget is free on a routing host (1 = all of it). Background work
   * (the stats collector, filling in ladder names) waits for at least half, so visitors'
   * own lookups always have room.
   */
  headroom(host: string) {
    return this.limiter.headroom(host);
  }

  /**
   * Riot reports the key's real limits on every response ("20:1,100:120"). Development,
   * personal and production keys differ, so adopt them (at 90%, leaving headroom).
   */
  private adaptLimits(header: string | null) {
    if (!header || header === this.appLimitHeader) return;
    this.appLimitHeader = header;
    const windows = parseLimitHeader(header);
    if (windows.length) {
      this.limiter.setWindows(windows);
      console.log(`Using your API key's rate limits: ${this.limiter.describe()}`);
    }
  }

  private adaptMethodLimits(methodKey: string, header: string | null) {
    if (!header || this.methodLimitHeaders.get(methodKey) === header) return;
    this.methodLimitHeaders.set(methodKey, header);
    this.methodLimiter.setWindows(parseLimitHeader(header), methodKey);
  }

  account(p: Platform, gameName: string, tagLine: string, fresh = false) {
    return this.get<RiotAccount>(
      p.accountRegional,
      `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      30 * MINUTE,
      { fresh, method: 'account-by-riot-id' },
    ) as Promise<RiotAccount>;
  }

  summoner(p: Platform, puuid: string, fresh = false) {
    return this.get<RiotSummoner>(p.id, `/lol/summoner/v4/summoners/by-puuid/${puuid}`, 5 * MINUTE, { fresh, method: 'summoner' }) as Promise<RiotSummoner>;
  }

  async league(p: Platform, puuid: string, fresh = false, summonerId?: string) {
    try {
      return (await this.get<unknown[]>(p.id, `/lol/league/v4/entries/by-puuid/${puuid}`, 2 * MINUTE, { fresh, method: 'league-entries' })) as any[];
    } catch (e) {
      // Older routing: fall back to the summoner-id endpoint when it is still available.
      if (e instanceof ApiError && e.code === 'NOT_FOUND' && summonerId) {
        return ((await this.get<unknown[]>(p.id, `/lol/league/v4/entries/by-summoner/${summonerId}`, 2 * MINUTE, { fresh, method: 'league-entries-old' })) as any[]) ?? [];
      }
      if (e instanceof ApiError && e.code === 'NOT_FOUND') return [];
      throw e;
    }
  }

  /** Challenge progress: total points, level and percentile (lol-challenges-v1). */
  challenges(p: Platform, puuid: string) {
    return this.get<any>(p.id, `/lol/challenges/v1/player-data/${puuid}`, 30 * MINUTE, { allow404: true, method: 'challenges-player' }) as Promise<any>;
  }

  mastery(p: Platform, puuid: string, fresh = false) {
    return this.get<unknown[]>(p.id, `/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=10`, 30 * MINUTE, {
      fresh,
      method: 'mastery-top',
    }) as Promise<any[]>;
  }

  masteryOn(p: Platform, puuid: string, championId: number) {
    return this.get<any>(p.id, `/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${championId}`, 30 * MINUTE, { allow404: true, method: 'mastery-champion' });
  }

  matchIds(p: Platform, puuid: string, start: number, count: number, filter: { queue?: number; type?: string }, fresh = false) {
    const q = new URLSearchParams({ start: String(start), count: String(count) });
    if (filter.queue) q.set('queue', String(filter.queue));
    if (filter.type) q.set('type', filter.type);
    return this.get<string[]>(p.regional, `/lol/match/v5/matches/by-puuid/${puuid}/ids?${q}`, 2 * MINUTE, { fresh, method: 'match-ids' }) as Promise<string[]>;
  }

  /** Finished matches never change, so they are cached for a long time. */
  async match(p: Platform, matchId: string, store = true, expectPuuid?: string) {
    // Finished matches never change: once stored on disk they are never requested again.
    // PUUIDs are encrypted per API key, so a match saved under another key (e.g. the development
    // key, before the production key) won't contain the player's current PUUID: fetch it again.
    const saved = this.matchStore?.get(matchId) as any;
    if (saved && (!expectPuuid || saved.metadata?.participants?.includes(expectPuuid))) return saved;
    const data = await this.get<any>(p.regional, `/lol/match/v5/matches/${matchId}`, store ? 6 * 60 * MINUTE : 0, { method: 'match' });
    if (data && store) this.matchStore?.set(matchId, data, !!saved);
    return data as any;
  }

  /** One page (about 200 players) of a tier below Master; entries include each player's puuid. */
  leaguePage(p: Platform, tier: string, division: string, page: number, queue = 'RANKED_SOLO_5x5') {
    return this.get<any[]>(p.id, `/lol/league/v4/entries/${queue}/${tier}/${division}?page=${page}`, 30 * MINUTE, { method: 'league-entries-tier' }) as Promise<any[]>;
  }

  /** Top of the ladder; entries include each player's puuid. */
  apexLeague(p: Platform, tier: 'challenger' | 'grandmaster' | 'master', queue = 'RANKED_SOLO_5x5') {
    return this.get<any>(p.id, `/lol/league/v4/${tier}leagues/by-queue/${queue}`, 10 * MINUTE, { method: 'apex-league' }) as Promise<any>;
  }

  accountByPuuid(p: Platform, puuid: string) {
    return this.get<RiotAccount>(p.accountRegional, `/riot/account/v1/accounts/by-puuid/${puuid}`, 24 * 60 * MINUTE, { method: 'account-by-puuid' }) as Promise<RiotAccount>;
  }

  rotation(p: Platform) {
    return this.get<any>(p.id, `/lol/platform/v3/champion-rotations`, 60 * MINUTE, { method: 'rotation' }) as Promise<any>;
  }

  status(p: Platform) {
    return this.get<any>(p.id, `/lol/status/v4/platform-data`, 5 * MINUTE, { method: 'status' }) as Promise<any>;
  }

  timeline(p: Platform, matchId: string) {
    // Raw timelines are large (~1 MB); callers cache the shaped version instead.
    return this.get<any>(p.regional, `/lol/match/v5/matches/${matchId}/timeline`, 0, { method: 'timeline' }) as Promise<any>;
  }

  live(p: Platform, puuid: string) {
    return this.get<any>(p.id, `/lol/spectator/v5/active-games/by-summoner/${puuid}`, 30_000, { allow404: true, method: 'spectator' });
  }
}
