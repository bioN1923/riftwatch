import fs from 'node:fs';
import path from 'node:path';
import type { BlindPicks, Benchmark, ChampionStats, MatchSummary, MatchTimeline, MatchupStats, PatchMover, Rated, StatsGroup, TierList, TierRow } from '../shared/types';
import { itemKind } from './items';
import { getPlatform } from '../shared/regions';
import { isArena } from '../shared/queues';

/**
 * Champion statistics built from the matches this server sees — the same idea as u.gg/op.gg,
 * on a smaller scale. Every ranked/ARAM match adds win rates, runes, spells, item builds and
 * matchups per champion and role; timelines add starting items, skill order and lane gold leads.
 */

interface C {
  g: number;
  w: number;
}
interface Vs extends C {
  gd: number; // summed gold diff at 15 minutes
  gn: number; // games with a timeline
  cd?: number; // summed CS diff at 15
  xd?: number; // summed XP diff at 15
  /** Lane curve: summed [gold@5, gold@10, gold@15, cs@5, cs@10, cs@15] leads, over `ln` games. */
  ld?: number[];
  ln?: number;
}
export const LANE_MINUTES = [5, 10, 15];
/** Games with 5/10/15 frames a matchup needs before its lane chart shows: one game can swing gold at 15 by thousands. */
export const MATCHUP_LANE_MIN = 10;

/** Lane leads summed over every opponent; needs a fair sample, since one game can swing gold by thousands. */
function laneOverall(r: RoleAgg) {
  const ld = [0, 0, 0, 0, 0, 0];
  let n = 0;
  for (const v of Object.values(r.vs ?? {})) {
    if (!v.ld || !v.ln) continue;
    v.ld.forEach((x, k) => (ld[k] += x));
    n += v.ln;
  }
  return n >= 20 ? { minutes: LANE_MINUTES, gold: ld.slice(0, 3).map((x) => x / n), cs: ld.slice(3).map((x) => x / n), games: n } : null;
}

function addLaneLeads(v: Vs, tl: MatchTimeline, i: number, j: number) {
  const fs = LANE_MINUTES.map((t) => tl.frames[t]);
  if (!fs.every(Boolean)) return;
  const ld = (v.ld ??= [0, 0, 0, 0, 0, 0]);
  fs.forEach((f, k) => {
    ld[k] += f.gold[i] - f.gold[j];
    ld[k + 3] += f.cs[i] - f.cs[j];
  });
  v.ln = (v.ln ?? 0) + 1;
}

/** Win rate pulled towards 50% for small samples, so one lucky game doesn't top a ranking. */
export const shrunk = (w: number, g: number, k = 10) => (w + 0.5 * k) / (g + k);

/** The opponents this role does worst against in lane (enough games, sorted by adjusted win rate). */
/** Lane matchups need real samples: 0/7 is bad luck as often as a real counter. */
export const MATCHUP_K = 25;
export const matchupMin = (games: number) => Math.max(8, Math.round(games * 0.03));
/**
 * Up to n opponents this role does worst against, the clear ones first. A matchup is a *clear*
 * counter when even an optimistic read (adjusted rate plus one standard error) stays under 50%;
 * the rest only lean that way and could still be chance. Returns the ids and how many are clear.
 */
export function countersOf(r: Pick<RoleAgg, 'g' | 'vs'>, n = 3): { ids: number[]; sure: number } {
  const min = matchupMin(r.g);
  const rows = Object.entries(r.vs)
    .filter(([, v]) => v.g >= min && v.w / v.g < 0.5)
    .map(([id, v]) => {
      const adj = shrunk(v.w, v.g, MATCHUP_K);
      return { id: Number(id), adj, sure: adj + 0.5 / Math.sqrt(v.g + MATCHUP_K) < 0.5 };
    })
    .filter((x) => x.adj < 0.5)
    .sort((a, b) => Number(b.sure) - Number(a.sure) || a.adj - b.adj)
    .slice(0, n);
  return { ids: rows.map((x) => x.id), sure: rows.filter((x) => x.sure).length };
}
interface RoleAgg {
  g: number;
  w: number;
  k: number;
  d: number;
  a: number;
  cs: number;
  dmg: number;
  gold: number;
  min: number;
  runes: Record<string, C>;
  spells: Record<string, C>;
  core: Record<string, C>;
  boots: Record<string, C>;
  s4: Record<string, C>;
  s5: Record<string, C>;
  s6: Record<string, C>;
  start: Record<string, C>;
  max: Record<string, C>;
  lv: number[][]; // [level][slot 0..3] counts
  tl: number;
  vs: Record<string, Vs>;
  len: C[];
  duo?: Record<string, C>; // same-team champion in the partner role
  bv?: Record<string, BuildVar>; // per core build (first three items): its boots and 4th–6th items
  mu?: Record<string, MatchupAgg>; // per lane opponent: what was played into them
  pl?: Record<string, { n: string; t: string; pf: string; g: number; w: number; k: number; d: number; a: number }>;
  ar?: ArenaAgg;
}

/**
 * Arena: finishing places, duo partners and how often each item is bought.
 * Riot's policy forbids win rates for Augments and Arena items, so augments aren't recorded at all
 * and items are only counted (popularity), never tied to results.
 */
interface ArenaAgg {
  pl: number[]; // games per place, index 0 = 1st
  par: Record<string, C & { p: number }>;
  it?: Record<string, number>; // item id -> games it was in the final inventory
  aug?: unknown; // older saves recorded augments; dropped on the next save
}
const newArena = (): ArenaAgg => ({ pl: [0, 0, 0, 0, 0, 0, 0, 0], par: {}, it: {} });

interface BuildVar {
  boots: Record<string, C>;
  s4: Record<string, C>;
  s5: Record<string, C>;
  s6: Record<string, C>;
}

