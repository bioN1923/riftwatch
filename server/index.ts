import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import compression from 'compression';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ApiError } from './errors';
import { RiotClient } from './riot';
import { shapeLeague, shapeLive, shapeMatch, shapeTimeline } from './shape';
import { DEMO_SEED, mockLadder, mockLive, mockLpHistory, mockMatchById, mockMatches, mockProfile, mockRotation, mockScout, mockTimeline, nameFromDemoPuuid } from './mock';
import { LpStore } from './lpStore';
import { PlayerIndex } from './playerIndex';
import { ChampionStatsStore } from './champStats';
import { loadItemKinds } from './items';
import { startCrawler } from './crawler';
import { TtlCache } from './cache';
import { getPlatform } from '../shared/regions';
import type { ApiErrorBody, HealthResponse, Ladder, LadderEntry, LpHistory, MatchPage, MatchSummary, MatchTimeline, PlayerHit, Profile, ScoutInfo, ServerStatus, StatsGroup } from '../shared/types';

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
const lp = new LpStore(path.resolve(here, 'data', DEMO ? 'lp.demo.json' : 'lp.json'));
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
    { platform: p.platform, puuid: p.account.puuid, gameName: p.account.gameName, tagLine: p.account.tagLine, profileIconId: p.summoner.profileIconId, level: p.summoner.summonerLevel, tier: solo?.tier, rank: solo?.rank, lp: solo?.leaguePoints },
    { viewed },
  );
}
function indexMatches(platform: string, matches: MatchSummary[]) {
  for (const m of matches) for (const x of m.participants) if (!x.puuid.startsWith('demo-rand') || DEMO) players.add({ platform, puuid: x.puuid, gameName: x.gameName, tagLine: x.tagLine });
}

const app = express();
app.disable('x-powered-by');
app.use(compression());

// Optional password for the whole site (HTTP Basic auth). Riot doesn't allow a development key
// on a site the public can reach, so keep SITE_PASSWORD set until the production key is approved
// and give the reviewers the login. The health check stays open for the host's monitoring.
// Riot verifies the product URL with a code served at /riot.txt.
app.get('/riot.txt', (_req, res, next) => (process.env.RIOT_VERIFICATION ? res.type('text/plain').send(process.env.RIOT_VERIFICATION) : next()));

const SITE_PASSWORD = process.env.SITE_PASSWORD;
if (SITE_PASSWORD) {
  const expected = 'Basic ' + Buffer.from(`${process.env.SITE_USER ?? 'riot'}:${SITE_PASSWORD}`).toString('base64');
  app.use((req, res, next) => {
    if (req.path === '/api/health' || req.path === '/riot.txt' || req.headers.authorization === expected) return next();
    res.set('WWW-Authenticate', 'Basic realm="Riftwatch preview", charset="UTF-8"').status(401).send('Login required');
  });
}
app.use(express.json({ limit: '10kb' }));

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

const UPDATE_COOLDOWN_MS = 3 * 60_000;
const lastUpdate = new Map<string, number>(); // "platform:name#tag" -> when Riot was last asked for fresh data
setInterval(() => {
  for (const [k, t] of lastUpdate) if (Date.now() - t > UPDATE_COOLDOWN_MS) lastUpdate.delete(k);
}, 10 * 60_000).unref();

