import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ApiError } from './errors';
import { RiotClient } from './riot';
import { shapeLeague, shapeLive, shapeMatch, shapeTimeline } from './shape';
import { DEMO_SEED, mockLive, mockMatchById, mockMatches, mockProfile, mockTimeline, nameFromDemoPuuid } from './mock';
import { PlayerIndex } from './playerIndex';
import { ChampionStatsStore } from './champStats';
import { loadItemKinds } from './items';
import { startCrawler } from './crawler';
import { TtlCache } from './cache';
import { getPlatform } from '../shared/regions';
import type { ApiErrorBody, HealthResponse, MatchPage, MatchSummary, MatchTimeline, PlayerHit, Profile, StatsGroup } from '../shared/types';

const PORT = Number(process.env.PORT ?? 3001);
const API_KEY = process.env.RIOT_API_KEY?.trim() ?? '';
const DEMO = process.env.DEMO_MODE === 'true' || !API_KEY || API_KEY.startsWith('RGAPI-xxxx');

const riot = new RiotClient(API_KEY, {
  perSecond: Number(process.env.RIOT_RATE_PER_SECOND ?? 20),
  perTwoMinutes: Number(process.env.RIOT_RATE_PER_2MIN ?? 100),
});

const here = path.dirname(fileURLToPath(import.meta.url));
const players = new PlayerIndex(path.resolve(here, 'data', DEMO ? 'players.demo.json' : 'players.json'));
if (DEMO) DEMO_SEED.forEach((p) => players.add(p));

const champStats = new ChampionStatsStore(DEMO ? null : path.resolve(here, 'data', 'champions.json'));
const timelines = new TtlCache<MatchTimeline>(300);
let lastUserRequest = 0;

if (DEMO) {
  // Demo mode: build champion stats from a few thousand generated games.
  const t0 = Date.now();
  for (let i = 0; i < 180; i++) {
    const page = mockMatches({ gameName: `Scout${i}`, tagLine: 'DEMO' }, 0, 20, {});
    for (const m of page.matches) {
      champStats.addMatch(m);
      champStats.addTimeline(m, mockTimeline(m));
    }
  }
  console.log(`Demo champion stats ready (${Date.now() - t0} ms).`);
} else {
  void loadItemKinds();
}

function indexProfile(p: Profile, viewed = true) {
  const solo = p.ranked.find((r) => r.queueType === 'RANKED_SOLO_5x5');
  players.add(
    { platform: p.platform, gameName: p.account.gameName, tagLine: p.account.tagLine, profileIconId: p.summoner.profileIconId, level: p.summoner.summonerLevel, tier: solo?.tier, rank: solo?.rank, lp: solo?.leaguePoints },
    { viewed },
  );
}
function indexMatches(platform: string, matches: MatchSummary[]) {
  for (const m of matches) for (const x of m.participants) if (!x.puuid.startsWith('demo-rand') || DEMO) players.add({ platform, gameName: x.gameName, tagLine: x.tagLine });
}

const app = express();
app.disable('x-powered-by');

const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

function platformOr400(id: string) {
  const p = getPlatform(id);
  if (!p) throw new ApiError(400, 'BAD_REQUEST', `Unknown region "${id}".`);
  return p;
}

const QUEUE_FILTERS: Record<string, { queue?: number; type?: string }> = {
  all: {},
  solo: { queue: 420 },
  flex: { queue: 440 },
  normal: { type: 'normal' },
  aram: { queue: 450 },
  arena: { queue: 1700 },
};

app.use('/api', (req, _res, next) => {
  if (!req.path.startsWith('/champions') && req.path !== '/health') lastUserRequest = Date.now();
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: DEMO ? 'demo' : 'live' } satisfies HealthResponse);
});

