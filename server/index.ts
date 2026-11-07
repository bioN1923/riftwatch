import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import compression from 'compression';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ApiError } from './errors';
import { RiotClient } from './riot';
import { shapeLeague, shapeLive, shapeMatch, shapeTimeline } from './shape';
import { DEMO_SEED, mockArenaMatch, mockLadder, mockLive, mockLpHistory, mockMatchById, mockMatches, mockProfile, mockRotation, mockScout, mockTimeline, nameFromDemoPuuid } from './mock';
import { LpStore } from './lpStore';
import { PlayerIndex } from './playerIndex';
import { ChampionStatsStore } from './champStats';
import { loadItemKinds } from './items';
import { startCrawler } from './crawler';
import { TtlCache } from './cache';
import { getPlatform } from '../shared/regions';
import { MatchStore } from './matchStore';
import { CHALLENGE_MS, PrivacyStore } from './privacy';
import { ErrorLog, errorsPage } from './errorLog';
import { timingSafeEqual } from 'node:crypto';
import { HTML_LANG, OG_LOCALE, alternateLinks, pickLang, seoText, sitemapXml } from './seo';
import { allChampions, championByKey, championBySlug, championCard, loadOgData, matchupCard, profileCard, siteCard, type ProfileCard } from './og';
import type { ApiErrorBody, HealthResponse, PrivacyChallenge, PrivacyResult, Ladder, LadderEntry, LpHistory, MatchPage, MatchSummary, MatchTimeline, PlayerHit, Profile, ScoutInfo, ServerStatus, StatsGroup } from '../shared/types';

const PORT = Number(process.env.PORT ?? 3001);
const API_KEY = process.env.RIOT_API_KEY?.trim() ?? '';
const DEMO = process.env.DEMO_MODE === 'true' || !API_KEY || API_KEY.startsWith('RGAPI-xxxx');

const here = path.dirname(fileURLToPath(import.meta.url));
const riot = new RiotClient(
  API_KEY,
  {
    perSecond: Number(process.env.RIOT_RATE_PER_SECOND ?? 20),
    perTwoMinutes: Number(process.env.RIOT_RATE_PER_2MIN ?? 100),
  },
  DEMO ? undefined : new MatchStore(path.resolve(here, 'data', 'matches')),
);
const players = new PlayerIndex(path.resolve(here, 'data', DEMO ? 'players.demo.json' : 'players.json'));
if (DEMO) DEMO_SEED.forEach((p) => players.add(p));

const champStats = new ChampionStatsStore(DEMO ? null : path.resolve(here, 'data', 'champions.json'));
const timelines = new TtlCache<MatchTimeline>(300);
const privacy = new PrivacyStore(DEMO ? null : path.resolve(here, 'data', 'privacy.json'));
players.isBlocked = (puuid) => privacy.isHidden(puuid);
champStats.isHidden = (puuid) => privacy.isHidden(puuid);
champStats.currentName = (puuid) => players.nameOf(puuid);
const PRIVATE_MSG = 'This player has chosen to keep their profile private.';
/** Hidden players stay in other people's games (Riot's data), but without their name. */
function scrubMatch(m: MatchSummary): MatchSummary {
  if (!m.participants.some((x) => privacy.isHiddenPlayer(x))) return m;
  return { ...m, participants: m.participants.map((x) => (privacy.isHiddenPlayer(x) ? { ...x, gameName: '', tagLine: '', hidden: true } : x)) };
}
const errorLog = new ErrorLog(DEMO ? null : path.resolve(here, 'data', 'errors.json'));
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
  for (let i = 0; i < 1500; i++) champStats.addMatch(mockArenaMatch(i));
  // A smaller previous patch, so the tier list can show which champions moved.
  for (let i = 0; i < 140; i++) {
    const page = mockMatches({ gameName: `Earlier${i}`, tagLine: 'DEMO' }, 0, 20, {});
    for (const m of page.matches) champStats.addMatch({ ...m, id: `PREV_${m.id}`, version: '15.19.1', startedAt: m.startedAt - 14 * 86_400_000 });
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
// Behind Fly's proxy: use the forwarded protocol/host for absolute link-preview URLs.
app.set('trust proxy', true);
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
    if (req.path === '/api/health' || req.path === '/riot.txt' || req.path === '/robots.txt' || req.headers.authorization === expected) return next();
    res.set('WWW-Authenticate', 'Basic realm="Riftwatch preview", charset="UTF-8"').status(401).send('Login required');
  });
}
app.use(express.json({ limit: '10kb' }));

