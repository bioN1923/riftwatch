/**
 * Demo mode: deterministic, realistic-looking data so the app can be explored and
 * developed without a Riot API key. Any Riot ID works; the same ID always produces
 * the same profile. Search "notfound#demo" to see the not-found state.
 */
import { scoreMatch } from './shape';
import type { LeagueEntry, LiveResponse, LpPoint, MatchPage, MatchSummary, MatchTimeline, Participant, PlayerHit, Profile, ScoutInfo, TimelineEvent } from '../shared/types';

type Role = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY';

const CHAMPS: Record<Role, number[]> = {
  TOP: [266, 122, 86, 875, 164, 114, 54, 516, 897, 799],
  JUNGLE: [64, 234, 254, 104, 121, 76, 517],
  MIDDLE: [103, 84, 157, 777, 61, 134, 238, 112, 910, 893, 800],
  BOTTOM: [22, 51, 81, 222, 145, 202, 21, 498, 901],
  UTILITY: [89, 412, 99, 111, 117, 526, 497],
};
const ROLES: Role[] = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];
const ALL_CHAMPS = ROLES.flatMap((r) => CHAMPS[r]);

const ITEMS: Record<Role, number[]> = {
  TOP: [3078, 3071, 6333, 3053, 3742, 3075, 3065, 3047, 3111, 6610, 3748],
  JUNGLE: [3071, 6333, 3053, 3156, 6692, 3142, 3047, 3111, 3074, 6676],
  MIDDLE: [3157, 3089, 3135, 4645, 3020, 3165, 3102, 6655, 3118, 3116],
  BOTTOM: [3031, 3094, 3036, 3153, 3006, 6672, 3046, 3085, 3072, 3033],
  UTILITY: [3190, 3107, 3504, 3222, 3158, 3050, 3109, 6617, 3853, 3860],
};
const TRINKET: Record<Role, number> = { TOP: 3340, JUNGLE: 3364, MIDDLE: 3340, BOTTOM: 3363, UTILITY: 3364 };

const KEYSTONES: Record<Role, [number, number, number][]> = {
  // [keystone, primaryStyle, secondaryStyle]
  TOP: [[8010, 8000, 8400], [8437, 8400, 8000], [8230, 8200, 8400]],
  JUNGLE: [[8010, 8000, 8100], [8128, 8100, 8000], [8021, 8000, 8100]],
  MIDDLE: [[8112, 8100, 8200], [8229, 8200, 8300], [8369, 8300, 8200], [8008, 8000, 8400]],
  BOTTOM: [[8008, 8000, 8100], [8005, 8000, 8300], [8021, 8000, 8200]],
  UTILITY: [[8439, 8400, 8300], [8465, 8400, 8200], [8214, 8200, 8400], [8351, 8300, 8400]],
};
const SPELLS: Record<Role, [number, number]> = {
  TOP: [4, 12],
  JUNGLE: [11, 4],
  MIDDLE: [4, 14],
  BOTTOM: [4, 7],
  UTILITY: [4, 14],
};

const NAME_A = ['Silent', 'Rift', 'Lunar', 'Void', 'Hex', 'Crimson', 'Quiet', 'Iron', 'Azure', 'Feral', 'Lucky', 'Frost', 'Wild', 'Shy', 'Late'];
const NAME_B = ['Fox', 'Walker', 'Drake', 'Baron', 'Jungler', 'Tide', 'Ward', 'Lantern', 'Cleaver', 'Spark', 'Herald', 'Moth', 'Poro', 'Comet', 'Gank'];
const TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER'];
const DIVS = ['IV', 'III', 'II', 'I'];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(r: () => number, arr: T[]) => arr[Math.floor(r() * arr.length)];
const int = (r: () => number, min: number, max: number) => Math.floor(min + r() * (max - min + 1));

function fakeName(r: () => number) {
  return { gameName: `${pick(r, NAME_A)}${pick(r, NAME_B)}${r() < 0.4 ? int(r, 1, 99) : ''}`, tagLine: pick(r, ['EUW', 'EUNE', 'NA1', '2077', 'GG', 'MID', 'KR1', '0001']) };
}

/** Demo puuids carry the Riot ID so the server can rebuild the persona statelessly. */
function puuidFor(name: string) {
  return `demo-${Buffer.from(name, 'utf8').toString('base64url')}`;
}

export function nameFromDemoPuuid(puuid: string): { gameName: string; tagLine: string } | null {
  if (!puuid.startsWith('demo-') || puuid.startsWith('demo-rand-')) return null;
  const decoded = Buffer.from(puuid.slice(5), 'base64url').toString('utf8');
  const i = decoded.lastIndexOf('#');
  return i > 0 ? { gameName: decoded.slice(0, i), tagLine: decoded.slice(i + 1) } : null;
}

interface Persona {
  seed: number;
  puuid: string;
  gameName: string;
  tagLine: string;
  role: Role;
  pool: number[];
  skill: number; // 0..1, shifts win rate & stats
  duo: { puuid: string; gameName: string; tagLine: string; role: Role; pool: number[] };
}