app.get(
  '/api/profile/:platform/:gameName/:tagLine',
  wrap(async (req, res) => {
    const p = platformOr400(String(req.params.platform));
    const gameName = String(req.params.gameName).trim();
    const tagLine = String(req.params.tagLine).trim();
    const fresh = req.query.fresh === '1';
    if (!gameName || !tagLine || gameName.length > 16 || tagLine.length > 5) {
      throw new ApiError(400, 'BAD_REQUEST', 'A Riot ID looks like Name#TAG — up to 16 characters, then a tag of 3–5.');
    }

    if (DEMO) {
      const profile = mockProfile(p.id, gameName, tagLine);
      if (!profile) throw new ApiError(404, 'NOT_FOUND', `No player called ${gameName}#${tagLine} on ${p.label}.`);
      indexProfile(profile);
      return res.json(profile);
    }

    let account;
    try {
      account = await riot.account(p, gameName, tagLine, fresh);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'NOT_FOUND') {
        throw new ApiError(404, 'NOT_FOUND', `No player called ${gameName}#${tagLine}. Check the spelling and the tag after the #.`);
      }
      throw e;
    }

    let summoner;
    try {
      summoner = await riot.summoner(p, account.puuid, fresh);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'NOT_FOUND') {
        throw new ApiError(404, 'NOT_FOUND', `${account.gameName}#${account.tagLine} exists, but has never played League on ${p.label}. Try another region.`);
      }
      throw e;
    }

    const [league, mastery] = await Promise.all([riot.league(p, account.puuid, fresh), riot.mastery(p, account.puuid, fresh).catch(() => [])]);

    const profile: Profile = {
      platform: p.id,
      account: { puuid: account.puuid, gameName: account.gameName, tagLine: account.tagLine },
      summoner: { profileIconId: summoner.profileIconId, summonerLevel: summoner.summonerLevel, revisionDate: summoner.revisionDate },
      ranked: shapeLeague(league ?? []),
      mastery: (mastery ?? []).map((m: any) => ({
        championId: m.championId,
        championLevel: m.championLevel,
        championPoints: m.championPoints,
        lastPlayTime: m.lastPlayTime,
      })),
      fetchedAt: Date.now(),
    };
    indexProfile(profile);
    res.json(profile);
  }),
);

app.get(
  '/api/matches/:platform/:puuid',
  wrap(async (req, res) => {
    const p = platformOr400(String(req.params.platform));
    const puuid = String(req.params.puuid);
    const start = Math.max(0, Number(req.query.start ?? 0) || 0);
    const count = Math.min(20, Math.max(1, Number(req.query.count ?? 10) || 10));
    const filter = QUEUE_FILTERS[String(req.query.queue ?? 'all')] ?? {};
    const fresh = req.query.fresh === '1';

    if (DEMO) {
      const name = nameFromDemoPuuid(puuid);
      if (!name) throw new ApiError(404, 'NOT_FOUND', 'Unknown player.');
      const page = mockMatches(name, start, count, filter);
      indexMatches(p.id, page.matches);
      return res.json(page);
    }

    const ids = await riot.matchIds(p, puuid, start, count, filter, fresh);
    const settled = await Promise.allSettled(ids.map((id) => riot.match(p, id)));
    const firstFatal = settled.find((s) => s.status === 'rejected' && !(s.reason instanceof ApiError && s.reason.code === 'NOT_FOUND'));
    if (firstFatal && settled.every((s) => s.status === 'rejected')) throw (firstFatal as PromiseRejectedResult).reason;

    const matches = settled.flatMap((s) => (s.status === 'fulfilled' && s.value ? [shapeMatch(s.value)] : []));
    const page: MatchPage = { matches, nextStart: ids.length === count ? start + count : null };
    indexMatches(p.id, matches);
    matches.forEach((m) => champStats.addMatch(m));
    res.json(page);
  }),
);

app.get(
  '/api/timeline/:platform/:matchId',
  wrap(async (req, res) => {
    const p = platformOr400(String(req.params.platform));
    const matchId = String(req.params.matchId);
    if (DEMO) {
      const m = mockMatchById(matchId);
      if (!m) throw new ApiError(404, 'NOT_FOUND', 'No timeline for this match.');
      return res.json(mockTimeline(m));
    }
    const cached = timelines.get(matchId);
    if (cached) return res.json(cached);
    const [raw, match] = await Promise.all([riot.timeline(p, matchId), riot.match(p, matchId)]);
    const tl = shapeTimeline(raw, match.info.participants.map((x: any) => x.puuid));
    timelines.set(matchId, tl, 6 * 60 * 60_000);
    const summary = shapeMatch(match);
    champStats.addMatch(summary);
    champStats.addTimeline(summary, tl);
    res.json(tl);
  }),
);

const groupParam = (v: unknown): StatsGroup => (v === 'aram' ? 'aram' : 'ranked');

