import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';
import type { StatsGroup, TierRow } from '../../shared/types';
import { api } from '../lib/api';
import { assets, champSlug, useStaticData } from '../lib/ddragon';
import { useRegion } from '../lib/storage';
import { pct, thousands } from '../lib/format';
import { GameImg } from '../components/ui/GameImg';
import { RoleIcon, ROLE_LABEL } from '../components/ui/RoleIcon';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { GroupToggle, PatchSelect, ROLE_TABS, RoleTab, TierBadge, WinRateBar } from '../components/champions/common';
import { SlidingIndicator } from '../components/ui/Motion';

type SortKey = 'rank' | 'name' | 'tier' | 'winRate' | 'pickRate' | 'banRate' | 'games';
const TIER_ORDER = { 'S+': 0, S: 1, A: 2, B: 3, C: 4, D: 5, '–': 6 };

export function ChampionsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const group: StatsGroup = params.get('queue') === 'aram' ? 'aram' : 'ranked';
  const role = group === 'aram' ? 'ALL' : (params.get('role') ?? 'ALL');
  const patch = params.get('patch') ?? undefined;
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'tier', dir: 1 });
  const { data: sd } = useStaticData();
  const a = assets(sd);

  useEffect(() => {
    document.title = 'Champion tier list — Riftwatch';
  }, []);

  const q = useQuery({
    queryKey: ['tierlist', group, patch],
    queryFn: ({ signal }) => api.tierList(group, patch, signal),
    staleTime: 60_000,
    refetchInterval: (query) => (query.state.data?.collecting ? 120_000 : false),
  });

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v === null) next.delete(k);
    else next.set(k, v);
    setParams(next, { replace: true });
  };

  const rows = useMemo(() => {
    const list = (q.data?.rows ?? []).filter((r) => role === 'ALL' || r.role === role);
    const needle = query.trim().toLowerCase();
    const named = list
      .map((r) => ({ ...r, name: a.champion(r.championId).name }))
      .filter((r) => !needle || r.name.toLowerCase().includes(needle));
    const val = (r: TierRow & { name: string }) =>
      sort.key === 'name' ? r.name : sort.key === 'tier' ? TIER_ORDER[r.tier] * 1000 + r.rank : sort.key === 'rank' ? r.rank : (r[sort.key] as number);
    return named.sort((x, y) => {
      const vx = val(x);
      const vy = val(y);
      const c = typeof vx === 'string' ? vx.localeCompare(vy as string) : (vx as number) - (vy as number);
      return c * sort.dir;
    });
  }, [q.data, role, query, sort, a]);

  const header = (key: SortKey, label: string, align: 'left' | 'right' = 'right', defaultDir: 1 | -1 = -1) => {
    const active = sort.key === key;
    return (
      <th scope="col" aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className={clsx('px-3 py-2 font-medium', align === 'right' ? 'text-right' : 'text-left')}>
        <button
          onClick={() => setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: defaultDir }))}
          className={clsx('inline-flex items-center gap-1 hover:text-text', active && 'text-text')}
        >
          {label}
          {active && (sort.dir === 1 ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />)}
        </button>
      </th>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">Champion tier list</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {q.data && q.data.matches > 0 ? (
              <>
                Built from <span className="num font-semibold text-text">{thousands(q.data.matches)}</span> {group === 'aram' ? 'ARAM' : 'ranked'} games this server has read
                {q.data.patch ? ` on patch ${q.data.patch}` : ''}. Tiers weigh win rate against how often a champion is played.
              </>
            ) : (
              'Win, pick and ban rates from games this server has read.'
            )}
            {q.data?.collecting && (
              <span className="ml-2 inline-flex items-center gap-1.5 text-win">
                <span className="live-dot size-1.5 rounded-full bg-win" aria-hidden /> Collecting new games
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PatchSelect patches={q.data?.patches ?? []} value={q.data?.patch ?? null} onChange={(p) => set('patch', p)} />
          <GroupToggle value={group} onChange={(g) => set('queue', g === 'ranked' ? null : g)} />
        </div>
      </div>

      <FreeRotation />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-line">
        {group === 'ranked' ? (
          <div role="tablist" aria-label="Role" className="relative flex gap-5 overflow-x-auto">
            <SlidingIndicator />
            {ROLE_TABS.map((t) => (
              <RoleTab key={t.id} role={t.id} active={role === t.id} onClick={() => set('role', t.id === 'ALL' ? null : t.id)}>
                {t.label}
              </RoleTab>
            ))}
          </div>
        ) : (
          <span />
        )}
        <label className="relative mb-2 flex items-center">
          <span className="sr-only">Filter champions</span>
          <Search className="pointer-events-none absolute left-2.5 size-4 text-faint" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter champions"
            className="h-9 w-56 rounded border border-line bg-surface pl-8 pr-3 text-sm outline-none placeholder:text-faint focus:border-gold"
          />
        </label>
      </div>

      {q.isPending ? (
        <div className="mt-4 space-y-1.5">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : q.isError ? (
        <div className="mt-6">
          <ErrorState error={q.error} />
        </div>
      ) : rows.length === 0 ? (
        <div className="panel mt-6">
          <EmptyState title={q.data.matches ? 'No champions match that filter' : 'No games collected yet'}>
            {q.data.matches
              ? 'Try another name or role.'
              : q.data.collecting
                ? 'The server is reading high-elo ranked games in the background. Stats appear here within a few minutes and fill in over the next hours.'
                : 'Champion stats come from games this server reads. Open some player profiles, or turn on the match collector (CRAWLER=true in .env).'}
          </EmptyState>
        </div>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">Champion tier list, sortable by column</caption>
            <thead className="text-xs text-muted">
              <tr>
                {header('rank', '#', 'left', 1)}
                {header('name', 'Champion', 'left', 1)}
                {role === 'ALL' && group === 'ranked' && (
                  <th scope="col" className="px-3 py-2 text-left font-medium">
                    Role
                  </th>
                )}
                {header('tier', 'Tier', 'left', 1)}
                {header('winRate', 'Win rate')}
                {header('pickRate', 'Pick rate')}
                {header('banRate', 'Ban rate')}
                {header('games', 'Games')}
                {group === 'ranked' && (
                  <th scope="col" className="hidden px-3 py-2 text-left font-medium xl:table-cell">
                    Weak against
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const c = a.champion(r.championId);
                const champ = sd?.champions.get(r.championId);
                const href = champ ? `/champions/${champSlug(champ.id)}${group === 'aram' ? '?queue=aram' : r.role !== 'ALL' ? `?role=${r.role}` : ''}` : '#';
                return (
                  <tr
                    key={`${r.championId}-${r.role}`}
                    onClick={() => navigate(href)}
                    className="fade-up group cursor-pointer border-t border-line transition-colors hover:bg-raised"
                    style={{ animationDelay: `${Math.min(i, 16) * 22}ms` }}
                  >
                    <td className="num w-10 px-3 py-2 text-muted">{role === 'ALL' && sort.key === 'tier' ? i + 1 : r.rank}</td>
                    <td className="px-3 py-2">
                      <Link to={href} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3 font-medium">
                        <GameImg src={c.url} alt="" size={34} rounded="md" />
                        <span className="group-hover:text-gold">{c.name}</span>
                      </Link>
                    </td>
                    {role === 'ALL' && group === 'ranked' && (
                      <td className="px-3 py-2 text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <RoleIcon role={r.role} size={15} />
                          {ROLE_LABEL[r.role]}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-2">
                      <TierBadge tier={r.tier} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="inline-flex items-center gap-2.5">
                        <WinRateBar value={r.winRate} />
                        <span className={clsx('num w-12 font-semibold', r.winRate >= 0.5 ? 'text-text' : 'text-muted')}>{pct(r.winRate, 1)}</span>
                      </span>
                    </td>
                    <td className="num px-3 py-2 text-right text-muted">{pct(r.pickRate, 1)}</td>
                    <td className="num px-3 py-2 text-right text-muted">{pct(r.banRate, 1)}</td>
                    <td className="num px-3 py-2 text-right text-muted">
                      {thousands(r.games)}
                      {r.lowSample && (
                        <span className="ml-1 text-faint" title="Small sample: treat with care">
                          *
                        </span>
                      )}
                    </td>
                    {group === 'ranked' && (
                      <td className="hidden px-3 py-2 xl:table-cell">
                        {r.counters?.length ? (
                          <span className="flex gap-1">
                            {r.counters.map((cid) => {
                              const cc = a.champion(cid);
                              const cslug = sd?.champions.get(cid)?.id;
                              return (
                                <Link key={cid} to={cslug ? `/champions/${champSlug(cslug)}?role=${r.role}` : '#'} onClick={(e) => e.stopPropagation()} className="rounded-[5px] ring-1 ring-loss/40 transition hover:ring-loss">
                                  <GameImg src={cc.url} alt={`Weak against ${cc.name}`} size={26} rounded="md" tip={cc.name} />
                                </Link>
                              );
                            })}
                          </span>
                        ) : (
                          <span className="text-xs text-faint">–</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.some((r) => r.lowSample) && <p className="mt-3 text-xs text-faint">* Small sample — these numbers will move as more games come in.</p>}
        </div>
      )}
    </div>
  );
}

/** This week's free champions on the selected region. */
function FreeRotation() {
  const [region] = useRegion();
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const q = useQuery({ queryKey: ['rotation', region], queryFn: ({ signal }) => api.rotation(region, signal), staleTime: 60 * 60_000, retry: false });
  const ids = q.data?.championIds ?? [];
  if (!ids.length) return null;
  return (
    <section aria-labelledby="rot-h" className="mt-6">
      <h2 id="rot-h" className="mb-2 text-xs font-medium text-muted">
        Free to play this week
      </h2>
      <ul className="flex flex-wrap gap-1.5">
        {ids.map((id, i) => {
          const c = sd?.champions.get(id);
          return (
            <li key={id} className="fade-up" style={{ animationDelay: `${i * 15}ms` }}>
              <Link to={c ? `/champions/${champSlug(c.id)}` : '#'} className="block rounded-[5px] ring-1 ring-line transition hover:-translate-y-0.5 hover:ring-gold">
                <GameImg src={a.champion(id).url} alt={a.champion(id).name} size={34} rounded="md" tip={a.champion(id).name} />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