app.get(
  '/api/profile/:platform/:gameName/:tagLine',
  wrap(async (req, res) => {
    const p = platformOr400(String(req.params.platform));
    const gameName = String(req.params.gameName).trim();
    const tagLine = String(req.params.tagLine).trim();
    let fresh = req.query.fresh === '1';
    if (!gameName || !tagLine || gameName.length > 16 || tagLine.length > 5) {
      throw new ApiError(400, 'BAD_REQUEST', 'A Riot ID looks like Name#TAG — up to 16 characters, then a tag of 3–5.');
    }

    // One real update per player every UPDATE_COOLDOWN_MS, enforced here rather than trusted to the browser.
    const coolKey = `${p.id}:${gameName}#${tagLine}`.toLowerCase();
    const last = lastUpdate.get(coolKey);
    if (fresh && last && Date.now() - last < UPDATE_COOLDOWN_MS) fresh = false;
    if (fresh) lastUpdate.set(coolKey, Date.now());
    const updateIn = () => Math.max(0, (lastUpdate.get(coolKey) ?? 0) + UPDATE_COOLDOWN_MS - Date.now());

    if (DEMO) {
      const profile = mockProfile(p.id, gameName, tagLine);
      if (!profile) throw new ApiError(404, 'NOT_FOUND', `No player called ${gameName}#${tagLine} on ${p.label}.`);
      indexProfile(profile);
      return res.json({ ...profile, updateIn: updateIn() });
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

    const [league, mastery] = await Promise.all([riot.league(p, account.puuid, fresh, summoner.id), riot.mastery(p, account.puuid, fresh).catch(() => [])]);

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
    lp.record(profile.account.puuid, profile.ranked);
    res.json({ ...profile, updateIn: updateIn() });
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

app.get('/api/lp/:platform/:puuid', (req, res) => {
  const puuid = String(req.params.puuid);
  let points = lp.history(puuid);
  if (DEMO && points.length < 2) {
    const name = nameFromDemoPuuid(puuid);
    points = name ? mockLpHistory(name.gameName, name.tagLine) : [];
  }
  res.json({ points, tracked: lp.isTracked(puuid) } satisfies LpHistory);
});

app.post('/api/track', (req, res) => {
  const { platform, puuid, gameName, tagLine } = req.body ?? {};
  if (!getPlatform(platform) || typeof puuid !== 'string' || !puuid || typeof gameName !== 'string' || typeof tagLine !== 'string') {
    throw new ApiError(400, 'BAD_REQUEST', 'Missing player details.');
  }
  lp.track({ platform, puuid, gameName, tagLine });
  res.json({ tracked: true });
});

app.delete('/api/track/:puuid', (req, res) => {
  lp.untrack(String(req.params.puuid));
  res.json({ tracked: false });
});

/** Rank, level, mastery on a champion and recent match ids: what the live and multi-search views need. */
app.get(
  '/api/scout/:platform/:puuid',
  wrap(async (req, res) => {
    const p = platformOr400(String(req.params.platform));
    const puuid = String(req.params.puuid);
    const championId = Number(req.query.champion ?? 0);
    if (DEMO) return res.json(mockScout(puuid, championId));
    const [summoner, league, mastery, ids] = await Promise.all([
      riot.summoner(p, puuid).catch(() => null),
      riot.league(p, puuid).catch(() => [] as any[]),
      championId ? riot.masteryOn(p, puuid, championId).catch(() => null) : Promise.resolve(null),
      riot.matchIds(p, puuid, 0, 10, {}).catch(() => [] as string[]),
    ]);
    const ranked = shapeLeague(league ?? []);
    lp.record(puuid, ranked);
    const info: ScoutInfo = {
      puuid,
      level: summoner?.summonerLevel ?? null,
      profileIconId: summoner?.profileIconId ?? null,
      solo: ranked.find((e) => e.queueType === 'RANKED_SOLO_5x5') ?? null,
      flex: ranked.find((e) => e.queueType === 'RANKED_FLEX_SR') ?? null,
      mastery: mastery ? { level: mastery.championLevel, points: mastery.championPoints } : null,
      recentMatchIds: ids,
    };
    res.json(info);
  }),
);

const LADDER_PAGE = 50;

app.get(
  '/api/leaderboard/:platform',
  wrap(async (req, res) => {
    const p = platformOr400(String(req.params.platform));
    const queue = req.query.queue === 'flex' ? 'flex' : 'solo';
    const tier = (['challenger', 'grandmaster', 'master'] as const).find((t) => t === req.query.tier) ?? 'challenger';
    const page = Math.max(1, Number(req.query.page ?? 1) || 1);

    let all: Omit<LadderEntry, 'rank'>[];
    if (DEMO) {
      all = mockLadder(tier, queue);
    } else {
      const league = await riot.apexLeague(p, tier, queue === 'flex' ? 'RANKED_FLEX_SR' : 'RANKED_SOLO_5x5');
      all = (league?.entries ?? [])
        .map((e: any) => ({ puuid: e.puuid, gameName: null, tagLine: null, lp: e.leaguePoints, wins: e.wins, losses: e.losses, hotStreak: !!e.hotStreak, veteran: !!e.veteran }))
        .sort((a: LadderEntry, b: LadderEntry) => b.lp - a.lp);
    }
    const slice = all.slice((page - 1) * LADDER_PAGE, page * LADDER_PAGE);
    // Names: from the player index when known, otherwise one account lookup each (cached for a day).
    const entries: LadderEntry[] = await Promise.all(
      slice.map(async (e, i) => {
        let name = e.gameName ? { gameName: e.gameName, tagLine: e.tagLine! } : players.nameOf(e.puuid);
        if (!name && !DEMO && e.puuid) {
          try {
            const acc = await riot.accountByPuuid(p, e.puuid);
            name = { gameName: acc.gameName, tagLine: acc.tagLine };
            players.add({ platform: p.id, puuid: e.puuid, ...name });
          } catch {
            /* leave unnamed */
          }
        }
        return { ...e, rank: (page - 1) * LADDER_PAGE + i + 1, gameName: name?.gameName ?? null, tagLine: name?.tagLine ?? null };
      }),
    );
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.json({ platform: p.id, queue, tier, total: all.length, page, pageSize: LADDER_PAGE, entries } satisfies Ladder);
  }),
);

app.get(
  '/api/rotation/:platform',
  wrap(async (req, res) => {
    const p = platformOr400(String(req.params.platform));
    const ids: number[] = DEMO ? mockRotation() : ((await riot.rotation(p))?.freeChampionIds ?? []);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json({ championIds: ids });
  }),
);

app.get(
  '/api/status/:platform',
  wrap(async (req, res) => {
    const p = platformOr400(String(req.params.platform));
    if (DEMO) return res.json({ platform: p.id, notices: [] } satisfies ServerStatus);
    const raw = await riot.status(p).catch(() => null);
    const pick = (list: any[]) => (list ?? []).find((t: any) => t.locale === 'en_US')?.content ?? list?.[0]?.content ?? '';
    const notices: ServerStatus['notices'] = [
      ...(raw?.maintenances ?? []).map((m: any) => ({ id: String(m.id), kind: 'maintenance' as const, severity: m.maintenance_status ?? 'scheduled', title: pick(m.titles), detail: pick(m.updates?.[0]?.translations) })),
      ...(raw?.incidents ?? []).map((m: any) => ({ id: String(m.id), kind: 'incident' as const, severity: m.incident_severity ?? 'info', title: pick(m.titles), detail: pick(m.updates?.[0]?.translations) })),
    ].filter((n) => n.title);
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.json({ platform: p.id, notices } satisfies ServerStatus);
  }),
);

const groupParam = (v: unknown): StatsGroup => (v === 'aram' ? 'aram' : 'ranked');

app.get('/api/champions', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.json(champStats.tierList(groupParam(req.query.group), req.query.patch ? String(req.query.patch) : undefined));
});

app.get('/api/champions/:id', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=60');
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
    live?.participants.forEach((x) => players.add({ platform: p.id, puuid: x.puuid, gameName: x.gameName, tagLine: x.tagLine, profileIconId: x.profileIconId }));
    res.json(live ?? { inGame: false });
  }),
);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown API route.' } } satisfies ApiErrorBody);
});