app.get('/api/champions', (req, res) => {
  res.json(champStats.tierList(groupParam(req.query.group), req.query.patch ? String(req.query.patch) : undefined));
});

app.get('/api/champions/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) throw new ApiError(400, 'BAD_REQUEST', 'Unknown champion.');
  res.json(
    champStats.champion(id, groupParam(req.query.group), req.query.role ? String(req.query.role) : undefined, req.query.patch ? String(req.query.patch) : undefined),
  );
});

/**
 * Autocomplete. Returns players from the local index, and — when the query is a full
 * Riot ID (Name#TAG) and `resolve=1` — also checks Riot directly so brand-new players appear.
 */
app.get(
  '/api/search',
  wrap(async (req, res) => {
    const p = platformOr400(String(req.query.platform ?? 'euw1'));
    const q = String(req.query.q ?? '').slice(0, 40);
    const hits = players.search(q, p.id);
    const hash = q.lastIndexOf('#');
    const gameName = hash > 0 ? q.slice(0, hash).trim() : '';
    const tagLine = hash > 0 ? q.slice(hash + 1).trim() : '';
    const exact = (h: PlayerHit) => h.platform === p.id && h.gameName.toLowerCase() === gameName.toLowerCase() && h.tagLine.toLowerCase() === tagLine.toLowerCase();

    if (req.query.resolve === '1' && gameName && tagLine.length >= 2 && !hits.some(exact)) {
      try {
        let found: PlayerHit | null = null;
        if (DEMO) {
          const prof = mockProfile(p.id, gameName, tagLine);
          if (prof) found = { platform: p.id, gameName, tagLine, profileIconId: prof.summoner.profileIconId, level: prof.summoner.summonerLevel, tier: prof.ranked[0]?.tier, rank: prof.ranked[0]?.rank, lp: prof.ranked[0]?.leaguePoints };
        } else {
          const acc = await riot.account(p, gameName, tagLine);
          const sum = await riot.summoner(p, acc.puuid);
          found = { platform: p.id, gameName: acc.gameName, tagLine: acc.tagLine, profileIconId: sum.profileIconId, level: sum.summonerLevel };
        }
        if (found) {
          players.add(found);
          hits.unshift({ ...found, verified: true });
        }
      } catch (e) {
        if (!(e instanceof ApiError && e.code === 'NOT_FOUND')) throw e;
      }
    }
    res.json(hits.slice(0, 8));
  }),
);

app.get(
  '/api/live/:platform/:puuid',
  wrap(async (req, res) => {
    const p = platformOr400(String(req.params.platform));
    const puuid = String(req.params.puuid);
    if (DEMO) {
      const name = nameFromDemoPuuid(puuid);
      return res.json(name ? mockLive(name.gameName, name.tagLine) : { inGame: false });
    }
    const raw = await riot.live(p, puuid);
    const live = raw ? shapeLive(raw) : null;
    live?.participants.forEach((x) => players.add({ platform: p.id, gameName: x.gameName, tagLine: x.tagLine, profileIconId: x.profileIconId }));
    res.json(live ?? { inGame: false });
  }),
);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown API route.' } } satisfies ApiErrorBody);
});

// In production, serve the built client from the same origin.
const dist = path.resolve(here, '../dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '1h', index: false }));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    if (err.retryAfter) res.setHeader('Retry-After', String(err.retryAfter));
    return res.status(err.status).json({ error: { code: err.code, message: err.message, retryAfter: err.retryAfter } } satisfies ApiErrorBody);
  }
  console.error(err);
  res.status(500).json({ error: { code: 'UPSTREAM', message: 'Something went wrong on the server.' } } satisfies ApiErrorBody);
});

if (!DEMO && process.env.CRAWLER !== 'false') {
  const crawlPlatform = getPlatform(process.env.CRAWL_REGION ?? 'euw1') ?? getPlatform('euw1')!;
  startCrawler({ riot, platform: crawlPlatform, stats: champStats, lastUserRequest: () => lastUserRequest, paceMs: Number(process.env.CRAWL_PACE_MS ?? 2500) });
}

process.on('SIGINT', () => {
  players.flush();
  champStats.flush();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}  (${DEMO ? 'demo data — set RIOT_API_KEY in .env for live data' : 'live Riot data'})`);
});