function persona(gameName: string, tagLine: string): Persona {
  const seed = hash(`${gameName.toLowerCase()}#${tagLine.toLowerCase()}`);
  const r = rng(seed);
  const role = pick(r, ROLES);
  const pool = [...CHAMPS[role]].sort(() => r() - 0.5).slice(0, 4);
  const duoRole = pick(r, ROLES.filter((x) => x !== role));
  const duoName = fakeName(r);
  return {
    seed,
    puuid: puuidFor(`${gameName}#${tagLine}`),
    gameName,
    tagLine,
    role,
    pool,
    skill: 0.35 + r() * 0.5,
    duo: { ...duoName, puuid: puuidFor(`${duoName.gameName}#${duoName.tagLine}`), role: duoRole, pool: [...CHAMPS[duoRole]].slice(0, 3) },
  };
}

export function mockProfile(platform: string, gameName: string, tagLine: string): Profile | null {
  if (gameName.toLowerCase() === 'notfound') return null;
  const p = persona(gameName, tagLine);
  const r = rng(p.seed + 7);
  const tierIdx = Math.min(TIERS.length - 1, Math.floor(p.skill * TIERS.length + r()));
  const tier = TIERS[tierIdx];
  const solo: LeagueEntry = {
    queueType: 'RANKED_SOLO_5x5',
    tier,
    rank: tier === 'MASTER' ? 'I' : pick(r, DIVS),
    leaguePoints: tier === 'MASTER' ? int(r, 20, 420) : int(r, 0, 99),
    wins: int(r, 40, 220),
    losses: 0,
    hotStreak: r() < 0.3,
    veteran: r() < 0.2,
    freshBlood: false,
  };
  solo.losses = Math.round(solo.wins * (1 / (0.42 + p.skill * 0.2) - 1));
  const ranked: LeagueEntry[] = [solo];
  if (r() < 0.7) {
    const ft = TIERS[Math.max(0, tierIdx - int(r, 0, 2))];
    ranked.push({ queueType: 'RANKED_FLEX_SR', tier: ft, rank: pick(r, DIVS), leaguePoints: int(r, 0, 99), wins: int(r, 8, 60), losses: int(r, 8, 55), hotStreak: false, veteran: false, freshBlood: r() < 0.3 });
  }
  const masteryChamps = [...p.pool, ...ALL_CHAMPS.filter((c) => !p.pool.includes(c)).sort(() => r() - 0.5)].slice(0, 10);
  return {
    platform,
    account: { puuid: p.puuid, gameName, tagLine },
    summoner: { profileIconId: pick(r, [588, 4568, 5367, 6328, 4884, 5455, 29, 4655]), summonerLevel: int(r, 60, 640), revisionDate: Date.now() - int(r, 1, 48) * 3600_000 },
    ranked,
    mastery: masteryChamps
      .map((championId, i) => {
        const points = Math.round((900_000 / (i + 1.4)) * (0.5 + r()));
        return { championId, championLevel: Math.min(60, Math.max(5, Math.floor(points / 20000))), championPoints: points, lastPlayTime: Date.now() - i * 86400_000 * r() * 8 };
      })
      .sort((x, y) => y.championPoints - x.championPoints),
    fetchedAt: Date.now(),
  };
}

const QUEUE_MIX = [420, 420, 420, 420, 420, 420, 440, 440, 450, 450, 490];
const TOTAL_MATCHES = 80;

/** One game in each demo history is Arena, so augments and placements show up on profiles. */
const DEMO_ARENA_INDEX = 4;

function mockMatch(p: Persona, index: number): MatchSummary {
  const base = mockRiftMatch(p, index);
  if (index !== DEMO_ARENA_INDEX) return base;
  const arena = mockArenaMatch(2000 + (p.seed % 5000));
  const slot = p.seed % arena.participants.length;
  arena.participants[slot] = { ...arena.participants[slot], puuid: p.puuid, gameName: p.gameName, tagLine: p.tagLine };
  return { ...arena, id: base.id, startedAt: base.startedAt };
}

