import { TtlCache } from './cache';
import { ApiError } from './errors';
import { RateLimiter } from './rateLimiter';
import type { Platform } from '../shared/regions';

const MINUTE = 60_000;

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

export class RiotClient {
  private cache = new TtlCache<unknown>(1500);
  private limiter: RateLimiter;
  private appLimitHeader = '';

  constructor(
    private apiKey: string,
    limits = { perSecond: 20, perTwoMinutes: 100 },
  ) {
    this.limiter = new RateLimiter([
      { limit: limits.perSecond, ms: 1000 },
      { limit: limits.perTwoMinutes, ms: 2 * MINUTE },
    ]);
  }

  /** GET a Riot endpoint with caching, rate limiting and one automatic retry on 429. */
  async get<T>(host: string, path: string, ttlMs: number, opts: { fresh?: boolean; allow404?: boolean } = {}): Promise<T | null> {
    const key = `${host}${path}`;
    if (!opts.fresh) {
      const hit = this.cache.get(key);
      if (hit !== undefined) return hit as T | null;
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      await this.limiter.schedule(host);
      let res: Response;
      try {
        res = await fetch(`https://${host}.api.riotgames.com${path}`, {
          headers: { 'X-Riot-Token': this.apiKey },
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        throw new ApiError(502, 'UPSTREAM', 'Could not reach the Riot API. Check your internet connection.');
      }

      this.adaptLimits(res.headers.get('x-app-rate-limit'));
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
        const retryAfter = Number(res.headers.get('retry-after') ?? '2');
        if (attempt === 0 && retryAfter <= 10) {
          await new Promise((r) => setTimeout(r, retryAfter * 1000));
          continue;
        }
        throw new ApiError(429, 'RATE_LIMITED', 'Riot is rate limiting requests. Try again in a moment.', retryAfter);
      }
      if (res.status === 401 || res.status === 403) {
        throw new ApiError(
          502,
          'KEY_INVALID',
          'The Riot API key was rejected. Development keys expire every 24 hours — generate a new one at developer.riotgames.com and update server/.env.',
        );
      }
      throw new ApiError(502, 'UPSTREAM', `Riot API returned ${res.status}.`);
    }
    throw new ApiError(429, 'RATE_LIMITED', 'Riot is rate limiting requests. Try again in a moment.');
  }

  /**
   * Riot reports the key's real limits on every response ("20:1,100:120"). Development,
   * personal and production keys differ, so adopt them (at 90%, leaving headroom).
   */
  private adaptLimits(header: string | null) {
    if (!header || header === this.appLimitHeader) return;
    this.appLimitHeader = header;
    const windows = header
      .split(',')
      .map((part) => part.split(':').map(Number))
      .filter(([limit, secs]) => limit > 0 && secs > 0)
      .map(([limit, secs]) => ({ limit: Math.max(1, Math.floor(limit * 0.9)), ms: secs * 1000 }));
    if (windows.length) {
      this.limiter.setWindows(windows);
      console.log(`Using your API key's rate limits: ${this.limiter.describe()}`);
    }
  }

  account(p: Platform, gameName: string, tagLine: string, fresh = false) {
    return this.get<RiotAccount>(
      p.accountRegional,
      `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      30 * MINUTE,
      { fresh },
    ) as Promise<RiotAccount>;
  }

  summoner(p: Platform, puuid: string, fresh = false) {
    return this.get<RiotSummoner>(p.id, `/lol/summoner/v4/summoners/by-puuid/${puuid}`, 5 * MINUTE, { fresh }) as Promise<RiotSummoner>;
  }

  async league(p: Platform, puuid: string, fresh = false, summonerId?: string) {
    try {
      return (await this.get<unknown[]>(p.id, `/lol/league/v4/entries/by-puuid/${puuid}`, 2 * MINUTE, { fresh })) as any[];
    } catch (e) {
      // Older routing: fall back to the summoner-id endpoint when it is still available.
      if (e instanceof ApiError && e.code === 'NOT_FOUND' && summonerId) {
        return ((await this.get<unknown[]>(p.id, `/lol/league/v4/entries/by-summoner/${summonerId}`, 2 * MINUTE, { fresh })) as any[]) ?? [];
      }
      if (e instanceof ApiError && e.code === 'NOT_FOUND') return [];
      throw e;
    }
  }

  mastery(p: Platform, puuid: string, fresh = false) {
    return this.get<unknown[]>(p.id, `/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=10`, 30 * MINUTE, {
      fresh,
    }) as Promise<any[]>;
  }

  masteryOn(p: Platform, puuid: string, championId: number) {
    return this.get<any>(p.id, `/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${championId}`, 30 * MINUTE, { allow404: true });
  }

  matchIds(p: Platform, puuid: string, start: number, count: number, filter: { queue?: number; type?: string }, fresh = false) {
    const q = new URLSearchParams({ start: String(start), count: String(count) });
    if (filter.queue) q.set('queue', String(filter.queue));
    if (filter.type) q.set('type', filter.type);
    return this.get<string[]>(p.regional, `/lol/match/v5/matches/by-puuid/${puuid}/ids?${q}`, 2 * MINUTE, { fresh }) as Promise<string[]>;
  }

  /** Finished matches never change, so they are cached for a long time. */
  match(p: Platform, matchId: string, store = true) {
    return this.get<any>(p.regional, `/lol/match/v5/matches/${matchId}`, store ? 6 * 60 * MINUTE : 0) as Promise<any>;
  }

  /** Top of the ladder; entries include each player's puuid. */
  apexLeague(p: Platform, tier: 'challenger' | 'grandmaster' | 'master', queue = 'RANKED_SOLO_5x5') {
    return this.get<any>(p.id, `/lol/league/v4/${tier}leagues/by-queue/${queue}`, 10 * MINUTE) as Promise<any>;
  }

  accountByPuuid(p: Platform, puuid: string) {
    return this.get<RiotAccount>(p.accountRegional, `/riot/account/v1/accounts/by-puuid/${puuid}`, 24 * 60 * MINUTE) as Promise<RiotAccount>;
  }

  rotation(p: Platform) {
    return this.get<any>(p.id, `/lol/platform/v3/champion-rotations`, 60 * MINUTE) as Promise<any>;
  }

  status(p: Platform) {
    return this.get<any>(p.id, `/lol/status/v4/platform-data`, 5 * MINUTE) as Promise<any>;
  }

  timeline(p: Platform, matchId: string) {
    // Raw timelines are large (~1 MB); callers cache the shaped version instead.
    return this.get<any>(p.regional, `/lol/match/v5/matches/${matchId}/timeline`, 0) as Promise<any>;
  }

  live(p: Platform, puuid: string) {
    return this.get<any>(p.id, `/lol/spectator/v5/active-games/by-summoner/${puuid}`, 30_000, { allow404: true });
  }
}