/** Builds, runes and spells used against one lane opponent. */
interface MatchupAgg {
  runes: Record<string, C>;
  spells: Record<string, C>;
  start: Record<string, C>;
  core: Record<string, C>;
  boots: Record<string, C>;
  s4: Record<string, C>;
  s5: Record<string, C>;
  s6: Record<string, C>;
  bv?: Record<string, BuildVar>;
  k: number;
  d: number;
  a: number;
}
const newMatchup = (): MatchupAgg => ({ runes: {}, spells: {}, start: {}, core: {}, boots: {}, s4: {}, s5: {}, s6: {}, k: 0, d: 0, a: 0 });
/** Anything that tallies builds: a whole champion-role, or one of its matchups. */
type BuildTally = Pick<RoleAgg, 'core' | 's4' | 's5' | 's6' | 'bv'>;

/** The teammate role whose champion matters most for each role. */
const PARTNER: Record<string, string> = { TOP: 'JUNGLE', JUNGLE: 'MIDDLE', MIDDLE: 'JUNGLE', BOTTOM: 'UTILITY', UTILITY: 'BOTTOM' };
interface GroupAgg {
  matches: number;
  champs: Record<string, { roles: Record<string, RoleAgg>; bans: number }>;
}
interface Store {
  v: 1;
  patches: Record<string, Partial<Record<StatsGroup, GroupAgg>>>;
  seen: string[];
  seenTl: string[];
  /** Matches whose 5/10/15 lane leads are counted (timelines seen before v3.12 lack them until backfilled). */
  laneDone?: string[];
}

const LENGTHS = [
  { label: 'Under 20 min', max: 20 },
  { label: '20–25 min', max: 25 },
  { label: '25–30 min', max: 30 },
  { label: '30–35 min', max: 35 },
  { label: '35+ min', max: Infinity },
];
const KEYS = ['Q', 'W', 'E'];

export const groupOf = (queueId: number): StatsGroup | null =>
  queueId === 420 || queueId === 440 ? 'ranked' : queueId === 450 ? 'aram' : isArena(queueId) ? 'arena' : null;
export const patchOf = (version: string) => version.split('.').slice(0, 2).join('.');
const patchCmp = (a: string, b: string) => {
  const [a1, a2] = a.split('.').map(Number);
  const [b1, b2] = b.split('.').map(Number);
  return b1 - a1 || b2 - a2;
};

function newRole(): RoleAgg {
  return { g: 0, w: 0, k: 0, d: 0, a: 0, cs: 0, dmg: 0, gold: 0, min: 0, runes: {}, spells: {}, core: {}, boots: {}, s4: {}, s5: {}, s6: {}, start: {}, max: {}, lv: Array.from({ length: 18 }, () => [0, 0, 0, 0]), tl: 0, vs: {}, len: LENGTHS.map(() => ({ g: 0, w: 0 })) };
}

function bump(map: Record<string, C>, key: string, win: boolean, delta = 1) {
  const c = (map[key] ??= { g: 0, w: 0 });
  c.g += delta;
  if (win) c.w += delta;
  if (c.g <= 0) delete map[key];
}

/** Completed items in inventory-slot order (new items fill the first free slot). */
function slotBuild(items: number[]) {
  const inv = items.slice(0, 6);
  return { legendaries: inv.filter((id) => itemKind(id) === 'legendary'), boots: inv.find((id) => itemKind(id) === 'boots') };
}

/** Completed items in the order they were actually bought, keeping only those still owned at the end. */
function purchaseBuild(items: number[], purchases: { t: number; itemId: number; sold?: boolean }[]) {
  const owned = new Map<number, number>();
  for (const id of items.slice(0, 6)) if (itemKind(id) === 'legendary') owned.set(id, (owned.get(id) ?? 0) + 1);
  const order: number[] = [];
  for (const e of purchases) {
    if (e.sold || itemKind(e.itemId) !== 'legendary') continue;
    const left = owned.get(e.itemId) ?? 0;
    if (left > 0) {
      order.push(e.itemId);
      owned.set(e.itemId, left - 1);
    }
  }
  return order;
}

function countBuild(r: BuildTally, legendaries: number[], boots: number | undefined, win: boolean, delta: 1 | -1) {
  if (legendaries.length >= 3) {
    const key = legendaries.slice(0, 3).join(',');
    bump(r.core, key, win, delta);
    // The same game counted under its core build, so each build variation has its own follow-ups.
    const v = ((r.bv ??= {})[key] ??= { boots: {}, s4: {}, s5: {}, s6: {} });
    if (boots) bump(v.boots, String(boots), win, delta);
    if (legendaries[3]) bump(v.s4, String(legendaries[3]), win, delta);
    if (legendaries[4]) bump(v.s5, String(legendaries[4]), win, delta);
    if (legendaries[5]) bump(v.s6, String(legendaries[5]), win, delta);
    if (!r.core[key]) delete r.bv[key];
  }
  if (legendaries[3]) bump(r.s4, String(legendaries[3]), win, delta);
  if (legendaries[4]) bump(r.s5, String(legendaries[4]), win, delta);
  if (legendaries[5]) bump(r.s6, String(legendaries[5]), win, delta);
}

/**
 * Pick variations from a tally: the three most played, plus the best performer (by
 * sample-adjusted win rate) if it isn't among them. Tags mark which is which.
 */
function pickVariations<T extends C>(entries: [string, T][]) {
  const total = entries.reduce((n, [, v]) => n + v.g, 0);
  const all = [...entries].sort((a, b) => b[1].g - a[1].g);
  const popular = all.filter(([, v]) => v.g >= Math.max(3, Math.round(total * 0.03))).slice(0, 3);
  for (const e of all) if (popular.length < 3 && !popular.includes(e)) popular.push(e);
  const qualified = all.filter(([, v]) => v.g >= Math.max(5, Math.round(total * 0.05)));
  const best = [...qualified].sort((a, b) => shrunk(b[1].w, b[1].g) - shrunk(a[1].w, a[1].g))[0];
  const chosen = best && !popular.includes(best) ? [...popular, best] : popular;
  return chosen.map(([key, v], i) => ({
    key,
    v,
    share: total ? v.g / total : 0,
    tags: [...(i === 0 ? (['popular'] as const) : []), ...(best && key === best[0] && qualified.length > 1 ? (['best'] as const) : [])],
  }));
}

