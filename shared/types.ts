/** Types shared by the API server and the web client. The server reshapes Riot's
 * large payloads into these compact structures, so the client never sees raw Riot data. */

export interface Account {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface SummonerInfo {
  profileIconId: number;
  summonerLevel: number;
  revisionDate: number;
}

export type QueueType = 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR' | string;

export interface LeagueEntry {
  queueType: QueueType;
  tier: string; // IRON … CHALLENGER
  rank: string; // I … IV
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  miniSeries?: { progress: string; target: number; wins: number; losses: number };
}

export interface Mastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
}

export interface Profile {
  platform: string;
  account: Account;
  summoner: SummonerInfo;
  ranked: LeagueEntry[];
  mastery: Mastery[];
  fetchedAt: number;
  /** Milliseconds until this profile may be updated again (server-decided, so clocks don't matter). */
  updateIn?: number;
  /** Milliseconds since this data was last read fresh from Riot. */
  age?: number;
}

export interface Participant {
  puuid: string;
  gameName: string;
  tagLine: string;
  teamId: number;
  subteam?: number; // Arena only
  placement?: number; // Arena only
  win: boolean;
  championId: number;
  champLevel: number;
  position: '' | 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY';
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gold: number;
  damage: number; // to champions
  damageTaken: number;
  visionScore: number;
  wardsPlaced: number;
  controlWards: number;
  items: number[]; // 7 slots, 0 = empty, slot 6 = trinket
  spells: [number, number];
  keystone: number;
  primaryStyle: number;
  secondaryStyle: number;
  largestMultiKill: number;
  killParticipation: number; // 0..1
  score: number; // 0..10 performance score computed server-side
  badge?: 'MVP' | 'ACE';
  runes: { primary: number[]; secondary: number[]; shards: number[] };
  extra: ParticipantExtra;
}

export interface ParticipantExtra {
  soloKills: number;
  turretPlates: number;
  csAt10: number;
  firstBlood: boolean;
  damageMitigated: number;
  healing: number;
  shielding: number;
  ccTime: number;
  objectiveDamage: number;
  turretDamage: number;
  skillshotsHit: number;
  skillshotsDodged: number;
}

export interface TeamSummary {
  teamId: number;
  win: boolean;
  kills: number;
  gold: number;
  bans: number[];
  objectives: { baron: number; dragon: number; tower: number; herald: number; grubs: number; inhibitor: number };
}

export interface MatchSummary {
  id: string;
  queueId: number;
  gameMode: string;
  startedAt: number;
  duration: number; // seconds
  version: string;
  remake: boolean;
  teams: TeamSummary[];
  participants: Participant[];
}

/** Per-minute frames and key events, from match-v5 timeline. Arrays align with `puuids`,
 * which is the same order as MatchSummary.participants. */
export interface TimelineFrame {
  minute: number;
  gold: number[];
  cs: number[];
  xp: number[];
  level: number[];
  damage: number[];
}

export type TimelineEvent =
  | { type: 'kill'; t: number; killer: number; victim: number; assists: number[]; x: number; y: number }
  | { type: 'objective'; t: number; teamId: number; monster: string; sub?: string }
  | { type: 'building'; t: number; teamId: number; building: string; lane: string };

export interface MatchTimeline {
  puuids: string[];
  frames: TimelineFrame[];
  events: TimelineEvent[];
  items: { t: number; itemId: number; sold?: boolean }[][];
  skills: number[][]; // skill slot (1=Q … 4=R) per level-up, per participant
}

export interface PlayerHit {
  platform: string;
  gameName: string;
  tagLine: string;
  profileIconId?: number;
  level?: number;
  tier?: string;
  rank?: string;
  lp?: number;
  verified?: boolean; // confirmed live against Riot just now
}

export interface MatchPage {
  matches: MatchSummary[];
  nextStart: number | null;
}

export interface LiveParticipant {
  puuid: string;
  gameName: string;
  tagLine: string;
  teamId: number;
  championId: number;
  spells: [number, number];
  keystone: number;
  secondaryStyle: number;
  profileIconId: number;
}

export interface LiveGame {
  inGame: true;
  gameId: number;
  queueId: number;
  gameMode: string;
  startedAt: number;
  participants: LiveParticipant[];
  bans: { teamId: number; championId: number }[];
}