function mockRiftMatch(p: Persona, index: number): MatchSummary {
  const r = rng(p.seed * 31 + index * 977);
  const queueId = pick(r, QUEUE_MIX);
  const aram = queueId === 450;
  const duration = aram ? int(r, 900, 1500) : r() < 0.06 ? int(r, 190, 230) : int(r, 1250, 2350);
  const remake = duration < 240;
  const minutes = duration / 60;
  const meWin = r() < 0.38 + p.skill * 0.25;
  const withDuo = queueId !== 450 && r() < 0.35;

  const myRole: Role = r() < 0.78 ? p.role : pick(r, ROLES);
  const used = new Set<number>();
  const champFor = (role: Role, prefer?: number[]) => {
    const list = aram ? ALL_CHAMPS : prefer && r() < 0.8 ? prefer : CHAMPS[role];
    let c = pick(r, list);
    for (let i = 0; used.has(c) && i < 30; i++) c = pick(r, aram ? ALL_CHAMPS : CHAMPS[role]);
    used.add(c);
    return c;
  };

  const teamKills = [int(r, 12, 38), int(r, 12, 38)];
  if (meWin) teamKills[0] = Math.max(teamKills[0], teamKills[1] + int(r, 0, 10));
  else teamKills[1] = Math.max(teamKills[1], teamKills[0] + int(r, 0, 10));

  const participants: Participant[] = [];
  for (let t = 0; t < 2; t++) {
    const teamId = t === 0 ? 100 : 200;
    const win = t === 0 ? meWin : !meWin;
    const weights = ROLES.map(() => 0.5 + r());
    const wsum = weights.reduce((a, b) => a + b, 0);
    ROLES.forEach((role, ri) => {
      const isMe = t === 0 && role === myRole;
      const isDuo = withDuo && t === 0 && role === (p.duo.role === myRole ? ROLES[(ri + 1) % 5] : p.duo.role) && !isMe;
      const who = isMe ? p : isDuo ? p.duo : { ...fakeName(r), puuid: `demo-rand-${index}-${t}-${ri}` };
      const championId = champFor(role, isMe ? p.pool : isDuo ? p.duo.pool : undefined);
      const share = weights[ri] / wsum;
      const tk = teamKills[t];
      const skillBoost = isMe ? 0.7 + p.skill * 0.8 : 1;
      const kills = Math.round(tk * share * (role === 'UTILITY' ? 0.4 : 1.2) * skillBoost * (0.6 + r() * 0.6));
      const assists = Math.round(tk * (role === 'UTILITY' ? 0.6 : 0.35) * (0.5 + r() * 0.7));
      const deaths = Math.max(0, Math.round((teamKills[1 - t] / 5) * (0.5 + r()) * (isMe ? 1.3 - p.skill : 1)));
      const csPerMin = aram ? 2 + r() * 2.5 : role === 'UTILITY' ? 0.8 + r() * 1.2 : role === 'JUNGLE' ? 5 + r() * 2.5 : 5.5 + r() * 3 + (isMe ? p.skill * 1.5 : 0);
      const itemCount = Math.min(6, Math.floor(minutes / 6) + int(r, 0, 1));
      // Most players of a champion use one of two or three rune pages, and each page has its own
      // usual build (so picking a rune page on the champion page shows different items).
      const rv = r();
      const rr = rng(championId * 104729 + 7 + (rv < 0.6 ? 0 : rv < 0.85 ? 31 : 62));
      const [keystone, primaryStyle, secondaryStyle] = pick(rr, KEYSTONES[role]);
      const cr = r() < 0.72 ? rng(championId * 7919 + 13 + keystone) : r;
      const items = [...ITEMS[role]].sort(() => cr() - 0.5).slice(0, itemCount);
      while (items.length < 6) items.push(0);
      participants.push({
        puuid: who.puuid,
        gameName: who.gameName,
        tagLine: who.tagLine,
        teamId,
        win,
        championId,
        champLevel: Math.min(18, Math.round(minutes / 1.9 + r() * 3)),
        position: aram ? '' : role,
        kills: remake ? int(r, 0, 1) : kills,
        deaths: remake ? int(r, 0, 1) : deaths,
        assists: remake ? int(r, 0, 2) : assists,
        cs: Math.round(csPerMin * minutes),
        gold: Math.round((280 + kills * 35 + csPerMin * 22) * minutes),
        damage: Math.round((role === 'UTILITY' ? 380 : 750 + r() * 650) * minutes * (isMe ? 0.8 + p.skill * 0.6 : 1)),
        damageTaken: Math.round((role === 'TOP' || role === 'JUNGLE' ? 1100 : 650) * minutes * (0.7 + r() * 0.6)),
        visionScore: aram ? int(r, 0, 6) : Math.round((role === 'UTILITY' ? 2.4 : role === 'JUNGLE' ? 1.3 : 0.8) * minutes * (0.6 + r() * 0.7)),
        wardsPlaced: aram ? 0 : Math.round((role === 'UTILITY' ? 1.1 : 0.4) * minutes),
        controlWards: aram ? 0 : int(r, 0, role === 'UTILITY' ? 10 : 4),
        items: [...items, aram ? 0 : TRINKET[role]],
        spells: aram ? [4, 32] : SPELLS[role],
        keystone,
        primaryStyle,
        secondaryStyle,
        largestMultiKill: kills > 12 && r() < 0.3 ? int(r, 3, 5) : kills > 5 ? int(r, 1, 2) : kills > 0 ? 1 : 0,
        killParticipation: 0,
        score: 0,
        runes: runePage(rr, keystone, primaryStyle, secondaryStyle),
        extra: {
          soloKills: Math.round(kills * (0.1 + r() * 0.25)),
          turretPlates: aram || role === 'UTILITY' ? int(r, 0, 1) : int(r, 0, 5),
          csAt10: aram ? 0 : Math.round(csPerMin * 10 * (0.75 + r() * 0.2)),
          firstBlood: false,
          damageMitigated: Math.round((role === 'TOP' || role === 'JUNGLE' || role === 'UTILITY' ? 900 : 300) * minutes * (0.6 + r() * 0.8)),
          healing: Math.round((role === 'UTILITY' ? 220 : 10) * minutes * r()),
          shielding: Math.round((role === 'UTILITY' ? 260 : 15) * minutes * r()),
          ccTime: Math.round((role === 'UTILITY' || role === 'TOP' ? 1.6 : 0.7) * minutes * (0.5 + r())),
          objectiveDamage: Math.round((role === 'JUNGLE' ? 1300 : role === 'UTILITY' ? 120 : 450) * minutes * (0.6 + r() * 0.8)),
          turretDamage: Math.round((role === 'UTILITY' ? 80 : role === 'JUNGLE' ? 150 : 300) * minutes * (0.4 + r())),
          skillshotsHit: int(r, 10, 120),
          skillshotsDodged: int(r, 5, 90),
        },
      });
    });
    const sum = participants.filter((x) => x.teamId === teamId).reduce((a, x) => a + x.kills, 0);
    teamKills[t] = sum;
    participants.filter((x) => x.teamId === teamId).forEach((x) => (x.killParticipation = sum ? Math.min(1, (x.kills + x.assists) / sum) : 0));
  }

  // Games come in sittings of four, about 45 minutes apart, with sittings half a day apart — like real players.
  const startedAt = Date.now() - (Math.floor(index / 4) * 14 + (index % 4) * 0.75 + r() * 0.05 + 0.4) * 3600_000;
  const m: MatchSummary = {
    id: `DEMO_${p.puuid.slice(5)}_${index}`,
    queueId,
    gameMode: aram ? 'ARAM' : 'CLASSIC',
    startedAt,
    duration,
    version: '15.20.1',
    remake,
    teams: [100, 200].map((teamId, t) => {
      const win = t === 0 ? meWin : !meWin;
      return {
        teamId,
        win,
        kills: teamKills[t],
        gold: participants.filter((x) => x.teamId === teamId).reduce((a, x) => a + x.gold, 0),
        bans: aram ? [] : Array.from({ length: 5 }, () => pick(r, ALL_CHAMPS)),
        objectives: aram
          ? { baron: 0, dragon: 0, tower: win ? int(r, 4, 7) : int(r, 0, 4), herald: 0, grubs: 0, inhibitor: win ? int(r, 1, 2) : 0 }
          : { baron: win ? int(r, 0, 2) : int(r, 0, 1), dragon: win ? int(r, 2, 4) : int(r, 0, 2), tower: win ? int(r, 6, 11) : int(r, 0, 5), herald: int(r, 0, 1), grubs: int(r, 0, 6), inhibitor: win ? int(r, 1, 3) : 0 },
      };
    }),
    participants,
  };
  if (!remake) {
    const fb = pick(r, participants.filter((x) => x.kills > 0));
    if (fb) fb.extra.firstBlood = true;
  }
  scoreMatch(m);
  return m;
}

