import { RecentChampList } from '../components/champions/RecentChamps';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { keepWhile } from '../lib/keepWhile';
import clsx from 'clsx';
import { PatchMovers } from '../components/champions/PatchMovers';
import { PatchDelta } from '../components/ui/PatchDelta';
import { ArrowDown, ArrowUp, Search, Star, Swords, Package } from 'lucide-react';
import type { StatsGroup, TierRow } from '../../shared/types';
import { api } from '../lib/api';
import { assets, champSlug, useStaticData, matchupPath } from '../lib/ddragon';
import { clearRecentChamps, useRecentChamps, useRegion } from '../lib/storage';
import { decimal, pct, thousands } from '../lib/format';
import { GameImg } from '../components/ui/GameImg';
import { RoleIcon, ROLE_LABEL } from '../components/ui/RoleIcon';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { GroupToggle, PatchSelect, ROLE_TABS, RoleTab, TierBadge, WinRateBar } from '../components/champions/common';
import { SlidingIndicator } from '../components/ui/Motion';
import { t } from '../i18n';
import { champHit } from '../lib/champSearch';
import { readPools } from '../lib/pool';

type SortKey = 'rank' | 'name' | 'tier' | 'winRate' | 'pickRate' | 'banRate' | 'games' | 'avgPlacement';
const TIER_ORDER = { 'S+': 0, S: 1, A: 2, B: 3, C: 4, D: 5, '–': 6 };