/** Rune pages grouped without their stat shards; each page keeps its most played shard set. */
export function runeVariations(runes: Record<string, C>): ChampionStats['runes'] {
  const pages = new Map<string, C & { shards: Record<string, number> }>();
  for (const [k, v] of Object.entries(runes)) {
    const [pri, sec, shards] = k.split('|');
    const page = (pages.get(`${pri}|${sec}`) ?? pages.set(`${pri}|${sec}`, { g: 0, w: 0, shards: {} }).get(`${pri}|${sec}`))!;
    page.g += v.g;
    page.w += v.w;
    page.shards[shards ?? ''] = (page.shards[shards ?? ''] ?? 0) + v.g;
  }
  const ids = (s: string) => (s ? s.split(',').map(Number) : []);
  return pickVariations([...pages.entries()]).map(({ key, v, share, tags }) => {
    const [pri, sec] = key.split('|');
    const [ps, pl] = pri.split(':');
    const [ss, sl] = sec.split(':');
    const shards = Object.entries(v.shards).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    return { games: v.g, winRate: v.w / v.g, share, tags, primaryStyle: Number(ps), primary: ids(pl), secondaryStyle: Number(ss), secondary: ids(sl), shards: ids(shards) };
  });
}

/**
 * Up to four complete build variations: the most played core builds (first three items),
 * plus the best-performing one if it isn't among them. Each carries the boots and 4th–6th
 * items bought after that specific core.
 */
export function buildVariations(r: BuildTally): ChampionStats['builds'] {
  const chosen = pickVariations(Object.entries(r.core));
  const opts = (m: Record<string, C> | undefined, n: number) =>
    Object.entries(m ?? {})
      .sort((a, b) => b[1].g - a[1].g)
      .slice(0, n)
      .map(([k, v]) => ({ id: Number(k), games: v.g, winRate: v.w / v.g }));
  const sum = (m: Record<string, C> | undefined) => Object.values(m ?? {}).reduce((n, v) => n + v.g, 0);

  return chosen.map(({ key, v, share, tags }) => {
    const bv = r.bv?.[key];
    return {
      ids: key.split(',').map(Number),
      games: v.g,
      winRate: v.w / v.g,
      share,
      tags,
      boots: opts(bv?.boots, 2),
      bootsTotal: sum(bv?.boots),
      later: (['s4', 's5', 's6'] as const).map((s, j) => ({ slot: j + 4, total: sum(bv?.[s]), options: opts(bv?.[s], 3) })),
    };
  });
}

function arenaSummary(ar: ArenaAgg, games: number): NonNullable<ChampionStats['arena']> {
  const placed = ar.pl.reduce((s, n) => s + n, 0) || 1;
  return {
    avgPlacement: ar.pl.reduce((s, n, i) => s + n * (i + 1), 0) / placed,
    firstRate: ar.pl[0] / placed,
    placements: ar.pl,
    items: Object.entries(ar.it ?? {})
      .map(([id, n]) => ({ id: Number(id), pickRate: n / Math.max(1, games) }))
      .sort((a, b) => b.pickRate - a.pickRate)
      .slice(0, 18),
    partners: Object.entries(ar.par)
      .filter(([, c]) => c.g >= Math.max(2, Math.round(games * 0.01)))
      .map(([id, c]) => ({ championId: Number(id), games: c.g, winRate: c.w / c.g, avgPlacement: c.p / c.g }))
      .sort((a, b) => (a.avgPlacement * a.games + 4.5 * 10) / (a.games + 10) - (b.avgPlacement * b.games + 4.5 * 10) / (b.games + 10))
      .slice(0, 8),
  };
}

/**
 * Champions whose win rate moved most since the previous patch. Small samples swing wildly, and
 * with a couple of hundred champion-role pairs some will look like big movers by chance alone. So a
 * pair needs a decent number of games on both patches and a change of at least two standard errors
 * (about a 1-in-20 fluke for any one pair), and the list is ranked by the change we can be fairly
 * sure of: the measured change minus one standard error.
 */
/** Standard error of the difference between two win rates (around 50%) on g1 and g2 games. */
const moverSe = (g1: number, g2: number) => Math.sqrt(0.25 / g1 + 0.25 / g2);

export function movers(now: TierRow[], before: TierRow[], against: string, minGames = 100): NonNullable<TierList['movers']> {
  const prev = new Map(before.map((r) => [`${r.championId}:${r.role}`, r]));
  const list: PatchMover[] = [];
  for (const r of now) {
    const p = prev.get(`${r.championId}:${r.role}`);
    if (!p || r.games < minGames || p.games < minGames) continue;
    if (Math.abs(r.winRate - p.winRate) < 2 * moverSe(r.games, p.games)) continue;
    list.push({ championId: r.championId, role: r.role, winRate: r.winRate, prevWinRate: p.winRate, delta: r.winRate - p.winRate, games: r.games, prevGames: p.games, pickRate: r.pickRate, prevPickRate: p.pickRate });
  }
  const score = (m: PatchMover) => Math.sign(m.delta) * (Math.abs(m.delta) - moverSe(m.games, m.prevGames));
  const sorted = [...list].sort((a, b) => score(b) - score(a));
  return {
    against,
    up: sorted.filter((m) => m.delta > 0.005).slice(0, 15),
    down: sorted.filter((m) => m.delta < -0.005).reverse().slice(0, 15),
  };
}

export class ChampionStatsStore {
  /** Players who hid their profile are left out of "who plays it most". */
  isHidden: (puuid: string) => boolean = () => false;
  /** A player's current Riot ID, so "who plays it most" never shows an old name. */
  currentName: (puuid: string) => { gameName: string; tagLine: string } | undefined = () => undefined;

  private s: Store = { v: 1, patches: {}, seen: [], seenTl: [] };
  private seen = new Set<string>();
  private seenTl = new Set<string>();
  private laneDone = new Set<string>();
  private dirty = false;
  collecting = false;