const RUNE_ROWS: Record<number, number[][]> = {
  8000: [[9101, 9111, 8009], [9104, 9105, 9103], [8014, 8017, 8299]],
  8100: [[8126, 8139, 8143], [8137, 8140, 8141], [8135, 8105, 8106]],
  8200: [[8224, 8226, 8275], [8210, 8234, 8233], [8237, 8232, 8236]],
  8300: [[8306, 8304, 8321], [8313, 8352, 8345], [8347, 8410, 8316]],
  8400: [[8446, 8463, 8401], [8429, 8444, 8473], [8451, 8453, 8242]],
};

function runePage(r: () => number, keystone: number, primaryStyle: number, secondaryStyle: number): Participant['runes'] {
  const rows = RUNE_ROWS[primaryStyle];
  const sec = RUNE_ROWS[secondaryStyle];
  const secRows = [0, 1, 2].sort(() => r() - 0.5).slice(0, 2).sort();
  return {
    primary: [keystone, ...rows.map((row) => pick(r, row))],
    secondary: secRows.map((i) => pick(r, sec[i])),
    shards: [pick(r, [5008, 5005, 5007]), pick(r, [5008, 5010, 5001]), pick(r, [5011, 5013, 5001])],
  };
}

const START_ITEMS: Record<string, number[]> = { TOP: [1055, 2003], JUNGLE: [1103, 2003], MIDDLE: [1056, 2003, 2003], BOTTOM: [1055, 2003], UTILITY: [3865, 2003], '': [] };
const BOOTS = new Set([3006, 3047, 3111, 3020, 3158, 3009]);
const COMPONENTS = [1036, 1052, 1028, 1029, 1033, 1037, 1026, 1018, 1042];

