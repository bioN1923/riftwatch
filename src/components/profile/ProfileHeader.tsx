import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { LadderPlace, type LadderRef } from '../ui/LadderPlace';
import { Link } from 'react-router';
import clsx from 'clsx';
import { poolRead } from '../../lib/playstyle';
import { RefreshCw, Star, Flame, Link2, Check, Scale, HeartHandshake, Medal } from 'lucide-react';
import type { LeagueEntry, MatchSummary, Profile } from '../../../shared/types';
import { getPlatform } from '../../../shared/regions';
import { GameImg, Tooltip } from '../ui/GameImg';
import { assets, rankEmblem, useStaticData } from '../../lib/ddragon';
import { isFavorite, toggleFavorite, useFavorites } from '../../lib/storage';
import { profilePath, toSlug } from '../../lib/riotId';
import { pct, timeAgo, tierName, regionName, sureTone } from '../../lib/format';
import { me, result } from '../../lib/stats';
import { playerTags } from '../../lib/tags';
import { TagList } from '../ui/TagList';
import { fadeIn } from '../../lib/motion';
import { SlidingIndicator } from '../ui/Motion';
import { t } from '../../i18n';

const APEX = new Set(['MASTER', 'GRANDMASTER', 'CHALLENGER']);

export function ProfileHeader({
  profile,
  matches,
  inGame,
  tab,
  updating,
  readyAt,
  onUpdate,
}: {
  profile: Profile;
  matches: MatchSummary[] | undefined;
  inGame: boolean;
  tab: 'overview' | 'stats' | 'live';
  updating: boolean;
  /** Client-clock time when the server allows the next update. */
  readyAt: number;
  onUpdate: () => void;
}) {
  const { data } = useStaticData();
  const a = assets(data);
  const favorites = useFavorites();
  const solo = profile.ranked.find((r) => r.queueType === 'RANKED_SOLO_5x5');
  const flex = profile.ranked.find((r) => r.queueType === 'RANKED_FLEX_SR');
  const saved = { platform: profile.platform, gameName: profile.account.gameName, tagLine: profile.account.tagLine, profileIconId: profile.summoner.profileIconId, tier: solo?.tier, rank: solo?.rank };
  const fav = isFavorite(favorites, saved);
  const platform = getPlatform(profile.platform);
  const backdrop = profile.mastery[0] ? a.splash(profile.mastery[0].championId) : undefined;

  const [now, setNow] = useState(Date.now());
  const cooling = now < readyAt;
  useEffect(() => {
    setNow(Date.now());
    // Tick every second while the countdown runs, otherwise just keep "Updated … ago" fresh.
    const t = setInterval(() => setNow(Date.now()), cooling ? 1000 : 15_000);
    return () => clearInterval(t);
  }, [cooling, readyAt]);
  const wait = Math.max(0, Math.ceil((readyAt - now) / 1000));
  const waitLabel = `${Math.floor(wait / 60)}:${String(wait % 60).padStart(2, '0')}`;
  const id = { gameName: profile.account.gameName, tagLine: profile.account.tagLine };

  return (
    <section className="relative overflow-hidden border-b border-line bg-surface">
      {backdrop && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-full max-w-4xl">
          <img key={backdrop} src={backdrop} alt="" {...fadeIn('splash')} className="h-full w-full object-cover object-[center_25%] opacity-35" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/70 to-surface/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
        </div>
      )}

      <div className="relative mx-auto max-w-6xl px-4 pt-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          {/* Phones get a compact header (smaller icon, buttons in one row) so the match list starts higher. */}
          <div className="flex items-start gap-3 sm:items-center sm:gap-5">
            <div className="relative mt-1 shrink-0 sm:mt-0">
              <span className="block sm:hidden">
                <GameImg src={a.profileIcon(profile.summoner.profileIconId)} alt="Profile icon" size={60} rounded="md" className="ring-1 ring-line-strong" />
              </span>
              <span className="hidden sm:block">
                <GameImg src={a.profileIcon(profile.summoner.profileIconId)} alt="" size={92} rounded="md" className="ring-1 ring-line-strong" />
              </span>
              <span className="num absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-sm border border-gold/60 bg-bg px-1.5 font-display text-xs font-bold text-gold sm:text-sm">
                {profile.summoner.summonerLevel}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h1 title={`${profile.account.gameName}#${profile.account.tagLine}`} className="truncate font-display text-3xl font-extrabold leading-none tracking-tight sm:text-5xl">
                  {profile.account.gameName}
                  <span className="ml-2 text-xl font-semibold text-muted sm:text-3xl">#{profile.account.tagLine}</span>
                </h1>
                <button
                  onClick={() => toggleFavorite(saved)}
                  aria-pressed={fav}
                  aria-label={fav ? t('profile.favRemove') : t('profile.favAdd')}
                  title={fav ? t('profile.favRemove') : t('profile.favAdd')}
                  className="grid size-9 shrink-0 place-items-center rounded text-muted hover:bg-raised hover:text-gold"
                >
                  <Star className={clsx('size-5', fav && 'fill-gold text-gold')} aria-hidden />
                </button>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted sm:mt-1.5">
                {platform ? regionName(platform.id) : ''}
                <Challenges platform={profile.platform} puuid={profile.account.puuid} />
              </p>
              <TagList
                className="mt-2"
                tags={playerTags({ matches, puuid: profile.account.puuid, solo, level: profile.summoner.summonerLevel, champName: (cid) => a.champion(cid).name })}
              />
              <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  onClick={onUpdate}
                  disabled={updating || cooling}
                  title={cooling ? t('profile.updateWait', { time: waitLabel }) : t('profile.updateHint')}
                  className="inline-flex h-8 items-center gap-2 rounded bg-gold px-3.5 text-sm font-semibold text-gold-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <RefreshCw className={clsx('size-3.5', updating && 'animate-spin')} aria-hidden />
                  {updating ? t('profile.updating') : t('profile.update')}
                </button>
                <CopyLink />
                <Link
                  to={`/compare?a=${profile.platform}/${toSlug(id)}`}
                  title={t('profile.compare')}
                  className="inline-flex h-8 items-center gap-1.5 rounded border border-line-strong px-2.5 text-sm font-medium text-muted transition-colors hover:border-gold/60 hover:text-text sm:px-3"
                >
                  <Scale className="size-3.5" aria-hidden />
                  <span className="sr-only sm:not-sr-only">{t('profile.compare')}</span>
                </Link>
                <Link
                  to={`/duo?region=${profile.platform}&player=${toSlug(id)}`}
                  title={t('duo.pageTitle')}
                  className="inline-flex h-8 items-center gap-1.5 rounded border border-line-strong px-2.5 text-sm font-medium text-muted transition-colors hover:border-gold/60 hover:text-text sm:px-3"
                >
                  <HeartHandshake className="size-3.5" aria-hidden />
                  <span className="sr-only sm:not-sr-only">{t('duo.find')}</span>
                </Link>
                <span className="basis-full text-xs text-muted sm:basis-auto" aria-live="polite">
                  {t('profile.updated', { ago: timeAgo(readyAt - (profile.updateIn ?? 0) - (profile.age ?? 0), now) })}
                  {cooling && !updating && <span className="num text-faint"> · {t('profile.nextUpdate', { time: waitLabel })}</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Side by side even on phones (emblem above the text there), so the match list isn't a full screen away. */}
          <div className="grid grid-cols-2 gap-3 lg:flex lg:gap-6">
            <RankBlock label={t('profile.solo')} entry={solo} big ladder={{ platform: profile.platform, puuid: profile.account.puuid, queue: 'solo' }} />
            <RankBlock label={t('profile.flex')} entry={flex} ladder={{ platform: profile.platform, puuid: profile.account.puuid, queue: 'flex' }} />
          </div>
        </div>

        <FormRibbon matches={matches} puuid={profile.account.puuid} />

        <nav aria-label={t('profile.sections')} className="relative mt-2 flex gap-1">
          <SlidingIndicator className="h-[3px]" />
          <TabLink to={profilePath(profile.platform, id)} active={tab === 'overview'}>
            {t('profile.tab.overview')}
          </TabLink>
          <TabLink to={profilePath(profile.platform, id, 'stats')} active={tab === 'stats'}>
            {t('profile.tab.stats')}
          </TabLink>
          <TabLink to={profilePath(profile.platform, id, 'live')} active={tab === 'live'}>
            {t('profile.tab.live')}
            {inGame && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-sm bg-loss px-1.5 py-px font-sans text-[11px] font-semibold text-on-accent">
                <span className="live-dot size-1.5 rounded-full bg-on-accent" aria-hidden />
                {t('profile.inGame')}
              </span>
            )}
          </TabLink>
        </nav>
      </div>
    </section>
  );
}

