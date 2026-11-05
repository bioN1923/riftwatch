import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { getPlatform } from '../../shared/regions';
import type { Profile } from '../../shared/types';
import { api, ApiClientError } from '../lib/api';
import { fromSlug } from '../lib/riotId';
import { addRecent } from '../lib/storage';
import { overview } from '../lib/stats';
import { QUEUE_FILTERS, type QueueFilter } from '../lib/queues';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { PlayerChampionDialog } from '../components/profile/PlayerChampion';
import { ChampionPool, dayRecord, MasteryList, PlayedWith, ScoutingReport } from '../components/profile/Sidebar';
import type { MatchSummary } from '../../shared/types';
import { LiveGame } from '../components/profile/LiveGame';
import { StatsTab } from '../components/profile/StatsTab';
import { AutoLoad } from '../components/ui/AutoLoad';
import { LpPanel } from '../components/profile/LpPanel';
import { MatchRow } from '../components/match/MatchRow';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { useSlideDirection } from '../components/ui/Motion';
import { langInfo, t } from '../i18n';

const FIRST_PAGE = 20;
const NEXT_PAGE = 10;

export function ProfilePage({ tab }: { tab: 'overview' | 'stats' | 'live' }) {
  const params = useParams();
  const platform = getPlatform(params.region);
  const id = params.slug ? fromSlug(params.slug) : null;

  if (!platform || !id) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorState
          page
          title={t('profile.badLinkTitle')}
          error={new ApiClientError(400, 'BAD_REQUEST', t('profile.badLinkBody'))}
          action={
            <Link to="/" className="rounded-lg bg-gold px-4 py-2 font-semibold text-gold-ink">
              {t('notFound.cta')}
            </Link>
          }
        />
      </div>
    );
  }
  return <ProfileView key={`${platform.id}/${id.gameName}/${id.tagLine}`.toLowerCase()} platform={platform.id} gameName={id.gameName} tagLine={id.tagLine} tab={tab} />;
}