export function ChampionsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const queue = params.get('queue');
  const group: StatsGroup = queue === 'aram' || queue === 'arena' ? queue : 'ranked';
  const role = group !== 'ranked' ? 'ALL' : (params.get('role') ?? 'ALL');
  const patch = params.get('patch') ?? undefined;
  const [query, setQuery] = useState('');
  // The champions the player saved in the draft helper, per role; only on ranked, where roles exist.
  const [pools] = useState(readPools);
  const [onlyPool, setOnlyPool] = useState(false);
  const inPool = (r: TierRow) => !!sd && !!pools.get(r.role)?.has(champSlug(sd.champions.get(r.championId)?.id ?? ''));
  const showPool = group === 'ranked' && pools.size > 0;
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'tier', dir: 1 });
  const { data: sd } = useStaticData();
  const a = assets(sd);

  useEffect(() => {
    document.title = t('tl.title');
  }, []);

  const tlKey = ['tierlist', group, patch] as const;
  const q = useQuery({
    queryKey: tlKey,
    // A patch switch keeps the list on screen (dimmed) until the new one arrives.
    placeholderData: keepWhile(tlKey, 1),
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
    const needle = query.trim();
    const named = list
      .map((r) => ({ ...r, name: a.champion(r.championId).name }))
      .filter((r) => !needle || champHit(needle, { id: sd?.champions.get(r.championId)?.id ?? r.name, name: r.name }) != null)
      .filter((r) => !(showPool && onlyPool) || inPool(r));
    const val = (r: TierRow & { name: string }) =>
      sort.key === 'name' ? r.name : sort.key === 'tier' ? TIER_ORDER[r.tier] * 1000 + r.rank : sort.key === 'rank' ? r.rank : ((r[sort.key] as number | undefined) ?? 9);
    // Sorting by a rate puts small samples after the rest: 66.7% over 36 games shouldn't top the list.
    const rated = sort.key === 'winRate' || sort.key === 'pickRate' || sort.key === 'banRate' || sort.key === 'avgPlacement';
    return named.sort((x, y) => {
      if (rated && !!x.lowSample !== !!y.lowSample) return x.lowSample ? 1 : -1;
      const vx = val(x);
      const vy = val(y);
      const c = typeof vx === 'string' ? vx.localeCompare(vy as string) : (vx as number) - (vy as number);
      return c * sort.dir;
    });
  }, [q.data, role, query, sort, a, onlyPool, showPool, sd]); // eslint-disable-line react-hooks/exhaustive-deps

  // Arena: average place is the number players read first. Bans: a column of 0.0% only when a mode
  // (or the games read so far) records none, so it's left out then.
  const arenaCols = group === 'arena' && (q.data?.rows ?? []).some((r) => r.avgPlacement != null);
  const showBans = (q.data?.rows ?? []).some((r) => r.banRate > 0);
  const header = (key: SortKey, label: string, align: 'left' | 'right' = 'right', defaultDir: 1 | -1 = -1, extra?: string) => {
    const active = sort.key === key;
    return (
      <th scope="col" aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className={clsx('px-3 py-2 font-medium', align === 'right' ? 'text-right' : 'text-left', extra)}>
        <button
          onClick={() => setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: defaultDir }))}
          className={clsx('-my-1 inline-flex min-h-[24px] min-w-[24px] items-center gap-1 py-1 hover:text-text', active && 'text-text')}
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
          <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">{t('tl.heading')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {q.data && q.data.matches > 0 ? (
              t.rich(group === 'arena' ? (q.data.patch ? 'tl.builtFromArenaPatch' : 'tl.builtFromArena') : group === 'aram' ? (q.data.patch ? 'tl.builtFromAramPatch' : 'tl.builtFromAram') : q.data.patch ? 'tl.builtFromRankedPatch' : 'tl.builtFromRanked', {
                count: <span className="num font-semibold text-text">{thousands(q.data.matches)}</span>,
                patch: q.data.patch ?? '',
              })
            ) : (
              t('tl.noData')
            )}
            {q.data?.collecting && (
              <span className="ml-2 inline-flex items-center gap-1.5 text-win">
                <span className="live-dot size-1.5 rounded-full bg-win" aria-hidden /> {t('tl.collecting')}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/draft" className="inline-flex h-9 items-center gap-1.5 rounded border border-line px-3 text-sm font-medium text-muted transition-colors hover:border-gold/60 hover:text-text">
            <Swords className="size-3.5" aria-hidden /> {t('nav.draft')}
          </Link>
          <Link to="/items" className="inline-flex h-9 items-center gap-1.5 rounded border border-line px-3 text-sm font-medium text-muted transition-colors hover:border-gold/60 hover:text-text">
            <Package className="size-3.5" aria-hidden /> {t('it.heading')}
          </Link>
          <PatchSelect patches={q.data?.patches ?? []} value={q.data?.patch ?? null} onChange={(p) => set('patch', p)} />
          <GroupToggle value={group} onChange={(g) => set('queue', g === 'ranked' ? null : g)} />
        </div>
      </div>

      <RecentChamps group={group} />
      <FreeRotation />
      {q.data && <PatchMovers data={q.data} role={role} group={group} />}

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-line">
        {group === 'ranked' ? (
          <div role="tablist" aria-label={t('tl.role')} className="relative flex gap-5 overflow-x-auto overflow-y-hidden">
            <SlidingIndicator />
            {ROLE_TABS.map((tab) => (
              <RoleTab key={tab.id} role={tab.id} active={role === tab.id} onClick={() => set('role', tab.id === 'ALL' ? null : tab.id)}>
                {tab.label}
              </RoleTab>
            ))}
          </div>
        ) : (
          <span />
        )}
        <div className="mb-2 flex items-center gap-2">
        {showPool && (
          <button
            type="button"
            aria-pressed={onlyPool}
            onClick={() => setOnlyPool((v) => !v)}
            title={t('tl.myPoolHint')}
            className={clsx(
              'flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded border px-3 text-sm font-medium transition-colors',
              onlyPool ? 'border-gold bg-gold/10 text-gold' : 'border-line text-muted hover:text-text',
            )}
          >
            <Star className={clsx('size-3.5', onlyPool && 'fill-current')} aria-hidden />
            {t('tl.myPool')}
          </button>
        )}
        <label className="relative flex items-center">
          <span className="sr-only">{t('tl.filter')}</span>
          <Search className="pointer-events-none absolute left-2.5 size-4 text-faint" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('tl.filter')}
            className="h-9 w-56 rounded border border-line bg-surface pl-8 pr-3 text-sm outline-none placeholder:text-faint focus:border-gold focus:ring-2 focus:ring-gold/50"
          />
        </label>
        </div>
      </div>

      {q.isPending ? (
        <div className="mt-4 space-y-1.5">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : q.isError ? (
        <div className="mt-6">
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        </div>
      ) : rows.length === 0 ? (
        <div className="panel mt-6">
          <EmptyState title={q.data.matches ? t('tl.noMatch') : t('tl.noGames')}>
            {q.data.matches ? t('tl.noMatchBody') : group === 'arena' ? t('tl.collectingArena') : q.data.collecting ? t('tl.collectingBody') : t('tl.noGamesBody')}
          </EmptyState>
        </div>
      ) : (
        <div className={clsx('mt-2 overflow-x-auto transition-opacity duration-200', q.isPlaceholderData && 'pointer-events-none opacity-60')} aria-busy={q.isPlaceholderData}>
          {rows.every((x) => x.lowSample) && (
            <p className="mb-2 rounded border border-line bg-surface px-3 py-2 text-sm text-muted" role="note">
              {t('tl.earlyData', { count: q.data.matches })}
            </p>
          )}
          {(sort.key === 'winRate' || sort.key === 'pickRate' || sort.key === 'banRate') && rows.some((x) => x.lowSample) && (
            <p className="px-3 pb-1 text-xs text-faint">{t('tl.smallLast')}</p>
          )}
          {/* Phones: champion, tier and win rate only (role shows as an icon by the name); the rest from sm up. */}
          <table className="w-full text-sm sm:min-w-[720px]">
            <caption className="sr-only">{t('tl.caption')}</caption>
            <thead className="text-xs text-muted">
              <tr>
                {header('rank', '#', 'left', 1)}
                {header('name', t('tl.col.champion'), 'left', 1)}
                {role === 'ALL' && group === 'ranked' && (
                  <th scope="col" className="hidden px-3 py-2 text-left font-medium sm:table-cell">
                    {t('tl.col.role')}
                  </th>
                )}
                {header('tier', t('tl.col.tier'), 'left', 1)}
                {header('winRate', t('tl.col.wr'))}
                {arenaCols && header('avgPlacement', t('arena.avgPlaceShort'), 'right', 1, 'hidden sm:table-cell')}
                {header('pickRate', t('tl.col.pick'), 'right', -1, 'hidden sm:table-cell')}
                {showBans && header('banRate', t('tl.col.ban'), 'right', -1, 'hidden sm:table-cell')}
                {header('games', t('tl.col.games'), 'right', -1, 'hidden sm:table-cell')}
                {group === 'ranked' && (
                  <th scope="col" className="hidden px-3 py-2 text-left font-medium xl:table-cell">
                    {t('tl.col.weak')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const c = a.champion(r.championId);
                const champ = sd?.champions.get(r.championId);
                const href = champ ? `/champions/${champSlug(champ.id)}${group !== 'ranked' ? `?queue=${group}` : r.role !== 'ALL' ? `?role=${r.role}` : ''}` : '#';
                // Sorted by tier: a stronger line where one tier ends and the next begins, so the bands read at a glance.
                const tierBreak = sort.key === 'tier' && i > 0 && rows[i - 1].tier !== r.tier;
                return (
                  <tr
                    key={`${r.championId}-${r.role}`}
                    onClick={() => navigate(href)}
                    className={clsx('fade-up group cursor-pointer transition-colors hover:bg-raised', tierBreak ? 'border-t-2 border-line-strong' : 'border-t border-line')}
                    style={{ animationDelay: `${Math.min(i, 16) * 22}ms` }}
                  >
                    <td className="num w-10 px-2 py-2 text-muted sm:px-3">{role === 'ALL' && sort.key === 'tier' ? i + 1 : r.rank}</td>
                    <td className="px-3 py-2">
                      <Link to={href} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3 font-medium">
                        <GameImg src={c.url} alt="" size={34} rounded="md" />
                        <span className="min-w-0 group-hover:text-gold">
                          {c.name}
                          {role === 'ALL' && group === 'ranked' && (
                            <span className="mt-0.5 flex items-center gap-1 text-xs font-normal text-muted sm:hidden">
                              <RoleIcon role={r.role} size={12} />
                              {ROLE_LABEL[r.role]}
                            </span>
                          )}
                        </span>
                        {showPool && inPool(r) && (
                          <Star className="size-3.5 shrink-0 fill-gold text-gold" aria-label={t('draft.inPool')} role="img" />
                        )}
                      </Link>
                    </td>
                    {role === 'ALL' && group === 'ranked' && (
                      <td className="hidden px-3 py-2 text-muted sm:table-cell">
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
                        {/* No bar on a handful of games: its length would read as a result. */}
                        <span className={clsx('hidden sm:inline', r.lowSample && 'invisible')}>
                          <WinRateBar value={r.winRate} />
                        </span>
                        <span className="flex w-12 flex-col items-end leading-tight">
                          <span className={clsx('num font-semibold', r.lowSample ? 'text-faint' : r.winRate >= 0.5 ? 'text-text' : 'text-muted')} title={r.lowSample ? t('tl.smallSample') : undefined}>
                            {pct(r.winRate, 1)}
                            {r.lowSample && <span className="sm:hidden">*</span>}
                          </span>
                          <PatchDelta now={r.winRate} before={r.prevWinRate} games={r.games} prevGames={r.prevGames} />
                        </span>
                      </span>
                    </td>
                    {arenaCols && (
                      <td className={clsx('num hidden px-3 py-2 text-right sm:table-cell', r.lowSample ? 'text-faint' : 'text-text')} title={t('arena.avgPlace')}>
                        {r.avgPlacement != null ? decimal(r.avgPlacement, 2) : '–'}
                      </td>
                    )}
                    <td className="num hidden px-3 py-2 text-right text-muted sm:table-cell">{pct(r.pickRate, 1)}</td>
                    {showBans && <td className="num hidden px-3 py-2 text-right text-muted sm:table-cell">{pct(r.banRate, 1)}</td>}
                    <td className="num hidden px-3 py-2 text-right text-muted sm:table-cell">
                      {thousands(r.games)}
                      {r.lowSample && (
                        <span className="ml-1 text-faint" title={t('tl.smallSample')}>
                          *
                        </span>
                      )}
                    </td>
                    {group === 'ranked' && (
                      <td className="hidden px-3 py-2 xl:table-cell">
                        {r.counters?.length ? (
                          <span className="flex gap-1">
                            {r.counters.map((cid, i) => {
                              const cc = a.champion(cid);
                              // Clear counters get the red ring; ones that only lean that way stay neutral and say so.
                              const sure = i < (r.countersSure ?? r.counters!.length);
                              const vs = t('tl.vs', { a: a.champion(r.championId).name, b: cc.name });
                              return (
                                <Link
                                  key={cid}
                                  to={matchupPath(sd, r.championId, cid, r.role)}
                                  onClick={(e) => e.stopPropagation()}
                                  className={clsx('rounded-[5px] ring-1 transition', sure ? 'ring-loss/40 hover:ring-loss' : 'opacity-70 ring-line hover:opacity-100 hover:ring-line-strong')}
                                >
                                  <GameImg src={cc.url} alt={t('tl.weakAgainst', { champion: cc.name })} size={26} rounded="md" tip={sure ? vs : `${vs} · ${t('tl.leaning')}`} />
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
          {rows.some((r) => r.lowSample) && <p className="mt-3 text-xs text-faint">{t('tl.smallNote')}</p>}
        </div>
      )}
    </div>
  );
}

/** Champion pages opened lately in this browser, one click back (in the role they were viewed in). */
function RecentChamps({ group }: { group: StatsGroup }) {
  const list = useRecentChamps();
  if (!list.length) return null;
  return (
    <section aria-labelledby="recent-champs-h" className="mt-6">
      <div className="mb-2 flex items-center gap-3">
        <h2 id="recent-champs-h" className="text-xs font-medium text-muted">
          {t('tl.recent')}
        </h2>
        <button onClick={clearRecentChamps} className="-my-1 py-1 text-xs text-faint underline-offset-2 hover:text-text hover:underline">
          {t('tl.recentClear')}
        </button>
      </div>
      <RecentChampList list={list} group={group} />
    </section>
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
        {t('tl.free')}
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