function CopyLink() {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href.split('#')[0]);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard blocked */
        }
      }}
      title={t('profile.copyLink')}
      className="inline-flex h-8 items-center gap-1.5 rounded border border-line-strong px-2.5 text-sm font-medium text-muted transition-colors hover:border-gold/60 hover:text-text sm:px-3"
    >
      {done ? <Check className="pop-in size-3.5 text-win" aria-hidden /> : <Link2 className="size-3.5" aria-hidden />}
      {/* Icon-only on phones, except for the short "Copied" confirmation. */}
      <span aria-live="polite" className={done ? undefined : 'sr-only sm:not-sr-only'}>
        {done ? t('profile.copied') : t('profile.copyLink')}
      </span>
    </button>
  );
}

/** Overall challenge level and how few players have as many points (Riot's challenges). */
function Challenges({ platform, puuid }: { platform: string; puuid: string }) {
  const q = useQuery({ queryKey: ['challenges', platform, puuid], queryFn: ({ signal }) => api.challenges(platform, puuid, signal), staleTime: 30 * 60_000, retry: false });
  const c = q.data;
  if (!c) return null;
  const top = c.percentile != null && c.percentile > 0 && c.percentile <= 0.5 ? (c.percentile * 100).toFixed(c.percentile < 0.01 ? 2 : 1) : null;
  return (
    <span className="inline-flex items-center gap-1" title={t('profile.challengesTip', { points: c.points.toLocaleString() })}>
      <span aria-hidden>·</span>
      <Medal className="size-3.5 text-gold" aria-hidden />
      {t('profile.challenges', { level: tierName(c.level) })}
      {top && <span className="num text-faint">· {t('profile.challengesTop', { pct: top })}</span>}
    </span>
  );
}