// In production, serve the built client from the same origin.
const dist = path.resolve(here, '../dist');
if (fs.existsSync(dist)) {
  const indexHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  // fallthrough: false → a missing (e.g. outdated) asset is a real 404, not the HTML page.
  app.use('/assets', express.static(path.join(dist, 'assets'), { maxAge: '1y', immutable: true, fallthrough: false }));
  app.use(express.static(dist, { maxAge: '1h', index: false }));
  app.get(/^(?!\/api).*/, (req, res) => res.type('html').send(withMeta(indexHtml, req.path)));
}

/** Page titles and link-preview tags (Discord, Slack, X …) for shared profile and champion links. */
function withMeta(html: string, urlPath: string) {
  const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  let title = 'Riftwatch — League of Legends stats';
  let desc = 'Rank, match history, champion stats and live games for any League of Legends account.';
  const prof = /^\/lol\/([a-z0-9]+)\/([^/]+)/.exec(urlPath);
  const champ = /^\/champions\/([a-z0-9]+)/i.exec(urlPath);
  if (prof) {
    const slug = decodeURIComponent(prof[2]);
    const i = slug.lastIndexOf('-');
    if (i > 0) {
      const gameName = slug.slice(0, i);
      const tagLine = slug.slice(i + 1);
      const platform = getPlatform(prof[1]);
      const hit = players.search(`${gameName}#${tagLine}`, prof[1], 1)[0];
      const known = hit && hit.gameName.toLowerCase() === gameName.toLowerCase() ? hit : undefined;
      const rank = known?.tier ? `${known.tier.charAt(0)}${known.tier.slice(1).toLowerCase()} ${['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(known.tier) ? '' : known.rank ?? ''}`.trim() : null;
      title = `${known?.gameName ?? gameName}#${known?.tagLine ?? tagLine}${rank ? ` — ${rank}` : ''} · Riftwatch`;
      desc = `${rank ? `${rank}${known?.lp != null ? ` ${known.lp} LP` : ''} on ${platform?.label ?? prof[1]}. ` : ''}Match history, champion stats, rank history and live game.`;
    }
  } else if (champ) {
    const name = champ[1].charAt(0).toUpperCase() + champ[1].slice(1);
    title = `${name} build, runes and counters · Riftwatch`;
    desc = `Win rate, best build, runes, skill order and matchups for ${name}.`;
  } else if (urlPath.startsWith('/champions')) {
    title = 'Champion tier list · Riftwatch';
  } else if (urlPath.startsWith('/leaderboard')) {
    title = 'Ranked ladder · Riftwatch';
  } else if (urlPath.startsWith('/multisearch')) {
    title = 'Multi-search · Riftwatch';
  }
  const tags = [
    `<meta property="og:site_name" content="Riftwatch" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="theme-color" content="#091315" />`,
  ].join('\n    ');
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(desc)}" />`)
    .replace('</head>', `    ${tags}\n  </head>`);
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    if (err.retryAfter) res.setHeader('Retry-After', String(err.retryAfter));
    return res.status(err.status).json({ error: { code: err.code, message: err.message, retryAfter: err.retryAfter } } satisfies ApiErrorBody);
  }
  const status = (err as { status?: number; statusCode?: number })?.status ?? (err as { statusCode?: number })?.statusCode;
  if (status === 404) return res.status(404).type('text').send('Not found');
  console.error(err);
  res.status(500).json({ error: { code: 'UPSTREAM', message: 'Something went wrong on the server.' } } satisfies ApiErrorBody);
});

if (!DEMO && process.env.CRAWLER !== 'false') {
  const crawlPlatform = getPlatform(process.env.CRAWL_REGION ?? 'euw1') ?? getPlatform('euw1')!;
  startCrawler({ riot, platform: crawlPlatform, stats: champStats, lastUserRequest: () => lastUserRequest, paceMs: Number(process.env.CRAWL_PACE_MS ?? 2500) });
}

// Tracked (starred) players: refresh their rank regularly so LP history fills in by itself.
if (!DEMO) {
  const refreshTracked = async () => {
    for (const t of lp.tracked()) {
      while (Date.now() - lastUserRequest < 8000) await new Promise((r) => setTimeout(r, 2000));
      const p = getPlatform(t.platform);
      if (!p) continue;
      try {
        lp.record(t.puuid, shapeLeague(await riot.league(p, t.puuid, true)));
      } catch {
        /* try again next round */
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
  };
  setInterval(() => void refreshTracked(), 20 * 60_000).unref();
  setTimeout(() => void refreshTracked(), 15_000).unref();
}

process.on('SIGINT', () => {
  lp.flush();
  players.flush();
  champStats.flush();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}  (${DEMO ? 'demo data — set RIOT_API_KEY in .env for live data' : 'live Riot data'})`);
});