  constructor(private file: string | null) {
    if (file) {
      try {
        this.s = JSON.parse(fs.readFileSync(file, 'utf8'));
        this.seen = new Set(this.s.seen);
        this.seenTl = new Set(this.s.seenTl);
        if (this.s.laneDone) this.laneDone = new Set(this.s.laneDone);
        else {
          // First start with lane leads: the newest timelines (since v3.12) already have them. Mark about that many as done,
          // erring on the side of skipping a few rather than counting any game twice.
          let n = 0;
          for (const groups of Object.values(this.s.patches))
            for (const g of Object.values(groups))
              for (const c of Object.values(g?.champs ?? {})) for (const r of Object.values(c.roles)) for (const v of Object.values(r.vs ?? {})) n += v.ln ?? 0;
          this.laneDone = new Set(n ? this.s.seenTl.slice(-Math.ceil(n / 8)) : []);
        }
      } catch {
        /* first run */
      }
      setInterval(() => this.flush(), 30_000).unref();
    }
  }

  has(matchId: string) {
    return this.seen.has(matchId);
  }
  hasTimeline(matchId: string) {
    return this.seenTl.has(matchId);
  }
  /** Timelines counted before lane leads existed, newest first: the collector re-reads these slowly to fill the lane curves. */
  laneBackfill(limit: number) {
    const out: string[] = [];
    const all = [...this.seenTl];
    for (let i = all.length - 1; i >= 0 && out.length < limit; i--) if (!this.laneDone.has(all[i])) out.push(all[i]);
    return out;
  }
  skipLane(matchId: string) {
    this.laneDone.add(matchId);
    this.dirty = true;
  }
  /** Adds only the 5/10/15 lane leads from a timeline already counted for everything else. */
  addLane(m: MatchSummary, tl: MatchTimeline) {
    if (this.laneDone.has(m.id) || !this.seenTl.has(m.id)) return;
    this.laneDone.add(m.id);
    this.dirty = true;
    const g = this.group(m, false);
    if (!g || m.queueId === 450) return;
    for (const p of m.participants) {
      if (!p.position) continue;
      const i = tl.puuids.indexOf(p.puuid);
      const opp = m.participants.find((x) => x.teamId !== p.teamId && x.position === p.position);
      const j = opp ? tl.puuids.indexOf(opp.puuid) : -1;
      const v = opp && i >= 0 && j >= 0 ? g.champs[p.championId]?.roles[p.position]?.vs?.[opp.championId] : undefined;
      if (v) addLaneLeads(v, tl, i, j);
    }
  }

  private group(m: MatchSummary, create = true) {
    const group = groupOf(m.queueId);
    if (!group || m.remake) return null;
    const patch = patchOf(m.version);
    const p = (this.s.patches[patch] ??= {});
    if (!p[group] && !create) return null;
    return (p[group] ??= { matches: 0, champs: {} });
  }

  private role(g: GroupAgg, championId: number, position: string) {
    const c = (g.champs[championId] ??= { roles: {}, bans: 0 });
    return (c.roles[position || 'ALL'] ??= newRole());
  }

  addMatch(m: MatchSummary) {
    if (this.seen.has(m.id)) return;
    const g = this.group(m);
    if (!g) return;
    this.seen.add(m.id);
    this.dirty = true;
    g.matches++;
    const arena = isArena(m.queueId);
    const aram = m.queueId === 450 || arena; // no lanes: one 'ALL' role
    const minutes = m.duration / 60;
    const lenIdx = LENGTHS.findIndex((l) => minutes < l.max);

    for (const t of m.teams) for (const b of new Set(t.bans)) (g.champs[b] ??= { roles: {}, bans: 0 }).bans++;

    for (const p of m.participants) {
      if (!aram && !p.position) continue;
      const r = this.role(g, p.championId, aram ? 'ALL' : p.position);
      r.g++;
      if (p.win) r.w++;
      r.k += p.kills;
      r.d += p.deaths;
      r.a += p.assists;
      r.cs += p.cs;
      r.dmg += p.damage;
      r.gold += p.gold;
      r.min += minutes;
      r.len[lenIdx].g++;
      if (p.win) r.len[lenIdx].w++;
      if (p.runes?.primary?.length) {
        bump(r.runes, `${p.primaryStyle}:${p.runes.primary.join(',')}|${p.secondaryStyle}:${p.runes.secondary.join(',')}|${p.runes.shards.join(',')}`, p.win);
      }
      bump(r.spells, [...p.spells].sort((x, y) => x - y).join(','), p.win);

      if (arena && p.placement) {
        const place = Math.min(8, Math.max(1, p.placement));
        const ar = (r.ar ??= newArena());
        ar.pl[place - 1]++;
        const it = (ar.it ??= {});
        for (const id of new Set(p.items.filter((x) => x > 0))) it[id] = (it[id] ?? 0) + 1;
        const mate = m.participants.find((x) => x !== p && x.subteam === p.subteam);
        if (mate) {
          const c = (ar.par[mate.championId] ??= { g: 0, w: 0, p: 0 });
          c.g++;
          if (p.win) c.w++;
          c.p += place;
        }
      }

      // Slot order first; replaced by the real purchase order if the timeline arrives later.
      const { legendaries, boots } = slotBuild(p.items);
      if (boots) bump(r.boots, String(boots), p.win);
      countBuild(r, legendaries, boots, p.win, 1);

      // Who plays this champion most (and best): a per-champion leaderboard.
      if (p.puuid && !p.puuid.startsWith('demo-rand') && p.gameName && !this.isHidden(p.puuid)) {
        const pl = (r.pl ??= {});
        const e = (pl[p.puuid] ??= { n: p.gameName, t: p.tagLine, pf: getPlatform(m.id.split('_')[0].toLowerCase())?.id ?? 'euw1', g: 0, w: 0, k: 0, d: 0, a: 0 });
        e.n = p.gameName;
        e.t = p.tagLine;
        e.g++;
        if (p.win) e.w++;
        e.k += p.kills;
        e.d += p.deaths;
        e.a += p.assists;
        if (Object.keys(pl).length > 400) r.pl = Object.fromEntries(Object.entries(pl).sort((x, y) => y[1].g - x[1].g).slice(0, 200));
      }

      if (!aram) {
        const partner = m.participants.find((x) => x.teamId === p.teamId && x.position === PARTNER[p.position]);
        if (partner) bump((r.duo ??= {}), String(partner.championId), p.win);
        const opp = m.participants.find((x) => x.teamId !== p.teamId && x.position === p.position);
        if (opp) {
          const v = (r.vs[opp.championId] ??= { g: 0, w: 0, gd: 0, gn: 0 });
          v.g++;
          if (p.win) v.w++;
          const mu = ((r.mu ??= {})[opp.championId] ??= newMatchup());
          mu.k += p.kills;
          mu.d += p.deaths;
          mu.a += p.assists;
          if (p.runes?.primary?.length) {
            bump(mu.runes, `${p.primaryStyle}:${p.runes.primary.join(',')}|${p.secondaryStyle}:${p.runes.secondary.join(',')}|${p.runes.shards.join(',')}`, p.win);
          }
          bump(mu.spells, [...p.spells].sort((x, y) => x - y).join(','), p.win);
          if (boots) bump(mu.boots, String(boots), p.win);
          countBuild(mu, legendaries, boots, p.win, 1);
        }
      }
    }
  }

