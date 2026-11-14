import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUp, Flame, Search } from 'lucide-react';
import { PLATFORMS, getPlatform } from '../../shared/regions';
import { api } from '../lib/api';
import { rankEmblem } from '../lib/ddragon';
import { pct, thousands, regionName, tierName } from '../lib/format';
import { profilePath } from '../lib/riotId';
import { useRegion } from '../lib/storage';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { WinRateBar } from '../components/champions/common';
import { fadeIn } from '../lib/motion';
import { SlidingIndicator } from '../components/ui/Motion';
import { t } from '../i18n';

const TIERS = [
  { id: 'challenger', label: () => tierName('CHALLENGER') },
  { id: 'grandmaster', label: () => tierName('GRANDMASTER') },
  { id: 'master', label: () => tierName('MASTER') },
] as const;

export function LeaderboardPage() {
  const [params, setParams] = useSearchParams();
  const [storedRegion, setRegion] = useRegion();
  const region = getPlatform(params.get('region') ?? storedRegion)?.id ?? 'euw1';
  const queue = params.get('queue') === 'flex' ? 'flex' : 'solo';
  const tier = TIERS.find((t) => t.id === params.get('tier'))?.id ?? 'challenger';
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);

  useEffect(() => {
    document.title = t('lb.docTitle', { region: getPlatform(region)?.label ?? region });
  }, [region]);

  const q = useQuery({
    queryKey: ['ladder', region, queue, tier, page],
    queryFn: ({ signal }) => api.leaderboard(region, { queue, tier, page }, signal),
    staleTime: 2 * 60_000,
    placeholderData: keepPreviousData,
    // Names the server is still looking up in the background fill in on their own.
    refetchInterval: (query) => (query.state.data?.namesPending && query.state.dataUpdateCount < 30 ? 5000 : false),
  });

  // The tier above (Grandmaster for Master, Challenger for Grandmaster): its lowest LP right now
  // marks who in this tier already has the LP to move up at Riot's next daily update.
  const upper = tier === 'master' ? 'grandmaster' : tier === 'grandmaster' ? 'challenger' : null;
  const upQ = useQuery({
    queryKey: ['ladder', region, queue, upper, 1],
    queryFn: ({ signal }) => api.leaderboard(region, { queue, tier: upper!, page: 1 }, signal),
    enabled: !!upper,
    staleTime: 2 * 60_000,
  });
  const upperMin = upper ? upQ.data?.minLp ?? null : null;
  const upperLabel = TIERS.find((x) => x.id === upper)?.label() ?? '';

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v === null ? next.delete(k) : next.set(k, v);
    setParams(next, { replace: true });
  };
  const pages = q.data ? Math.max(1, Math.ceil(q.data.total / q.data.pageSize)) : 1;

  // Find a player on this ladder: jump to their page and highlight the row.
  const [find, setFind] = useState('');
  const [finding, setFinding] = useState(false);
  const [missing, setMissing] = useState<string | null>(null);
  // Set when the player turned up in another apex tier than the one on screen.
  const [movedTo, setMovedTo] = useState<string | null>(null);
  const hl = Number(params.get('hl')) || null;
  const hlRef = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    if (hl && q.data?.entries.some((e) => e.rank === hl)) hlRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [hl, q.data]);
  async function onFind(e: React.FormEvent) {
    e.preventDefault();
    const v = find.trim();
    if (!v) return;
    setFinding(true);
    setMissing(null);
    setMovedTo(null);
    try {
      // This tier first, then the other apex tiers: people look up a friend without knowing where they are.
      for (const tr of [tier, ...TIERS.map((x) => x.id).filter((x) => x !== tier)]) {
        const r = await api.ladderFind(region, { queue, tier: tr, q: v });
        if (r.rank && r.page) {
          set({ tier: tr === 'challenger' ? null : tr, page: r.page > 1 ? String(r.page) : null, hl: String(r.rank) });
          if (tr !== tier) setMovedTo(TIERS.find((x) => x.id === tr)?.label() ?? tr);
          return;
        }
      }
      setMissing(v);
    } catch {
      setMissing(v);
    } finally {
      setFinding(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">{t('lb.heading')}</h1>
          <p className="mt-2 text-sm text-muted">{t('lb.sub', { region: regionName(region) })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form role="search" onSubmit={onFind} className="relative flex items-center">
            <label className="sr-only" htmlFor="lb-find">
              {t('lb.find')}
            </label>
            <Search className="pointer-events-none absolute left-2.5 size-4 text-faint" aria-hidden />
            <input
              id="lb-find"
              value={find}
              onChange={(e) => {
                setFind(e.target.value);
                setMissing(null);
              }}
              placeholder={t('lb.find')}
              aria-describedby={missing ? 'lb-find-miss' : undefined}
              className="h-9 w-52 rounded border border-line bg-surface pl-8 pr-3 text-sm outline-none placeholder:text-faint focus:border-gold focus:ring-2 focus:ring-gold/50"
            />
            {/* Enter submits; the button is only for screen readers, so it's not an invisible Tab stop. */}
            <button type="submit" disabled={finding} tabIndex={-1} className="sr-only">
              {t('lb.find')}
            </button>
          </form>
          <label className="relative">
            <span className="sr-only">{t('lb.region')}</span>
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                set({ region: e.target.value, page: null, hl: null });
              }}
              className="h-9 appearance-none rounded border border-line bg-surface pl-3 pr-8 font-display text-lg font-bold"
            >
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 size-4 text-muted" aria-hidden />
          </label>
          <div role="radiogroup" aria-label={t('lb.queue')} className="flex rounded border border-line bg-surface p-0.5">
            {(
              [
                ['solo', t('lb.solo')],
                ['flex', t('lb.flex')],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                role="radio"
                aria-checked={queue === id}
                onClick={() => set({ queue: id === 'solo' ? null : id, page: null, hl: null })}
                className={clsx('rounded-sm px-3 py-1 text-sm font-medium transition-colors', queue === id ? 'bg-raised text-text' : 'text-muted hover:text-text')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p id="lb-find-miss" role="status" className="mt-2 min-h-5 text-sm text-muted">
        {missing && t('lb.notFoundAny', { name: missing })}
        {movedTo && t('lb.foundIn', { name: find.trim(), tier: movedTo })}
      </p>

      <div role="tablist" aria-label={t('lb.tier')} className="relative mt-3 flex gap-5 border-b border-line">
        <SlidingIndicator />
        {TIERS.map((tr) => (
          <button
            key={tr.id}
            role="tab"
            aria-selected={tier === tr.id}
            onClick={() => (setMovedTo(null), setMissing(null), set({ tier: tr.id === 'challenger' ? null : tr.id, page: null, hl: null }))}
            className={clsx('-mb-px flex items-center gap-2 border-b-2 pb-2 text-sm font-medium transition-colors', tier === tr.id ? 'border-transparent text-text' : 'border-transparent text-muted hover:text-text')}
          >
            <img src={rankEmblem(tr.id)} alt="" {...fadeIn()} className="size-6" />
            {tr.label()}
          </button>
        ))}
      </div>

      {q.isPending ? (
        <div className="mt-4 space-y-1.5">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      ) : q.isError ? (
        <div className="mt-6">
          <ErrorState error={q.error} />
        </div>
      ) : q.data.entries.length === 0 ? (
        <div className="panel mt-6">
          <EmptyState title={t('lb.empty')}>{t('lb.emptyBody')}</EmptyState>
        </div>
      ) : (
        <>
          {/* Like the "LP cutoffs" on other ladders, but only what we can see: today's lowest LP in the tier. */}
          {q.data.minLp != null && tier !== 'master' && (
            <p className="mt-3 text-xs text-muted" title={t('lb.cutoffTip')}>
              {t.rich('lb.cutoff', {
                players: <span className="num font-semibold text-text">{thousands(q.data.total)}</span>,
                tier: TIERS.find((x) => x.id === tier)?.label() ?? '',
                lp: <span className="num font-semibold text-text">{t('common.lp', { lp: thousands(q.data.minLp) })}</span>,
              })}
            </p>
          )}
          {upperMin != null && (
            <p className="mt-1 text-xs text-muted" title={t('lb.cutoffTip')}>
              {t.rich('lb.upperCut', {
                tier: upperLabel,
                lp: <span className="num font-semibold text-text">{t('common.lp', { lp: thousands(upperMin) })}</span>,
              })}
            </p>
          )}
          <div className={clsx('mt-2 overflow-x-auto transition-opacity', q.isPlaceholderData && 'opacity-60')}>
            {/* Phones: games go under the win rate and the bar is left out, so nothing runs off the edge. */}
            <table className="w-full text-sm sm:min-w-[640px]">
              <caption className="sr-only">
                {t('lb.caption', { tier: TIERS.find((x) => x.id === tier)?.label() ?? '', page: String(page), pages: String(pages) })}
              </caption>
              <thead className="text-xs text-muted">
                <tr>
                  <th scope="col" className="w-16 px-3 py-2 text-left font-medium">
                    {t('lb.rank')}
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">
                    {t('lb.player')}
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    {t('lb.lp')}
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    {t('lb.wr')}
                  </th>
                  <th scope="col" className="hidden px-3 py-2 text-right font-medium sm:table-cell">
                    {t('lb.games')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {q.data.entries.map((e, i) => {
                  const games = e.wins + e.losses;
                  const wr = games ? e.wins / games : 0;
                  return (
                    <tr
                      key={e.puuid || e.rank}
                      ref={e.rank === hl ? hlRef : undefined}
                      aria-current={e.rank === hl ? 'true' : undefined}
                      className={clsx('fade-up border-t border-line hover:bg-raised', e.rank === hl && 'bg-gold/10 outline outline-1 -outline-offset-1 outline-gold/60')}
                      style={{ animationDelay: `${Math.min(i, 20) * 10}ms` }}
                    >
                      <td className={clsx('num px-3 py-2.5 font-display text-lg font-bold', e.rank <= 3 ? 'text-gold' : 'text-muted')}>{e.rank}</td>
                      <td className="px-3 py-2.5">
                        {e.gameName ? (
                          <Link to={profilePath(region, { gameName: e.gameName, tagLine: e.tagLine ?? '' })} className="font-medium hover:text-gold">
                            {e.gameName}
                            <span className="text-faint">#{e.tagLine}</span>
                          </Link>
                        ) : q.data?.namesPending ? (
                          <span className="inline-block h-3.5 w-28 animate-pulse rounded-sm bg-raised align-middle" aria-label={t('lb.loadingName')} />
                        ) : (
                          <span className="text-faint">{t('lb.noName')}</span>
                        )}
                        {e.hotStreak && <Flame className="ml-1.5 inline size-3.5 text-kda-great" aria-label={t('lb.hot')} />}
                        {upperMin != null && e.lp >= upperMin && (
                          <span className="ml-2 inline-flex items-center gap-0.5 rounded border border-gold/40 px-1.5 py-0.5 align-middle text-[11px] font-medium text-gold" title={t('lb.upperTip', { tier: upperLabel })}>
                            <ChevronsUp className="size-3" aria-hidden />
                            {t('lb.upperChip', { tier: upperLabel })}
                          </span>
                        )}
                      </td>
                      <td className="num px-3 py-2.5 text-right font-semibold">{thousands(e.lp)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="inline-flex items-center gap-2.5">
                          <span className="hidden sm:inline">
                            <WinRateBar value={wr} />
                          </span>
                          <span className={clsx('num w-11', wr >= 0.5 ? 'text-text' : 'text-muted')}>{pct(wr, 1)}</span>
                        </span>
                        <span className="num block text-xs text-faint sm:hidden">{t('common.games', { count: games })}</span>
                      </td>
                      <td className="num hidden px-3 py-2.5 text-right text-muted sm:table-cell">
                        {thousands(games)}
                        <span className="ml-1 text-xs text-faint">
                          ({t('common.wins', { count: e.wins })} {t('common.losses', { count: e.losses })})
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <nav aria-label={t('lb.pages')} className="mt-4 flex items-center justify-between text-sm text-muted">
            <span className="num">
              {t('lb.pageOf', { players: thousands(q.data.total), page: String(page), pages: String(pages) })}
            </span>
            <span className="flex gap-2">
              <button disabled={page <= 1} onClick={() => set({ page: page - 1 <= 1 ? null : String(page - 1) })} className="inline-flex items-center gap-1 rounded border border-line px-3 py-1.5 hover:border-line-strong hover:text-text disabled:opacity-40">
                <ChevronLeft className="size-4" aria-hidden /> {t('lb.prev')}
              </button>
              <button disabled={page >= pages} onClick={() => set({ page: String(page + 1) })} className="inline-flex items-center gap-1 rounded border border-line px-3 py-1.5 hover:border-line-strong hover:text-text disabled:opacity-40">
                {t('lb.next')} <ChevronRight className="size-4" aria-hidden />
              </button>
            </span>
          </nav>
        </>
      )}
    </div>
  );
}