function RankBlock({ label, entry, big, ladder }: { label: string; entry?: LeagueEntry; big?: boolean; ladder?: LadderRef }) {
  if (!entry) {
    return (
      <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <span className="grid size-12 place-items-center rounded-full border border-dashed border-line-strong text-faint" aria-hidden>
          –
        </span>
        <div>
          <p className="text-xs text-muted">{label}</p>
          <p className="font-display text-xl font-bold text-faint">{t('common.unranked')}</p>
        </div>
      </div>
    );
  }
  const games = entry.wins + entry.losses;
  const wr = games ? entry.wins / games : 0;
  const size = big ? 76 : 56;
  return (
    <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
      <img
        src={rankEmblem(entry.tier)}
        alt=""
        {...fadeIn()}
        width={size}
        height={size}
        className={clsx('size-12 shrink-0 drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]', big ? 'sm:size-[76px]' : 'sm:size-14')}
      />
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-xs text-muted">
          {label}
          {entry.hotStreak && <Flame className="size-3.5 text-kda-great" aria-label={t('profile.hotStreak')} />}
        </p>
        <p className={clsx('font-display text-xl font-extrabold leading-tight', big ? 'sm:text-3xl' : 'sm:text-2xl')}>
          {/* Tier and division stay on one line ("Emerald IV", never "Emerald" / "IV"); LP may wrap below on narrow widths. */}
          <span className="whitespace-nowrap">
            {tierName(entry.tier)} {APEX.has(entry.tier) ? '' : entry.rank}
          </span>
          <span className="num ml-2 whitespace-nowrap text-sm font-semibold text-muted sm:text-base">{t('common.lp', { lp: entry.leaguePoints })}</span>
        </p>
        <p className="num text-xs text-muted">
          {t('common.wins', { count: entry.wins })} {t('common.losses', { count: entry.losses })} · <span className={clsx('font-semibold', sureTone(wr, entry.wins + entry.losses))}>{pct(wr)}</span>
        </p>
        {ladder && APEX.has(entry.tier) && <LadderPlace entry={entry} ladder={ladder} />}
      </div>
    </div>
  );
}

function TabLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        'relative inline-flex items-center px-3 pb-3 pt-2 font-display text-lg font-bold tracking-wide transition-colors',
        active ? 'text-text' : 'text-muted hover:text-text',
      )}
    >
      {children}
    </Link>
  );
}

/** Recent form as a strip of champion portraits, oldest on the left, each underlined by its result. */
function FormRibbon({ matches, puuid }: { matches: MatchSummary[] | undefined; puuid: string }) {
  const { data } = useStaticData();
  const a = assets(data);
  if (!matches) return <div className="skeleton mt-6 h-12 w-full" aria-hidden />;

  const recent = matches.slice(0, 20).flatMap((m) => {
    const p = me(m, puuid);
    return p ? [{ m, p, r: result(m, p) }] : [];
  });
  if (!recent.length) return <div className="mt-6" />;
  const counted = recent.filter((x) => x.r !== 'remake');
  const wins = counted.filter((x) => x.r === 'win').length;
  const ordered = [...recent].reverse();
  const pool = poolRead(counted.map((x) => x.p.championId));

  let streak = 0;
  const latest = counted[0]?.r;
  for (const x of counted) {
    if (x.r !== latest) break;
    streak++;
  }

  return (
    <div className="mt-7 flex flex-wrap items-end gap-x-5 gap-y-2">
      {/* Phones: two rows of ten, so all 20 games are visible without sideways scrolling. */}
      <ol className="grid grid-cols-10 justify-items-center gap-1 pb-1 sm:flex sm:items-end sm:overflow-x-auto" aria-label={t('form.aria', { total: recent.length, wins, losses: counted.length - wins })}>
        {ordered.map(({ m, p, r }, i) => {
          const c = a.champion(p.championId);
          const label = t(r === 'win' ? 'form.win' : r === 'loss' ? 'form.loss' : 'form.remake', { champion: c.name, kda: `${p.kills}/${p.deaths}/${p.assists}` });
          return (
            <li key={m.id} className="form-tile shrink-0" style={{ animationDelay: `${i * 18}ms` }}>
              <Tooltip content={label}>
                <a href={`#m-${m.id}`} aria-label={label} className="group block">
                  <GameImg src={c.url} alt="" size={30} rounded="sm" className={clsx('transition-opacity', r === 'remake' && 'opacity-40', 'group-hover:opacity-80')} />
                  <span className={clsx('mt-1 block h-[3px] rounded-full', r === 'win' ? 'bg-win' : r === 'loss' ? 'bg-loss' : 'bg-faint')} />
                </a>
              </Tooltip>
            </li>
          );
        })}
      </ol>
      <p className="num pb-1.5 text-sm text-muted">
        <span className="font-display text-xl font-bold text-text">
          {wins}–{counted.length - wins}
        </span>{' '}
        {t('form.inLast', { count: recent.length })}
        {/* Win streaks only: Riot's policy doesn't allow shaming players for losing runs. */}
        {streak >= 3 && latest === 'win' && <span className="ml-2 font-semibold text-win">· {t('form.winStreak', { count: streak })}</span>}
        {pool && (
          <span className="ml-2" title={pool.kind === 'oneTrick' ? t('form.oneTrickTip') : undefined}>
            ·{' '}
            {pool.kind === 'oneTrick'
              ? t('form.oneTrick', { champion: a.champion(pool.championId).name, n: pool.games, total: pool.total })
              : t('form.widePool', { count: pool.champions, total: pool.total })}
          </span>
        )}
      </p>
    </div>
  );
}