  addTimeline(m: MatchSummary, tl: MatchTimeline) {
    if (this.seenTl.has(m.id) || !this.seen.has(m.id)) return;
    const g = this.group(m, false);
    if (!g) return;
    this.seenTl.add(m.id);
    this.laneDone.add(m.id);
    this.dirty = true;
    const aram = m.queueId === 450;
    const f15 = tl.frames[15];

    m.participants.forEach((p) => {
      if (!aram && !p.position) return;
      const i = tl.puuids.indexOf(p.puuid);
      if (i < 0) return;
      const r = this.role(g, p.championId, aram ? 'ALL' : p.position);
      r.tl++;

      const laneOpp = aram ? undefined : m.participants.find((x) => x.teamId !== p.teamId && x.position === p.position);
      const mu = laneOpp ? r.mu?.[laneOpp.championId] : undefined;

      const { legendaries: bySlot, boots } = slotBuild(p.items);
      const byPurchase = purchaseBuild(p.items, tl.items[i] ?? []);
      if (byPurchase.length === bySlot.length && byPurchase.join() !== bySlot.join()) {
        for (const t of mu ? [r, mu] : [r]) {
          countBuild(t, bySlot, boots, p.win, -1);
          countBuild(t, byPurchase, boots, p.win, 1);
        }
      }

      const start = (tl.items[i] ?? []).filter((it) => it.t <= 60 && !it.sold && itemKind(it.itemId) === 'starter').map((it) => it.itemId);
      if (start.length) {
        const key = start.sort((x, y) => x - y).join(',');
        bump(r.start, key, p.win);
        if (mu) bump(mu.start, key, p.win);
      }

      const skills = tl.skills[i] ?? [];
      skills.slice(0, 18).forEach((slot, lvl) => {
        if (slot >= 1 && slot <= 4) r.lv[lvl][slot - 1]++;
      });
      const counts = [0, 0, 0];
      const maxedAt: number[] = [99, 99, 99];
      skills.forEach((slot, lvl) => {
        if (slot <= 3 && ++counts[slot - 1] === 5) maxedAt[slot - 1] = lvl;
      });
      if (skills.length >= 9) {
        const order = [0, 1, 2].sort((x, y) => maxedAt[x] - maxedAt[y] || counts[y] - counts[x]).map((x) => KEYS[x]).join('');
        bump(r.max, order, p.win);
      }

      if (!aram && f15) {
        const opp = m.participants.find((x) => x.teamId !== p.teamId && x.position === p.position);
        const j = opp ? tl.puuids.indexOf(opp.puuid) : -1;
        if (opp && j >= 0) {
          const v = r.vs[opp.championId];
          if (v) {
            v.gd += f15.gold[i] - f15.gold[j];
            v.cd = (v.cd ?? 0) + (f15.cs[i] - f15.cs[j]);
            v.xd = (v.xd ?? 0) + (f15.xp[i] - f15.xp[j]);
            v.gn++;
            addLaneLeads(v, tl, i, j);
          }
        }
      }
    });
  }

  private patches(group: StatsGroup) {
    return Object.keys(this.s.patches)
      .filter((p) => this.s.patches[p][group]?.matches)
      .sort(patchCmp);
  }

  /** High-elo averages for a role (all champions), or one champion in that role, on the latest patch. */
  benchmarks(role: string, championId?: number): Benchmark {
    const pt = this.patches('ranked')[0] ?? null;
    const g = pt ? this.s.patches[pt].ranked : undefined;
    const t = { g: 0, w: 0, k: 0, d: 0, a: 0, cs: 0, dmg: 0, gold: 0, min: 0 };
    for (const [id, c] of Object.entries(g?.champs ?? {})) {
      if (championId && Number(id) !== championId) continue;
      const r = c.roles[role];
      if (!r) continue;
      t.g += r.g;
      t.w += r.w;
      t.k += r.k;
      t.d += r.d;
      t.a += r.a;
      t.cs += r.cs;
      t.dmg += r.dmg;
      t.gold += r.gold;
      t.min += r.min;
    }
    return {
      role,
      championId: championId ?? null,
      patch: pt,
      games: t.g,
      avg:
        t.g && t.min
          ? { kills: t.k / t.g, deaths: t.d / t.g, assists: t.a / t.g, csPerMin: t.cs / t.min, damagePerMin: t.dmg / t.min, goldPerMin: t.gold / t.min, winRate: t.w / t.g }
          : null,
    };
  }

  tierList(group: StatsGroup, patch?: string): TierList {
    const patches = this.patches(group);
    const pt = patch && patches.includes(patch) ? patch : (patches[0] ?? null);
    const g = pt ? this.s.patches[pt][group] : undefined;
    const rows = g ? this.rows(g) : [];
    const prevPatch = pt ? patches[patches.indexOf(pt) + 1] : undefined;
    const prev = prevPatch ? this.s.patches[prevPatch][group] : undefined;
    const prevRows = prev ? this.rows(prev) : [];
    // Each row carries last patch's win rate when both samples are big enough to compare.
    const before = new Map(prevRows.map((r) => [`${r.championId}:${r.role}`, r]));
    const minCompare = Math.max(50, Math.round((g?.matches ?? 0) * 0.008));
    for (const r of rows) {
      const p = before.get(`${r.championId}:${r.role}`);
      if (p && p.games >= minCompare && r.games >= minCompare) {
        r.prevWinRate = p.winRate;
        r.prevGames = p.games;
      }
    }
    return { group, patch: pt, patches, matches: g?.matches ?? 0, rows, collecting: this.collecting, movers: g && prev ? movers(rows, prevRows, prevPatch!) : null };
  }