function lanePoint(r: () => number, role: string): [number, number] {
  const along = (pts: [number, number][]) => {
    const seg = Math.floor(r() * (pts.length - 1));
    const t = r();
    return [pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * t, pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * t] as [number, number];
  };
  let p: [number, number];
  if (role === 'TOP') p = along([[1500, 4500], [1500, 13300], [10000, 13300]]);
  else if (role === 'BOTTOM' || role === 'UTILITY') p = along([[4500, 1500], [13300, 1500], [13300, 10000]]);
  else if (role === 'MIDDLE' || role === '') p = along([[3500, 3500], [11300, 11300]]);
  else p = [3000 + r() * 8800, 3000 + r() * 8800];
  return [Math.max(400, Math.min(14400, p[0] + (r() - 0.5) * 1400)), Math.max(400, Math.min(14400, p[1] + (r() - 0.5) * 1400))];
}

/** A plausible timeline that ends exactly at the match's final stats. */
export function mockTimeline(m: MatchSummary): MatchTimeline {
  const r = rng(hash(m.id));
  const ps = m.participants;
  const n = ps.length;
  const M = Math.ceil(m.duration / 60);
  const curves = ps.map(() => 0.9 + r() * 0.5);
  const frames = Array.from({ length: M + 1 }, (_, k) => {
    const end = k === M;
    const f = (i: number) => (end ? 1 : Math.pow(Math.min(1, (k * 60) / m.duration), curves[i]) * (0.94 + r() * 0.06));
    return {
      minute: k,
      gold: ps.map((p, i) => Math.round(500 + (p.gold - 500) * f(i))),
      cs: ps.map((p, i) => (k < 2 ? 0 : Math.round(p.cs * f(i)))),
      level: ps.map((p, i) => Math.max(1, Math.round(1 + (p.champLevel - 1) * Math.sqrt(f(i))))),
      xp: [] as number[],
      damage: ps.map((p, i) => Math.round(p.damage * Math.pow(f(i), 1.2))),
    };
  });
  // keep every series non-decreasing
  for (let k = 1; k <= M; k++) {
    for (const key of ['gold', 'cs', 'level', 'damage'] as const) for (let i = 0; i < n; i++) frames[k][key][i] = Math.max(frames[k][key][i], frames[k - 1][key][i]);
  }
  for (const f of frames) f.xp = f.level.map((l) => Math.round(280 * (l - 1) + 50 * (l - 1) * (l - 1)));

  const events: TimelineEvent[] = [];
  const left = ps.map((p) => ({ k: p.kills, d: p.deaths, a: p.assists }));
  // Arena duos share teamId 100 and differ by subteam.
  const side = (j: number) => `${ps[j].teamId}-${ps[j].subteam ?? 0}`;
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < ps[i].kills; k++) {
      const enemies = ps.map((_, j) => j).filter((j) => side(j) !== side(i));
      const victim = enemies.find((j) => left[j].d > 0) ?? pick(r, enemies);
      left[victim].d--;
      const mates = ps.map((_, j) => j).filter((j) => j !== i && side(j) === side(i) && left[j].a > 0);
      const assists = mates.sort(() => r() - 0.5).slice(0, int(r, 0, Math.min(3, mates.length)));
      assists.forEach((j) => left[j].a--);
      const [x, y] = lanePoint(r, ps[victim].position);
      events.push({ type: 'kill', t: int(r, 150, m.duration - 20), killer: i, victim, assists, x, y });
    }
  }
  for (const t of m.teams) {
    for (let k = 0; k < t.objectives.dragon; k++) events.push({ type: 'objective', t: 300 + k * int(r, 280, 360) + int(r, 0, 60), teamId: t.teamId, monster: 'DRAGON', sub: pick(r, ['FIRE_DRAGON', 'WATER_DRAGON', 'EARTH_DRAGON', 'AIR_DRAGON', 'HEXTECH_DRAGON', 'CHEMTECH_DRAGON']) });
    for (let k = 0; k < t.objectives.baron; k++) events.push({ type: 'objective', t: Math.min(m.duration - 30, 1260 + k * 420 + int(r, 0, 200)), teamId: t.teamId, monster: 'BARON_NASHOR' });
    for (let k = 0; k < t.objectives.herald; k++) events.push({ type: 'objective', t: 840 + int(r, 0, 120), teamId: t.teamId, monster: 'RIFTHERALD' });
    for (let k = 0; k < Math.ceil(t.objectives.grubs / 3); k++) events.push({ type: 'objective', t: 360 + k * 240 + int(r, 0, 40), teamId: t.teamId, monster: 'HORDE' });
    for (let k = 0; k < t.objectives.tower; k++) events.push({ type: 'building', t: int(r, 600, m.duration - 10), teamId: t.teamId, building: 'TOWER', lane: pick(r, ['TOP_LANE', 'MID_LANE', 'BOT_LANE']) });
    for (let k = 0; k < t.objectives.inhibitor; k++) events.push({ type: 'building', t: int(r, Math.min(1300, m.duration - 60), m.duration - 10), teamId: t.teamId, building: 'INHIBITOR', lane: pick(r, ['TOP_LANE', 'MID_LANE', 'BOT_LANE']) });
  }
  // Short games (remakes) still carry team objective counts; keep only what fits inside the game.
  for (let i = events.length - 1; i >= 0; i--) if (events[i].t < 0 || events[i].t >= m.duration) events.splice(i, 1);
  // Who took each epic monster: the team's jungler when there is one.
  for (const e of events) {
    if (e.type !== 'objective') continue;
    const team = ps.map((_, j) => j).filter((j) => ps[j].teamId === e.teamId);
    e.killer = team.find((j) => ps[j].position === 'JUNGLE') ?? team[0];
  }
  events.sort((a, b) => a.t - b.t);

  const items = ps.map((p) => {
    const out: { t: number; itemId: number; sold?: boolean }[] = (START_ITEMS[p.position] ?? []).map((itemId) => ({ t: int(r, 0, 12), itemId }));
    if (p.items[6]) out.push({ t: 5, itemId: 3340 });
    const finals = p.items.slice(0, 6).filter(Boolean).sort((a, b) => Number(BOOTS.has(b)) - Number(BOOTS.has(a)));
    const span = Math.max(300, m.duration - 240);
    finals.forEach((id, i) => {
      const t = Math.round(330 + (span * (i + 0.6)) / Math.max(1, finals.length) + int(r, -40, 40));
      out.push({ t: Math.max(60, t - int(r, 110, 200)), itemId: BOOTS.has(id) ? 1001 : pick(r, COMPONENTS) });
      if (r() < 0.5) out.push({ t: Math.max(60, t - int(r, 30, 90)), itemId: 2055 });
      out.push({ t, itemId: id });
      if (i === 4 && START_ITEMS[p.position]?.[0]) out.push({ t: t + 2, itemId: START_ITEMS[p.position][0], sold: true });
    });
    return out.sort((a, b) => a.t - b.t);
  });

  const skills = ps.map((p) => {
    const order = [1, 2, 3].sort(() => r() - 0.5);
    const pts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const out: number[] = [];
    for (let lvl = 1; lvl <= p.champLevel; lvl++) {
      let s: number;
      if ([6, 11, 16].includes(lvl)) s = 4;
      else if (lvl <= 3) s = [order[0], order[2], order[1]][lvl - 1];
      else s = order.find((x) => pts[x] < 5 && pts[x] < Math.ceil(lvl / 2)) ?? order[0];
      pts[s]++;
      out.push(s);
    }
    return out;
  });

  return { puuids: ps.map((p) => p.puuid), frames, events, items, skills };
}

