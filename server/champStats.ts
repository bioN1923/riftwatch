import fs from 'node:fs';
import path from 'node:path';
import type { ChampionStats, MatchSummary, MatchTimeline, Rated, StatsGroup, TierList, TierRow } from '../shared/types';
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
  pl?: Record<string, { n: string; t: string; pf: string; g: number; w: number; k: number; d: number; a: number }>;
}

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

function bump(map: Record<string, C>, key: string, win: boolean) {
  const c = (map[key] ??= { g: 0, w: 0 });
  c.g++;
  if (win) c.w++;
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

      // Items fill the first free slot, so slot order is close to purchase order.
      const legendaries = p.items.slice(0, 6).filter((id) => itemKind(id) === 'legendary');
      const boots = p.items.slice(0, 6).find((id) => itemKind(id) === 'boots');
      if (boots) bump(r.boots, String(boots), p.win);
      if (legendaries.length >= 3) bump(r.core, legendaries.slice(0, 3).join(','), p.win);
      if (legendaries[3]) bump(r.s4, String(legendaries[3]), p.win);
      if (legendaries[4]) bump(r.s5, String(legendaries[4]), p.win);
      if (legendaries[5]) bump(r.s6, String(legendaries[5]), p.win);

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

      const start = (tl.items[i] ?? []).filter((it) => it.t <= 60 && !it.sold && itemKind(it.itemId) === 'starter').map((it) => it.itemId);
      if (start.length) bump(r.start, start.sort((x, y) => x - y).join(','), p.win);

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
      boots: [],
      later: [],
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
      summary: this.rows(g).find((x) => x.championId === championId && x.role === chosen) ?? null,
      avg: {
        kills: r.k / r.g,
        deaths: r.d / r.g,
        assists: r.a / r.g,
        csPerMin: r.cs / r.min,
        damagePerMin: r.dmg / r.min,
        goldPerMin: r.gold / r.min,
        minutes: r.min / r.g,
      },
      runes: top(r.runes, 3).map(([k, v]) => {
        const [pri, sec, shards] = k.split('|');
        const [ps, pl] = pri.split(':');
        const [ss, sl] = sec.split(':');
        return { ...rated(v), primaryStyle: Number(ps), primary: ids(pl), secondaryStyle: Number(ss), secondary: ids(sl), shards: ids(shards) };
      }),
      spells: top(r.spells, 2).map(([k, v]) => ({ ...rated(v), ids: ids(k) })),
      starting: top(r.start, 3).map(([k, v]) => ({ ...rated(v), ids: ids(k) })),
      core: top(r.core, 5).map(([k, v]) => ({ ...rated(v), ids: ids(k) })),
      boots: top(r.boots, 3).map(([k, v]) => ({ ...rated(v), id: Number(k) })),
      later: (['s4', 's5', 's6'] as const).map((key, i) => ({ slot: i + 4, options: top(r[key], 4).map(([k, v]) => ({ ...rated(v), id: Number(k) })) })).filter((x) => x.options.length),
      skills: { order: top(r.max, 1)[0]?.[0] ?? '', path: sample ? path.filter(Boolean) : [], maxOrders: top(r.max, 3).map(([k, v]) => ({ ...rated(v), order: k })), sample },
      matchups: Object.entries(r.vs)
        .map(([id, v]) => ({ ...rated(v), championId: Number(id), goldDiff15: v.gn ? v.gd / v.gn : null }))
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