  /**
   * Safe blind picks for a role: rank champions by their three worst lane matchups (a cautious
   * estimate of each: shrunk win rate minus about one standard error, enough games each), so a first pick with no hard counters rises above one that wins a
   * lot on average but gets crushed by a few champions.
   */
  blindPicks(role: string, limit = 8): BlindPicks {
    const patch = this.patches('ranked')[0] ?? null;
    const g = patch ? this.s.patches[patch].ranked : undefined;
    if (!g) return { patch, role, picks: [] };
    const minGames = Math.max(20, Math.round(g.matches * 0.005));
    const picks: BlindPicks['picks'] = [];
    for (const [id, c] of Object.entries(g.champs)) {
      const r = c.roles[role];
      // Safe but losing isn't a good first pick: the champion has to hold its own overall too.
      if (!r || r.g < minGames || shrunk(r.w, r.g, 150) < 0.49) continue;
      const min = matchupMin(r.g);
      const mus = Object.entries(r.vs)
        .filter(([, v]) => v.g >= min)
        // Pessimistic: the shrunk rate minus about one standard error, so a matchup seen 10 times
        // can't look safe just because there's too little data to show it's bad.
        .map(([opp, v]) => ({ championId: Number(opp), games: v.g, winRate: v.w / v.g, adj: shrunk(v.w, v.g, MATCHUP_K) - 0.5 / Math.sqrt(v.g + MATCHUP_K) }))
        .sort((x, y) => x.adj - y.adj);
      if (mus.length < 5) continue;
      const floor = (mus[0].adj + mus[1].adj + mus[2].adj) / 3;
      picks.push({ championId: Number(id), games: r.g, winRate: r.w / r.g, floor, matchups: mus.length, worst: { championId: mus[0].championId, games: mus[0].games, winRate: mus[0].winRate } });
    }
    picks.sort((x, y) => y.floor - x.floor);
    return { patch, role, picks: picks.slice(0, limit) };
  }

  private rows(g: GroupAgg): TierRow[] {
    const rows: TierRow[] = [];
    // Below ~0.5% of games a win rate is mostly noise (40 games at 66% is common luck).
    const minGames = Math.max(20, Math.round(g.matches * 0.005));
    for (const [id, c] of Object.entries(g.champs)) {
      const total = Object.values(c.roles).reduce((s, r) => s + r.g, 0);
      for (const [role, r] of Object.entries(c.roles)) {
        if (r.g < 2 || (role !== 'ALL' && r.g < total * 0.08)) continue;
        rows.push({
          championId: Number(id),
          role,
          games: r.g,
          winRate: r.w / r.g,
          pickRate: r.g / Math.max(1, g.matches),
          banRate: c.bans / Math.max(1, g.matches),
          tier: 'C',
          rank: 0,
          lowSample: r.g < minGames,
          ...(role === 'ALL' ? { counters: [], countersSure: 0 } : (({ ids, sure }) => ({ counters: ids, countersSure: sure }))(countersOf(r))),
          ...(r.ar && r.ar.pl.some((n) => n > 0) ? { avgPlacement: r.ar.pl.reduce((s, n, i) => s + n * (i + 1), 0) / r.ar.pl.reduce((s, n) => s + n, 0) } : {}),
        });
      }
    }
    // Shrink win rate towards 50% as if every champion had 150 extra games at exactly 50%, then
    // take off about one standard error (a cautious estimate), so a small lucky sample can't
    // outrank a large solid one (54 games at 68% used to reach S+). Popularity counts a little.
    const score = (r: TierRow) =>
      ((r.winRate * r.games + 0.5 * 150) / (r.games + 150) - 0.5 - 0.5 / Math.sqrt(r.games + 150)) * 100 + Math.log10(1 + r.pickRate * 100) * 2;
    const byRole = new Map<string, TierRow[]>();
    for (const r of rows) byRole.set(r.role, [...(byRole.get(r.role) ?? []), r]);
    for (const list of byRole.values()) {
      list.sort((a, b) => score(b) - score(a));
      list.forEach((r, i) => {
        const q = i / Math.max(1, list.length);
        r.rank = i + 1;
        r.tier = q < 0.06 ? 'S+' : q < 0.18 ? 'S' : q < 0.4 ? 'A' : q < 0.65 ? 'B' : q < 0.85 ? 'C' : 'D';
        // Too few games to rank: no tier at all rather than a guess (it still has a place in the list).
        if (r.lowSample) r.tier = '–';
      });
    }
    return rows;
  }