/* ---------- Error reports and the owner's error page ---------- */

// Browsers report crashes here. Each address may send a few a minute; the rest are dropped.
const reportsByIp = new Map<string, { at: number; n: number }>();
app.post('/api/client-error', (req, res) => {
  const ip = req.ip ?? '';
  const now = Date.now();
  const r = reportsByIp.get(ip);
  if (r && now - r.at < 60_000 && r.n >= 5) return res.status(204).end();
  reportsByIp.set(ip, r && now - r.at < 60_000 ? { at: r.at, n: r.n + 1 } : { at: now, n: 1 });
  if (reportsByIp.size > 5000) reportsByIp.clear();
  const b = (req.body ?? {}) as Record<string, unknown>;
  const str = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : undefined);
  const message = str(b.message, 500);
  if (message) errorLog.record({ source: 'client', kind: str(b.kind, 60) || 'Error', message, where: str(b.where, 300), detail: [str(b.stack, 1500), str(req.get('user-agent'), 200)].filter(Boolean).join('\n\n') });
  res.status(204).end();
});

/** /admin/errors?token=… — only when ADMIN_TOKEN is set, and only with the right token. */
function adminOk(req: Request) {
  const want = process.env.ADMIN_TOKEN;
  const got = typeof req.query.token === 'string' ? req.query.token : '';
  if (!want || want.length < 8) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}
app.get('/admin/errors', (req, res) => {
  if (!adminOk(req)) return res.status(404).type('text/plain').send('Not found');
  res.setHeader('Cache-Control', 'no-store');
  res.type('html').send(errorsPage(errorLog.entries(), String(req.query.token)));
});
app.get('/api/admin/errors', (req, res) => {
  if (!adminOk(req)) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown API route.' } } satisfies ApiErrorBody);
  res.setHeader('Cache-Control', 'no-store');
  res.json(errorLog.entries());
});
/** Delete everything stored about a player — for deletion requests Riot forwards to developers. */
app.post('/admin/forget', express.urlencoded({ extended: false, limit: '2kb' }), (req, res) => {
  if (!adminOk(req)) return res.status(404).type('text/plain').send('Not found');
  const puuid = String(req.body?.puuid ?? '').trim();
  if (puuid) {
    players.remove(puuid);
    lp.forget(puuid);
    champStats.forgetPlayer(puuid);
    console.log('Deleted stored data for a player on request.');
  }
  res.redirect(303, `/admin/errors?token=${encodeURIComponent(String(req.query.token))}&forgot=${puuid ? 1 : 0}`);
});

app.post('/admin/errors/clear', (req, res) => {
  if (!adminOk(req)) return res.status(404).type('text/plain').send('Not found');
  errorLog.clear();
  res.redirect(303, `/admin/errors?token=${encodeURIComponent(String(req.query.token))}`);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  errorLog.record({ source: 'server', kind: 'UnhandledRejection', message: String((reason as Error)?.message ?? reason), detail: (reason as Error)?.stack });
});

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

// Fair use per visitor: the site's API is for the site's own pages, not for scraping or
// re-selling Riot data (Riot forbids acting as a data broker), and every lookup can cost Riot calls.
const API_PER_MINUTE = Number(process.env.API_PER_MINUTE ?? 150);
const apiHits = new Map<string, number[]>();
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path === '/client-error') return next();
  const ip = req.ip ?? '';
  const now = Date.now();
  const recent = (apiHits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= API_PER_MINUTE) {
    const retryAfter = Math.ceil((60_000 - (now - recent[0])) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Slow down a little and try again.', retryAfter } } satisfies ApiErrorBody);
  }
  recent.push(now);
  apiHits.set(ip, recent);
  if (apiHits.size > 20_000) apiHits.clear();
  next();
});

