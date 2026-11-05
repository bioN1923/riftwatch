import fs from 'node:fs';
import path from 'node:path';
import type { ChampionStats, MatchSummary, MatchTimeline, MatchupStats, Rated, StatsGroup, TierList, TierRow } from '../shared/types';
import { itemKind } from './items';
import { getPlatform } from '../shared/regions';

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
}

/** Win rate pulled towards 50% for small samples, so one lucky game doesn't top a ranking. */
export const shrunk = (w: number, g: number, k = 10) => (w + 0.5 * k) / (g + k);

/** The opponents this role does worst against in lane (enough games, sorted by adjusted win rate). */
function countersOf(r: RoleAgg, n = 3) {
  const min = Math.max(3, Math.round(r.g * 0.02));
  return Object.entries(r.vs)
    .filter(([, v]) => v.g >= min)
    .sort((a, b) => shrunk(a[1].w, a[1].g) - shrunk(b[1].w, b[1].g))
    .slice(0, n)
    .filter(([, v]) => v.w / v.g < 0.5)
    .map(([id]) => Number(id));
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
}

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
}

const LENGTHS = [
  { label: 'Under 20 min', max: 20 },
  { label: '20–25 min', max: 25 },
  { label: '25–30 min', max: 30 },
  { label: '30–35 min', max: 35 },
  { label: '35+ min', max: Infinity },
];
const KEYS = ['Q', 'W', 'E'];

export const groupOf = (queueId: number): StatsGroup | null => (queueId === 420 || queueId === 440 ? 'ranked' : queueId === 450 ? 'aram' : null);
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

export class ChampionStatsStore {
  private s: Store = { v: 1, patches: {}, seen: [], seenTl: [] };
  private seen = new Set<string>();
  private seenTl = new Set<string>();
  private dirty = false;
  collecting = false;

  constructor(private file: string | null) {
    if (file) {
      try {
        this.s = JSON.parse(fs.readFileSync(file, 'utf8'));
        this.seen = new Set(this.s.seen);
        this.seenTl = new Set(this.s.seenTl);
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
    const aram = m.queueId === 450;
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

      // Slot order first; replaced by the real purchase order if the timeline arrives later.
      const { legendaries, boots } = slotBuild(p.items);
      if (boots) bump(r.boots, String(boots), p.win);
      countBuild(r, legendaries, boots, p.win, 1);

      // Who plays this champion most (and best): a per-champion leaderboard.
      if (p.puuid && !p.puuid.startsWith('demo-rand') && p.gameName) {
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

  tierList(group: StatsGroup, patch?: string): TierList {
    const patches = this.patches(group);
    const pt = patch && patches.includes(patch) ? patch : (patches[0] ?? null);
    const g = pt ? this.s.patches[pt][group] : undefined;
    return { group, patch: pt, patches, matches: g?.matches ?? 0, rows: g ? this.rows(g) : [], collecting: this.collecting };
  }

  private rows(g: GroupAgg): TierRow[] {
    const rows: TierRow[] = [];
    const minGames = Math.max(3, Math.round(g.matches * 0.002));
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
          counters: role === 'ALL' ? [] : countersOf(r),
        });
      }
    }
    // Shrink win rate towards 50% for small samples, then reward popularity a little.
    const score = (r: TierRow) => ((r.winRate * r.games + 0.5 * 40) / (r.games + 40) - 0.5) * 100 + Math.log10(1 + r.pickRate * 100) * 2;
    const byRole = new Map<string, TierRow[]>();
    for (const r of rows) byRole.set(r.role, [...(byRole.get(r.role) ?? []), r]);
    for (const list of byRole.values()) {
      list.sort((a, b) => score(b) - score(a));
      list.forEach((r, i) => {
        const q = i / Math.max(1, list.length);
        r.rank = i + 1;
        r.tier = q < 0.06 ? 'S+' : q < 0.18 ? 'S' : q < 0.4 ? 'A' : q < 0.65 ? 'B' : q < 0.85 ? 'C' : 'D';
        if (r.lowSample && (r.tier === 'S+' || r.tier === 'S')) r.tier = 'A';
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
      baseline: r?.g ? rated(r) : null,
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
    const chosen = role && c?.roles[role] ? role : (roles[0]?.role ?? (group === 'aram' ? 'ALL' : 'MIDDLE'));
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

    return {
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
          adjusted: shrunk(v.w, v.g),
          goldDiff15: v.gn ? v.gd / v.gn : null,
          csDiff15: v.gn && v.cd != null ? v.cd / v.gn : null,
          xpDiff15: v.gn && v.xd != null ? v.xd / v.gn : null,
        }))
        .sort((a, b) => b.games - a.games),
      byLength: r.len.map((x, i) => ({ ...rated(x), label: LENGTHS[i].label })),
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
      players: Object.values(r.pl ?? {})
        .filter((e) => e.g >= 3)
        .map((e) => ({ gameName: e.n, tagLine: e.t, platform: e.pf, games: e.g, winRate: e.w / e.g, kda: (e.k + e.a) / Math.max(1, e.d) }))
        .sort((a, b) => b.games - a.games || b.winRate - a.winRate)
        .slice(0, 10),
    };
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
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify(this.s));
    } catch (e) {
      console.warn('Could not save champion stats:', (e as Error).message);
    }
  }
}