/** Find a demo match by id so its timeline can be generated. */
export function mockMatchById(id: string): MatchSummary | null {
  const mm = /^DEMO_(.+)_(\d+)$/.exec(id);
  if (!mm) return null;
  const owner = nameFromDemoPuuid(`demo-${mm[1]}`);
  if (!owner) return null;
  return mockMatch(persona(owner.gameName, owner.tagLine), Number(mm[2]));
}

/** Seed names so demo autocomplete has something to suggest straight away. */
export const DEMO_SEED: PlayerHit[] = ['Hide on bush#KR1', 'Caps#EUW', 'Rekkles#EUW', 'Upset#EUW', 'Faker#KR1', 'Doublelift#NA1', 'Agurin#EUW', 'Thebausffs#EUW', 'Nemesis#EUW', 'Hans Sama#EUW', 'Jankos#EUW', 'Bwipo#EUW', 'Perkz#EUW']
  .map((s) => {
    const [gameName, tagLine] = s.split('#');
    const prof = mockProfile('euw1', gameName, tagLine)!;
    const solo = prof.ranked[0];
    return { platform: tagLine === 'KR1' ? 'kr' : tagLine === 'NA1' ? 'na1' : 'euw1', gameName, tagLine, profileIconId: prof.summoner.profileIconId, level: prof.summoner.summonerLevel, tier: solo.tier, rank: solo.rank, lp: solo.leaguePoints };
  });

const QUEUE_GROUPS: Record<string, number[]> = { normal: [400, 430, 480, 490] };

export function mockMatches(puuidOrName: { gameName: string; tagLine: string }, start: number, count: number, filter: { queue?: number; type?: string }): MatchPage {
  const p = persona(puuidOrName.gameName, puuidOrName.tagLine);
  const all = Array.from({ length: TOTAL_MATCHES }, (_, i) => mockMatch(p, i));
  const filtered = all.filter((m) => {
    if (filter.queue) return m.queueId === filter.queue;
    if (filter.type === 'ranked') return m.queueId === 420 || m.queueId === 440;
    if (filter.type && QUEUE_GROUPS[filter.type]) return QUEUE_GROUPS[filter.type].includes(m.queueId);
    return true;
  });
  const slice = filtered.slice(start, start + count);
  return { matches: slice, nextStart: start + count < filtered.length ? start + count : null };
}

/** Premade groups in generated live games, so the scout view can detect them. */
const demoPremades = new Map<string, string>();