  matchup(championId: number, opponentId: number, group: StatsGroup, role?: string, patch?: string): MatchupStats {
    const patches = this.patches(group);
    const pt = patch && patches.includes(patch) ? patch : (patches[0] ?? null);
    const g = pt ? this.s.patches[pt][group] : undefined;
    const c = g?.champs[championId];
    const roles = Object.entries(c?.roles ?? {})
      .map(([r, a]) => ({ role: r, games: a.vs[opponentId]?.g ?? 0 }))
      .filter((r) => r.games > 0)
      .sort((a, b) => b.games - a.games);
    const chosen = role && roles.some((r) => r.role === role) ? role : (roles[0]?.role ?? role ?? 'MIDDLE');
    const r = c?.roles[chosen];
    const v = r?.vs[opponentId];
    const mu = r?.mu?.[opponentId];
    const rated = (x: C): Rated => ({ games: x.g, winRate: x.w / Math.max(1, x.g) });
    const top = (m: Record<string, C> | undefined, n: number) => Object.entries(m ?? {}).sort((a, b) => b[1].g - a[1].g).slice(0, n);
    const ids = (k: string) => k.split(',').map(Number);
    const sum = (m: Record<string, C> | undefined) => Object.values(m ?? {}).reduce((n, x) => n + x.g, 0);
    const out: MatchupStats = {
      championId,
      opponentId,
      group,
      patch: pt,
      patches,
      role: chosen,
      roles,
      games: v?.g ?? 0,
      winRate: v && v.g ? v.w / v.g : 0,
      adjusted: v ? shrunk(v.w, v.g) : 0.5,
      kda: mu && v?.g ? { kills: mu.k / v.g, deaths: mu.d / v.g, assists: mu.a / v.g } : null,
      goldDiff15: v?.gn ? v.gd / v.gn : null,
      csDiff15: v?.gn && v.cd != null ? v.cd / v.gn : null,
      xpDiff15: v?.gn && v.xd != null ? v.xd / v.gn : null,
      lane:
        v?.ld && v.ln && v.ln >= MATCHUP_LANE_MIN
          ? { minutes: LANE_MINUTES, gold: v.ld.slice(0, 3).map((x) => x / v.ln!), cs: v.ld.slice(3).map((x) => x / v.ln!), games: v.ln }
          : null,
      baseline: r?.g ? rated(r) : null,
      history: [...patches].reverse().flatMap((p) => {
        const x = this.s.patches[p]?.[group]?.champs[championId]?.roles[chosen]?.vs[opponentId];
        return x && x.g ? [{ patch: p, ...rated(x) }] : [];
      }),
      others: Object.entries(r?.vs ?? {})
        .filter(([id]) => Number(id) !== opponentId)
        .sort((a, b) => b[1].g - a[1].g)
        .slice(0, 12)
        .map(([id, x]) => ({ ...rated(x), championId: Number(id) })),
      runes: mu ? runeVariations(mu.runes) : [],
      spells: top(mu?.spells, 2).map(([k, x]) => ({ ...rated(x), ids: ids(k) })),
      starting: top(mu?.start, 2).map(([k, x]) => ({ ...rated(x), ids: ids(k) })),
      core: top(mu?.core, 5).map(([k, x]) => ({ ...rated(x), ids: ids(k) })),
      builds: mu ? buildVariations(mu) : [],
      boots: top(mu?.boots, 3).map(([k, x]) => ({ ...rated(x), id: Number(k) })),
      later: (['s4', 's5', 's6'] as const).map((key, i) => ({ slot: i + 4, total: sum(mu?.[key]), options: top(mu?.[key], 4).map(([k, x]) => ({ ...rated(x), id: Number(k) })) })),
      coreTotal: sum(mu?.core),
      bootsTotal: sum(mu?.boots),
    };
    return out;
  }

  champion(championId: number, group: StatsGroup, role?: string, patch?: string): ChampionStats {
    const patches = this.patches(group);
    const pt = patch && patches.includes(patch) ? patch : (patches[0] ?? null);
    const g = pt ? this.s.patches[pt][group] : undefined;
    const c = g?.champs[championId];
    const roleList = c ? Object.entries(c.roles).map(([r, a]) => ({ role: r, games: a.g })) : [];
    const total = roleList.reduce((s, r) => s + r.games, 0);
    const roles = roleList.filter((r) => r.games > 0).map((r) => ({ ...r, share: r.games / Math.max(1, total) })).sort((a, b) => b.games - a.games);
    const chosen = role && c?.roles[role] ? role : (roles[0]?.role ?? (group === 'ranked' ? 'MIDDLE' : 'ALL'));
    const r = c?.roles[chosen];

    const empty: ChampionStats = {
      championId,
      group,
      patch: pt,
      patches,
      matches: g?.matches ?? 0,
      role: chosen,
      roles,
      summary: null,
      avg: null,
      runes: [],
      spells: [],
      starting: [],
      core: [],
      builds: [],
      boots: [],
      later: [],
      coreTotal: 0,
      bootsTotal: 0,
      skills: { order: '', path: [], maxOrders: [], sample: 0 },
      matchups: [],
      byLength: [],
      synergy: null,
      players: [],
    };
    if (!g || !r || !r.g) return empty;

    const rated = (x: C): Rated => ({ games: x.g, winRate: x.w / Math.max(1, x.g) });
    const history = [...patches]
      .reverse()
      .flatMap((p) => {
        const gg = this.s.patches[p]?.[group];
        const rr = gg?.champs[championId]?.roles[chosen];
        return gg && rr && rr.g ? [{ patch: p, ...rated(rr), pickRate: rr.g / Math.max(1, gg.matches) }] : [];
      });
    // Options with almost no games behind them are noise; keep the most popular one regardless.
    const minG = Math.max(2, Math.round(r.g * 0.015));
    const top = (map: Record<string, C>, n: number) =>
      Object.entries(map)
        .sort((a, b) => b[1].g - a[1].g || b[1].w - a[1].w)
        .filter(([, v], i) => i === 0 || v.g >= minG)
        .slice(0, n);
    const ids = (k: string) => k.split(',').filter(Boolean).map(Number);

    const path = r.lv.map((counts) => {
      const max = Math.max(...counts);
      return max ? counts.indexOf(max) + 1 : 0;
    });
    const sample = r.tl;

    const out: ChampionStats = {
      ...empty,
      summary: this.rows(g).find((x) => x.championId === championId && x.role === chosen) ?? {
        // Played in this role too rarely to be ranked, but the games still count.
        championId,
        role: chosen,
        games: r.g,
        winRate: r.w / r.g,
        pickRate: r.g / Math.max(1, g.matches),
        banRate: c!.bans / Math.max(1, g.matches),
        tier: '–',
        rank: 0,
        lowSample: true,
      },
      avg: {
        kills: r.k / r.g,
        deaths: r.d / r.g,
        assists: r.a / r.g,
        csPerMin: r.cs / r.min,
        damagePerMin: r.dmg / r.min,
        goldPerMin: r.gold / r.min,
        minutes: r.min / r.g,
      },
      runes: runeVariations(r.runes),
      spells: top(r.spells, 2).map(([k, v]) => ({ ...rated(v), ids: ids(k) })),
      starting: top(r.start, 3).map(([k, v]) => ({ ...rated(v), ids: ids(k) })),
      core: top(r.core, 5).map(([k, v]) => ({ ...rated(v), ids: ids(k) })),
      builds: buildVariations(r),
      boots: top(r.boots, 3).map(([k, v]) => ({ ...rated(v), id: Number(k) })),
      later: (['s4', 's5', 's6'] as const).map((key, i) => ({
        slot: i + 4,
        total: Object.values(r[key]).reduce((n, v) => n + v.g, 0),
        options: top(r[key], 4).map(([k, v]) => ({ ...rated(v), id: Number(k) })),
      })),
      coreTotal: Object.values(r.core).reduce((n, v) => n + v.g, 0),
      bootsTotal: Object.values(r.boots).reduce((n, v) => n + v.g, 0),
      skills: { order: top(r.max, 1)[0]?.[0] ?? '', path: sample ? path.filter(Boolean) : [], maxOrders: top(r.max, 3).map(([k, v]) => ({ ...rated(v), order: k })), sample },
      matchups: Object.entries(r.vs)
        .map(([id, v]) => ({
          ...rated(v),
          championId: Number(id),
          adjusted: shrunk(v.w, v.g, MATCHUP_K),
          goldDiff15: v.gn ? v.gd / v.gn : null,
          csDiff15: v.gn && v.cd != null ? v.cd / v.gn : null,
          xpDiff15: v.gn && v.xd != null ? v.xd / v.gn : null,
        }))
        .sort((a, b) => b.games - a.games),
      byLength: r.len.map((x, i) => ({ ...rated(x), label: LENGTHS[i].label })),
      history,
      lane: chosen === 'ALL' ? null : laneOverall(r),
      synergy:
        r.duo && PARTNER[chosen]
          ? {
              role: PARTNER[chosen],
              list: Object.entries(r.duo)
                .filter(([, v]) => v.g >= Math.max(3, Math.round(r.g * 0.015)))
                .map(([id, v]) => ({ ...rated(v), championId: Number(id) }))
                .sort((a, b) => b.winRate - a.winRate)
                .slice(0, 6),
            }
          : null,
      players: Object.entries(r.pl ?? {})
        .filter(([puuid, e]) => e.g >= 3 && !this.isHidden(puuid))
        .map(([puuid, e]) => ({ ...e, ...(this.currentName(puuid) && { n: this.currentName(puuid)!.gameName, t: this.currentName(puuid)!.tagLine }) }))
        .map((e) => ({ gameName: e.n, tagLine: e.t, platform: e.pf, games: e.g, winRate: e.w / e.g, kda: (e.k + e.a) / Math.max(1, e.d) }))
        .sort((a, b) => b.games - a.games || b.winRate - a.winRate)
        .slice(0, 10),
      arena: r.ar ? arenaSummary(r.ar, r.g) : undefined,
    };
    // Riot policy: no win rates for Arena items (or augments). Arena has no runes or lanes either,
    // so the item, rune, spell and matchup breakdowns are simply not offered for Arena.
    if (group === 'arena') {
      Object.assign(out, { runes: [], spells: [], starting: [], core: [], builds: [], boots: [], later: [], coreTotal: 0, bootsTotal: 0, matchups: [], synergy: null });
    }
    return out;
  }