function ProfileView({ platform, gameName, tagLine, tab }: { platform: string; gameName: string; tagLine: string; tab: 'overview' | 'stats' | 'live' }) {
  const qc = useQueryClient();
  const [search, setSearch] = useSearchParams();
  const queue = (QUEUE_FILTERS.some((q) => q.id === search.get('queue')) ? search.get('queue') : 'all') as QueueFilter;
  // ?champ=<id> opens the player's record on that champion (shareable; Back closes it).
  const focusChamp = Number(search.get('champ')) || null;
  const openChamp = (id: number) => {
    const next = new URLSearchParams(search);
    next.set('champ', String(id));
    setSearch(next);
  };
  const closeChamp = () => {
    const next = new URLSearchParams(search);
    next.delete('champ');
    setSearch(next, { replace: true });
  };
  const freshRef = useRef(false);
  const [updating, setUpdating] = useState(false);

  const profileKey = ['profile', platform, gameName.toLowerCase(), tagLine.toLowerCase()];
  const profileQ = useQuery({ queryKey: profileKey, queryFn: ({ signal }) => api.profile(platform, gameName, tagLine, { signal }) });
  const profile = profileQ.data;
  const tabDir = useSlideDirection(['overview', 'stats', 'live'].indexOf(tab));
  const puuid = profile?.account.puuid;

  const matchesQ = useInfiniteQuery({
    queryKey: ['matches', platform, puuid, queue],
    enabled: !!puuid,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => {
      const fresh = freshRef.current && pageParam === 0;
      freshRef.current = false;
      return api.matches(platform, puuid!, { start: pageParam, count: pageParam === 0 ? FIRST_PAGE : NEXT_PAGE, queue, fresh }, signal);
    },
    getNextPageParam: (last) => last.nextStart ?? undefined,
  });

  const liveQ = useQuery({
    queryKey: ['live', platform, puuid],
    enabled: !!puuid,
    queryFn: ({ signal }) => api.live(platform, puuid!, signal),
    staleTime: 60_000,
    refetchInterval: tab === 'live' ? 60_000 : false,
  });

  const matches = useMemo(() => matchesQ.data?.pages.flatMap((p) => p.matches), [matchesQ.data]);
  const { fetchNextPage } = matchesQ;
  const loadMore = useCallback(() => void fetchNextPage(), [fetchNextPage]);
  const ov = useMemo(() => (matches && puuid ? overview(matches, puuid) : undefined), [matches, puuid]);

  useEffect(() => {
    if (!profile) return;
    document.title = `${profile.account.gameName}#${profile.account.tagLine} — Riftwatch`;
    const solo = profile.ranked.find((r) => r.queueType === 'RANKED_SOLO_5x5');
    addRecent({ platform, gameName: profile.account.gameName, tagLine: profile.account.tagLine, profileIconId: profile.summoner.profileIconId, tier: solo?.tier, rank: solo?.rank });
  }, [profile, platform]);

  async function update() {
    setUpdating(true);
    try {
      const fresh = await api.profile(platform, gameName, tagLine, { fresh: true });
      qc.setQueryData<Profile>(profileKey, fresh);
      freshRef.current = true;
      await qc.resetQueries({ queryKey: ['matches', platform, fresh.account.puuid] });
      await qc.invalidateQueries({ queryKey: ['live', platform, fresh.account.puuid] });
    } catch {
      /* the queries surface their own errors */
    } finally {
      setUpdating(false);
    }
  }

  if (profileQ.isPending) return <ProfileSkeleton />;
  if (profileQ.isError || !profile) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorState
          page
          error={profileQ.error}
          action={
            <button onClick={() => profileQ.refetch()} className="rounded-lg border border-line-strong px-4 py-2 font-semibold hover:bg-raised">
              {t('common.tryAgain')}
            </button>
          }
        />
      </div>
    );
  }

  const live = liveQ.data?.inGame ? liveQ.data : null;

  const queueBar = (
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex w-max gap-5 border-b border-line" role="group" aria-label={t('profile.filterQueue')}>
        {QUEUE_FILTERS.map((q) => (
          <button
            key={q.id}
            aria-pressed={queue === q.id}
            onClick={() => {
              const next = new URLSearchParams(search);
              q.id === 'all' ? next.delete('queue') : next.set('queue', q.id);
              setSearch(next, { replace: true });
            }}
            className={clsx(
              '-mb-px whitespace-nowrap border-b-2 pb-2 text-sm font-medium transition-colors',
              queue === q.id ? 'border-gold text-text' : 'border-transparent text-muted hover:text-text',
            )}
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {focusChamp && matches && (
        <PlayerChampionDialog
          key={focusChamp}
          matches={matches}
          puuid={profile.account.puuid}
          name={profile.account.gameName}
          championId={focusChamp}
          hasMore={!!matchesQ.hasNextPage}
          loadingMore={matchesQ.isFetchingNextPage}
          onLoadMore={() => matchesQ.fetchNextPage()}
          onClose={closeChamp}
        />
      )}
      <ProfileHeader profile={profile} matches={matches} inGame={!!live} tab={tab} updating={updating} readyAt={profileQ.dataUpdatedAt + (profile.updateIn ?? 0)} onUpdate={update} />

      <div key={tab} className="tab-in mx-auto max-w-6xl px-4 py-5" style={{ '--dir': tabDir } as React.CSSProperties}>
        {tab === 'live' ? (
          liveQ.isPending ? (
            <Skeleton className="h-80" />
          ) : live ? (
            <LiveGame game={live} puuid={profile.account.puuid} platform={platform} />
          ) : liveQ.isError ? (
            <ErrorState error={liveQ.error} />
          ) : (
            <div className="panel">
              <EmptyState title={t('profile.notInGame', { name: profile.account.gameName })}>{t('profile.notInGameBody')}</EmptyState>
            </div>
          )
        ) : tab === 'stats' ? (
          <div className="space-y-4">
            {queueBar}
            <StatsTab
              matches={matches}
              puuid={profile.account.puuid}
              loading={matchesQ.isPending}
              hasMore={!!matchesQ.hasNextPage}
              loadingMore={matchesQ.isFetchingNextPage}
              onLoadMore={() => matchesQ.fetchNextPage()}
              onOpenChampion={openChamp}
            />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
            <section aria-label={t('profile.matchHistory')} className="min-w-0 space-y-4">
              {queueBar}

              {matchesQ.isError ? (
                <ErrorState
                  error={matchesQ.error}
                  action={
                    <button onClick={() => matchesQ.refetch()} className="rounded border border-line-strong px-4 py-2 font-semibold hover:bg-raised">
                      {t('common.tryAgain')}
                    </button>
                  }
                />
              ) : (
                <>
                  <div className="space-y-5" aria-busy={matchesQ.isPending}>
                    {matchesQ.isPending && Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[124px] rounded" />)}
                    {matches &&
                      groupByDay(matches).map((g) => {
                        const rec = dayRecord(g.matches, profile.account.puuid);
                        return (
                          <section key={g.key} aria-label={g.label} className="space-y-2">
                            <h2 className="flex items-baseline justify-between">
                              <span className="font-display text-lg font-bold">{g.label}</span>
                              <span className="num text-xs text-muted">
                                <span className="text-win">{t('common.wins', { count: rec.w })}</span> <span className="text-loss">{t('common.losses', { count: rec.l })}</span>
                              </span>
                            </h2>
                            {g.matches.map((m, i) => (
                              <div key={m.id} className="fade-up" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                                <MatchRow match={m} puuid={profile.account.puuid} platform={platform} />
                              </div>
                            ))}
                          </section>
                        );
                      })}
                    {matches && matches.length === 0 && (
                      <div className="panel">
                        <EmptyState title={t('profile.noGames')}>
                          {queue === 'all' ? t('profile.noGamesAll') : t('profile.noGamesQueue')}
                        </EmptyState>
                      </div>
                    )}
                  </div>
                  {matchesQ.hasNextPage && (
                    <AutoLoad onLoad={loadMore} loading={matchesQ.isFetchingNextPage} loadedPages={matchesQ.data?.pages.length ?? 0} />
                  )}
                </>
              )}
            </section>

            <aside aria-label={t('profile.summary')} className="space-y-4 lg:sticky lg:top-[72px] lg:self-start">
              <ScoutingReport ov={ov} matches={matches} puuid={profile.account.puuid} name={profile.account.gameName} />
              <LpPanel profile={profile} />
              <ChampionPool ov={ov} loading={matchesQ.isPending} onOpen={openChamp} />
              <PlayedWith ov={ov} platform={platform} />
              <MasteryList mastery={profile.mastery} />
            </aside>
          </div>
        )}
      </div>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <div aria-busy="true" role="status" aria-label={t('profile.loading')}>
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-8">
          <Skeleton className="size-[88px]" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-5 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-14" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-28" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[108px]" />
          ))}
        </div>
      </div>
    </div>
  );
}

function groupByDay(matches: MatchSummary[]) {
  const dayFmt = new Intl.DateTimeFormat(langInfo().intl, { weekday: 'long', month: 'short', day: 'numeric' });
  const today = new Date();
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  const groups: { key: string; label: string; matches: MatchSummary[] }[] = [];
  for (const m of matches) {
    const d = new Date(m.startedAt + m.duration * 1000);
    const k = key(d);
    let g = groups.find((x) => x.key === k);
    if (!g) {
      g = { key: k, label: k === key(today) ? t('common.today') : k === key(yest) ? t('common.yesterday') : dayFmt.format(d), matches: [] };
      groups.push(g);
    }
    g.matches.push(m);
  }
  return groups;
}