app.use('/api', (req, _res, next) => {
  if (!req.path.startsWith('/champions') && req.path !== '/health') lastUserRequest = Date.now();
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: DEMO ? 'demo' : 'live', contact: process.env.CONTACT_EMAIL || undefined } satisfies HealthResponse);
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
    let fresh = true;
    if (!gameName || !tagLine || gameName.length > 16 || tagLine.length > 5) {
      throw new ApiError(400, 'BAD_REQUEST', 'A Riot ID looks like Name#TAG — up to 16 characters, then a tag of 3–5.');
    }

    // Opening a profile or pressing Update reads fresh data from Riot, at most once per player
    // every UPDATE_COOLDOWN_MS; in between, the cached copy is served. Enforced here, not trusted
    // to the browser, and reported as relative times so the visitor's clock doesn't matter.
    const coolKey = `${p.id}:${gameName}#${tagLine}`.toLowerCase();
    const last = lastUpdate.get(coolKey);
    if (last && Date.now() - last < UPDATE_COOLDOWN_MS) fresh = false;
    else lastUpdate.set(coolKey, Date.now());
    const timing = () => {
      const at = lastUpdate.get(coolKey) ?? Date.now();
      return { updateIn: Math.max(0, at + UPDATE_COOLDOWN_MS - Date.now()), age: Date.now() - at };
    };

    if (DEMO) {
      const profile = mockProfile(p.id, gameName, tagLine);
      if (!profile) throw new ApiError(404, 'NOT_FOUND', `No player called ${gameName}#${tagLine} on ${p.label}.`);
      if (privacy.isHiddenPlayer(profile.account)) throw new ApiError(403, 'PRIVATE', PRIVATE_MSG);
      indexProfile(profile);
      return res.json({ ...profile, ...timing() });
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

    if (privacy.isHiddenPlayer(account)) throw new ApiError(403, 'PRIVATE', PRIVATE_MSG);

    let summoner;
    try {
      summoner = await riot.summoner(p, account.puuid, fresh);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'NOT_FOUND') {
        throw new ApiError(404, 'NOT_FOUND', `${account.gameName}#${account.tagLine} exists, but has never played League on ${p.label}. Try another region.`);
      }
      throw e;
    }

    // Rank history saved under a previous API key's PUUID follows the player to the new one.
    const oldPuuid = players.puuidOf(p.id, account.gameName, account.tagLine);
    if (oldPuuid && oldPuuid !== account.puuid) lp.rekey(oldPuuid, account.puuid);

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
    res.json({ ...profile, ...timing() });
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
    if (privacy.isHidden(puuid)) throw new ApiError(403, 'PRIVATE', PRIVATE_MSG);

    if (DEMO) {
      const name = nameFromDemoPuuid(puuid);
      if (!name) throw new ApiError(404, 'NOT_FOUND', 'Unknown player.');
      const page = mockMatches(name, start, count, filter);
      indexMatches(p.id, page.matches);
      return res.json({ ...page, matches: page.matches.map(scrubMatch) });
    }

    const ids = await riot.matchIds(p, puuid, start, count, filter, fresh);
    const settled = await Promise.allSettled(ids.map((id) => riot.match(p, id, true, puuid)));
    const firstFatal = settled.find((s) => s.status === 'rejected' && !(s.reason instanceof ApiError && s.reason.code === 'NOT_FOUND'));
    if (firstFatal && settled.every((s) => s.status === 'rejected')) throw (firstFatal as PromiseRejectedResult).reason;

    // Custom games (queue 0) are private to the player under Riot's policy, so they're never shown publicly.
    const matches = settled.flatMap((s) => (s.status === 'fulfilled' && s.value && s.value.info?.queueId !== 0 ? [shapeMatch(s.value)] : []));
    const page: MatchPage = { matches, nextStart: ids.length === count ? start + count : null };
    indexMatches(p.id, matches);
    matches.forEach((m) => champStats.addMatch(m));
    res.json({ ...page, matches: matches.map(scrubMatch) });
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
  if (privacy.isHidden(puuid)) return res.json({ points: [], tracked: false } satisfies LpHistory);
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
  if (privacy.isHidden(puuid)) throw new ApiError(403, 'PRIVATE', PRIVATE_MSG);
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
    if (privacy.isHidden(puuid)) {
      return res.json({ puuid, hidden: true, level: null, profileIconId: null, solo: null, flex: null, mastery: null } satisfies ScoutInfo);
    }
    if (DEMO) return res.json(mockScout(puuid, championId));
    const [summoner, league, mastery] = await Promise.all([
      riot.summoner(p, puuid).catch(() => null),
      riot.league(p, puuid).catch(() => [] as any[]),
      championId ? riot.masteryOn(p, puuid, championId).catch(() => null) : Promise.resolve(null),
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
    };
    res.json(info);
  }),
);