export type LiveResponse = LiveGame | { inGame: false };

export type ApiErrorCode = 'NOT_FOUND' | 'RATE_LIMITED' | 'KEY_INVALID' | 'BAD_REQUEST' | 'UPSTREAM' | 'NO_KEY';

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string; retryAfter?: number };
}

export interface HealthResponse {
  ok: true;
  mode: 'live' | 'demo';
}

/* ---------- Champion statistics (aggregated by the server from matches it has seen) ---------- */

export type StatsGroup = 'ranked' | 'aram';

export interface Rated {
  games: number;
  winRate: number;
}

export interface TierRow {
  championId: number;
  role: string; // TOP … UTILITY, or ALL for ARAM
  games: number;
  winRate: number;
  pickRate: number;
  banRate: number;
  tier: 'S+' | 'S' | 'A' | 'B' | 'C' | 'D' | '–'; // '–' = too rare in this role to rank
  rank: number; // within role
  lowSample: boolean;
  counters?: number[]; // champion ids this pick struggles against in lane
}

export interface TierList {
  group: StatsGroup;
  patch: string | null;
  patches: string[];
  matches: number;
  rows: TierRow[];
  collecting: boolean; // a background collector is adding matches
}

export interface ChampionStats {
  championId: number;
  group: StatsGroup;
  patch: string | null;
  patches: string[];
  matches: number; // matches in this group/patch
  role: string;
  roles: { role: string; games: number; share: number }[];
  summary: TierRow | null;
  avg: { kills: number; deaths: number; assists: number; csPerMin: number; damagePerMin: number; goldPerMin: number; minutes: number } | null;
  runes: (Rated & { primaryStyle: number; primary: number[]; secondaryStyle: number; secondary: number[]; shards: number[] })[];
  spells: (Rated & { ids: number[] })[];
  starting: (Rated & { ids: number[] })[];
  core: (Rated & { ids: number[] })[];
  /** Complete build variations: core (first three items) with the boots and 4th–6th items bought after it. */
  builds: (Rated & {
    ids: number[];
    share: number; // of games with three completed items
    tags: ('popular' | 'best')[];
    boots: (Rated & { id: number })[];
    bootsTotal: number;
    later: { slot: number; total: number; options: (Rated & { id: number })[] }[];
  })[];
  boots: (Rated & { id: number })[];
  later: { slot: number; total: number; options: (Rated & { id: number })[] }[]; // 4th, 5th, 6th item
  coreTotal: number; // games with three completed items
  bootsTotal: number;
  skills: { order: string; path: number[]; maxOrders: (Rated & { order: string })[]; sample: number };
  matchups: (Rated & { championId: number; adjusted: number; goldDiff15: number | null; csDiff15: number | null; xpDiff15: number | null })[];
  byLength: (Rated & { label: string })[];
  synergy: { role: string; list: (Rated & { championId: number })[] } | null;
  players: (Rated & { gameName: string; tagLine: string; platform: string; kda: number })[];
}

/* ---------- Ranked history, tracking and scouting ---------- */

export interface LpPoint {
  t: number;
  queue: string;
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
}

export interface TrackedPlayer {
  platform: string;
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface LpHistory {
  points: LpPoint[];
  tracked: boolean;
}

/** Everything the live-game and multi-search views need about one player, cheaply. */
export interface ScoutInfo {
  puuid: string;
  level: number | null;
  profileIconId: number | null;
  solo: LeagueEntry | null;
  flex: LeagueEntry | null;
  mastery: { level: number; points: number } | null; // on the requested champion
  recentMatchIds: string[]; // for premade detection
}

/* ---------- Leaderboards, rotation, status ---------- */

export interface LadderEntry {
  rank: number;
  puuid: string;
  gameName: string | null;
  tagLine: string | null;
  lp: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
}

export interface Ladder {
  platform: string;
  queue: 'solo' | 'flex';
  tier: 'challenger' | 'grandmaster' | 'master';
  total: number;
  page: number;
  pageSize: number;
  entries: LadderEntry[];
}

export interface ServerStatus {
  platform: string;
  notices: { id: string; kind: 'incident' | 'maintenance'; severity: string; title: string; detail: string }[];
}
