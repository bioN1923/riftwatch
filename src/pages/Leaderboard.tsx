import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ChevronDown, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { PLATFORMS, getPlatform } from '../../shared/regions';
import { api } from '../lib/api';
import { rankEmblem } from '../lib/ddragon';
import { pct, thousands } from '../lib/format';
import { profilePath } from '../lib/riotId';
import { useRegion } from '../lib/storage';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { WinRateBar } from '../components/champions/common';
import { fadeIn } from '../lib/motion';
import { SlidingIndicator } from '../components/ui/Motion';

const TIERS = [
  { id: 'challenger', label: 'Challenger' },
  { id: 'grandmaster', label: 'Grandmaster' },
  { id: 'master', label: 'Master' },
] as const;

export function LeaderboardPage() {
  const [params, setParams] = useSearchParams();
  const [storedRegion, setRegion] = useRegion();
  const region = getPlatform(params.get('region') ?? storedRegion)?.id ?? 'euw1';
  const queue = params.get('queue') === 'flex' ? 'flex' : 'solo';
  const tier = TIERS.find((t) => t.id === params.get('tier'))?.id ?? 'challenger';
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);

  useEffect(() => {
    document.title = `${getPlatform(region)?.label} ladder — Riftwatch`;
  }, [region]);

  const q = useQuery({
    queryKey: ['ladder', region, queue, tier, page],
    queryFn: ({ signal }) => api.leaderboard(region, { queue, tier, page }, signal),
    staleTime: 2 * 60_000,
    placeholderData: keepPreviousData,
  });

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v === null ? next.delete(k) : next.set(k, v);
    setParams(next, { replace: true });
  };
  const pages = q.data ? Math.max(1, Math.ceil(q.data.total / q.data.pageSize)) : 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">Ladder</h1>
          <p className="mt-2 text-sm text-muted">The top of ranked on {getPlatform(region)?.name}, ordered by LP.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative">
            <span className="sr-only">Region</span>
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                set({ region: e.target.value, page: null });
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
          <div role="radiogroup" aria-label="Queue" className="flex rounded border border-line bg-surface p-0.5">
            {(
              [
                ['solo', 'Solo/Duo'],
                ['flex', 'Flex'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                role="radio"
                aria-checked={queue === id}
                onClick={() => set({ queue: id === 'solo' ? null : id, page: null })}
                className={clsx('rounded-sm px-3 py-1 text-sm font-medium transition-colors', queue === id ? 'bg-raised text-text' : 'text-muted hover:text-text')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div role="tablist" aria-label="Tier" className="relative mt-6 flex gap-5 border-b border-line">
        <SlidingIndicator />
        {TIERS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tier === t.id}
            onClick={() => set({ tier: t.id === 'challenger' ? null : t.id, page: null })}
            className={clsx('-mb-px flex items-center gap-2 border-b-2 pb-2 text-sm font-medium transition-colors', tier === t.id ? 'border-transparent text-text' : 'border-transparent text-muted hover:text-text')}
          >
            <img src={rankEmblem(t.id)} alt="" {...fadeIn()} className="size-6" />
            {t.label}
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
          <EmptyState title="Nobody here yet">This tier is empty on this server right now — early in a season it can take a while to fill.</EmptyState>
        </div>
      ) : (
        <>
          <div className={clsx('mt-2 overflow-x-auto transition-opacity', q.isPlaceholderData && 'opacity-60')}>
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">
                {TIERS.find((t) => t.id === tier)?.label} ladder, page {page} of {pages}
              </caption>
              <thead className="text-xs text-muted">
                <tr>
                  <th scope="col" className="w-16 px-3 py-2 text-left font-medium">
                    Rank
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">
                    Player
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    LP
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Win rate
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Games
                  </th>
                </tr>
              </thead>
              <tbody>
                {q.data.entries.map((e, i) => {
                  const games = e.wins + e.losses;
                  const wr = games ? e.wins / games : 0;
                  return (
                    <tr key={e.puuid || e.rank} className="fade-up border-t border-line hover:bg-raised" style={{ animationDelay: `${Math.min(i, 20) * 10}ms` }}>
                      <td className={clsx('num px-3 py-2.5 font-display text-lg font-bold', e.rank <= 3 ? 'text-gold' : 'text-muted')}>{e.rank}</td>
                      <td className="px-3 py-2.5">
                        {e.gameName ? (
                          <Link to={profilePath(region, { gameName: e.gameName, tagLine: e.tagLine ?? '' })} className="font-medium hover:text-gold">
                            {e.gameName}
                            <span className="text-faint">#{e.tagLine}</span>
                          </Link>
                        ) : (
                          <span className="text-faint">Name unavailable</span>
                        )}
                        {e.hotStreak && <Flame className="ml-1.5 inline size-3.5 text-kda-great" aria-label="On a win streak" />}
                      </td>
                      <td className="num px-3 py-2.5 text-right font-semibold">{thousands(e.lp)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="inline-flex items-center gap-2.5">
                          <WinRateBar value={wr} />
                          <span className={clsx('num w-11', wr >= 0.5 ? 'text-text' : 'text-muted')}>{pct(wr, 1)}</span>
                        </span>
                      </td>
                      <td className="num px-3 py-2.5 text-right text-muted">
                        {thousands(games)}
                        <span className="ml-1 text-xs text-faint">
                          ({e.wins}W {e.losses}L)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm text-muted">
            <span className="num">
              {thousands(q.data.total)} players · page {page} of {pages}
            </span>
            <span className="flex gap-2">
              <button disabled={page <= 1} onClick={() => set({ page: page - 1 <= 1 ? null : String(page - 1) })} className="inline-flex items-center gap-1 rounded border border-line px-3 py-1.5 hover:border-line-strong hover:text-text disabled:opacity-40">
                <ChevronLeft className="size-4" aria-hidden /> Previous
              </button>
              <button disabled={page >= pages} onClick={() => set({ page: String(page + 1) })} className="inline-flex items-center gap-1 rounded border border-line px-3 py-1.5 hover:border-line-strong hover:text-text disabled:opacity-40">
                Next <ChevronRight className="size-4" aria-hidden />
              </button>
            </span>
          </nav>
        </>
      )}
    </div>
  );
}