/* ---------- Privacy: players can hide their profile ---------- */

const challengesByIp = new Map<string, number[]>();
/** Step 1: look the player up and name a starter icon to equip. */
app.post(
  '/api/privacy/challenge',
  wrap(async (req, res) => {
    // Each check reads Riot twice, so one visitor may start a few per ten minutes.
    const ip = req.ip ?? '';
    const recent = (challengesByIp.get(ip) ?? []).filter((t) => Date.now() - t < 10 * 60_000);
    if (recent.length >= 5) throw new ApiError(429, 'RATE_LIMITED', 'Too many checks started. Try again in a few minutes.', 120);
    challengesByIp.set(ip, [...recent, Date.now()]);
    if (challengesByIp.size > 5000) challengesByIp.clear();
    const { platform, gameName, tagLine, action } = (req.body ?? {}) as Record<string, unknown>;
    const p = platformOr400(String(platform));
    if (typeof gameName !== 'string' || typeof tagLine !== 'string' || !gameName.trim() || !tagLine.trim() || (action !== 'hide' && action !== 'show')) {
      throw new ApiError(400, 'BAD_REQUEST', 'Enter your Riot ID as Name#TAG.');
    }
    let account: { puuid: string; gameName: string; tagLine: string };
    let icon: number;
    if (DEMO) {
      const prof = mockProfile(p.id, gameName.trim(), tagLine.trim());
      if (!prof) throw new ApiError(404, 'NOT_FOUND', `No player called ${gameName}#${tagLine}.`);
      account = prof.account;
      icon = demoIcons.get(account.puuid) ?? prof.summoner.profileIconId;
    } else {
      account = await riot.account(p, gameName.trim(), tagLine.trim(), true);
      icon = (await riot.summoner(p, account.puuid, true)).profileIconId;
    }
    const c = privacy.challenge(account, p.id, icon, action);
    res.json({ puuid: account.puuid, gameName: account.gameName, tagLine: account.tagLine, action, iconId: c.iconId, expiresIn: CHALLENGE_MS, hidden: privacy.isHiddenPlayer(account) } satisfies PrivacyChallenge);
  }),
);

/** Step 2: read the profile icon back from Riot; if it matches, hide (and delete stored data) or show. */
const verifyTries = new Map<string, number>();
app.post(
  '/api/privacy/verify',
  wrap(async (req, res) => {
    const { platform, puuid } = (req.body ?? {}) as Record<string, unknown>;
    const p = platformOr400(String(platform));
    if (typeof puuid !== 'string' || !privacy.pending(puuid)) throw new ApiError(400, 'BAD_REQUEST', 'This check has expired. Start again.');
    // Each check reads Riot once; a few seconds apart at most.
    const last = verifyTries.get(puuid) ?? 0;
    if (Date.now() - last < 5000) throw new ApiError(429, 'RATE_LIMITED', 'Wait a few seconds before checking again.', 5);
    verifyTries.set(puuid, Date.now());
    const iconNow = DEMO ? (demoIcons.get(puuid) ?? -1) : (await riot.summoner(p, puuid, true)).profileIconId;
    const done = privacy.verify(puuid, iconNow);
    if (done?.action === 'hide') {
      players.remove(puuid, done);
      lp.forget(puuid);
      champStats.forgetPlayer(puuid);
    }
    res.json({ done: !!done, hidden: privacy.isHidden(puuid), iconNow } satisfies PrivacyResult);
  }),
);