  /** Remove a player from every "who plays it most" list (they hid their profile). */
  forgetPlayer(puuid: string) {
    for (const groups of Object.values(this.s.patches))
      for (const g of Object.values(groups)) for (const c of Object.values(g!.champs)) for (const r of Object.values(c.roles)) if (r.pl?.[puuid]) delete r.pl[puuid];
    this.dirty = true;
  }

  flush() {
    if (!this.dirty || !this.file) return;
    this.dirty = false;
    // Trim long tails so the file stays small.
    for (const groups of Object.values(this.s.patches)) {
      for (const g of Object.values(groups)) {
        for (const c of Object.values(g!.champs)) {
          for (const r of Object.values(c.roles)) {
            if (r.pl && Object.keys(r.pl).length > 60) r.pl = Object.fromEntries(Object.entries(r.pl).sort((x, y) => y[1].g - x[1].g).slice(0, 50));
            for (const key of ['runes', 'core', 's4', 's5', 's6', 'start', 'spells', 'boots'] as const) {
              const entries = Object.entries(r[key]);
              if (entries.length > 60) r[key] = Object.fromEntries(entries.sort((a, b) => b[1].g - a[1].g).slice(0, 40));
            }
            if (r.bv) for (const k of Object.keys(r.bv)) if (!r.core[k]) delete r.bv[k];
            if (r.ar) {
              delete r.ar.aug;
              if (r.ar.it && Object.keys(r.ar.it).length > 60) r.ar.it = Object.fromEntries(Object.entries(r.ar.it).sort((a, b) => b[1] - a[1]).slice(0, 40));
              const par = Object.entries(r.ar.par);
              if (par.length > 80) r.ar.par = Object.fromEntries(par.sort((a, b) => b[1].g - a[1].g).slice(0, 60));
            }
            for (const mu of Object.values(r.mu ?? {})) {
              for (const key of ['runes', 'spells', 'start', 'core', 'boots', 's4', 's5', 's6'] as const) {
                const entries = Object.entries(mu[key]);
                if (entries.length > 24) mu[key] = Object.fromEntries(entries.sort((a, b) => b[1].g - a[1].g).slice(0, 16));
              }
              if (mu.bv) for (const k of Object.keys(mu.bv)) if (!mu.core[k]) delete mu.bv[k];
            }
          }
        }
      }
    }
    // Keep the four most recent patches.
    const keep = Object.keys(this.s.patches).sort(patchCmp).slice(0, 4);
    for (const p of Object.keys(this.s.patches)) if (!keep.includes(p)) delete this.s.patches[p];
    this.s.seen = [...this.seen].slice(-150_000);
    this.s.seenTl = [...this.seenTl].slice(-150_000);
    this.s.laneDone = [...this.laneDone].slice(-150_000);
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify(this.s));
    } catch (e) {
      console.warn('Could not save champion stats:', (e as Error).message);
    }
  }
}