export function mockLive(gameName: string, tagLine: string): LiveResponse {
  const p = persona(gameName, tagLine);
  if (p.seed % 3 !== 0) return { inGame: false };
  const m = mockMatch(p, 999);
  const mate = m.participants.find((x) => x.puuid === p.duo.puuid) ?? m.participants.find((x) => x.teamId === 100 && x.puuid !== p.puuid);
  if (mate) {
    demoPremades.set(p.puuid, `PAIR_${p.seed}`);
    demoPremades.set(mate.puuid, `PAIR_${p.seed}`);
  }
  const enemyDuo = m.participants.filter((x) => x.teamId === 200).slice(3, 5);
  enemyDuo.forEach((x) => demoPremades.set(x.puuid, `PAIR_E_${p.seed}`));
  const r = rng(p.seed + 99);
  return {
    inGame: true,
    gameId: p.seed,
    queueId: m.queueId,
    gameMode: m.gameMode,
    startedAt: Date.now() - int(r, 180, 1500) * 1000,
    participants: m.participants.map((x) => ({
      puuid: x.puuid,
      gameName: x.gameName,
      tagLine: x.tagLine,
      teamId: x.teamId,
      championId: x.championId,
      spells: x.spells,
      keystone: x.keystone,
      secondaryStyle: x.secondaryStyle,
      profileIconId: pick(r, [588, 4568, 5367, 6328, 29]),
    })),
    bans: m.teams.flatMap((t) => t.bans.map((championId) => ({ teamId: t.teamId, championId }))),
  };
}


const TIER_LIST = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER'];

export function mockScout(puuid: string, championId: number): ScoutInfo {
  const name = nameFromDemoPuuid(puuid);
  const r = rng(hash(puuid) + championId);
  const prof = name ? mockProfile('euw1', name.gameName, name.tagLine) : null;
  let solo: LeagueEntry | null = prof?.ranked.find((e) => e.queueType === 'RANKED_SOLO_5x5') ?? null;
  if (!prof && r() < 0.85) {
    const tier = pick(r, TIER_LIST.slice(1, 7));
    const wins = int(r, 15, 180);
    solo = { queueType: 'RANKED_SOLO_5x5', tier, rank: pick(r, ['I', 'II', 'III', 'IV']), leaguePoints: int(r, 0, 99), wins, losses: Math.round(wins * (0.8 + r() * 0.45)), hotStreak: r() < 0.2, veteran: r() < 0.25, freshBlood: r() < 0.1 };
  }
  return {
    puuid,
    level: prof?.summoner.summonerLevel ?? int(r, 35, 520),
    profileIconId: prof?.summoner.profileIconId ?? pick(r, [588, 4568, 5367, 6328, 29]),
    solo,
    flex: prof?.ranked.find((e) => e.queueType === 'RANKED_FLEX_SR') ?? null,
    mastery: r() < 0.9 ? { level: int(r, 1, 40), points: Math.round(Math.pow(r(), 2) * 900_000) } : r() < 0.5 ? { level: 0, points: 0 } : null,
  };
}

/** A month of plausible LP movement ending at the player's current rank. */
export function mockLpHistory(gameName: string, tagLine: string): LpPoint[] {
  const prof = mockProfile('euw1', gameName, tagLine);
  const solo = prof?.ranked.find((e) => e.queueType === 'RANKED_SOLO_5x5');
  if (!solo) return [];
  const r = rng(hash(`${gameName}#${tagLine}`) + 3);
  const TIERS_ALL = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
  const DIV = ['IV', 'III', 'II', 'I'];
  const toAbs = (tier: string, rank: string, lp: number) => {
    const ti = TIERS_ALL.indexOf(tier);
    return ti >= 7 ? 2800 + lp : ti * 400 + DIV.indexOf(rank) * 100 + lp;
  };
  const fromAbs = (v: number) => {
    if (v >= 2800) return { tier: 'MASTER', rank: 'I', lp: v - 2800 };
    const ti = Math.floor(v / 400);
    const di = Math.floor((v % 400) / 100);
    return { tier: TIERS_ALL[ti], rank: DIV[di], lp: Math.round(v % 100) };
  };
  const points: LpPoint[] = [];
  let v = toAbs(solo.tier, solo.rank, solo.leaguePoints);
  let wins = solo.wins;
  let losses = solo.losses;
  const now = Date.now();
  for (let i = 0; i < 36; i++) {
    const f = fromAbs(Math.max(0, v));
    points.unshift({ t: now - i * 20 * 3600_000 - int(r, 0, 3 * 3600_000), queue: 'RANKED_SOLO_5x5', tier: f.tier, rank: f.rank, lp: f.lp, wins, losses });
    const won = r() < 0.5;
    v += won ? -int(r, 18, 26) : int(r, 15, 24);
    if (won) wins--;
    else losses--;
  }
  return points;
}

const LADDER_SIZE = { challenger: 300, grandmaster: 700, master: 2500 } as const;