/** Demo mode only: pretend the player changed their icon in the client, so the flow can be tried. */
const demoIcons = new Map<string, number>();
if (DEMO) {
  app.post('/api/privacy/demo-set-icon', (req, res) => {
    const { puuid, iconId } = (req.body ?? {}) as Record<string, unknown>;
    if (typeof puuid === 'string' && typeof iconId === 'number') demoIcons.set(puuid, iconId);
    res.json({ ok: true });
  });
}

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
        if (privacy.isHidden(e.puuid)) return { ...e, rank: (page - 1) * LADDER_PAGE + i + 1, gameName: null, tagLine: null };
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
        if (name && privacy.isHiddenPlayer({ puuid: e.puuid, ...name })) name = undefined;
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

const groupParam = (v: unknown): StatsGroup => (v === 'aram' || v === 'arena' ? v : 'ranked');

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

app.get('/api/champions/:id/vs/:opp', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=60');
  const id = Number(req.params.id);
  const opp = Number(req.params.opp);
  if (!Number.isFinite(id) || !Number.isFinite(opp) || id === opp) throw new ApiError(400, 'BAD_REQUEST', 'Unknown matchup.');
  res.json(
    champStats.matchup(id, opp, groupParam(req.query.group), req.query.role ? String(req.query.role) : undefined, req.query.patch ? String(req.query.patch) : undefined),
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
          if (privacy.isHiddenPlayer(acc)) return res.json(hits.slice(0, 8));
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
    if (privacy.isHidden(puuid)) throw new ApiError(403, 'PRIVATE', PRIVATE_MSG);
    let live: any;
    if (DEMO) {
      const name = nameFromDemoPuuid(puuid);
      live = name ? mockLive(name.gameName, name.tagLine) : { inGame: false };
    } else {
      const raw = await riot.live(p, puuid);
      live = raw ? shapeLive(raw) : { inGame: false };
      live.participants?.forEach((x: any) => players.add({ platform: p.id, puuid: x.puuid, gameName: x.gameName, tagLine: x.tagLine, profileIconId: x.profileIconId }));
    }
    if (live.participants) live = { ...live, participants: live.participants.map((x: any) => (privacy.isHiddenPlayer(x) ? { ...x, gameName: '', tagLine: '', hidden: true } : x)) };
    res.json(live);
  }),
);

/* ---------- Link-preview images ---------- */

void loadOgData();
const ogCache = new Map<string, { png: Buffer; t: number }>();
const OG_ROLES: Record<string, string> = { TOP: 'Top', JUNGLE: 'Jungle', MIDDLE: 'Mid', BOTTOM: 'Bot', UTILITY: 'Support' };
async function sendOg(res: Response, key: string, draw: () => Promise<Buffer> | Buffer) {
  let hit = ogCache.get(key);
  if (!hit || Date.now() - hit.t > 30 * 60_000) {
    hit = { png: await draw(), t: Date.now() };
    if (ogCache.size > 300) ogCache.delete(ogCache.keys().next().value!);
    ogCache.set(key, hit);
  }
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.type('jpeg').send(hit.png);
}

app.get('/og/site.jpg', wrap(async (_req, res) => sendOg(res, 'site', siteCard)));

