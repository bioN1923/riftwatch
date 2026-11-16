import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { keepWhile } from '../lib/keepWhile';
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
import { Goals, PatchWatch, Today, TryNext } from '../components/profile/Insights';
import { MatchRow } from '../components/match/MatchRow';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { useSlideDirection } from '../components/ui/Motion';
import { langInfo, t } from '../i18n';
import { useStickyTop } from '../lib/useStickyTop';
import { useMedia } from '../lib/useMedia';
import { regionName } from '../lib/format';
import { ArrowDown } from 'lucide-react';

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
  const side = useStickyTop<HTMLElement>();
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

  // Same query as the rank-history panel (shared cache), for today's LP change.
  const lpQ = useQuery({ queryKey: ['lp', puuid], enabled: !!puuid, queryFn: ({ signal }) => api.lp(platform, puuid!, signal), staleTime: 60_000 });
  const matchesKey = ['matches', platform, puuid, queue] as const;
  const matchesQ = useInfiniteQuery({
    queryKey: matchesKey,
    enabled: !!puuid,
    // Switching queue filter keeps the current games on screen (dimmed) until the new list arrives.
    placeholderData: keepWhile(matchesKey, 1, 2),
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
  // Coming back to the overview with 60+ games loaded re-mounts every card (~1.4 s at 4× CPU). Paint the
  // first 20 (several screens' worth) straight away and add the rest when the browser is idle.
  const [rowCap, setRowCap] = useState(20);
  // Each return to the overview starts capped again (derived state reset during render).
  const [capTab, setCapTab] = useState(tab);
  if (capTab !== tab) {
    setCapTab(tab);
    setRowCap(20);
  }
  useEffect(() => {
    if (rowCap === Infinity || !matches || matches.length <= rowCap) return;
    const lift = () => setRowCap(Infinity);
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(lift, { timeout: 600 });
      return () => window.cancelIdleCallback(id);
    }
    const id = globalThis.setTimeout(lift, 60);
    return () => globalThis.clearTimeout(id);
  }, [matches, rowCap]);
  const { fetchNextPage } = matchesQ;
  const loadMore = useCallback(() => void fetchNextPage(), [fetchNextPage]);
  const ov = useMemo(() => (matches && puuid ? overview(matches, puuid) : undefined), [matches, puuid]);

  useEffect(() => {
    if (!profile) return;
    document.title = `${profile.account.gameName}#${profile.account.tagLine} — Riftwatch`;
    const solo = profile.ranked.find((r) => r.queueType === 'RANKED_SOLO_5x5');
    addRecent({ platform, gameName: profile.account.gameName, tagLine: profile.account.tagLine, profileIconId: profile.summoner.profileIconId, tier: solo?.tier, rank: solo?.rank });
  }, [profile, platform]);

  // Below lg the summary sits under the match list. There, scrolling down shouldn't keep loading games
  // (each page pushes the summary further away and costs API calls); "Show more games" stays a button.
  const wide = useMedia('(min-width: 1024px)');
  const summaryRef = useRef<HTMLElement | null>(null);

  // "#m-<id>" (e.g. from Personal records): bring that game into view once it's in the list, and mark it briefly.
  const { hash } = useLocation();
  const shownHash = useRef('');
  useEffect(() => {
    if (tab !== 'overview' || !matches || !hash.startsWith('#m-') || shownHash.current === hash) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!el) return;
    shownHash.current = hash;
    requestAnimationFrame(() => {
      // Instant, then once more after the cards in between have rendered: off-screen cards are laid out
      // from estimated heights (content-visibility), so a smooth scroll to a far card used to stop short.
      el.scrollIntoView({ block: 'center' });
      setTimeout(() => el.scrollIntoView({ block: 'center' }), 300);
      el.classList.add('ring-2', 'ring-gold');
      setTimeout(() => el.classList.remove('ring-2', 'ring-gold'), 2500);
    });
  }, [hash, tab, matches, rowCap]); // rowCap: a game past the first 20 appears once the rest are added

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

  if (profileQ.isPending) return <ProfileSkeleton gameName={gameName} tagLine={tagLine} platform={platform} />;
  if (profileQ.isError || !profile) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorState
          page
          error={profileQ.error}
          onRetry={() => profileQ.refetch()}
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
              '-mb-px min-w-[24px] whitespace-nowrap border-b-2 pb-2 pt-1 text-sm font-medium transition-colors',
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
              {!wide && (
                <button
                  type="button"
                  onClick={() => {
                    const el = summaryRef.current;
                    if (!el) return;
                    el.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
                    el.focus({ preventScroll: true });
                  }}
                  className="inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline"
                >
                  {t('profile.jumpSummary')} <ArrowDown className="size-3.5" aria-hidden />
                </button>
              )}

              {matchesQ.isError ? (
                <ErrorState
                  error={matchesQ.error}
                  onRetry={() => matchesQ.refetch()}
                  action={
                    <button onClick={() => matchesQ.refetch()} className="rounded border border-line-strong px-4 py-2 font-semibold hover:bg-raised">
                      {t('common.tryAgain')}
                    </button>
                  }
                />
              ) : (
                <>
                  <div className={clsx('space-y-5 transition-opacity duration-200', matchesQ.isPlaceholderData && 'pointer-events-none opacity-60')} aria-busy={matchesQ.isPending || matchesQ.isPlaceholderData}>
                    {matchesQ.isPending && Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[124px] rounded" />)}
                    {matches &&
                      groupByDay(rowCap === Infinity ? matches : matches.slice(0, rowCap)).map((g) => {
                        const rec = dayRecord(g.matches, profile.account.puuid);
                        return (
                          <section key={g.key} aria-label={g.label} className="space-y-2">
                            <h2 className="flex flex-wrap items-baseline justify-between gap-x-3">
                              <span className="flex flex-wrap items-baseline gap-x-2">
                                <span className="font-display text-lg font-bold">{g.label}</span>
                                <span className="text-xs font-normal text-faint">{t('profile.dayPlayed', { time: hoursMinutes(rec.played) })}</span>
                                {rec.end && rec.end.n >= 3 && (
                                  <span className={clsx('rounded px-1.5 py-0.5 text-[11px] font-medium', rec.end.r === 'win' ? 'bg-win-tint text-win' : 'bg-loss-tint text-loss')}>
                                    {t(rec.end.r === 'win' ? 'profile.dayEndWins' : 'profile.dayEndLosses', { count: rec.end.n })}
                                  </span>
                                )}
                              </span>
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
                    <AutoLoad onLoad={loadMore} loading={matchesQ.isFetchingNextPage} loadedPages={matchesQ.data?.pages.length ?? 0} maxAuto={wide ? 4 : 0} />
                  )}
                </>
              )}
            </section>

            <aside
              ref={(el) => {
                side.ref(el);
                summaryRef.current = el;
              }}
              tabIndex={-1}
              style={side.style}
              aria-label={t('profile.summary')}
              className="scroll-mt-20 space-y-4 outline-none lg:sticky lg:self-start"
            >
              <ScoutingReport ov={ov} matches={matches} puuid={profile.account.puuid} name={profile.account.gameName} />
              <Today matches={matches} puuid={profile.account.puuid} lp={lpQ.data?.points} />
              <LpPanel profile={profile} />
              <PatchWatch matches={matches} puuid={profile.account.puuid} />
              <TryNext matches={matches} puuid={profile.account.puuid} />
              <Goals matches={matches} puuid={profile.account.puuid} />
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

/**
 * While the profile loads: the Riot ID from the address is already known, so show it where the name will be
 * (on a slow connection you can see whose profile is coming). Layout follows the real page: matches, then summary.
 */
function ProfileSkeleton({ gameName, tagLine, platform }: { gameName: string; tagLine: string; platform: string }) {
  return (
    <div aria-busy="true" role="status" aria-label={t('profile.loading')}>
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-8">
          <Skeleton className="size-[72px] sm:size-[88px]" />
          <div className="min-w-0 space-y-1.5">
            <p className="truncate font-display text-3xl font-bold leading-tight sm:text-4xl">
              {gameName}
              <span className="ml-1.5 text-xl text-faint sm:text-2xl">#{tagLine}</span>
            </p>
            <p className="text-sm text-muted">{regionName(platform)}</p>
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="space-y-2">
          <Skeleton className="h-10" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[124px]" />
          ))}
        </div>
        <div className="hidden space-y-3 lg:block">
          <Skeleton className="h-36" />
          <Skeleton className="h-24" />
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

/** "2 h 15 min", "45 min": time spent in games that day. */
function hoursMinutes(seconds: number) {
  const m = Math.round(seconds / 60);
  if (m < 60) return t('profile.m', { m });
  return m % 60 ? t('profile.hm', { h: Math.floor(m / 60), m: m % 60 }) : t('profile.h', { h: m / 60 });
}