/** Generated apex ladder, sorted by LP. */
export function mockLadder(tier: 'challenger' | 'grandmaster' | 'master', queue: 'solo' | 'flex') {
  const r = rng(hash(`${tier}-${queue}`));
  const n = LADDER_SIZE[tier] / (queue === 'flex' ? 3 : 1);
  const top = tier === 'challenger' ? 2100 : tier === 'grandmaster' ? 900 : 450;
  const bottom = tier === 'challenger' ? 900 : tier === 'grandmaster' ? 450 : 0;
  return Array.from({ length: Math.round(n) }, (_, i) => {
    const name = fakeName(r);
    const wins = int(r, 120, 520);
    return {
      puuid: puuidFor(`${name.gameName}#${name.tagLine}`),
      gameName: name.gameName,
      tagLine: name.tagLine,
      lp: Math.round(top - (top - bottom) * Math.pow(i / n, 0.8)),
      wins,
      losses: Math.round(wins * (0.78 + r() * 0.2)),
      hotStreak: r() < 0.15,
      veteran: r() < 0.4,
    };
  });
}

/** This week's free champions (changes weekly). */
export function mockRotation() {
  const week = Math.floor(Date.now() / (7 * 86400_000));
  const r = rng(week);
  return [...ALL_CHAMPS].sort(() => r() - 0.5).slice(0, 20);
}

/* ---------- Arena (demo champion stats only) ---------- */

const AUGMENT_POOL = [93, 89, 323, 87, 108, 120, 327, 66, 23, 21, 243, 14, 129, 231, 318, 6, 94, 308, 223, 44, 214, 5, 80, 97, 154, 90, 28, 226, 54, 51, 72, 136, 133, 135, 193, 65, 180, 92, 10, 233, 310, 251, 322, 53, 57, 88, 236, 171, 39, 79, 86, 30, 60, 321, 15, 156, 27, 103, 82, 76];
const ARENA_ITEMS = [...new Set(Object.values(ITEMS).flat())];

/** A generated Arena game: eight duos, placements 1–8, four augments each. Top four counts as a win. */
export function mockArenaMatch(seed: number): MatchSummary {
  const r = rng(seed * 7477 + 3);
  const duration = int(r, 900, 1500);
  const minutes = duration / 60;
  const used = new Set<number>();
  const champ = () => {
    let c = pick(r, ALL_CHAMPS);
    for (let i = 0; used.has(c) && i < 40; i++) c = pick(r, ALL_CHAMPS);
    used.add(c);
    return c;
  };
  // Some champions and augments are simply stronger, so the stats have a shape to them.
  const strength = (id: number) => ((id * 2654435761) % 1000) / 1000;
  const duos = Array.from({ length: 8 }, (_, i) => {
    const pair = [champ(), champ()];
    return { sub: i + 1, pair, power: strength(pair[0]) + strength(pair[1]) + r() * 1.6 };
  }).sort((a, b) => b.power - a.power);

  const participants: Participant[] = [];
  duos.forEach((d, place) => {
    for (const championId of d.pair) {
      const cr = rng(championId * 7919 + 101);
      const augs = [...AUGMENT_POOL].sort(() => (r() < 0.6 ? cr() : r()) - 0.5).slice(0, 4);
      const items = [...ARENA_ITEMS].sort(() => (r() < 0.7 ? cr() : r()) - 0.5).slice(0, 5);
      const kills = int(r, 2, 14) + (8 - place);
      participants.push({
        puuid: `demo-rand-arena-${seed}-${participants.length}`,
        gameName: fakeName(r).gameName,
        tagLine: 'DEMO',
        teamId: 100,
        subteam: d.sub,
        placement: place + 1,
        augments: augs,
        win: place < 4,
        championId,
        champLevel: Math.min(18, 9 + place),
        position: '',
        kills,
        deaths: int(r, 2, 9),
        assists: int(r, 2, 10),
        cs: 0,
        gold: Math.round(700 * minutes),
        damage: Math.round((900 + r() * 900) * minutes),
        damageTaken: Math.round(1000 * minutes * (0.7 + r() * 0.6)),
        visionScore: 0,
        wardsPlaced: 0,
        controlWards: 0,
        items: [...items, 0, 0],
        spells: [2202, 2201],
        keystone: 0,
        primaryStyle: 0,
        secondaryStyle: 0,
        largestMultiKill: 1,
        killParticipation: 0.5,
        score: 0,
        runes: { primary: [], secondary: [], shards: [] },
        extra: { soloKills: 0, turretPlates: 0, csAt10: 0, firstBlood: false, damageMitigated: 0, healing: 0, shielding: 0, ccTime: 0, objectiveDamage: 0, turretDamage: 0, skillshotsHit: 0, skillshotsDodged: 0 },
      });
    }
  });
  return {
    id: `DEMOARENA_${seed}`,
    queueId: 1700,
    gameMode: 'CHERRY',
    startedAt: Date.now() - seed * 600_000,
    duration,
    version: '15.20.1',
    remake: false,
    teams: [],
    participants,
  };
}

/** A stable made-up challenge standing for demo profiles. */
export function mockChallenges(puuid: string) {
  const r = rng(hash(`challenges-${puuid}`));
  const levels = ['SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MASTER', 'GRANDMASTER'];
  const i = Math.floor(r() * levels.length);
  return { level: levels[i], points: 4000 + i * 3500 + Math.round(r() * 2000), percentile: Math.round((0.61 - i * 0.11) * 1000) / 1000 };
}