app.get(
  '/og/profile/:platform/:slug.jpg',
  wrap(async (req, res) => {
    const p = platformOr400(String(req.params.platform));
    const slug = decodeURIComponent(String(req.params.slug));
    const i = slug.lastIndexOf('-');
    if (i <= 0) throw new ApiError(404, 'NOT_FOUND', 'Unknown player.');
    const gameName = slug.slice(0, i);
    const tagLine = slug.slice(i + 1);
    let card: ProfileCard = { gameName, tagLine, platform: p.label };
    if (DEMO) {
      const m = mockProfile(p.id, gameName, tagLine);
      const solo = m?.ranked.find((r) => r.queueType === 'RANKED_SOLO_5x5');
      if (m) card = { ...card, gameName: m.account.gameName, tagLine: m.account.tagLine, level: m.summoner.summonerLevel, profileIconId: m.summoner.profileIconId, tier: solo?.tier, rank: solo?.rank, lp: solo?.leaguePoints, wins: solo?.wins, losses: solo?.losses };
    } else {
      const hit = players.search(`${gameName}#${tagLine}`, p.id, 1)[0];
      if (hit && hit.gameName.toLowerCase() === gameName.toLowerCase() && hit.tagLine.toLowerCase() === tagLine.toLowerCase()) {
        card = { ...card, gameName: hit.gameName, tagLine: hit.tagLine, level: hit.level, profileIconId: hit.profileIconId, tier: hit.tier, rank: hit.rank, lp: hit.lp };
      }
    }
    await sendOg(res, `p:${p.id}:${slug.toLowerCase()}:${card.tier}:${card.rank}:${card.lp}`, () => profileCard(card));
  }),
);

app.get(
  '/og/champion/:slug.jpg',
  wrap(async (req, res) => {
    const c = championBySlug(String(req.params.slug));
    if (!c) throw new ApiError(404, 'NOT_FOUND', 'Unknown champion.');
    const s = champStats.champion(c.key, 'ranked');
    await sendOg(res, `c:${c.key}:${s.patch}:${s.summary?.games}`, () =>
      championCard({ champion: c, role: OG_ROLES[s.role], tier: s.summary?.tier, winRate: s.summary?.winRate, games: s.summary?.games, patch: s.patch }),
    );
  }),
);

app.get(
  '/og/vs/:a/:b.jpg',
  wrap(async (req, res) => {
    const a = championBySlug(String(req.params.a));
    const b = championBySlug(String(req.params.b));
    if (!a || !b) throw new ApiError(404, 'NOT_FOUND', 'Unknown matchup.');
    const m = champStats.matchup(a.key, b.key, 'ranked', req.query.role ? String(req.query.role) : undefined);
    const edge = m.adjusted - 0.5;
    const verdict = m.games < 10 ? undefined : edge > 0.02 ? `${a.name} is favoured` : edge < -0.02 ? `${b.name} is favoured` : 'An even matchup';
    await sendOg(res, `v:${a.key}:${b.key}:${m.role}:${m.games}`, () => matchupCard({ a, b, role: OG_ROLES[m.role], winRate: m.games ? m.winRate : undefined, games: m.games, verdict }));
  }),
);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown API route.' } } satisfies ApiErrorBody);
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  // While the site is password-protected (development key), keep it out of search engines entirely.
  if (SITE_PASSWORD) return res.send('User-agent: *\nDisallow: /\n');
  res.send(`User-agent: *\nDisallow: /api/\nAllow: /\n\nSitemap: ${siteOrigin(req)}/sitemap.xml\n`);
});

let sitemapCache: { at: number; xml: string } | null = null;
app.get('/sitemap.xml', (req, res) => {
  if (SITE_PASSWORD) return res.status(404).type('text/plain').send('Not found');
  if (!sitemapCache || Date.now() - sitemapCache.at > 6 * 3600_000) {
    const paths = ['/', '/champions', '/champions?queue=aram', '/champions?queue=arena', '/leaderboard', '/multisearch', '/compare', '/privacy', '/api-usage'];
    for (const c of allChampions()) paths.push(`/champions/${c.id.toLowerCase()}`);
    // The most played lane matchups, which are the ones people search for.
    const tier = champStats.tierList('ranked');
    for (const row of tier.rows) {
      if (row.lowSample) continue;
      const a = championByKey(row.championId);
      if (!a) continue;
      const s = champStats.champion(row.championId, 'ranked', row.role);
      for (const m of s.matchups.filter((x) => x.games >= 20).slice(0, 6)) {
        const b = championByKey(m.championId);
        if (b) paths.push(`/champions/${a.id.toLowerCase()}/vs/${b.id.toLowerCase()}`);
      }
    }
    sitemapCache = { at: Date.now(), xml: sitemapXml(siteOrigin(req), [...new Set(paths)]) };
  }
  res.type('application/xml').setHeader('Cache-Control', 'public, max-age=3600');
  res.send(sitemapCache.xml);
});

// In production, serve the built client from the same origin.
const dist = path.resolve(here, '../dist');
if (fs.existsSync(dist)) {
  const indexHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  // fallthrough: false → a missing (e.g. outdated) asset is a real 404, not the HTML page.
  app.use('/assets', express.static(path.join(dist, 'assets'), { maxAge: '1y', immutable: true, fallthrough: false }));
  app.use(express.static(dist, { maxAge: '1h', index: false }));
  app.get(/^(?!\/api\/|\/og\/).*/, (req, res) => res.type('html').send(withMeta(indexHtml, req)));
}

/** Page titles, descriptions, language alternates and link-preview tags, translated for the page's language. */
function withMeta(html: string, req: Request) {
  const urlPath = req.path;
  const origin = siteOrigin(req);
  const { lang, explicit } = pickLang(req.query.lang, req.get('accept-language'));
  const T = (key: Parameters<typeof seoText>[1], vars?: Record<string, string>) => seoText(lang, key, vars);
  let image = '/og/site.jpg';
  const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  let title = T('siteTitle');
  let desc = T('siteDesc');
  let indexable = true;
  // Query parameters that make a different page (the rest are view state and stay out of canonical URLs).
  const keep = new URLSearchParams();
  const prof = /^\/lol\/([a-z0-9]+)\/([^/]+)/.exec(urlPath);
  const champ = /^\/champions\/([a-z0-9]+)\/?$/i.exec(urlPath);
  const vs = /^\/champions\/([a-z0-9]+)\/vs\/([a-z0-9]+)/i.exec(urlPath);
  if (vs) {
    const a = championBySlug(vs[1]);
    const b = championBySlug(vs[2]);
    if (a && b) {
      title = T('vsTitle', { a: a.name, b: b.name });
      desc = T('vsDesc', { a: a.name, b: b.name });
      const role = typeof req.query.role === 'string' ? req.query.role : undefined;
      if (role) keep.set('role', role);
      image = `/og/vs/${vs[1].toLowerCase()}/${vs[2].toLowerCase()}.jpg${role ? `?role=${encodeURIComponent(role)}` : ''}`;
    } else indexable = false;
  } else if (prof) {
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
      desc = rank ? T('profileDesc', { rank: `${rank}${known?.lp != null ? ` ${known.lp} LP` : ''} · ${platform?.label ?? prof[1]}` }) : T('profileDescUnranked');
      image = `/og/profile/${prof[1]}/${encodeURIComponent(`${gameName}-${tagLine}`)}.jpg`;
      // Only players someone has actually looked up are worth indexing; unknown names may not exist.
      if (!known) indexable = false;
    }
  } else if (champ) {
    const c = championBySlug(champ[1]);
    const name = c?.name ?? champ[1].charAt(0).toUpperCase() + champ[1].slice(1);
    if (c) image = `/og/champion/${champ[1].toLowerCase()}.jpg`;
    else indexable = false;
    const queue = req.query.queue === 'aram' || req.query.queue === 'arena' ? req.query.queue : undefined;
    if (queue) keep.set('queue', queue);
    title = queue === 'aram' ? T('aramTitle', { name }) : queue === 'arena' ? T('aramTitle', { name }).replace('ARAM', 'Arena') : T('champTitle', { name });
    desc = T('champDesc', { name });
  } else if (urlPath === '/champions') {
    if (req.query.queue === 'aram' || req.query.queue === 'arena') keep.set('queue', req.query.queue);
    title = T('tierTitle');
    desc = T('tierDesc');
  } else if (urlPath.startsWith('/leaderboard')) {
    title = T('ladderTitle');
    desc = T('ladderDesc');
  } else if (urlPath.startsWith('/multisearch')) {
    title = T('msTitle');
    desc = T('msDesc');
    if (req.query.players) indexable = false;
  } else if (urlPath === '/privacy') {
    title = 'Privacy · Riftwatch';
    desc = 'What Riftwatch stores, for how long, and how to hide your profile.';
  } else if (urlPath === '/api-usage') {
    title = 'How we use the Riot API · Riftwatch';
    desc = 'Caching, rate-limit handling and privacy controls on Riftwatch.';
  } else if (urlPath.startsWith('/compare')) {
    title = T('cmpTitle');
    desc = T('cmpDesc');
    if (req.query.a || req.query.b) indexable = false;
  } else if (urlPath !== '/') {
    indexable = false; // unknown page: the client shows "not found"
  }
  const tags = [
    ...(indexable && !SITE_PASSWORD ? alternateLinks(origin, urlPath, explicit ? lang : null, keep) : [`<meta name="robots" content="noindex" />`]),
    `<meta property="og:site_name" content="Riftwatch" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="${OG_LOCALE[lang]}" />`,
    `<meta property="og:url" content="${esc(origin + req.originalUrl)}" />`,
    `<meta property="og:image" content="${esc(origin + image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${esc(origin + image)}" />`,
    `<meta name="theme-color" content="#091315" />`,
    ...(urlPath === '/' ? [`<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Riftwatch', url: `${origin}/`, inLanguage: HTML_LANG[lang], description: desc }).replace(/</g, '\\u003c')}</script>`] : []),
  ].join('\n    ');
  return html
    .replace(/<html lang="[^"]*">/, `<html lang="${HTML_LANG[lang]}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(desc)}" />`)
    .replace('</head>', `    ${tags}\n  </head>`);
}

/** The public address: SITE_URL when set (behind proxies and custom domains), otherwise the request's host. */
function siteOrigin(req: Request) {
  return (process.env.SITE_URL ?? `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    // Problems with Riot's side or our key are worth knowing about; "not found" and bad input aren't.
    if (err.code === 'KEY_INVALID' || err.code === 'RATE_LIMITED' || err.code === 'UPSTREAM' || err.code === 'NO_KEY')
      errorLog.record({ source: 'riot', kind: err.code, message: err.message, where: `${req.method} ${req.path}`, urgent: err.code === 'KEY_INVALID' });
    if (err.retryAfter) res.setHeader('Retry-After', String(err.retryAfter));
    return res.status(err.status).json({ error: { code: err.code, message: err.message, retryAfter: err.retryAfter } } satisfies ApiErrorBody);
  }
  const status = (err as { status?: number; statusCode?: number })?.status ?? (err as { statusCode?: number })?.statusCode;
  if (status === 404) return res.status(404).type('text').send('Not found');
  console.error(err);
  errorLog.record({ source: 'server', kind: String((err as Error)?.name ?? 'Error'), message: String((err as Error)?.message ?? err), where: `${req.method} ${req.path}`, detail: (err as Error)?.stack });
  res.status(500).json({ error: { code: 'UPSTREAM', message: 'Something went wrong on the server.' } } satisfies ApiErrorBody);
});

if (!DEMO && process.env.CRAWLER !== 'false') {
  const crawlPlatform = getPlatform(process.env.CRAWL_REGION ?? 'euw1') ?? getPlatform('euw1')!;
  startCrawler({
    riot,
    platform: crawlPlatform,
    stats: champStats,
    lastUserRequest: () => lastUserRequest,
    paceMs: Number(process.env.CRAWL_PACE_MS ?? 2500),
    onStop: (message) => errorLog.record({ source: 'riot', kind: 'KEY_INVALID', message, where: 'champion stats collector', urgent: true }),
  });
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
  errorLog.flush();
  lp.flush();
  players.flush();
  champStats.flush();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}  (${DEMO ? 'demo data — set RIOT_API_KEY in .env for live data' : 'live Riot data'})`);
});
